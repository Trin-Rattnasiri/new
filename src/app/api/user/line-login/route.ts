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
    const [users] = await connection.execute(
      "SELECT * FROM user WHERE line_id = ?", 
      [lineId]
    )

    const userArray = users as any[]
    let user = userArray.length > 0 ? userArray[0] : null

    // ถ้าไม่พบผู้ใช้ ให้สร้างผู้ใช้ใหม่
    if (!user) {
      console.log("Creating new user for LINE ID:", lineId)
      
      // สร้างรหัสผ่านสุ่มสำหรับผู้ใช้ใหม่
      const randomPassword = Math.random().toString(36).slice(-8)

      // สร้างผู้ใช้ใหม่ด้วยข้อมูลจาก LINE (ไม่ใส่ citizenId)
      const [result] = await connection.execute(
        `INSERT INTO user (line_id, name, profile_image, role, password, createdAt)
         VALUES (?, ?, ?, 'user', ?, NOW())`,
        [lineId, displayName, pictureUrl, randomPassword]
      )

      const insertResult = result as any

      // ดึงข้อมูลผู้ใช้ที่เพิ่งสร้าง
      const [newUsers] = await connection.execute(
        "SELECT * FROM user WHERE id = ?", 
        [insertResult.insertId]
      )

      const newUserArray = newUsers as any[]
      user = newUserArray.length > 0 ? newUserArray[0] : null
      
      console.log("New user created successfully:", user?.id)
    } else {
      console.log("Existing user found:", user.id)
      
      // อัพเดทข้อมูล profile ถ้ามีการเปลี่ยนแปลงจาก LINE
      if (user.name !== displayName || user.profile_image !== pictureUrl) {
        await connection.execute(
          `UPDATE user SET name = ?, profile_image = ? WHERE line_id = ?`,
          [displayName, pictureUrl, lineId]
        )
        
        // ดึงข้อมูลที่อัพเดทแล้ว
        const [updatedUsers] = await connection.execute(
          "SELECT * FROM user WHERE line_id = ?", 
          [lineId]
        )
        const updatedUserArray = updatedUsers as any[]
        user = updatedUserArray.length > 0 ? updatedUserArray[0] : user
        
        console.log("User profile updated")
      }
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
    
    // ตรวจสอบ error แบบ specific
    if (error.code === 'ER_DUP_ENTRY') {
      console.error("Duplicate entry error - this should not happen with the current logic")
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE" }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}