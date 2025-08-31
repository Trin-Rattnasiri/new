// src/app/api/user/link-line/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import mysql from "mysql2/promise"
import { verifySession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ใช้ Pool ระดับโมดูล (re-use)
const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
})

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}


export async function POST(req: NextRequest) {
  console.log("🔍 Link LINE API called")

  try {
    // 1) auth จาก cookie session
    const cookieStore = await cookies()
    const raw = cookieStore.get("session")?.value
    if (!raw) {
      console.warn("❌ no session cookie")
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
    }

    let sess: any // เปลี่ยนจาก type เฉพาะเป็น any เพื่อให้เข้าถึง field อื่นได้
    try {
      sess = verifySession(raw)
      console.log("🔍 Full session data:", sess)
    } catch (error) {
      console.warn("❌ invalid session:", error)
      return NextResponse.json({ success: false, error: "invalid session" }, { status: 401 })
    }
    
    if (sess.kind !== "user") {
      console.warn("❌ non-user trying to link LINE:", sess.kind)
      return NextResponse.json({ success: false, error: "only user can link LINE" }, { status: 403 })
    }

    // 2) หา citizenId จากหลายที่ในลำดับความสำคัญ
    let citizenId: string | undefined

    // ลำดับการค้นหา citizenId:
    // 1. จาก sess.sub (ถ้าไม่ใช่ 'undefined')
    // 2. จาก sess.profile.citizenId
    // 3. จาก sess.citizenId
    // 4. หาจากฐานข้อมูลผ่าน lineUserId

    if (sess.sub && sess.sub !== 'undefined' && sess.sub !== undefined) {
      citizenId = String(sess.sub)
      console.log("✅ Found citizenId from sess.sub:", citizenId)
    } else if (sess.profile?.citizenId) {
      citizenId = String(sess.profile.citizenId)
      console.log("✅ Found citizenId from sess.profile.citizenId:", citizenId)
    } else if (sess.citizenId) {
      citizenId = String(sess.citizenId)
      console.log("✅ Found citizenId from sess.citizenId:", citizenId)
    } else if (sess.line_user_id || sess.profile?.lineUserId) {
      // ลองหาจากฐานข้อมูลผ่าน LINE User ID
      const lineUserId = sess.line_user_id || sess.profile.lineUserId
      console.log("🔍 Attempting to find citizenId by lineUserId:", lineUserId)
      
      const conn = await pool.getConnection()
      try {
        const [userRows] = await conn.execute<any[]>(
          "SELECT citizenId FROM `user` WHERE line_id = ? LIMIT 1",
          [lineUserId]
        )
        if (userRows && userRows.length > 0) {
          citizenId = String(userRows[0].citizenId)
          console.log("✅ Found citizenId from database via lineUserId:", citizenId)
        }
      } finally {
        conn.release()
      }
    }

    if (!citizenId) {
      console.error("❌ Cannot find citizenId from session:", {
        sub: sess.sub,
        profile: sess.profile,
        lineUserId: sess.line_user_id,
        fullSession: sess
      })
      return NextResponse.json({
        success: false,
        error: "ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่"
      }, { status: 400 })
    }

    // 3) รับ lineProfile
    let body
    try {
      body = await req.json()
    } catch (jsonError) {
      console.error("❌ Invalid JSON in request body:", jsonError)
      return NextResponse.json({ 
        success: false, 
        error: "ข้อมูลไม่ถูกต้อง: ไม่สามารถอ่าน JSON ได้" 
      }, { status: 400 })
    }

    const lineProfile = (body?.lineProfile ?? {}) as LineProfile
    
    if (!lineProfile?.userId || !lineProfile?.displayName) {
      console.warn("❌ Missing LINE profile data:", { 
        hasUserId: !!lineProfile?.userId, 
        hasDisplayName: !!lineProfile?.displayName 
      })
      return NextResponse.json({
        success: false,
        error: "ข้อมูลไม่ครบถ้วน: ต้องมี lineProfile.userId และ lineProfile.displayName"
      }, { status: 400 })
    }

    console.log("🔍 linking:", {
      citizenId,
      lineId: lineProfile.userId,
      displayName: lineProfile.displayName,
      hasPicture: !!lineProfile.pictureUrl,
    })

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // 4) ยืนยันว่ามี user จริง (ล็อกแถว)
      console.log("🔍 Looking for user with citizenId:", citizenId)
      const [uRows] = await conn.execute<any[]>(
        "SELECT id, citizenId, name FROM `user` WHERE citizenId = ? FOR UPDATE",
        [citizenId]
      )
      
      if (!Array.isArray(uRows) || uRows.length === 0) {
        console.warn("❌ User not found for citizenId:", citizenId)
        await conn.rollback()
        return NextResponse.json({ 
          success: false, 
          error: "ไม่พบผู้ใช้" 
        }, { status: 404 })
      }

      const user = uRows[0]
      console.log("✅ Found user:", { id: user.id, name: user.name })

      // 5) กันซ้ำ: LINE id ห้ามชนกับ user อื่น
      console.log("🔍 Checking for LINE ID conflicts...")
      const [confRows] = await conn.execute<any[]>(
        "SELECT citizenId, name FROM `user` WHERE line_id = ? AND citizenId <> ? LIMIT 1",
        [lineProfile.userId, citizenId]
      )
      
      if (Array.isArray(confRows) && confRows.length > 0) {
        console.warn("❌ LINE ID already linked to another user:", confRows[0])
        await conn.rollback()
        return NextResponse.json({
          success: false,
          error: "บัญชี LINE นี้เชื่อมอยู่กับผู้ใช้อื่นแล้ว"
        }, { status: 409 })
      }

      // 6) อัปเดตข้อมูล LINE ให้ user ปัจจุบัน
      console.log("🔄 Updating user with LINE info...")
      const updateResult = await conn.execute(
        `UPDATE \`user\`
         SET line_id = ?, line_display_name = ?, line_picture_url = ?, updatedAt = NOW()
         WHERE citizenId = ?`,
        [lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl || null, citizenId]
      )
      
      console.log("✅ Update result:", updateResult)

      // 7) อ่านข้อมูลล่าสุดคืนไปให้ UI
      console.log("🔍 Fetching updated user data...")
      const [updated] = await conn.execute<any[]>(
        `SELECT prefix, name, hn, citizenId,
                line_id, line_display_name, line_picture_url
         FROM \`user\`
         WHERE citizenId = ?
         LIMIT 1`,
        [citizenId]
      )

      await conn.commit()
      console.log("✅ Transaction committed successfully")

      const u = updated?.[0] ?? {}
      const response = {
        success: true,
        message: "เชื่อมต่อบัญชี LINE สำเร็จ",
        user: {
          prefix: u.prefix ?? "",
          name: u.name ?? "",
          citizenId: u.citizenId ?? citizenId,
          hn: u.hn ?? "",
          isLinkedWithLine: !!u.line_id,
          lineUserId: u.line_id ?? undefined,
          lineDisplayName: u.line_display_name ?? undefined,
          linePictureUrl: u.line_picture_url ?? undefined,
        },
      }
      
      console.log("✅ Returning success response:", response)
      return NextResponse.json(response)
      
    } catch (dbError) {
      console.error("❌ Database error:", dbError)
      try { 
        await conn.rollback() 
        console.log("🔄 Transaction rolled back")
      } catch (rollbackError) {
        console.error("❌ Rollback error:", rollbackError)
      }
      
      return NextResponse.json({ 
        success: false, 
        error: "เกิดข้อผิดพลาดในฐานข้อมูล" 
      }, { status: 500 })
    } finally {
      conn.release()
    }
    
  } catch (generalError) {
    console.error("❌ General error in link-line API:", generalError)
    return NextResponse.json({ 
      success: false, 
      error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" 
    }, { status: 500 })
  }
}