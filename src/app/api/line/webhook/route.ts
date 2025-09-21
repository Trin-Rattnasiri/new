// src/app/api/line-webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
  lineClient,
  lineConfig,
  validateSignature,
  buildSimpleQueueFlex,
  type SimpleQueuePayload,
} from "@/lib/line"

export const runtime = "nodejs"

// ⬇️ โหมดทดสอบ
// MOCK_MODE: "has" = มีคิวจำลอง, "none" = ไม่มีคิว
const MODE = (process.env.MOCK_MODE || "has") as "has" | "none"
// ไม่ส่งไป LINE จริง (จะ console.log แทน) — ใช้ตอน dev/test
const LINE_MOCK_SEND = process.env.LINE_MOCK_SEND === "1"
// ข้ามตรวจลายเซ็น (เฉพาะตอน dev/test) — โปรดปิดใน production
const ALLOW_INSECURE_WEBHOOK = process.env.ALLOW_INSECURE_WEBHOOK === "1"

// ---------------- Mock data ----------------
function genMockQueue(seed?: string): SimpleQueuePayload {
  // ทำให้ได้ค่าคงที่ตาม seed (เช่น userId) เพื่อเทสซ้ำได้
  let base = 123
  if (seed) for (const ch of seed) base = (base * 31 + ch.charCodeAt(0)) % 100000

  const pick = <T,>(arr: T[]) => arr[base % arr.length]
  const pad = (n: number, w = 2) => String(n).padStart(w, "0")
  const now = new Date()
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
  const time = `${pad(now.getHours())}:${pad((now.getMinutes() + (base % 6) * 5) % 60)}`
  const qnum = `A ${200 + (base % 150)}`
  const waiting = 5 + (base % 60)

  return {
    hospitalName: "โรงพยาบาลแม่จัน",
    department: pick(["002 ซักประวัติทั่วไป", "003 ตรวจสุขภาพ", "101 ห้องฉุกเฉิน"]),
    queueNo: qnum,
    waitingCount: waiting,
    date,
    time,
  }
}

async function findCurrentHospitalQueueByUser(lineUserId?: string): Promise<SimpleQueuePayload | null> {
  if (MODE === "none") return null
  // โหมด mock: คืนข้อมูลจำลองเสมอ (ไม่แตะ DB)
  return genMockQueue(lineUserId)
}

// ---------------- helpers ----------------
async function safeReply(replyToken: string, message: any) {
  if (LINE_MOCK_SEND) {
    console.log("🧪 [MOCK SEND] reply:", JSON.stringify(message, null, 2))
    return
  }
  await lineClient.replyMessage(replyToken, message)
}

// ---------------- POST: LINE webhook ----------------
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-line-signature") || ""
  const raw = await req.text()

  // บังคับตรวจลายเซ็น (ยกเว้นเปิด ALLOW_INSECURE_WEBHOOK ตอนทดสอบ)
  if (!ALLOW_INSECURE_WEBHOOK) {
    try {
      validateSignature(raw, lineConfig.channelSecret!, signature)
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 403 })
    }
  }

  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 })
  }

  const { events = [] } = body

  await Promise.all(
    events.map(async (event: any) => {
      // ข้อความ "คิวปัจจุบัน"
      const askCurrentQueue =
        event.type === "message" &&
        event.message?.type === "text" &&
        String(event.message.text || "").trim() === "คิวปัจจุบัน"

      // ปุ่ม postback แสดงคิว
      const postbackCurrent = event.type === "postback" && event.postback?.data === "action=view_current_queue"

      if (!askCurrentQueue && !postbackCurrent) return

      const q = await findCurrentHospitalQueueByUser(event.source?.userId)
      const msg = q ? (buildSimpleQueueFlex(q) as any) : { type: "text", text: "ยังไม่พบคิวของคุณในตอนนี้" }

      try {
        await safeReply(event.replyToken, msg)
      } catch (err: any) {
        console.error("LINE send error:", err?.originalError?.response?.data || err)
      }
    }),
  )

  return NextResponse.json({ ok: true, mode: MODE, mockSend: LINE_MOCK_SEND })
}

// ---------------- GET: health / preview ----------------
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  // ดูตัวอย่าง Flex message โดยไม่ต้องยิงจาก LINE (ใช้ใน dev)
  if (url.searchParams.get("preview") === "1") {
    const seed = url.searchParams.get("seed") || undefined
    const payload = genMockQueue(seed)
    const flex = buildSimpleQueueFlex(payload)
    return NextResponse.json({ ok: true, preview: true, payload, flex })
  }

  return NextResponse.json({ ok: true, service: "line-webhook", mode: MODE, mockSend: LINE_MOCK_SEND })
}
