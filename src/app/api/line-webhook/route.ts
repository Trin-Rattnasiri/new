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

const MODE = (process.env.MOCK_MODE || "has") as "has" | "none"
async function findCurrentHospitalQueueByUser(_uid: string): Promise<SimpleQueuePayload | null> {
  if (MODE === "none") return null
  return {
    hospitalName: "โรงพยาบาลแม่จัน",
    department: "002 ซักประวัติทั่วไป",
    queueNo: "A 228",
    type: "นัดมา",
    waitingCount: 52,
    date: "22/08/2025",
    time: "15:40",
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-line-signature") || ""
  const raw = await req.text()
  try {
    validateSignature(raw, lineConfig.channelSecret!, signature)
  } catch {
    // return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 403 })
  }

  const { events } = JSON.parse(raw)

  await Promise.all(events.map(async (event: any) => {
    if (event.type === "message" && event.message?.type === "text" && event.message.text.trim() === "คิวปัจจุบัน") {
      const q = await findCurrentHospitalQueueByUser(event.source?.userId)
      const msg = q ? (buildSimpleQueueFlex(q) as any) : { type: "text", text: "ยังไม่พบคิวของคุณในตอนนี้" }
      try {
        await lineClient.replyMessage(event.replyToken, msg)
      } catch (err: any) {
        console.error("LINE send error:", err.originalError?.response?.data || err)
      }
      return
    }

    if (event.type === "postback" && event.postback?.data === "action=view_current_queue") {
      const q = await findCurrentHospitalQueueByUser(event.source?.userId)
      const msg = q ? (buildSimpleQueueFlex(q) as any) : { type: "text", text: "ยังไม่พบคิวของคุณในตอนนี้" }
      try {
        await lineClient.replyMessage(event.replyToken, msg)
      } catch (err: any) {
        console.error("LINE send error:", err.originalError?.response?.data || err)
      }
      return
    }
  }))

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "line-webhook" })
}
