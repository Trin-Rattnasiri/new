// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/front/user-signup",
  "/401",
])

const PUBLIC_API_PREFIXES = [
  "/api/user/login",
  "/api/consent/log", 
  "/api/line/webhook",
  "/api/auth/line/callback",
  "/api/line/notification",
  "/api/appointment",
  "/api/admin/que",
  "/api/admin/new",
]

const PROTECTED_API_PREFIXES = [
  "/api/admin",
  "/api/user",
  "/api/backend",
]

// Compile JWT_SECRET once
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

// Cache role maps for better performance
const ROLE_MAP = {
  "เจ้าหน้าที่": "staff",
  "ผู้ใช้": "user",
  "SuperAdmin": "superadmin",
  "Admin": "admin",
  "staff": "staff",
  "admin": "admin",
  "user": "user",
  "User": "user",
  "USER": "user"
} as const

const USER_ROLES = new Set(["user", "ผู้ใช้", "User", "USER"])
const STAFF_ROLES = new Set(["เจ้าหน้าที่", "SuperAdmin", "staff", "admin", "Admin"])

function normalizeRoleForHeader(role: string): string {
  return ROLE_MAP[role as keyof typeof ROLE_MAP] || "unknown"
}

function isUserRole(role: string): boolean {
  return USER_ROLES.has(role)
}

function isStaffRole(role: string): boolean {
  return STAFF_ROLES.has(role)
}

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

  // ตรวจสอบ API ที่ต้องการการยืนยันตัวตน
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

      console.log(`🔍 API Access - Role: ${userRole}, Path: ${pathname}`)

      // ตรวจสอบสิทธิ์สำหรับ API admin
      if (pathname.startsWith("/api/admin")) {
        if (!isStaffRole(userRole)) {
          console.log(`❌ Blocked: ${userRole} tried to access admin API`)
          return NextResponse.json(
            { error: "Forbidden", message: "คุณไม่มีสิทธิ์เข้าถึง API นี้" },
            { status: 403 }
          )
        }
      }

      // ตรวจสอบสิทธิ์สำหรับ API user (ยกเว้น login)
      if (pathname.startsWith("/api/user") && !pathname.startsWith("/api/user/login")) {
        if (!isUserRole(userRole)) {
          console.log(`❌ Blocked: ${userRole} tried to access user API`)
          return NextResponse.json(
            { error: "Forbidden", message: "คุณไม่มีสิทธิ์เข้าถึง API นี้" },
            { status: 403 }
          )
        }
      }

      // ✅ แก้ไข: แปลง role เป็นภาษาอังกฤษก่อนใส่ใน header
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', payload.userId as string)
      requestHeaders.set('x-user-role', normalizeRoleForHeader(userRole)) // 🔧 แก้ไขตรงนี้

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
    url.pathname = "/401"
    return NextResponse.redirect(url)
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    const userRole = payload.role as string
    
    console.log(`🔍 Page Access - Role: ${userRole}, Path: ${pathname}`)
    
    // ตรวจสอบสิทธิ์หน้าเจ้าหน้าที่
    if (pathname.startsWith("/เจ้าหน้าที่") || pathname.startsWith("/backend")) {
      if (!isStaffRole(userRole)) {
        console.log("❌ User trying to access staff area - showing 401")
        const url = req.nextUrl.clone()
        url.pathname = "/401"
        return NextResponse.redirect(url)
      }
    } 
    // ตรวจสอบสิทธิ์หน้า user
    else if (pathname.startsWith("/front")) {
      if (!isUserRole(userRole)) {
        console.log("❌ Staff trying to access user area - showing 401")
        const url = req.nextUrl.clone()
        url.pathname = "/401"
        return NextResponse.redirect(url)
      }
    }
    
    // Auto redirect หลัง login
    if (pathname === "/" && token) {
      console.log(`🚀 Auto redirecting ${userRole} to appropriate dashboard`)
      const url = req.nextUrl.clone()
      
      if (isStaffRole(userRole)) {
        url.pathname = "/backend/dashboard"
      } else if (isUserRole(userRole)) {
        url.pathname = "/front/user-dashboard"
      }
      
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error("🚨 JWT Verification failed:", error)
    const url = req.nextUrl.clone()
    url.pathname = "/401"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/",
    "/front/:path*",
    "/เจ้าหน้าที่/:path*",
    "/backend/:path*",
    "/api/:path*",
  ],
}