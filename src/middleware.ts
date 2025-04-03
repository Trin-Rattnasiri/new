import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// กำหนดเส้นทางที่ต้องการให้มีการตรวจสอบ authentication
const protectedRoutes = ['/dashboard'];
// กำหนดเส้นทางที่ต้องการให้ redirect ไปหน้า dashboard ถ้ามีการ login แล้ว
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ตรวจสอบ token จาก cookie
  const token = request.cookies.get('token')?.value;

  // ถ้าเป็นเส้นทางที่ต้องการ authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // ถ้าไม่มี token ให้ redirect ไปหน้า login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // ตรวจสอบความถูกต้องของ token
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      return NextResponse.next();
    } catch (error) {
      // ถ้า token ไม่ถูกต้อง ให้ลบ cookie และ redirect ไปหน้า login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // ถ้าเป็นเส้นทาง login หรือ register และมี token ที่ถูกต้อง
  if (authRoutes.includes(pathname)) {
    if (token) {
      try {
        // ตรวจสอบความถูกต้องของ token
        jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        // ถ้า token ถูกต้อง ให้ redirect ไปหน้า dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // ถ้า token ไม่ถูกต้อง ให้ลบ cookie และปล่อยให้เข้าหน้า login/register ได้
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /examples (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|examples|[\\w-]+\\.\\w+).*)',
  ],
};