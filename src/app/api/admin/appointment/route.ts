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

// GET handler to retrieve all appointments (for admin)
export async function GET(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()

    const [rows] = await connection.query(
      `SELECT 
        b.id,
        b.name AS user_name,
        b.hn,
        u.phone AS phone_number,
        u.citizenId AS id_card_number,
        b.created_by,
        b.status,
        b.cancelled_by,
        b.booking_reference_number,
        b.booking_date,
        d.name AS department_name,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM bookings b
      JOIN departments d ON b.department_id = d.id
      JOIN slots s ON b.slot_id = s.id
      LEFT JOIN user u ON b.created_by = u.citizenId
      ORDER BY s.slot_date DESC, s.start_time ASC`,
    )

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// POST handler for filtered appointments (for admin)
export async function POST(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    const { filters } = await req.json()

    let query = `SELECT 
      b.id,
      b.name AS user_name,
      b.hn,
      u.phone AS phone_number,
      u.citizenId AS id_card_number,
      b.created_by,
      b.status,
      b.cancelled_by,
      b.booking_reference_number,
      b.booking_date,
      d.name AS department_name,
      s.slot_date,
      s.start_time,
      s.end_time
    FROM bookings b
    JOIN departments d ON b.department_id = d.id
    JOIN slots s ON b.slot_id = s.id
    LEFT JOIN user u ON b.created_by = u.citizenId`

    const queryParams: any[] = []

    // Add filters if provided
    if (filters && Object.keys(filters).length > 0) {
      query += " WHERE "
      const conditions = []

      if (filters.department) {
        conditions.push("d.id = ?")
        queryParams.push(filters.department)
      }

      if (filters.status) {
        conditions.push("b.status = ?")
        queryParams.push(filters.status)
      }

      if (filters.date) {
        conditions.push("s.slot_date = ?")
        queryParams.push(filters.date)
      }

      if (filters.search) {
        conditions.push("(b.name LIKE ? OR b.hn LIKE ? OR b.booking_reference_number LIKE ?)")
        const searchTerm = `%${filters.search}%`
        queryParams.push(searchTerm, searchTerm, searchTerm)
      }

      query += conditions.join(" AND ")
    }

    query += " ORDER BY s.slot_date DESC, s.start_time ASC"

    const [rows] = await connection.query(query, queryParams)

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("Error fetching filtered appointments:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// PUT handler to update appointment status (for admin)
export async function PUT(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    const { bookingId, status } = await req.json()

    if (!bookingId || !status) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query("SELECT id, status, slot_id FROM bookings WHERE id = ?", [bookingId])

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]

    // อัพเดทสถานะการนัดหมาย
    await connection.query("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId])

    // ถ้าสถานะเดิมไม่ใช่ยกเลิก และกำลังเปลี่ยนเป็นยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
    if (booking.status !== "cancelled" && status === "cancelled") {
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])

      // เพิ่มการบันทึกว่ายกเลิกโดย admin
      await connection.query("UPDATE bookings SET cancelled_by = ? WHERE id = ?", ["admin", bookingId])
    }

    return NextResponse.json({ message: "อัพเดทสถานะการนัดหมายเรียบร้อย" })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// DELETE handler to delete appointment (for admin)
export async function DELETE(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    const url = new URL(req.url)
    const bookingId = url.searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "ไม่ระบุรหัสการนัดหมาย" }, { status: 400 })
    }

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query("SELECT id, slot_id, status FROM bookings WHERE id = ?", [bookingId])

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]

    // ถ้าสถานะไม่ใช่ยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
    if (booking.status !== "cancelled") {
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])
    }

    // ลบข้อมูลการนัดหมาย
    await connection.query("DELETE FROM bookings WHERE id = ?", [bookingId])

    return NextResponse.json({ message: "ลบข้อมูลการนัดหมายเรียบร้อย" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
