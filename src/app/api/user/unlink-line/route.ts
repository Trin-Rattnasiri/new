// src/app/api/user/unlink-line/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import mysql from "mysql2/promise"
import { verifySession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
})

export async function POST(_req: NextRequest) {
  // 1) auth
  const cookieStore = await cookies()
  const raw = cookieStore.get("session")?.value
  if (!raw) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let sess: { sub: string; kind: "user" | "admin" }
  try {
    sess = verifySession(raw)
  } catch {
    return NextResponse.json({ error: "invalid session" }, { status: 401 })
  }
  if (sess.kind !== "user") {
    return NextResponse.json({ error: "only user can unlink LINE" }, { status: 403 })
  }

  const citizenId = String(sess.sub)
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 2) ล็อกแถวผู้ใช้ — ใช้ citizenid (ตัวพิมพ์เล็ก)
    const [rows] = await conn.execute<any[]>(
      `SELECT id, prefix, name, hn, citizenid,
              line_id, line_display_name, line_picture_url
       FROM \`user\`
       WHERE citizenid = ?
       FOR UPDATE`,
      [citizenId]
    )
    if (!Array.isArray(rows) || rows.length === 0) {
      await conn.rollback()
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })
    }

    // 3) เคลียร์ค่า LINE (idempotent)
    if (rows[0].line_id !== null) {
      await conn.execute(
        `UPDATE \`user\`
         SET line_id = NULL,
             line_display_name = NULL,
             line_picture_url = NULL,
             updatedAt = NOW()
         -- ถ้า schema ใช้ snake_case: updated_at = NOW()
         WHERE citizenid = ?`,
        [citizenId]
      )
    }

    // 4) อ่านค่าล่าสุด
    const [after] = await conn.execute<any[]>(
      `SELECT prefix, name, hn, citizenid,
              line_id, line_display_name, line_picture_url
       FROM \`user\`
       WHERE citizenid = ?
       LIMIT 1`,
      [citizenId]
    )

    await conn.commit()

    const u = after?.[0] ?? {}
    return NextResponse.json({
      success: true,
      message: "ยกเลิกการเชื่อมต่อบัญชี LINE สำเร็จ",
      user: {
        prefix: u.prefix ?? "",
        name: u.name ?? "",
        citizenId: u.citizenid ?? citizenId, // map -> camelCase
        hn: u.hn ?? "",
        isLinkedWithLine: !!u.line_id,
        lineUserId: u.line_id ?? null,
        lineDisplayName: u.line_display_name ?? null,
        linePictureUrl: u.line_picture_url ?? null,
      },
    })
  } catch (e) {
    try { await conn.rollback() } catch {}
    console.error("unlink-line error:", e)
    return NextResponse.json({ error: "server error" }, { status: 500 })
  } finally {
    conn.release()
  }
}
