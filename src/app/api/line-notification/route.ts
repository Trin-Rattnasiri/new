// /app/api/line-notification/route.ts
import { NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'

// ⏱️ จัดโซนเวลาไทย + ภาษาไทย
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import tz from 'dayjs/plugin/timezone'
import 'dayjs/locale/th'
dayjs.extend(utc)
dayjs.extend(tz)
dayjs.locale('th')

// ===== helpers =====
function getEnvOrThrow(key: string) {
  const value = process.env[key]
  console.log(`Environment variable ${key}:`, value ? 'SET' : 'NOT SET')
  if (!value) throw new Error(`Environment variable ${key} is not set`)
  return value
}
function normalizeStatus(s?: string) {
  const v = (s || '').trim().toLowerCase()
  if (v === 'canceled' || v === 'cancel') return 'cancelled'
  return v
}
function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: 'รอการยืนยัน',
    confirmed: 'ยืนยันแล้ว',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ',
    cancelled: 'ยกเลิกแล้ว',
    completed: 'เสร็จสิ้น',
    'no-show': 'ไม่มาตามนัด',
  }
  return statusMap[status] || status
}
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    pending: '#ff9500',
    confirmed: '#34c759',
    approved: '#34c759',
    rejected: '#ff3b30',
    cancelled: '#ff3b30',
    completed: '#007aff',
    'no-show': '#ff6b6b',
  }
  return colorMap[status] || '#8e8e93'
}
// แปลงวันที่เป็นข้อความไทยเสมอ (รองรับ ISO/UTC และ DATE ธรรมดา)
function toThaiDateText(input?: string) {
  if (!input) return '-'
  const d = /T|Z/.test(input) ? dayjs.utc(input).tz('Asia/Bangkok') : dayjs(input)
  return d.isValid() ? d.format('D MMM YYYY') : input
}
// ทำเวลาให้สั้นลง เช่น "08:00:00-09:00:00" -> "08:00-09:00"
function toTimeRangeText(input?: string) {
  if (!input) return '-'
  const trim = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t)
  if (input.includes('-')) {
    const [a, b] = input.split('-')
    return `${trim(a)}-${trim(b)}`
  }
  return trim(input)
}

export async function POST(request: Request) {
  console.log('🚀 LINE Notification API called')
  try {
    // ENV
    const lineConfig = {
      channelAccessToken: getEnvOrThrow('LINE_CHANNEL_ACCESS_TOKEN'),
      channelSecret: getEnvOrThrow('LINE_CHANNEL_SECRET'),
    }
    const client = new Client(lineConfig)

    // Body
    const data = await request.json()
    console.log('📥 Request data:', JSON.stringify(data, null, 2))
    const { userId, appointmentDetails, statusUpdateDetails } = data

    if (!userId || (!appointmentDetails && !statusUpdateDetails)) {
      return NextResponse.json({ success: false, message: 'Missing required data' }, { status: 400 })
    }

    // BASE_URL (fallback จาก URL เอง)
    let baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof request === 'object' && (request as any).url ? new URL((request as any).url).origin : '')
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

    // เตรียมข้อมูล + ทำให้ฟอร์แมตเหมือนกันทุกกรณี
    let messageType: 'appointment' | 'status_update' = 'appointment'
    let messageData: any

    if (statusUpdateDetails) {
      messageType = 'status_update'
      messageData = {
        referenceNumber: statusUpdateDetails.referenceNumber,
        department: statusUpdateDetails.department,
        date: toThaiDateText(statusUpdateDetails.date),
        time: toTimeRangeText(statusUpdateDetails.time),
        status: normalizeStatus(statusUpdateDetails.newStatus),
        oldStatus: normalizeStatus(statusUpdateDetails.oldStatus),
        statusMessage: statusUpdateDetails.statusMessage,
        adminNote: statusUpdateDetails.adminNote,
      }
    } else {
      messageData = {
        ...appointmentDetails,
        date: toThaiDateText(appointmentDetails?.date),
        time: toTimeRangeText(appointmentDetails?.time),
        status: normalizeStatus(appointmentDetails?.status),
      }
    }

    const bookingStatus = messageData.status || 'pending'
    const statusText = getStatusText(bookingStatus)
    const statusColor = getStatusColor(bookingStatus)

    // Flex Message
    let flexMessage: any
    if (messageType === 'status_update') {
      flexMessage = {
        type: 'flex',
        altText: `🔄 อัปเดตสถานะ: ${messageData.referenceNumber} - ${statusText}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '🔄 อัปเดตสถานะการนัดหมาย', weight: 'bold', size: 'lg', color: '#ffffff' },
              { type: 'text', text: 'สถานะการจองของคุณได้รับการอัปเดต', size: 'sm', color: '#ffffff', margin: 'sm' },
            ],
            backgroundColor: statusColor,
            paddingAll: '20px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'การเปลี่ยนแปลงสถานะ', weight: 'bold', size: 'sm', color: '#666666' },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: getStatusText(messageData.oldStatus),
                        size: 'sm',
                        color: '#999999',
                        decoration: 'line-through',
                        flex: 1,
                      },
                      { type: 'text', text: '➜', size: 'sm', color: '#666666', align: 'center' },
                      {
                        type: 'text',
                        text: statusText,
                        size: 'sm',
                        weight: 'bold',
                        color: statusColor,
                        flex: 1,
                        align: 'end',
                      },
                    ],
                    margin: 'sm',
                  },
                ],
                backgroundColor: '#f8fafc',
                paddingAll: '15px',
                cornerRadius: '8px',
                margin: 'lg',
              },
              { type: 'separator', margin: 'lg' },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เลขอ้างอิง', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.referenceNumber,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    color: '#f59e0b',
                  },
                ],
                margin: 'lg',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'แผนก', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.department,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true,
                  },
                ],
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'วันที่', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.date, // ✅ ไทยเสมอ
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true,
                  },
                ],
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เวลา', color: '#666666', size: 'sm', flex: 2 },
                  { type: 'text', text: messageData.time, weight: 'bold', size: 'sm', flex: 3, align: 'end' },
                ],
                margin: 'md',
              },
            ],
            paddingAll: '20px',
          },
        },
      }
    } else {
      flexMessage = {
        type: 'flex',
        altText: `ใบนัดหมาย ${messageData.department} - ${messageData.date}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: 'ใบนัดหมาย', weight: 'bold', size: 'xl', color: '#ffffff' },
              { type: 'text', text: 'รายละเอียดการจองคิวของคุณ', size: 'sm', color: '#ffffff', margin: 'sm' },
            ],
            backgroundColor: '#2563eb',
            paddingAll: '20px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'สถานะ', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: statusText,
                    weight: 'bold',
                    color: statusColor,
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                  },
                ],
                margin: 'lg',
              },
              { type: 'separator', margin: 'lg' },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'แผนก', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.department,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true,
                  },
                ],
                margin: 'lg',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'วันที่', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.date, // ✅ ไทยเสมอ
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true,
                  },
                ],
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เวลา', color: '#666666', size: 'sm', flex: 2 },
                  { type: 'text', text: messageData.time, weight: 'bold', size: 'sm', flex: 3, align: 'end' },
                ],
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'หมายเลข', color: '#666666', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: messageData.referenceNumber,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    color: '#f59e0b',
                  },
                ],
                margin: 'md',
              },
              { type: 'separator', margin: 'lg' },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'หมายเหตุสำคัญ', weight: 'bold', size: 'sm', color: '#6366f1' },
                  {
                    type: 'text',
                    text: 'กรุณามาก่อนเวลานัด 15-30 นาที และนำบัตรประชาชนมาด้วย',
                    size: 'xs',
                    color: '#64748b',
                    wrap: true,
                    margin: 'sm',
                  },
                ],
                backgroundColor: '#f8fafc',
                paddingAll: '15px',
                cornerRadius: '8px',
                margin: 'lg',
              },
            ],
            paddingAll: '20px',
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                height: 'sm',
                action: { type: 'uri', label: 'ดูรายละเอียดเพิ่มเติม', uri: `${baseUrl}/appointment/${messageData.referenceNumber}` },
                color: '#2563eb',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: 'ติดต่อเจ้าหน้าที่', uri: 'tel:053771056' }, color: '#64748b', flex: 1 },
                  { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: 'แผนที่', uri: 'https://maps.app.goo.gl/p1Zr7jQ8ziWZxNvv9?g_st=ipc' }, color: '#64748b', flex: 1 },
                ],
                spacing: 'sm',
              },
            ],
            paddingAll: '20px',
          },
        },
      }
    }

    // ส่งข้อความไปยัง LINE
    await client.pushMessage(userId, flexMessage)
    return NextResponse.json({ success: true, message: 'Notification sent to LINE' })
  } catch (error: any) {
    console.error('💥 Error details:', { message: error.message, stack: error.stack, name: error.name })
    return NextResponse.json({ success: false, message: 'Failed to send notification', error: error.message }, { status: 500 })
  }
}
