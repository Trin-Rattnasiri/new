// app/api/user/link-line/route.ts - เพิ่ม debug logs

import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const getConnection = async () => {
  console.log("🔍 Creating database connection...")
  console.log("🔍 Database config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
  })
  
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+07:00'
  })
}

interface LinkLineRequest {
  citizenId: string
  lineProfile: {
    userId: string
    displayName: string
    pictureUrl?: string
    statusMessage?: string
  }
}

export async function POST(request: Request) {
  console.log("🔍 Link LINE API called")
  let connection: mysql.Connection | null = null
  
  try {
    const requestData: LinkLineRequest = await request.json()
    console.log("🔍 Request data received:", requestData)
    
    // Validate input
    if (!requestData.citizenId || !requestData.lineProfile?.userId) {
      console.error("❌ Invalid input data")
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน กรุณาระบุเลขบัตรประชาชนและ LINE User ID" }, 
        { status: 400 }
      )
    }

    const { citizenId, lineProfile } = requestData
    const { userId: lineUserId, displayName, pictureUrl } = lineProfile

    console.log("🔍 Processing:", { 
      citizenId, 
      lineUserId, 
      displayName, 
      pictureUrl: pictureUrl ? 'HAS_PICTURE' : 'NO_PICTURE' 
    })

    connection = await getConnection()
    console.log("✅ Database connection established")
    
    await connection.beginTransaction()
    console.log("🔍 Transaction started")

    try {
      // ตรวจสอบว่า user มีอยู่จริงหรือไม่
      console.log("🔍 Checking if user exists...")
      const [users] = await connection.execute(
        "SELECT * FROM user WHERE citizenId = ?", 
        [citizenId]
      )
      const userArray = users as any[]
      console.log("🔍 User query result count:", userArray.length)
      
      if (userArray.length === 0) {
        console.error("❌ User not found")
        await connection.rollback()
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้ที่มีเลขบัตรประชาชนนี้" }, 
          { status: 404 }
        )
      }

      console.log("✅ User found:", { 
        id: userArray[0].id, 
        name: userArray[0].name,
        currentLineId: userArray[0].line_id 
      })

      // ตรวจสอบว่า LINE ID นี้ถูกใช้โดยผู้ใช้คนอื่นหรือไม่
      console.log("🔍 Checking if LINE ID is already used by another user...")
      const [lineUsers] = await connection.execute(
        "SELECT * FROM user WHERE line_id = ? AND citizenId != ?", 
        [lineUserId, citizenId]
      )
      const lineUserArray = lineUsers as any[]
      console.log("🔍 LINE ID conflict check result:", lineUserArray.length)
      
      if (lineUserArray.length > 0) {
        console.error("❌ LINE ID already used by another user")
        await connection.rollback()
        return NextResponse.json(
          { error: "บัญชี LINE นี้เชื่อมต่อกับผู้ใช้คนอื่นอยู่แล้ว" }, 
          { status: 409 }
        )
      }

      // อัพเดทข้อมูล LINE ให้กับ user
      console.log("🔍 Updating user with LINE information...")
      const updateResult = await connection.execute(
        `UPDATE user SET 
           line_id = ?, 
           line_display_name = ?, 
           line_picture_url = ?, 
           updatedAt = NOW() 
         WHERE citizenId = ?`,
        [lineUserId, displayName, pictureUrl || null, citizenId]
      )
      
      console.log("✅ Update result:", updateResult[0])

      // ดึงข้อมูล user ที่อัพเดทแล้ว
      console.log("🔍 Fetching updated user data...")
      const [updatedUsers] = await connection.execute(
        `SELECT id, prefix, citizenId, name, phone, birthday, hn, 
                line_id, line_display_name, line_picture_url,
                createdAt, updatedAt
         FROM user WHERE citizenId = ?`, 
        [citizenId]
      )
      
      const updatedUserArray = updatedUsers as any[]
      const updatedUser = updatedUserArray[0]
      console.log("✅ Updated user data:", updatedUser)

      await connection.commit()
      console.log("✅ Transaction committed")

      const responseData = {
        success: true,
        message: "เชื่อมต่อบัญชี LINE สำเร็จ111111111111111111111111111111111111",
        user: {
          ...updatedUser,
          isLinkedWithLine: true,
          lineUserId: updatedUser.line_id,
          lineDisplayName: updatedUser.line_display_name,
          linePictureUrl: updatedUser.line_picture_url
        }
      }
      
      console.log("✅ Sending response:", responseData)
      return NextResponse.json(responseData)

    } catch (transactionError) {
      console.error("❌ Transaction error:", transactionError)
      await connection.rollback()
      throw transactionError
    }

  } catch (error: any) {
    console.error("❌ Link LINE Account Error:", error)
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.error("❌ Duplicate entry error")
      return NextResponse.json(
        { error: "บัญชี LINE นี้เชื่อมต่อกับผู้ใช้อื่นอยู่แล้ว" }, 
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี LINE" 
      }, 
      { status: 500 }
    )
    
  } finally {
    if (connection) {
      try {
        await connection.end()
        console.log("✅ Database connection closed")
      } catch (closeError) {
        console.error("❌ Error closing database connection:", closeError)
      }
    }
  }
}