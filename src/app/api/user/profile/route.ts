// app/api/user/profile/route.ts
import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+07:00'
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const citizenId = url.searchParams.get("citizenId")

  if (!citizenId) {
    return NextResponse.json({ error: "Missing citizenId" }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    // ดึงข้อมูลรวมถึง LINE integration
    const [rows] = await connection.query(
      `SELECT prefix, citizenId, name, phone, birthday, hn,
              line_id, line_display_name, line_picture_url,
              createdAt, updatedAt
       FROM user WHERE citizenId = ?`,
      [citizenId]
    )

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 })
    }

    const userData = (rows as any[])[0]

    // จัดรูปแบบข้อมูลเพื่อให้ตรงกับ interface ใน Dashboard
    const responseData = {
      ...userData,
      // เพิ่มข้อมูลสำหรับ LINE integration
      isLinkedWithLine: !!userData.line_id,
      lineUserId: userData.line_id,
      lineDisplayName: userData.line_display_name,
      linePictureUrl: userData.line_picture_url
    }

    return NextResponse.json(responseData)
    
  } catch (err) {
    console.error("❌ Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    connection.release()
  }
}