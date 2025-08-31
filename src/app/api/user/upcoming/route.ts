import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

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
    console.log("🔍 /api/user/upcoming called at:", new Date().toISOString())
    
    // ดึง session จาก cookies (await สำหรับ Next.js 15)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    
    if (!sessionCookie) {
      console.log("❌ No session cookie found")
      return NextResponse.json({ error: "ไม่พบ session" }, { status: 401 })
    }
    
    let citizenId: string
    
    try {
      console.log("🔓 Session cookie found, decoding JWT...")
      
      // Decode JWT token (ไม่ verify signature ก่อน เพื่อดู payload)
      const decoded = jwt.decode(sessionCookie) as any
      
      if (!decoded) {
        throw new Error("Cannot decode JWT token")
      }
      
      console.log("🔍 JWT payload:", decoded)
      
      // หา citizenId ใน JWT payload (ลองหลายที่)
      citizenId = decoded.citizenId || 
                 decoded.user?.citizenId || 
                 decoded.data?.citizenId ||
                 decoded.sub // subject ใน JWT
      
      if (!citizenId) {
        console.log("❌ Available JWT keys:", Object.keys(decoded))
        throw new Error("No citizenId found in JWT payload")
      }
      
      console.log("👤 Using citizenId from JWT:", citizenId)
      
    } catch (jwtError) {
      console.log("❌ JWT decode error:", jwtError)
      
      // ลอง parse เป็น JSON (fallback)
      try {
        const sessionData = JSON.parse(sessionCookie)
        citizenId = sessionData.user?.citizenId || sessionData.citizenId
        console.log("👤 Using citizenId from JSON fallback:", citizenId)
      } catch (jsonError) {
        console.log("❌ JSON parse fallback failed:", jsonError)
        return NextResponse.json({ error: "Session format ไม่ถูกต้อง" }, { status: 401 })
      }
    }

    // ดึงข้อมูลการจองจากฐานข้อมูล
    console.log("📊 Querying appointments for citizenId:", citizenId)
    
    const [rows] = await connection.query(
      `SELECT 
        b.booking_reference_number, 
        b.status, 
        b.cancelled_by AS cancelledBy,
        u.name AS user_name,          
        s.slot_date, 
        s.start_time, 
        s.end_time, 
        d.name AS department
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN departments d ON b.department_id = d.id
      LEFT JOIN user u ON b.created_by = u.citizenId
      WHERE b.created_by = ?
      AND s.slot_date >= CURDATE()
      ORDER BY s.slot_date ASC, s.start_time ASC`,
      [citizenId],
    )

    console.log("📊 Query result rows:", Array.isArray(rows) ? rows.length : 0)
    return NextResponse.json(rows)
    
  } catch (error) {
    console.error("❌ API ERROR:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  } finally {
    connection.release()
  }
}

// สำรอง: เก็บ version เก่าไว้ด้วย (แค่เปลี่ยน parameter checking)
export async function GET_OLD_VERSION(req: Request) {
  const connection = await pool.getConnection()

  try {
    console.log("🔍 /api/user/upcoming called at:", new Date().toISOString())
    
    const { searchParams } = new URL(req.url)
    const createdBy = searchParams.get("created_by")

    console.log("📝 Received created_by parameter:", createdBy)

    // ตรวจสอบว่าได้ค่าของ created_by หรือไม่
    if (!createdBy) {
      console.log("❌ No created_by parameter provided")
      return NextResponse.json({ error: "ไม่พบ created_by parameter" }, { status: 400 })
    }

    // ดึงข้อมูลการจองจากฐานข้อมูล
    console.log("📊 Querying appointments for created_by:", createdBy)
    
    const [rows] = await connection.query(
      `SELECT 
        b.booking_reference_number, 
        b.status, 
        b.cancelled_by AS cancelledBy,
        u.name AS user_name,          
        s.slot_date, 
        s.start_time, 
        s.end_time, 
        d.name AS department
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN departments d ON b.department_id = d.id
      LEFT JOIN user u ON b.created_by = u.citizenId
      WHERE b.created_by = ?
      AND s.slot_date >= CURDATE()
      ORDER BY s.slot_date ASC, s.start_time ASC`,
      [createdBy],
    )

    console.log("📊 Query result rows:", Array.isArray(rows) ? rows.length : 0)
    return NextResponse.json(rows)
    
  } catch (error) {
    console.error("❌ API ERROR:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  } finally {
    connection.release()
  }
}