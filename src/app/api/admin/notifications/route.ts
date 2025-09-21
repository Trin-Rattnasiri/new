// src/app/api/admin/notifications/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/mysql'

type AdminUser = {
  id: number
  username: string
  position: string
  is_approved: number | boolean
}

// ใช้ฟังก์ชัน verifyAdminAuth เดียวกับที่มีอยู่
async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies()

    const token =
      cookieStore.get('session')?.value ||
      cookieStore.get('auth_token')?.value ||
      cookieStore.get('admin_token')?.value ||
      cookieStore.get('token')?.value

    if (!token) {
      return { error: 'NO_TOKEN', status: 401 }
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    let decoded: any

    try {
      decoded = jwt.verify(token, jwtSecret)
      console.log("decoded --> ",decoded) 
    } catch (_jwtError) {
      return { error: 'INVALID_TOKEN', status: 401 }
    }

    const userIdentifier =
      decoded.sub || decoded.userId || decoded.id || decoded.user_id

    if (!userIdentifier) {
      return { error: 'NO_USER_ID', status: 401 }
    }

    const connection = await connectToDatabase()

    try {
      const [rows] = await connection.execute(
        'SELECT id, username, position, is_approved FROM admins WHERE username = ?',
        [userIdentifier]
      )

      const users = rows as AdminUser[]
      const userData = users.length > 0 ? users[0] : null

      if (
        !userData ||
        !userData.is_approved ||
        !['SuperAdmin', 'เจ้าหน้าที่'].includes(userData.position)
      ) {
        return { error: 'INSUFFICIENT_PERMISSIONS', status: 403 }
      }

      return { success: true, userData }
    } finally {
      connection.end()
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { error: 'INTERNAL_SERVER_ERROR', status: 500 }
  }
}

export async function GET() {
  const authResult = await verifyAdminAuth()

  if (!(authResult as any).success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication failed',
        code: (authResult as any).error
      },
      { status: (authResult as any).status }
    )
  }

  const connection = await connectToDatabase()

  try {
    console.log(
      '🔔 Fetching notifications for admin:',
      (authResult as any).userData.username
    )

    // ดึงจำนวน bookings ที่ยังไม่ได้อ่าน
    const [unreadRows] = await connection.query(`
      SELECT COUNT(*) AS unreadCount
      FROM bookings
      WHERE (is_read_by_admin = 0 OR is_read_by_admin IS NULL)
        AND status = 'pending'
    `)

    // ดึงจำนวน bookings ทั้งหมดที่ pending
    const [pendingRows] = await connection.query(`
      SELECT COUNT(*) AS pendingCount
      FROM bookings
      WHERE status = 'pending'
    `)

    // ดึงรายการ bookings ล่าสุดที่ยังไม่ได้อ่าน (5 รายการแรก)
    // หมายเหตุ: ตารางไม่มีคอลัมน์ created_at จึงใช้ ORDER BY id DESC แทน
    const [recentRows] = await connection.query(`
      SELECT
        id,
        name,
        department_id,
        booking_date,
        status
      FROM bookings
      WHERE (is_read_by_admin = 0 OR is_read_by_admin IS NULL)
        AND status = 'pending'
      ORDER BY id DESC
      LIMIT 5
    `)

    const unreadCount = (unreadRows as any[])[0]?.unreadCount ?? 0
    const pendingCount = (pendingRows as any[])[0]?.pendingCount ?? 0
    const recentBookings = recentRows as any[]

    console.log('📊 Notification stats:', {
      unreadCount,
      pendingCount,
      recentBookings: recentBookings.length
    })

    return NextResponse.json({
      success: true,
      hasNew: unreadCount > 0,
      count: unreadCount,
      pendingCount,
      recentBookings: recentBookings.map((booking: any) => ({
        id: booking.id,
        patientName: booking.name,
        departmentId: booking.department_id,
        bookingDate: booking.booking_date, // คอลัมน์จริงในตาราง
        createdAt: booking.booking_date,   // เผื่อฟรอนต์ต้องการฟิลด์ createdAt
        status: booking.status
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications'
      },
      { status: 500 }
    )
  } finally {
    connection.end()
  }
}
