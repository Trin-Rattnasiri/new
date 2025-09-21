// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ปรับให้ตรงกับตอนตั้งคุกกี้ตอน login
const COOKIE_BASE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  // domain: '.yourdomain.com', // ถ้าเคยตั้งตอน login ให้ใส่เหมือนกันตรงนี้ด้วย
}

function clearCookie(res: NextResponse, name: string) {
  res.cookies.set(name, '', {
    ...COOKIE_BASE_OPTS,
    maxAge: 0,
    expires: new Date(0),
  })
}

// อนุญาต redirect เฉพาะ path ภายใน (กัน open redirect)
function getSafeRedirect(req: NextRequest): URL | null {
  const current = new URL(req.url)
  const raw = current.searchParams.get('redirect')
  if (!raw) return null
  if (raw.startsWith('/')) return new URL(raw, current.origin) // absolute ภายในโดเมนเดียวกัน
  return null
}

function buildLogoutResponse(req?: NextRequest) {
  const toUrl = req ? getSafeRedirect(req) : null

  const res = toUrl
    ? NextResponse.redirect(toUrl)
    : NextResponse.json({ ok: true, message: 'Logged out' })

  // ลบคุกกี้ที่เกี่ยวข้องกับการยืนยันตัวตน (คุณใช้ session ตัวเดียว)
  clearCookie(res, 'session')

  // ป้องกัน cache
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')

  return res
}

export async function POST(req: NextRequest) {
  console.log('🚪 Logout POST endpoint called')
  const res = buildLogoutResponse(req)
  console.log('🔒 User logged out, cookies cleared')
  console.log('🧹 Cache-Control headers set to prevent caching')
  return res
}

export async function GET(req: NextRequest) {
  console.log('🚪 Logout GET endpoint called')
  // รองรับ: /api/auth/logout?redirect=/backend/login
  const res = buildLogoutResponse(req)
  console.log('🔒 User logged out, cookies cleared')
  console.log('🧹 Cache-Control headers set to prevent caching')
  return res
}
