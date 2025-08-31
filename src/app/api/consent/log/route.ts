import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export const runtime = "nodejs"

type SimpleBody = {
  acceptedAt?: string      // ISO (optional; ไม่ส่งจะใช้เวลาปัจจุบัน)
  citizenId: string
  marketingOptIn?: boolean // true/false (optional)
}

type EventItem = {
  purpose: "service" | "marketing"
  consent: boolean
  at?: string              // ISO (optional)
}

type EventsBody = {
  citizenId: string
  events: EventItem[]
}

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  // @ts-ignore: บาง runtime อาจไม่มี field ip
  return (req as any).ip ?? ""
}

export async function POST(req: NextRequest) {
  const pool = getPool()
  const conn = await pool.getConnection()

  try {
    const ua = req.headers.get("user-agent") || ""
    const ip = getClientIp(req)
    const body = await req.json()
    const nowIso = new Date().toISOString()

    type Row = {
      citizen_id: string
      purpose: "service" | "marketing"
      consent: boolean
      accepted_at: string
      ip: string
      user_agent: string
    }
    const rows: Row[] = []

    // รูปแบบ A: เรียบง่าย (หน้าฟอร์ม PDPA ก่อนล็อกอิน)
    // { citizenId, acceptedAt?, marketingOptIn? }
    if (body && body.citizenId && (body.acceptedAt || body.marketingOptIn !== undefined)) {
      const b = body as SimpleBody
      const at = b.acceptedAt || nowIso

      // บันทึก "ยินยอมเพื่อการให้บริการ" เสมอ เมื่อผู้ใช้กดยอมรับฟอร์ม
      rows.push({
        citizen_id: b.citizenId,
        purpose: "service",
        consent: true,
        accepted_at: at,
        ip,
        user_agent: ua,
      })
      // ถ้ามี checkbox การตลาด
      if (typeof b.marketingOptIn === "boolean") {
        rows.push({
          citizen_id: b.citizenId,
          purpose: "marketing",
          consent: b.marketingOptIn,
          accepted_at: at,
          ip,
          user_agent: ua,
        })
      }
    }
    // รูปแบบ B: หลายเหตุการณ์
    // { citizenId, events: [{purpose, consent, at?}, ...] }
    else if (body && body.citizenId && Array.isArray(body.events)) {
      const b = body as EventsBody
      for (const ev of b.events) {
        if (!ev?.purpose || typeof ev.consent !== "boolean") continue
        rows.push({
          citizen_id: b.citizenId,
          purpose: ev.purpose,
          consent: ev.consent,
          accepted_at: ev.at || nowIso,
          ip,
          user_agent: ua,
        })
      }
    } else {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }

    if (!rows.length) {
      return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับบันทึก" }, { status: 400 })
    }

    await conn.beginTransaction()

    const sql = `
      INSERT INTO consent_logs (citizen_id, purpose, consent, accepted_at, ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    consent     = VALUES(consent),
    accepted_at = VALUES(accepted_at),
    ip          = VALUES(ip),
    user_agent  = VALUES(user_agent),
    created_at  = CURRENT_TIMESTAMP
    `
    for (const r of rows) {
      await conn.execute(sql, [
        r.citizen_id,
        r.purpose,
        r.consent ? 1 : 0,
        new Date(r.accepted_at),
        r.ip,
        r.user_agent,
      ])
    }

    await conn.commit()
    return NextResponse.json({ ok: true, inserted: rows.length }, { status: 201 })
  } catch (err: any) {
    try { await conn.rollback() } catch {}
    console.error("🚨 Consent log error:", err?.message || err)
    return NextResponse.json({ error: "บันทึกความยินยอมไม่สำเร็จ" }, { status: 500 })
  } finally {
    conn.release()
  }
}

export async function GET() {
  // healthcheck
  return NextResponse.json({ ok: true, service: "consent-log" })
}
