// src/app/api/appointment/[booking_reference_number]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// ---------- helpers ----------
const createErrorResponse = (message: string, status: number = 500, details?: any) => {
  console.error(`❌ Error (${status}):`, message, details ?? "")
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  )
}

const normalizeStatus = (s: string) => {
  const v = (s || "").trim().toLowerCase()
  if (v === "canceled" || v === "cancel") return "cancelled"
  return v
}

const toHHMM = (time: string): string => {
  if (!time) return '00:00'
  const parts = time.split(':')
  return `${parts[0]}:${parts[1]}`
}

type Params = { booking_reference_number: string }
const REF_RE = /^\d{8}-\d{5}$/

// ---------- GET ----------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  let connection: PoolConnection | undefined
  try {
    connection = await pool.getConnection()

    const { booking_reference_number } = await params
    if (!booking_reference_number || !REF_RE.test(booking_reference_number)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    console.log("🔍 ค้นหาข้อมูลการนัดหมาย:", booking_reference_number)

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        b.id,
        b.name,
        b.hn,
        b.phone_number,
        b.created_by,
        b.status,
        b.cancelled_by AS cancelledBy,
        b.cancellation_reason,
        b.booking_reference_number,
        b.booking_date,
        d.name AS department_name,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM bookings b
      JOIN departments d ON b.department_id = d.id
      JOIN slots s ON b.slot_id = s.id
      WHERE b.booking_reference_number = ?`,
      [booking_reference_number],
    )

    if (!rows || rows.length === 0) {
      return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
    }

    const appointment = rows[0]
    console.log("✅ พบข้อมูลการนัดหมาย ID:", appointment.id)

    return NextResponse.json(
      { ...appointment, bookingReferenceNumber: appointment.booking_reference_number },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
    )
  } catch (error: any) {
    return createErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูล", 500, error?.message)
  } finally {
    connection?.release()
  }
}

// ---------- PUT (update status + push LINE status update) ----------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  let connection: PoolConnection | undefined
  try {
    connection = await pool.getConnection()

    const { booking_reference_number } = await params
    if (!booking_reference_number || !REF_RE.test(booking_reference_number)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return createErrorResponse("ข้อมูล JSON ไม่ถูกต้อง", 400)
    }

    let { status: rawStatus, cancelledBy, cancellation_reason } = body
    let status = normalizeStatus(rawStatus)

    if (!status) return createErrorResponse("กรุณาระบุสถานะ", 400)

    if (status === 'cancelled' && !cancellation_reason?.trim()) {
      return createErrorResponse("กรุณาระบุเหตุผลการยกเลิก", 400)
    }

    const valid = ["pending", "confirmed", "cancelled", "completed"]
    if (!valid.includes(status)) {
      return createErrorResponse(`สถานะไม่ถูกต้อง ต้องเป็น: ${valid.join(", ")}`, 400)
    }

    console.log("🔄 อัพเดทสถานะการนัดหมาย:", booking_reference_number, "เป็น:", status)

    await connection.beginTransaction()
    try {
      const [bookingRows] = await connection.query<RowDataPacket[]>(
        `SELECT 
           b.id,
           b.status,
           b.slot_id,
           b.booking_reference_number,
           b.name,
           b.hn,
           b.phone_number,
           b.created_by,
           d.name AS department_name,
           s.slot_date,
           s.start_time,
           s.end_time,
           u.line_id AS lineId
         FROM bookings b
         JOIN departments d ON b.department_id = d.id
         JOIN slots s ON b.slot_id = s.id
         LEFT JOIN \`user\` u ON u.citizenId = b.created_by
         WHERE b.booking_reference_number = ?
         FOR UPDATE`,
        [booking_reference_number],
      )

      if (!bookingRows || bookingRows.length === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
      }

      const booking = bookingRows[0]
      console.log("🔍 ข้อมูลการจองปัจจุบัน:", { id: booking.id, status: booking.status })

      if (booking.status === status) {
        await connection.rollback()
        return NextResponse.json(
          { message: "สถานะการนัดหมายเหมือนเดิม ไม่มีการเปลี่ยนแปลง", current_status: status },
          { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
        )
      }

      const [updateResult] = await connection.query<ResultSetHeader>(
        "UPDATE bookings SET status = ?, cancelled_by = ?, cancellation_reason = ? WHERE booking_reference_number = ?",
        [status, cancelledBy || null, cancellation_reason?.trim() || null, booking_reference_number],
      )
      if (updateResult.affectedRows === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่สามารถอัพเดทข้อมูลได้", 500)
      }

      if (booking.status !== "cancelled" && status === "cancelled") {
        await connection.query<ResultSetHeader>(
          "UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?",
          [booking.slot_id],
        )
      } else if (booking.status === "cancelled" && status !== "cancelled") {
        const [slotCheck] = await connection.query<RowDataPacket[]>(
          "SELECT available_seats FROM slots WHERE id = ? FOR UPDATE",
          [booking.slot_id],
        )
        const available = slotCheck?.[0]?.available_seats ?? 0
        if (available <= 0) {
          await connection.rollback()
          return createErrorResponse("ช่วงเวลานี้เต็มแล้ว ไม่สามารถเปลี่ยนสถานะได้", 400)
        }
        await connection.query<ResultSetHeader>(
          "UPDATE slots SET available_seats = available_seats - 1 WHERE id = ?",
          [booking.slot_id],
        )
      }

      await connection.commit()
      console.log("✅ อัพเดทสถานะการนัดหมายสำเร็จ")

      ;(async () => {
        try {
          const lineUserId = booking.lineId
          if (!lineUserId) {
            console.warn("⚠️ ไม่พบ LINE userId (line_id) สำหรับ citizenId:", booking.created_by)
            return
          }

          let baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || (request.nextUrl && request.nextUrl.origin) || ""
          if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1)

          const payload = {
            userId: String(lineUserId),
            statusUpdateDetails: {
              referenceNumber: booking.booking_reference_number,
              department: booking.department_name,
              date: booking.slot_date,
              time: `${toHHMM(booking.start_time)}-${toHHMM(booking.end_time)}`,
              oldStatus: booking.status,
              newStatus: status,
              statusMessage: status === "cancelled" 
                ? (cancellation_reason || "ผู้ใช้ยกเลิกคิวผ่านระบบ")
                : "มีการเปลี่ยนแปลงสถานะการนัดหมาย",
              adminNote: cancelledBy ? `cancelledBy=${cancelledBy}` : null,
              cancellationReason: cancellation_reason || null,
            },
          }

          console.log("📤 ส่งแจ้งเตือน LINE:", JSON.stringify(payload, null, 2))
          const notifyRes = await fetch(`${baseUrl}/api/line/notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          if (!notifyRes.ok) {
            console.error("❌ ส่งแจ้งเตือนไป LINE ไม่สำเร็จ:", notifyRes.status, await notifyRes.text())
          } else {
            console.log("✅ ส่งแจ้งเตือนไป LINE สำเร็จ")
          }
        } catch (e: any) {
          console.error("❌ เกิดข้อผิดพลาดระหว่างส่งแจ้งเตือนไป LINE:", e?.message || e)
        }
      })()

      return NextResponse.json(
        {
          message: "อัพเดทสถานะการนัดหมายเรียบร้อย",
          booking_reference_number,
          bookingReferenceNumber: booking_reference_number,
          new_status: status,
          previous_status: booking.status,
          cancellation_reason: cancellation_reason || null,
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
      )
    } catch (err) {
      await connection.rollback()
      throw err
    }
  } catch (error: any) {
    return createErrorResponse("เกิดข้อผิดพลาดในการอัพเดทข้อมูล", 500, error?.message)
  } finally {
    connection?.release()
  }
}

// ---------- DELETE ----------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  let connection: PoolConnection | undefined
  try {
    connection = await pool.getConnection()

    const { booking_reference_number } = await params
    if (!booking_reference_number || !REF_RE.test(booking_reference_number)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    console.log("🗑️ ลบการนัดหมาย:", booking_reference_number)

    await connection.beginTransaction()
    try {
      const [bookingRows] = await connection.query<RowDataPacket[]>(
        "SELECT id, status, slot_id, name FROM bookings WHERE booking_reference_number = ? FOR UPDATE",
        [booking_reference_number],
      )
      if (!bookingRows || bookingRows.length === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
      }

      const booking = bookingRows[0]

      if (booking.status !== "cancelled") {
        await connection.query<RowDataPacket[]>("SELECT id FROM slots WHERE id = ? FOR UPDATE", [booking.slot_id])
        await connection.query<ResultSetHeader>(
          "UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?",
          [booking.slot_id],
        )
      }

      const [del] = await connection.query<ResultSetHeader>(
        "DELETE FROM bookings WHERE booking_reference_number = ?",
        [booking_reference_number],
      )
      if (del.affectedRows === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่สามารถลบข้อมูลได้", 500)
      }

      await connection.commit()
      console.log("✅ ลบการนัดหมายสำเร็จ")

      return NextResponse.json(
        {
          message: "ลบการนัดหมายเรียบร้อย",
          deleted_booking_reference_number: booking_reference_number,
          deleted_booking_name: booking.name,
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
      )
    } catch (err) {
      await connection.rollback()
      throw err
    }
  } catch (error: any) {
    return createErrorResponse("เกิดข้อผิดพลาดในการลบข้อมูล", 500, error?.message)
  } finally {
    connection?.release()
  }
}