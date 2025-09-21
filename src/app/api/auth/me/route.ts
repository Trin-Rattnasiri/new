// src/app/api/me/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import { getPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  console.log('🔍 /api/me called at:', new Date().toISOString())
  
  // Helper function to calculate age
  const calculateAge = (birthday: string | Date | null): string | null => {
    if (!birthday) return null
    
    try {
      const birthDate = new Date(birthday)
      const now = new Date()
      
      // Check if birth date is valid
      if (isNaN(birthDate.getTime()) || birthDate > now) return null
      
      const diff = new Date(now.getTime() - birthDate.getTime())
      const years = diff.getUTCFullYear() - 1970
      const months = diff.getUTCMonth()
      const days = diff.getUTCDate() - 1
      
      if (years < 0) return null
      
      return `${years} ปี ${months} เดือน ${days} วัน`
    } catch {
      return null
    }
  }
  
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get("session")?.value
    
    if (!raw) {
      console.log('❌ No session cookie found')
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    console.log('🔓 Verifying session...')
    const sess = verifySession(raw) as {
      sub: string; role: string; kind: "user" | "admin"; name?: string; hn?: string
    }

    // ✅ เพิ่มการตรวจสอบ sub ที่ชัดเจน
    if (!sess.sub || sess.sub === 'undefined') {
      console.error('❌ Invalid session: sub is undefined or null')
      return NextResponse.json({ error: "invalid session data" }, { status: 401 })
    }

    console.log('✅ Session verified for:', sess.sub, sess.kind)

    const pool = getPool()

    if (sess.kind === "user") {
      console.log('👤 Fetching user profile for:', sess.sub)
      
      const dbPromise = pool.execute<string[]>(
        // ✅ แก้ไข column name เป็น citizenid (ตัวเล็ก) และเพิ่ม debug log
        "SELECT prefix, name, hn, citizenid, phone, birthday, line_id, line_display_name, line_picture_url FROM `user` WHERE citizenid = ? LIMIT 1",
        [sess.sub]
      )
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
      
      const [rows] = await Promise.race([dbPromise, timeoutPromise]) as any
      console.log('📊 DB query completed, rows:', rows.length)
      
      if (Array.isArray(rows) && rows.length) {
        const u = rows[0]
        
        // ✅ เพิ่ม debug log เพื่อเช็คข้อมูล
        console.log('✅ User data from DB:', {
          name: u.name,
          citizenid: u.citizenid,
          line_display_name: u.line_display_name
        })
        
        // ✅ คำนวณอายุจาก birthday
        const age = calculateAge(u.birthday)
        
        return NextResponse.json({
          ok: true,
          profile: {
            role: sess.role,
            kind: sess.kind,
            name: u.name ?? sess.name ?? null,
            prefix: u.prefix ?? null,
            hn: u.hn ?? sess.hn ?? null,
            citizenId: u.citizenid ?? sess.sub, // ✅ ใช้ citizenid จาก DB
            phone: u.phone ?? null,
            birthday: u.birthday ?? null,
            age: age ?? null,
            lineUserId: u.line_id ?? null,
            lineDisplayName: u.line_display_name ?? null,
            linePictureUrl: u.line_picture_url ?? null,
          },
        })
      }
      
      // fallback จาก JWT - เพิ่ม debug log
      console.log('📝 Using JWT fallback data for citizenId:', sess.sub)
      return NextResponse.json({
        ok: true,
        profile: {
          role: sess.role,
          kind: sess.kind,
          name: sess.name ?? null,
          prefix: null,
          hn: sess.hn ?? null,
          citizenId: sess.sub, // ✅ ใช้ sub ที่แน่ใจว่าไม่เป็น undefined
          phone: null,
          birthday: null,
          age: null,
          lineUserId: null,
          lineDisplayName: null,
          linePictureUrl: null,
        },
      })
    }

    // ✅ เพิ่ม case สำหรับ admin
    if (sess.kind === "admin") {
      console.log('🔑 Fetching admin profile for:', sess.sub)
      
      const dbPromise = pool.execute<any[]>(
        "SELECT name, role FROM `user` WHERE citizenid = ? LIMIT 1",
        [sess.sub]
      )
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
      
      const [rows] = await Promise.race([dbPromise, timeoutPromise]) as any
      console.log('📊 Admin DB query completed, rows:', rows.length)
      
      if (Array.isArray(rows) && rows.length) {
        const u = rows[0]
        
        return NextResponse.json({
          ok: true,
          profile: {
            role: u.role ?? sess.role,
            kind: sess.kind,
            name: u.name ?? sess.name ?? "Admin",
            prefix: null,
            hn: null,
            citizenId: sess.sub,
            phone: null,
            birthday: null,
            age: null,
            lineUserId: null,
            lineDisplayName: null,
            linePictureUrl: null,
          },
        })
      }
      
      // fallback for admin
      return NextResponse.json({
        ok: true,
        profile: {
          role: sess.role,
          kind: sess.kind,
          name: sess.name ?? "Admin",
          prefix: null,
          hn: null,
          citizenId: sess.sub,
          phone: null,
          birthday: null,
          age: null,
          lineUserId: null,
          lineDisplayName: null,
          linePictureUrl: null,
        },
      })
    }

    // ✅ Default case - ไม่รู้จัก kind
    console.error('❌ Unknown session kind:', sess.kind)
    return NextResponse.json({ error: "invalid session kind" }, { status: 400 })

  } catch (error: any) {
    console.error('❌ /api/me error:', error)
    if (error.message === 'Database query timeout') {
      return NextResponse.json({ error: "database timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
} // ✅ ปิด function GET ที่ขาดหาย