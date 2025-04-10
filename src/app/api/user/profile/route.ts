import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const citizenId = url.searchParams.get("citizenId")

  if (!citizenId) {
    return NextResponse.json({ error: "Missing citizenId" }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(
      `SELECT citizenId, name, prefix, phone, birthday, hn FROM user WHERE citizenId = ?`,
      [citizenId]
    )

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 })
    }

    return NextResponse.json((rows as any[])[0])
  } catch (err) {
    console.error("❌ Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    connection.release()
  }
}
