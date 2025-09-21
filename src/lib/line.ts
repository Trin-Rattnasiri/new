// src/lib/line.ts
import { Client, validateSignature, type FlexMessage } from "@line/bot-sdk"

export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

export const lineClient = new Client(lineConfig)

/** โครงบัตรคิวแบบมินิมอล  */
export type SimpleQueuePayload = {
  hospitalName: string
  department: string
  queueNo: string
  waitingCount: number
  date: string
  time: string
}

/** Flex Message: บัตรคิวมินิมอล (ไม่มีบรรทัด 'ประเภท') */
export function buildSimpleQueueFlex(q: SimpleQueuePayload): FlexMessage {
  return {
    type: "flex",
    altText: `บัตรคิว ${q.queueNo} • ${q.hospitalName}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "16px",
        backgroundColor: "#F9FAFB",
        contents: [
          { type: "text", text: q.hospitalName, weight: "bold", size: "lg", color: "#111827", align: "center" },
          { type: "text", text: q.department, size: "sm", color: "#6B7280", align: "center", wrap: true },
          { type: "separator", margin: "md" },
          { type: "text", text: q.queueNo, weight: "bold", size: "5xl", align: "center", color: "#1D4ED8", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "lg",
            contents: [
              { type: "text", text: `รออยู่: ${q.waitingCount} คิว`, flex: 1, size: "sm", color: "#DC2626" },
              { type: "text", text: `${q.date} ${q.time}`, size: "sm", color: "#6B7280", align: "end" }
            ],
          },
        ],
      },
      styles: { body: { backgroundColor: "#F9FAFB" } },
    },
  }
}

// re-export ให้ route.ts import ได้
export { validateSignature }
