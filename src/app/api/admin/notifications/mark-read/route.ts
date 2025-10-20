// src/app/api/admin/notifications/mark-read/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getPool } from '@/lib/db' 

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

    if (!token) return { error: 'NO_TOKEN', status: 401 }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch {
      return { error: 'INVALID_TOKEN', status: 401 }
    }

    const userIdentifier =
      decoded.sub || decoded.userId || decoded.id || decoded.user_id
    if (!userIdentifier) return { error: 'NO_USER_ID', status: 401 }

    const pool = getPool() // ✅ เปลี่ยนบรรทัดนี้
    
    const [rows] = await pool.execute( 
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
    // ✅ ลบ finally { connection.end() } ออก
  } catch (error) {
    console.error('Auth verification error:', error)
    return { error: 'INTERNAL_SERVER_ERROR', status: 500 }
  }
}

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['1', 'true', 'yes'].includes(v.toLowerCase())
  if (typeof v === 'number') return v === 1
  return false
}

export async function POST(request: Request) {
  const authResult: any = await verifyAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication failed',
        code: authResult.error,
      },
      { status: authResult.status }
    )
  }

  const pool = getPool() // ✅ เปลี่ยนบรรทัดนี้

  try {
    // --- รับ payload อย่างยืดหยุ่น: JSON / form / query ---
    let payload: any = null
    // ถ้า body เป็น JSON อาจว่างได้ ใช้ catch ป้องกัน error
    try {
      // ใช้ text() เพื่อกัน error "Unexpected end..." แล้วค่อย JSON.parse เอง
      const raw = await request.text()
      if (raw) payload = JSON.parse(raw)
    } catch {
      payload = null
    }

    // รองรับ form-encoded
    if (!payload && request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      payload = {
        bookingId: form.get('bookingId'),
        markAllRead: form.get('markAllRead'),
      }
    }

    // รองรับ query string
    const url = new URL(request.url)
    const qsBookingId = url.searchParams.get('bookingId')
    const qsMarkAll = url.searchParams.get('markAllRead')

    // รวมค่าจากทุกช่องทาง
    const bookingIdRaw =
      payload?.bookingId ?? (qsBookingId !== null ? qsBookingId : undefined)
    const markAllReadRaw =
      payload?.markAllRead ?? (qsMarkAll !== null ? qsMarkAll : undefined)

    // ถ้าไม่ส่งอะไรเลย ให้ default = markAllRead
    const isEmptyPayload = bookingIdRaw === undefined && markAllReadRaw === undefined
    const bookingId =
      bookingIdRaw !== undefined && bookingIdRaw !== null && `${bookingIdRaw}` !== ''
        ? Number(bookingIdRaw)
        : undefined
    const markAllRead = isEmptyPayload ? true : parseBool(markAllReadRaw)

    console.log('📝 Mark read request:', {
      bookingId,
      markAllRead,
      admin: authResult.userData.username,
      isEmptyPayload,
    })

    if (markAllRead) {
      // ทำเครื่องหมายทั้งหมดที่ยัง pending และยังไม่อ่าน เป็นอ่านแล้ว
      const [result] = await pool.execute(` 
        SET is_read_by_admin = 1, read_at = NOW()
        WHERE (is_read_by_admin = 0 OR is_read_by_admin IS NULL)
          AND status = 'pending'
      `)
      console.log(
        '✅ Marked all notifications as read:',
        (result as any).affectedRows,
        'rows affected'
      )
      return NextResponse.json({
        success: true,
        message: 'ทำเครื่องหมายการแจ้งเตือนทั้งหมดเป็นอ่านแล้ว',
        affectedRows: (result as any).affectedRows,
      })
    }

    if (bookingId) {
      // ทำเครื่องหมายเฉพาะรายการที่ระบุ
      const [result] = await pool.execute( 
        `
        UPDATE bookings
        SET is_read_by_admin = 1, read_at = NOW()
        WHERE id = ?
      `,
        [bookingId]
      )

      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'ไม่พบรายการจองที่ระบุ',
          },
          { status: 404 }
        )
      }

      console.log('✅ Marked notification as read for booking ID:', bookingId)
      return NextResponse.json({
        success: true,
        message: 'ทำเครื่องหมายการแจ้งเตือนเป็นอ่านแล้ว',
      })
    }

    // ไม่ได้ส่ง bookingId และไม่ได้สั่ง markAllRead
    return NextResponse.json(
      {
        success: false,
        message: 'ต้องระบุ bookingId หรือ markAllRead',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notifications as read',
      },
      { status: 500 }
    )
  }
  // ✅ ลบ finally { connection.end() } ออก
}