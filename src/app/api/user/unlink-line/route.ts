// app/api/user/unlink-line/route.ts
import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+07:00'
  })
}

interface UnlinkLineRequest {
  citizenId: string
}

export async function POST(request: Request) {
  let connection: mysql.Connection | null = null
  
  try {
    const requestData: UnlinkLineRequest = await request.json()
    
    // Validate input
    if (!requestData.citizenId) {
      return NextResponse.json(
        { error: "กรุณาระบุเลขบัตรประชาชน" }, 
        { status: 400 }
      )
    }

    const { citizenId } = requestData

    connection = await getConnection()
    await connection.beginTransaction()

    try {
      // ตรวจสอบว่า user มีอยู่จริงหรือไม่
      const [users] = await connection.execute(
        "SELECT * FROM user WHERE citizenId = ?", 
        [citizenId]
      )
      const userArray = users as any[]
      
      if (userArray.length === 0) {
        await connection.rollback()
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้ที่มีเลขบัตรประชาชนนี้" }, 
          { status: 404 }
        )
      }

      const user = userArray[0]

      // ตรวจสอบว่าผู้ใช้มีการเชื่อมต่อ LINE อยู่หรือไม่
      if (!user.line_id) {
        return NextResponse.json(
          { error: "ผู้ใช้นี้ยังไม่ได้เชื่อมต่อกับบัญชี LINE" }, 
          { status: 400 }
        )
      }

      // ลบข้อมูล LINE ออกจาก user
      await connection.execute(
        `UPDATE user SET 
           line_id = NULL, 
           line_display_name = NULL, 
           line_picture_url = NULL, 
           updatedAt = NOW() 
         WHERE citizenId = ?`,
        [citizenId]
      )

      // ดึงข้อมูล user ที่อัพเดทแล้ว
      const [updatedUsers] = await connection.execute(
        `SELECT id, prefix, citizenId, name, phone, birthday, hn, 
                line_id, line_display_name, line_picture_url,
                createdAt, updatedAt
         FROM user WHERE citizenId = ?`, 
        [citizenId]
      )
      
      const updatedUserArray = updatedUsers as any[]
      const updatedUser = updatedUserArray[0]

      await connection.commit()

      // ส่งข้อมูลผู้ใช้ที่อัพเดทแล้วกลับไป
      return NextResponse.json({
        success: true,
        message: "ยกเลิกการเชื่อมต่อบัญชี LINE สำเร็จ",
        user: {
          ...updatedUser,
          isLinkedWithLine: false,
          lineUserId: null,
          lineDisplayName: null,
          linePictureUrl: null
        }
      })

    } catch (transactionError) {
      await connection.rollback()
      throw transactionError
    }

  } catch (error: any) {
    console.error("Unlink LINE Account Error:", error)

    return NextResponse.json(
      { 
        success: false,
        error: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อบัญชี LINE" 
      }, 
      { status: 500 }
    )
    
  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error("Error closing database connection:", closeError)
      }
    }
  }
}