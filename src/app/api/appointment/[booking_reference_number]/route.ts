import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// GET handler to fetch appointment details
export async function GET(req: NextRequest, { params }: { params: { booking_reference_number: string } }) {
  const connection = await pool.getConnection()
  try {
    const bookingReferenceNumber = params.booking_reference_number

    const [rows] = await connection.query(
      `SELECT 
        b.id,
        b.name,
        b.hn,
        u.phone AS phone_number,
        b.created_by,
        b.status,
        b.cancelled_by AS cancelledBy,
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
      WHERE b.booking_reference_number = ?`,
      [bookingReferenceNumber],
    )

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    return NextResponse.json((rows as any[])[0])
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  } finally {
    connection.release()
  }
}

// PUT handler to update appointment status (cancel appointment)
export async function PUT(req: NextRequest, { params }: { params: { booking_reference_number: string } }) {
  const connection = await pool.getConnection()
  try {
    const bookingReferenceNumber = params.booking_reference_number
    const { status, cancelledBy } = await req.json()

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query(
      "SELECT id, status, slot_id FROM bookings WHERE booking_reference_number = ?",
      [bookingReferenceNumber],
    )

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]

    // อัพเดทสถานะการนัดหมายเป็นยกเลิก และบันทึกว่าใครเป็นผู้ยกเลิก
    await connection.query("UPDATE bookings SET status = ?, cancelled_by = ? WHERE booking_reference_number = ?", [
      status,
      cancelledBy,
      bookingReferenceNumber,
    ])

    // ถ้าสถานะเดิมไม่ใช่ยกเลิก และกำลังเปลี่ยนเป็นยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
    if (booking.status !== "cancelled" && status === "cancelled") {
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])
    }

    return NextResponse.json({ message: "อัพเดทสถานะการนัดหมายเรียบร้อย" })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" }, { status: 500 })
  } finally {
    connection.release()
  }
}

// DELETE handler to remove appointment
export async function DELETE(req: NextRequest, { params }: { params: { booking_reference_number: string } }) {
  const connection = await pool.getConnection()
  try {
    const bookingReferenceNumber = params.booking_reference_number

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query(
      "SELECT id, status, slot_id FROM bookings WHERE booking_reference_number = ?",
      [bookingReferenceNumber],
    )

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]

    // ถ้าสถานะไม่ใช่ยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
    if (booking.status !== "cancelled") {
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])
    }

    // ลบการนัดหมาย
    await connection.query("DELETE FROM bookings WHERE booking_reference_number = ?", [bookingReferenceNumber])

    return NextResponse.json({ message: "ลบการนัดหมายเรียบร้อย" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 })
  } finally {
    connection.release()
  }
}
