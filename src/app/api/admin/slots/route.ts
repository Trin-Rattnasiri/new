// src/app/api/admin/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// ---------- DB connection ----------
const getConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  })
}

// ---------- helpers ----------
const formatTime = (time?: string): string => {
  if (!time) return '00:00:00'
  // รองรับทั้ง 'HH:mm' และ 'HH:mm:ss'
  const [h = '00', m = '00'] = time.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`
}

// ========== POST: create slot ==========
export async function POST(req: NextRequest) {
  let conn
  try {
    const body = await req.json()

    // รับได้ทั้ง total_seats (ใหม่) หรือ available_seats (ของเดิม) แล้ว normalize
    const seatsInputRaw = body.total_seats ?? body.available_seats
    const department_id =
      body.department_id != null ? Number(body.department_id) : null
    const slot_date: string | null = body.slot_date ?? null
    const start_time: string | null = body.start_time ?? null
    const end_time: string | null = body.end_time ?? null
    const total_seats =
      seatsInputRaw != null ? Number(seatsInputRaw) : null

    if (
      department_id == null ||
      !slot_date ||
      !start_time ||
      !end_time ||
      total_seats == null
    ) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 },
      )
    }
    if (!Number.isFinite(total_seats) || total_seats < 0) {
      return NextResponse.json(
        { message: 'จำนวนที่นั่งทั้งหมดต้องเป็นตัวเลขศูนย์หรือมากกว่า' },
        { status: 400 },
      )
    }

    const formattedStart = formatTime(start_time)
    const formattedEnd = formatTime(end_time)
    // ว่างเริ่มต้น = ทั้งหมด
    const available_seats = total_seats

    conn = await getConnection()
    await conn.execute(
      `
      INSERT INTO slots
        (department_id, slot_date, start_time, end_time, available_seats, total_seats)
      VALUES
        (?, ?, ?, ?, ?, ?)
      `,
      [
        department_id,
        slot_date,
        formattedStart,
        formattedEnd,
        available_seats,
        total_seats,
      ],
    )

    return NextResponse.json({ message: 'เพิ่มเวลา (slot) สำเร็จ' }, { status: 201 })
  } catch (err) {
    console.error('Error creating slot:', err)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการเพิ่มเวลา' },
      { status: 500 },
    )
  } finally {
    if (conn) await conn.end()
  }
}

// ========== GET: list slots (with department name) ==========
export async function GET() {
  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.execute(
      `
      SELECT
        s.id,
        s.slot_date,
        s.start_time,
        s.end_time,
        s.available_seats,
        s.total_seats,
        d.name AS department_name
      FROM slots s
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.slot_date ASC, s.start_time ASC
      `,
    )
    return NextResponse.json({ slots: rows }, { status: 200 })
  } catch (err) {
    console.error('Error fetching slots:', err)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล slot' },
      { status: 500 },
    )
  } finally {
    if (conn) await conn.end()
  }
}

// ========== DELETE: delete slot ==========
export async function DELETE(req: NextRequest) {
  let conn
  try {
    const { searchParams } = new URL(req.url)
    const slotId = searchParams.get('slotId')
    const force = searchParams.get('force') === 'true' // เพิ่มพารามิเตอร์บังคับลบ

    if (!slotId) {
      return NextResponse.json(
        { message: 'กรุณาระบุ slotId' },
        { status: 400 }
      )
    }

    const id = Number(slotId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { message: 'slotId ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    conn = await getConnection()
    await conn.beginTransaction()

    // ตรวจสอบว่า slot มีอยู่หรือไม่
    const [rows]: any = await conn.execute(
      'SELECT id, available_seats, total_seats FROM slots WHERE id = ? FOR UPDATE',
      [id]
    )

    if (!rows?.length) {
      await conn.rollback()
      return NextResponse.json(
        { message: 'ไม่พบ slot ที่ต้องการลบ' },
        { status: 404 }
      )
    }

    const slot = rows[0]
    const bookedSeats = slot.total_seats - slot.available_seats

    // ถ้ามีคนจองแล้ว และไม่ได้บังคับลบ -> แจ้งเตือน
    if (bookedSeats > 0 && !force) {
      await conn.rollback()
      return NextResponse.json(
        { 
          message: `มีการจองแล้ว ${bookedSeats} ที่นั่ง\nต้องการลบต่อหรือไม่?`,
          needsConfirmation: true,
          bookedSeats,
          slotId: id
        },
        { status: 409 } // 409 Conflict
      )
    }

    // ลบการจองที่เกี่ยวข้องก่อน (ถ้ามี)
    if (bookedSeats > 0) {
      await conn.execute('DELETE FROM bookings WHERE slot_id = ?', [id])
    }

    // ลบ slot
    await conn.execute('DELETE FROM slots WHERE id = ?', [id])

    await conn.commit()
    return NextResponse.json(
      { 
        message: bookedSeats > 0 
          ? `ลบเวลา (slot) สำเร็จ พร้อมยกเลิกการจอง ${bookedSeats} ที่นั่ง`
          : 'ลบเวลา (slot) สำเร็จ',
        success: true,
        deletedBookings: bookedSeats
      },
      { status: 200 }
    )

  } catch (err) {
    if (conn) await conn.rollback()
    console.error('Error deleting slot:', err)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการลบเวลา' },
      { status: 500 }
    )
  } finally {
    if (conn) await conn.end()
  }
}
// ========== PUT: update slot ==========
// เพิ่มโค้ดนี้ใน src/app/api/admin/slots/route.ts
// วางหลัง DELETE method

export async function PUT(req: NextRequest) {
  let conn
  try {
    const body = await req.json()

    const id = body.id != null ? Number(body.id) : null
    const slot_date_in: string | null = body.slot_date ?? null
    const start_time_in: string | null = body.start_time ?? null
    const end_time_in: string | null = body.end_time ?? null
    const total_in = body.total_seats != null ? Number(body.total_seats) : null
    const avail_in = body.available_seats != null ? Number(body.available_seats) : null

    if (id == null) {
      return NextResponse.json({ message: 'ไม่พบ id' }, { status: 400 })
    }

    conn = await getConnection()
    await conn.beginTransaction()

    const [rows]: any = await conn.execute(
      `SELECT slot_date, start_time, end_time, total_seats, available_seats
       FROM slots WHERE id = ? FOR UPDATE`,
      [id],
    )
    if (!rows?.length) {
      await conn.rollback()
      return NextResponse.json({ message: 'ไม่พบ slot' }, { status: 404 })
    }

    const old = rows[0] as {
      slot_date: string; start_time: string; end_time: string;
      total_seats: number; available_seats: number
    }

    const new_date = slot_date_in ?? old.slot_date
    const new_start = start_time_in ? formatTime(start_time_in) : old.start_time
    const new_end   = end_time_in   ? formatTime(end_time_in)   : old.end_time

    let new_total     = old.total_seats
    let new_available = old.available_seats

    if (total_in != null) {
      if (!Number.isFinite(total_in) || total_in < 0) {
        await conn.rollback()
        return NextResponse.json({ message: 'จำนวนที่นั่งทั้งหมดต้องเป็นศูนย์หรือมากกว่า' }, { status: 400 })
      }
      new_total = total_in

      // คงจำนวนที่จองแล้วเดิม
      const booked = Math.max(0, Number(old.total_seats) - Number(old.available_seats))
      new_available = Math.max(0, Math.min(new_total - booked, new_total))
    } else if (avail_in != null) {
      // ไม่ได้เปลี่ยน total แต่เปลี่ยน available → ครอบช่วงด้วย total เดิม
      new_available = Math.max(0, Math.min(avail_in, new_total))
    }

    await conn.execute(
      `UPDATE slots
       SET slot_date = ?, start_time = ?, end_time = ?,
           total_seats = ?, available_seats = ?
       WHERE id = ?`,
      [new_date, new_start, new_end, new_total, new_available, id],
    )

    await conn.commit()
    return NextResponse.json({ message: 'แก้ไขเวลาเรียบร้อย' }, { status: 200 })
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('Error updating slot:', err)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  } finally {
    if (conn) await conn.end()
  }
}