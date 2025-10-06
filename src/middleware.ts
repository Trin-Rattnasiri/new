// middleware.ts  
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = new Set<string>([
  "/",                       //  หน้าแรก  Login
  "/front/user-signup",      // หน้า signup
  "/401",                    // 🆕 เพิ่ม หน้า 401 ให้เป็น public
])

const PUBLIC_API_PREFIXES = [
  "/api/user/login",
  "/api/consent/log", 
  "/api/line-webhook",
  "/api/auth/line/callback",
]

// 🆕 กำหนด API ที่ต้องการการตรวจสอบสิทธิ์
const PROTECTED_API_PREFIXES = [
  "/api/admin",      // API สำหรับ admin/staff
  "/api/user",       // API สำหรับ user (ยกเว้น login)
  "/api/backend",    // API สำหรับ backend
]

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ปล่อย static/_next/assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/.well-known")
  ) return NextResponse.next()

  // ปล่อย API สาธารณะ
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 🆕 ตรวจสอบ API ที่ต้องการการยืนยันตัวตน
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get("session")?.value
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ไม่พบ Token หรือ Token หมดอายุ" },
        { status: 401 }
      )
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
      const userRole = payload.role as string

      // ตรวจสอบสิทธิ์สำหรับ API admin
      if (pathname.startsWith("/api/admin")) {
        if (userRole !== "เจ้าหน้าที่" && userRole !== "SuperAdmin") {
          return NextResponse.json(
            { error: "Forbidden", message: "คุณไม่มีสิทธิ์เข้าถึง API นี้" },
            { status: 403 }
          )
        }
      }

      // ตรวจสอบสิทธิ์สำหรับ API user (ยกเว้น login)
      if (pathname.startsWith("/api/user") && !pathname.startsWith("/api/user/login")) {
        if (userRole !== "user") {
          return NextResponse.json(
            { error: "Forbidden", message: "คุณไม่มีสิทธิ์เข้าถึง API นี้" },
            { status: 403 }
          )
        }
      }

      // เพิ่ม user data ใน headers สำหรับ API ที่ผ่านการตรวจสอบ
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', payload.userId as string)
      requestHeaders.set('x-user-role', userRole)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      })

    } catch (error) {
      console.error("🚨 API JWT Verification failed:", error)
      return NextResponse.json(
        { error: "Unauthorized", message: "Token ไม่ถูกต้องหรือหมดอายุ" },
        { status: 401 }
      )
    }
  }

  // ปล่อยหน้า public
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // ตรวจคุกกี้ session
  const token = req.cookies.get("session")?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/401"  // 🔧 แก้ไข: redirect ไป 401 แทน
    return NextResponse.redirect(url)
  }

  try {
    // ถอดรหัส JWT เพื่อดู role
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    const userRole = payload.role as string
    
    console.log(`🔍 User role: ${userRole}, accessing: ${pathname}`)
    
    // 🔧 แก้ไข: ตรวจสอบสิทธิ์ตาม role ที่ถูกต้อง
    if (pathname.startsWith("/เจ้าหน้าที่") || pathname.startsWith("/backend")) {
      // หน้าเจ้าหน้าที่ - ต้องเป็น เจ้าหน้าที่ หรือ SuperAdmin
      if (userRole !== "เจ้าหน้าที่" && userRole !== "SuperAdmin") {
        console.log("❌ User trying to access staff area - showing 401")
        const url = req.nextUrl.clone()
        url.pathname = "/401"  // 🔧 แก้ไข: แสดงหน้า 401 แทนการ redirect
        return NextResponse.redirect(url)
      }
    } else if (pathname.startsWith("/front")) {
      // หน้า user - ต้องเป็น user
      if (userRole !== "user") {
        console.log("❌ Staff trying to access user area - showing 401")
        const url = req.nextUrl.clone()
        url.pathname = "/401"  // 🔧 แก้ไข: แสดงหน้า 401 แทนการ redirect
        return NextResponse.redirect(url)
      }
    }
    
    // 🔧 แก้ไข: Auto redirect หลัง login สำเร็จ
    if (pathname === "/" && token) {
      console.log(`🚀 Auto redirecting ${userRole} to appropriate dashboard`)
      const url = req.nextUrl.clone()
      
      if (userRole === "เจ้าหน้าที่" || userRole === "SuperAdmin") {
        url.pathname = "/backend/dashboard"
      } else if (userRole === "user") {
        url.pathname = "/front/user-dashboard"
      }
      
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error("🚨 JWT Verification failed:", error)
    const url = req.nextUrl.clone()
    url.pathname = "/401"  // 🔧 แก้ไข: แสดงหน้า 401 เมื่อ JWT ไม่ถูกต้อง
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/",                     // เพื่อ auto redirect หลัง login
    "/front/:path*",         // ป้องกันหน้าฝั่งผู้ใช้
    "/เจ้าหน้าที่/:path*",     // ป้องกันหน้าฝั่งเจ้าหน้าที่
    "/backend/:path*",       // ป้องกันหน้า backend
    "/api/:path*",           // 🆕 ป้องกัน API endpoints ทั้งหมด
  ],
}