import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

// 🔧 ปรับ config ตามฐานข้อมูลของคุณ
const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  }

export async function POST(req: Request) {
  try {
    const { username, password, position } = await req.json()

    // ✅ ตรวจสอบข้อมูลก่อน
    if (!username || !password || !position) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // ✅ ตรวจสอบว่ามี username ซ้ำหรือไม่
    const [rows]: any = await connection.execute(
      "SELECT id FROM admins WHERE username = ?",
      [username]
    )

    if (rows.length > 0) {
      await connection.end()
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 409 })
    }

    // ✅ เข้ารหัส password
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ บันทึกข้อมูลพร้อม is_approved = false
    await connection.execute(
      "INSERT INTO admins (username, position, password, is_approved) VALUES (?, ?, ?, ?)",
      [username, position, hashedPassword, false]
    )

    await connection.end()

    return NextResponse.json({ message: "สมัครแอดมินสำเร็จ กรุณารอการอนุมัติ" }, { status: 201 })
  } catch (error: any) {
    console.error("🔥 ERROR:", error.message)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
