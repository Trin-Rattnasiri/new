// src/app/api/admin/dashboard/route.ts
import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

// ---- helper: คำนวณเดือนถัดไปแบบ rollover ปี (YYYY-MM -> YYYY-MM) ----
function addOneMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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
  let connection: mysql.Connection | undefined
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // YYYY-MM

    connection = await getConnection()

    // 1) ภาพรวมสถานะการจอง
    const [bookingStatusStats] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT status, COUNT(*) AS count
      FROM bookings
      GROUP BY status
    `)

    // 2) การจองตามแผนก
    const [bookingsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name AS department_name, 
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      GROUP BY d.id, d.name
      ORDER BY total_bookings DESC
    `)

    // 3) การจองรายวัน (±30 วันรอบวันนี้)
    const [bookingsByDate] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        s.slot_date AS date,
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      WHERE s.slot_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      GROUP BY s.slot_date
      ORDER BY s.slot_date
    `)

    // 4) การจองรายเดือน
    const [bookingsByMonth] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(s.slot_date, '%Y-%m') AS month,
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      GROUP BY DATE_FORMAT(s.slot_date, '%Y-%m')
      ORDER BY month
    `)

    // 5) ที่นั่งว่าง/จำนวนสล็อตต่อแผนก (กัน NULL ด้วย COALESCE)
    const [seatsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name AS department_name,
        COALESCE(SUM(s.available_seats), 0) AS available_seats,
        COUNT(s.id) AS total_slots
      FROM departments d
      LEFT JOIN slots s ON d.id = s.department_id
      WHERE s.slot_date >= CURDATE()
      GROUP BY d.id, d.name
    `)

    // 6) Heatmap แผนก x วันที่ (±15 วัน)
    const [bookingHeatmap] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id AS department_id,
        d.name AS department_name,
        s.slot_date AS date,
        COUNT(b.id) AS booking_count
      FROM departments d
      LEFT JOIN slots s ON d.id = s.department_id
      LEFT JOIN bookings b ON s.id = b.slot_id
      WHERE s.slot_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 15 DAY) AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
      GROUP BY d.id, d.name, s.slot_date
      ORDER BY d.name, s.slot_date
    `)

    // 7) ช่วงเวลา (time slot)
    const [bookingsByTimeSlot] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        CONCAT(s.start_time, ' - ', s.end_time) AS time_slot,
        COUNT(b.id) AS total_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      GROUP BY s.start_time, s.end_time
      ORDER BY s.start_time
    `)

    // 8) อัตรายกเลิก
    const [cancellationRate] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT
        d.id,
        d.name AS department_name,
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
        ROUND((SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(b.id)) * 100, 2) AS cancellation_rate
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      GROUP BY d.id, d.name
      HAVING total_bookings > 0
      ORDER BY cancellation_rate DESC
    `)

    // 9) วันในสัปดาห์ — ให้ SELECT/GROUP BY/ORDER BY ใช้นิพจน์ตรงกัน (ผ่าน ONLY_FULL_GROUP_BY)
    const [bookingsByDayOfWeek] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        DAYNAME(s.slot_date)        AS day_of_week,
        (WEEKDAY(s.slot_date) + 1)  AS day_number,
        COUNT(b.id)                 AS total_bookings
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id
      WHERE s.slot_date IS NOT NULL
      GROUP BY 
        DAYNAME(s.slot_date),
        (WEEKDAY(s.slot_date) + 1)
      ORDER BY day_number
    `)

    // วันนี้: สถานะนัดหมาย
    const [todayAppointments] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT status, COUNT(*) AS count
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      WHERE s.slot_date = CURDATE()
      GROUP BY status
    `)

    // วันนี้: จำนวนการจองใหม่
    const [newBookingsToday] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS count
      FROM bookings 
      WHERE DATE(booking_date) = CURDATE()
    `)

    // วันนี้: แยกตามแผนก
    const [todayBookingsByDepartment] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        d.id,
        d.name AS department_name, 
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
      FROM departments d
      LEFT JOIN bookings b ON d.id = b.department_id
      LEFT JOIN slots s ON b.slot_id = s.id
      WHERE s.slot_date = CURDATE()
      GROUP BY d.id, d.name
      ORDER BY total_bookings DESC
    `)

    // รายเดือนแยกตามแผนก (รองรับ ?month=YYYY-MM และ all months)
    let monthlyBookingsByDepartment: mysql.RowDataPacket[] = []

    if (month) {
      const monthStart = `${month}-01`
      const nextMonth = addOneMonth(month)
      const monthEnd = `${nextMonth}-01`

      const [data] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT 
          d.id,
          d.name AS department_name, 
          COUNT(b.id) AS total_bookings,
          SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
          SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
        FROM departments d
        LEFT JOIN bookings b ON d.id = b.department_id
        LEFT JOIN slots s ON b.slot_id = s.id
        WHERE s.slot_date >= ? AND s.slot_date < ?
        GROUP BY d.id, d.name
        ORDER BY total_bookings DESC
      `, [monthStart, monthEnd])

      monthlyBookingsByDepartment = data
    } else {
      const months: Record<string, true> = {}
      for (const item of bookingsByMonth as mysql.RowDataPacket[]) {
        months[item.month] = true as const
      }
      for (const m of Object.keys(months)) {
        const monthStart = `${m}-01`
        const nextMonth = addOneMonth(m)
        const monthEnd = `${nextMonth}-01`

        const [data] = await connection.query<mysql.RowDataPacket[]>(`
          SELECT 
            d.id,
            d.name AS department_name,
            ? AS month,
            COUNT(b.id) AS total_bookings,
            SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
            SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END) AS pending_bookings,
            SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
          FROM departments d
          LEFT JOIN bookings b ON d.id = b.department_id
          LEFT JOIN slots s ON b.slot_id = s.id
          WHERE s.slot_date >= ? AND s.slot_date < ?
          GROUP BY d.id, d.name
          ORDER BY total_bookings DESC
        `, [m, monthStart, monthEnd])

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
