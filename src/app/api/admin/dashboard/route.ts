import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

// Function to connect to the database
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
}

export async function GET(req: NextRequest) {
  let connection;
  try {
    // รับพารามิเตอร์จาก URL query (ถ้ามี)
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // รูปแบบ YYYY-MM
    
    connection = await getConnection()

    // 1. รายงานภาพรวมจำนวนการจองตามสถานะ
    const [bookingStatusStats] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM bookings 
      GROUP BY status
    `)

    // 2. รายงานจำนวนการจองตามแผนก
    const [bookingsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name as department_name, 
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      GROUP BY d.id, d.name
      ORDER BY total_bookings DESC
    `)

    // 3. รายงานจำนวนการจองตามวันที่ (30 วันล่าสุด)
    const [bookingsByDate] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        s.slot_date as date,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      WHERE s.slot_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      GROUP BY s.slot_date
      ORDER BY s.slot_date
`)

    // 4. รายงานจำนวนการจองตามเดือน
    const [bookingsByMonth] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(s.slot_date, '%Y-%m') as month,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      GROUP BY DATE_FORMAT(s.slot_date, '%Y-%m')
      ORDER BY month
    `)

    // 5. รายงานจำนวนที่นั่งว่างและที่นั่งทั้งหมดตามแผนก
    const [seatsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name as department_name,
        SUM(s.available_seats) as available_seats,
        COUNT(s.id) as total_slots
      FROM departments d
      LEFT JOIN slots s ON d.id = s.department_id
      WHERE s.slot_date >= CURDATE()
      GROUP BY d.id, d.name
    `)

    // 6. รายงานจำนวนการจองตามแผนกและวันที่ (สำหรับแสดงเป็น heatmap)
    const [bookingHeatmap] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id as department_id,
        d.name as department_name,
        s.slot_date as date,
        COUNT(b.id) as booking_count
      FROM departments d
      LEFT JOIN slots s ON d.id = s.department_id
      LEFT JOIN bookings b ON s.id = b.slot_id
      WHERE s.slot_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 15 DAY) AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
      GROUP BY d.id, d.name, s.slot_date
      ORDER BY d.name, s.slot_date
    `)

    // 7. รายงานจำนวนการจองตามช่วงเวลา
    const [bookingsByTimeSlot] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        CONCAT(s.start_time, ' - ', s.end_time) as time_slot,
        COUNT(b.id) as total_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      GROUP BY s.start_time, s.end_time
      ORDER BY s.start_time
    `)

    // 8. รายงานอัตราการยกเลิกการจอง
    const [cancellationRate] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT
        d.id,
        d.name as department_name,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        ROUND((SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(b.id)) * 100, 2) as cancellation_rate
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      GROUP BY d.id, d.name
      HAVING total_bookings > 0
      ORDER BY cancellation_rate DESC
    `)

    // 9. รายงานจำนวนการจองตามวันในสัปดาห์
    const [bookingsByDayOfWeek] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        DAYNAME(s.slot_date) as day_of_week,
        WEEKDAY(s.slot_date) + 1 as day_number,
        COUNT(b.id) as total_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      GROUP BY DAYNAME(s.slot_date), WEEKDAY(s.slot_date)
      ORDER BY day_number
    `)

    // เพิ่มการดึงข้อมูลการนัดหมายของวันนี้
    const [todayAppointments] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      WHERE s.slot_date = CURDATE()
      GROUP BY status
    `)

    // เพิ่มการดึงข้อมูลการจองใหม่ที่เกิดขึ้นวันนี้
    const [newBookingsToday] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        COUNT(*) as count 
      FROM bookings 
      WHERE DATE(booking_date) = CURDATE()
    `)

    // เพิ่มการดึงข้อมูลการนัดหมายของวันนี้แยกตามแผนก
    const [todayBookingsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name as department_name, 
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      LEFT JOIN slots s ON b.slot_id = s.id
      WHERE s.slot_date = CURDATE()
      GROUP BY d.id, d.name
      ORDER BY total_bookings DESC
    `)

    // เพิ่ม: ดึงข้อมูลการนัดหมายแยกตามแผนกและเดือน (สำหรับเลือกดูข้อมูลรายเดือน)
    let monthlyBookingsByDepartment: mysql.RowDataPacket[] = []
    if (month) {
      const monthStart = `${month}-01`
      const nextMonth = month.substring(0, 5) + String(parseInt(month.substring(5)) + 1).padStart(2, '0')
      const monthEnd = `${nextMonth}-01`
      
      const [data] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT 
          d.id,
          d.name as department_name, 
          COUNT(b.id) as total_bookings,
          SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
        FROM departments d
        LEFT JOIN bookings b ON d.id = b.department_id
        LEFT JOIN slots s ON b.slot_id = s.id
        WHERE s.slot_date >= ? AND s.slot_date < ?
        GROUP BY d.id, d.name
        ORDER BY total_bookings DESC
      `, [monthStart, monthEnd])
      
      monthlyBookingsByDepartment = data
    } else {
      // สร้างข้อมูลรายเดือนสำหรับทุกเดือนในข้อมูล
      const months: Record<string, boolean> = {}
      
      // สกัดเดือนที่มีในข้อมูล
      for (const item of bookingsByMonth as mysql.RowDataPacket[]) {
        months[item.month] = true
      }
      
      // ดึงข้อมูลรายเดือนสำหรับทุกเดือน
      for (const month of Object.keys(months)) {
        const monthStart = `${month}-01`
        const nextMonth = month.substring(0, 5) + String(parseInt(month.substring(5)) + 1).padStart(2, '0')
        const monthEnd = `${nextMonth}-01`
        
        const [data] = await connection.query<mysql.RowDataPacket[]>(`
          SELECT 
            d.id,
            d.name as department_name,
            ? as month,
            COUNT(b.id) as total_bookings,
            SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
            SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
            SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
          FROM departments d
          LEFT JOIN bookings b ON d.id = b.department_id
          LEFT JOIN slots s ON b.slot_id = s.id
          WHERE s.slot_date >= ? AND s.slot_date < ?
          GROUP BY d.id, d.name
          ORDER BY total_bookings DESC
        `, [month, monthStart, monthEnd])
        
        monthlyBookingsByDepartment.push(...data)
      }
    }

    return NextResponse.json({
      bookingStatusStats,
      bookingsByDepartment,
      bookingsByDate,
      bookingsByMonth,
      seatsByDepartment,
      bookingHeatmap,
      bookingsByTimeSlot,
      cancellationRate,
      bookingsByDayOfWeek,
      todayAppointments,
      newBookingsToday,
      todayBookingsByDepartment,
      monthlyBookingsByDepartment,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}