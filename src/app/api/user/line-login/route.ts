import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import crypto from "crypto"

// Interface สำหรับ User data
interface User {
  id: number
  line_id: string
  name: string
  citizen_id?: string
  hn?: string
  role: string
  profile_image?: string
  createdAt: Date
  updatedAt?: Date
}

interface LineLoginRequest {
  lineId: string
  displayName: string
  pictureUrl?: string
}

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+07:00' // Thailand timezone
  })
}

// ฟังก์ชันสร้างรหัสผ่านที่แข็งแรงกว่า
const generateSecurePassword = (): string => {
  return crypto.randomBytes(12).toString('base64')
}

// ฟังก์ชันตรวจสอบ input validation
const validateLineLoginData = (data: any): data is LineLoginRequest => {
  return data && 
         typeof data.lineId === 'string' && 
         data.lineId.trim() !== '' &&
         typeof data.displayName === 'string' &&
         data.displayName.trim() !== ''
}

export async function POST(request: Request) {
  let connection: mysql.Connection | null = null
  
  try {
    const requestData = await request.json()
    
    // Validate input data
    if (!validateLineLoginData(requestData)) {
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบ LINE ID และชื่อผู้ใช้" }, 
        { status: 400 }
      )
    }

    const { lineId, displayName, pictureUrl } = requestData

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection()

    // ใช้ transaction เพื่อความปลอดภัย
    await connection.beginTransaction()

    try {
      // ค้นหาผู้ใช้จาก LINE ID
      const [users] = await connection.execute(
        "SELECT * FROM user WHERE line_id = ?", 
        [lineId]
      )

      const userArray = users as User[]
      let user = userArray.length > 0 ? userArray[0] : null

      // ถ้าไม่พบผู้ใช้ ให้สร้างผู้ใช้ใหม่
      if (!user) {
        console.log("Creating new user for LINE ID:", lineId)
        
        // สร้างรหัสผ่านแบบปลอดภัยสำหรับผู้ใช้ใหม่
        const securePassword = generateSecurePassword()

        // สร้างผู้ใช้ใหม่ด้วยข้อมูลจาก LINE
        const [result] = await connection.execute(
          `INSERT INTO user (line_id, name, profile_image, role, password, createdAt, updatedAt)
           VALUES (?, ?, ?, 'user', ?, NOW(), NOW())`,
          [lineId, displayName.trim(), pictureUrl || null, securePassword]
        )

        const insertResult = result as mysql.ResultSetHeader

        // ดึงข้อมูลผู้ใช้ที่เพิ่งสร้าง
        const [newUsers] = await connection.execute(
          "SELECT * FROM user WHERE id = ?", 
          [insertResult.insertId]
        )

        const newUserArray = newUsers as User[]
        user = newUserArray.length > 0 ? newUserArray[0] : null
        
        console.log("New user created successfully:", user?.id)
      } else {
        console.log("Existing user found:", user.id)
        
        // ตรวจสอบว่าข้อมูล profile มีการเปลี่ยนแปลงหรือไม่
        const nameChanged = user.name !== displayName.trim()
        const imageChanged = user.profile_image !== pictureUrl
        
        if (nameChanged || imageChanged) {
          await connection.execute(
            `UPDATE user SET name = ?, profile_image = ?, updatedAt = NOW() WHERE line_id = ?`,
            [displayName.trim(), pictureUrl || null, lineId]
          )
          
          // ดึงข้อมูลที่อัพเดทแล้ว
          const [updatedUsers] = await connection.execute(
            "SELECT * FROM user WHERE line_id = ?", 
            [lineId]
          )
          const updatedUserArray = updatedUsers as User[]
          user = updatedUserArray.length > 0 ? updatedUserArray[0] : user
          
          console.log("User profile updated")
        }
      }

      // Commit transaction
      await connection.commit()

      if (!user) {
        throw new Error("Failed to create or retrieve user")
      }

      // ส่งข้อมูลผู้ใช้กลับไป (ไม่ส่ง password)
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          citizenId: user.citizen_id || "",
          hn: user.hn || "",
          role: user.role,
          lineId: user.line_id,
          profileImage: user.profile_image || pictureUrl || "",
        }
      })

    } catch (transactionError) {
      // Rollback transaction on error
      await connection.rollback()
      throw transactionError
    }

  } catch (error: any) {
    console.error("LINE Login Error:", error)
    
    // ตรวจสอบ error แบบ specific
    if (error.code === 'ER_DUP_ENTRY') {
      console.error("Duplicate entry error - this should not happen with the current logic")
      return NextResponse.json(
        { 
          success: false,
          error: "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้ เนื่องจากข้อมูลซ้ำ" 
        }, 
        { status: 409 }
      )
    }

    if (error.code === 'ECONNREFUSED') {
      console.error("Database connection refused")
      return NextResponse.json(
        { 
          success: false,
          error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง" 
        }, 
        { status: 503 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false,
        error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE กรุณาลองใหม่อีกครั้ง" 
      }, 
      { status: 500 }
    )
    
  } finally {
    // ปิดการเชื่อมต่อฐานข้อมูล
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error("Error closing database connection:", closeError)
      }
    }
  }
}