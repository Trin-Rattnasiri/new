import { NextResponse } from "next/server"
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

export async function GET(req: Request) {
  const connection = await pool.getConnection()

  try {
    const { searchParams } = new URL(req.url)
    const idCardNumber = searchParams.get("id_card_number")

    if (!idCardNumber) {
      return NextResponse.json({ error: "ไม่พบเลขบัตรประชาชน" }, { status: 400 })
    }

    const [rows] = await connection.query(
      `
      SELECT b.booking_reference_number, b.status, s.slot_date, s.start_time, s.end_time, d.name AS department
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN departments d ON b.department_id = d.id
      WHERE b.id_card_number = ?
      AND s.slot_date >= CURDATE()
      ORDER BY s.slot_date ASC, s.start_time ASC
      `,
      [idCardNumber]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("❌ API ERROR:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  } finally {
    connection.release()
  }
}
