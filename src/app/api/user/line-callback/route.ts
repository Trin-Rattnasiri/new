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
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "ไม่พบรหัสการเข้าสู่ระบบจาก LINE" }, { status: 400 })
    }

    // ข้อมูลสำหรับแลกเปลี่ยน code เป็น access token
    const clientId = process.env.LINE_LOGIN_CHANNEL_ID || "2006488509"
    const clientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/line-login`

    if (!clientSecret) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการตั้งค่า LINE Login" }, { status: 500 })
    }

    // แลกเปลี่ยน code เป็น access token
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("LINE Token Error:", errorData)
      return NextResponse.json({ error: "ไม่สามารถรับ token จาก LINE ได้" }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, id_token } = tokenData

    // ดึงข้อมูลโปรไฟล์ผู้ใช้
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!profileResponse.ok) {
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้" }, { status: 400 })
    }

    const profile = await profileResponse.json()
    const { userId, displayName, pictureUrl } = profile

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection()

    // ค้นหาผู้ใช้จาก LINE ID
    const [users] = await connection.execute("SELECT * FROM users WHERE line_id = ?", [userId])

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
        [userId, displayName, pictureUrl, randomPassword],
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
      displayName,
      profileImage: user.profile_image || pictureUrl,
    })
  } catch (error: any) {
    console.error("LINE Callback Error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผลข้อมูลจาก LINE" }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
