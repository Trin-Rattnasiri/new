import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
}

export async function POST(request: Request) {
  let connection

  try {
    const { lineId, displayName, pictureUrl } = await request.json()

    if (!lineId) {
      return NextResponse.json({ error: "ไม่พบข้อมูล LINE ID" }, { status: 400 })
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection()

    // ค้นหาผู้ใช้จาก LINE ID
    const [users] = await connection.execute("SELECT * FROM users WHERE line_id = ?", [lineId])

    const userArray = users as any[]
    let user = userArray.length > 0 ? userArray[0] : null

    // ถ้าไม่พบผู้ใช้ ให้สร้างผู้ใช้ใหม่
    if (!user) {
      // สร้างรหัสผ่านสุ่มสำหรับผู้ใช้ใหม่
      const randomPassword = Math.random().toString(36).slice(-8)

      // สร้างผู้ใช้ใหม่ด้วยข้อมูลจาก LINE
      const [result] = await connection.execute(
        `INSERT INTO users (line_id, name, profile_image, role, password, created_at) 
         VALUES (?, ?, ?, 'user', ?, NOW())`,
        [lineId, displayName, pictureUrl, randomPassword],
      )

      const insertResult = result as any

      // ดึงข้อมูลผู้ใช้ที่เพิ่งสร้าง
      const [newUsers] = await connection.execute("SELECT * FROM users WHERE id = ?", [insertResult.insertId])

      const newUserArray = newUsers as any[]
      user = newUserArray.length > 0 ? newUserArray[0] : null
    }

    if (!user) {
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" }, { status: 500 })
    }

    // ส่งข้อมูลผู้ใช้กลับไป
    return NextResponse.json({
      id: user.id,
      name: user.name,
      citizenId: user.citizen_id || "",
      hn: user.hn || "",
      role: user.role,
      lineId: user.line_id,
      profileImage: user.profile_image || pictureUrl,
    })
  } catch (error: any) {
    console.error("LINE Login Error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE" }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
