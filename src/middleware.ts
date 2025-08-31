// middleware.ts (วางที่รากโปรเจกต์)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = new Set<string>([
  "/",                       // ✅ หน้าแรก = หน้า Login
  "/front/user-signup",      // ถ้ามีหน้า signup
])

const PUBLIC_API_PREFIXES = [
  "/api/user/login",
  "/api/consent/log",
  "/api/line-webhook",
  "/api/auth/line/callback",
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

  // ปล่อยหน้า public
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // ตรวจคุกกี้ session
  const token = req.cookies.get("session")?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/"       // ✅ รีไดเรกต์กลับหน้า Login (หน้าแรก)
    return NextResponse.redirect(url)
  }

  try {
    await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = "/"       // ✅ ถ้าโทเคนเสีย/หมดอายุ → กลับหน้า Login
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/front/:path*",     // ✅ ป้องกันหน้าฝั่งผู้ใช้
    // "/backend/:path*", // (ออปชัน) ถ้าต้องการป้องกันหลังบ้านด้วย
  ],
}
