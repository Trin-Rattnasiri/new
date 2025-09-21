// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function clearCookie(res: NextResponse, name: string) {
  // ใช้ค่าเดียวกับตอนตั้งคุกกี้ตอน login ให้มากที่สุด (path/sameSite/secure)
  res.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

function buildLogoutResponse(req?: NextRequest) {
  // ถ้ามี ?redirect=/somewhere ให้ redirect ไปหลังลบคุกกี้
  const redirectUrl = req ? new URL(req.url).searchParams.get('redirect') : null
  const res = redirectUrl
    ? NextResponse.redirect(redirectUrl)
    : NextResponse.json({ ok: true, message: 'Logged out' })

  // ลบคุกกี้ที่เกี่ยวข้องกับการยืนยันตัวตนทั้งหมด
  clearCookie(res, 'session')
  clearCookie(res, 'auth_token')
  clearCookie(res, 'admin_token')
  clearCookie(res, 'token')
  console.log('🔒 User logged out, cookies cleared');

  // ป้องกัน cache
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  console.log('🧹 Cache-Control headers set to prevent caching');

  return res
}

export async function POST(req: NextRequest) {
  return buildLogoutResponse(req)
  console.log('🚪 Logout POST endpoint called');
}

export async function GET(req: NextRequest) {
  // รองรับกดลิงก์ /api/auth/logout?redirect=/backend/login
  return buildLogoutResponse(req)
}
// ถ้าเรียก /api/auth/logout แบบ POST จะได้ JSON { ok: true, message: 'Logged out' }