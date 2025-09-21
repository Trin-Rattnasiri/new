// app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import mysql from 'mysql2/promise'

// ---------- Types ----------
interface UserData {
  id: number
  username: string
  position: string
  password: string
  created_at: Date
  updated_at: Date
  is_approved: number // 0 = not approved, 1 = approved
}

// ---------- DB Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// ---------- Helpers ----------
async function getUserFromDatabase(userIdentifier: string): Promise<UserData | null> {
  try {
    const connection = await pool.getConnection()
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, position, password, created_at, updated_at, is_approved FROM admins WHERE username = ?',
        [userIdentifier]
      )
      const users = rows as UserData[]
      return users.length > 0 ? users[0] : null
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Database error:', error)
    return null
  }
}

async function updateLastLogin(userIdentifier: string): Promise<void> {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.execute(
        'UPDATE admins SET updated_at = NOW() WHERE username = ?',
        [userIdentifier]
      )
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

function clearSessionCookie(res: NextResponse) {
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    // domain: '.yourdomain.com', // ถ้าเคยตั้งตอน login ให้ใส่เหมือนกันตรงนี้ด้วย
  })
}

// ---------- Handler ----------
export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies()

    // ✅ ใช้คุกกี้ชื่อเดียว: 'session'
    const token = (await cookieStore).get('session')?.value
    if (!token) {
      const res = NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน', code: 'NO_TOKEN' },
        { status: 401 }
      )
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      const res = NextResponse.json(
        {
          success: false,
          message: 'Token ไม่ถูกต้องหรือหมดอายุ',
          code: 'INVALID_TOKEN',
          ...(process.env.NODE_ENV !== 'production' && {
            debug: { error: jwtError instanceof Error ? jwtError.message : 'Unknown error' },
          }),
        },
        { status: 401 }
      )
      clearSessionCookie(res)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // รองรับหลายฟิลด์ใน payload แต่คาดหวังว่าคุณใส่อยู่ใน sub ตอน login
    const userIdentifier = decoded.sub || decoded.userId || decoded.id || decoded.user_id
    if (!userIdentifier) {
      const res = NextResponse.json(
        { success: false, message: 'ไม่พบ user identifier ใน token', code: 'NO_USER_ID' },
        { status: 401 }
      )
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // ดึงข้อมูลแอดมินจาก DB
    const userData = await getUserFromDatabase(String(userIdentifier))
    if (!userData) {
      const res = NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้', code: 'USER_NOT_FOUND' },
        { status: 401 }
      )
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (!userData.is_approved) {
      const res = NextResponse.json(
        { success: false, message: 'บัญชีผู้ใช้ยังไม่ได้รับการอนุมัติ', code: 'USER_NOT_APPROVED' },
        { status: 401 }
      )
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // อนุญาตเฉพาะตำแหน่งที่เข้าระบบแอดมินได้
    if (!['SuperAdmin', 'เจ้าหน้าที่'].includes(userData.position)) {
      const res = NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงระบบแอดมิน', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // สร้าง permissions + role สำหรับตอบกลับ
    let permissions: string[] = []
    let role = userData.position
    switch (userData.position) {
      case 'SuperAdmin':
        permissions = [
          'view_appointments',
          'manage_departments',
          'add_departments',
          'manage_schedule',
          'manage_news',
          'manage_admins',
          'manage_patients',
        ]
        break
      case 'เจ้าหน้าที่':
        permissions = ['view_appointments', 'manage_departments', 'manage_news']
        role = 'Admin'
        break
      default:
        permissions = ['view_appointments']
        role = 'User'
    }

    // อัปเดตเวลาการใช้งานล่าสุด
    await updateLastLogin(String(userIdentifier))

    // ✅ ตอบกลับสำเร็จ
    return NextResponse.json({
      success: true,
      id: String(userData.id),
      username: userData.username,
      position: userData.position,
      role,
      permissions,
      isSuperAdmin: userData.position === 'SuperAdmin',
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      isApproved: userData.is_approved === 1,
      isActive: userData.is_approved === 1,
    })
  } catch (error) {
    const res = NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV !== 'production' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    )
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
