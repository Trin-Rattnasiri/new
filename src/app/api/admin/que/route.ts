import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// POST - จองคิว
export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const {
      user_name,       // จะเก็บลง column `name`
      department_id,
      slot_id,
      id_card_number,  // จะเก็บลง column `hn`
      created_by,
    } = body;

    if (!user_name || !department_id || !slot_id || !id_card_number) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    connection = await getConnection();

    // ตรวจสอบที่นั่งว่างและดึง slot_date ด้วย
    const slotQuery = `
      SELECT available_seats, start_time, end_time, slot_date
      FROM slots
      WHERE id = ?
    `;
    const [slotResult] = await connection.query(slotQuery, [slot_id]);
    const slotData = (slotResult as mysql.RowDataPacket[])[0];

    if (!slotData || slotData.available_seats <= 0) {
      return NextResponse.json({ message: 'ที่นั่งเต็มแล้ว' }, { status: 400 });
    }

    const { available_seats, start_time, end_time, slot_date } = slotData;

    // บันทึกการจองลง bookings
    const insertQuery = `
      INSERT INTO bookings (created_by, name, department_id, slot_id, hn, booking_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await connection.query(insertQuery, [
      created_by || null,
      user_name,
      department_id,
      slot_id,
      id_card_number,
      slot_date, // ✅ ใช้ slot_date จากฐานข้อมูล
    ]);

    if ((result as mysql.ResultSetHeader).affectedRows > 0) {
      const bookingId = (result as mysql.ResultSetHeader).insertId;
      const bookingReferenceNumber = `${slot_date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(bookingId).padStart(5, '0')}`;

      // อัปเดต booking_reference_number
      const updateQuery = `
        UPDATE bookings 
        SET booking_reference_number = ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [bookingReferenceNumber, bookingId]);

      // อัปเดตจำนวนที่ว่าง
      const updateSeatsQuery = `
        UPDATE slots
        SET available_seats = available_seats - 1
        WHERE id = ?
      `;
      await connection.query(updateSeatsQuery, [slot_id]);

      const timeSlotMessage = `${start_time}-${end_time} (จำนวนที่ว่าง: ${available_seats - 1})`;

      return NextResponse.json({
        message: 'จองคิวสำเร็จ',
        bookingReferenceNumber,
        bookingDate: slot_date,
        timeSlot: timeSlotMessage,
        id: bookingId,
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'ไม่สามารถจองคิวได้' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error booking queue:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการจองคิว' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
