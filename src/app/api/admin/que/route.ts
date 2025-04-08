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
      user_name,
      department_id,
      slot_id,
      phone_number,
      id_card_number,
      created_by, // ✅ รับค่า created_by จากผู้ล็อกอิน
    } = body;

    if (!user_name || !department_id || !slot_id || !phone_number || !id_card_number) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    connection = await getConnection();

    // ตรวจสอบจำนวนที่นั่งใน slot
    const slotQuery = `
      SELECT available_seats, start_time, end_time
      FROM slots
      WHERE id = ?
    `;
    const [slotResult] = await connection.query(slotQuery, [slot_id]);
    const slotData = (slotResult as mysql.RowDataPacket[])[0];
    const availableSeats = slotData?.available_seats;

    if (availableSeats <= 0) {
      return NextResponse.json({ message: 'ที่นั่งเต็มแล้ว' }, { status: 400 });
    }

    // ✅ เพิ่ม created_by ในการบันทึก
    const insertQuery = `
      INSERT INTO bookings (created_by, user_name, department_id, slot_id, phone_number, id_card_number, booking_date, status)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, 'pending')
    `;
    const [result] = await connection.query(insertQuery, [
      created_by || null, // ถ้าไม่มีให้ใส่เป็น null
      user_name,
      department_id,
      slot_id,
      phone_number,
      id_card_number,
    ]);

    if ((result as mysql.ResultSetHeader).affectedRows > 0) {
      const bookingId = (result as mysql.ResultSetHeader).insertId;
      const bookingReferenceNumber = `${new Date().getFullYear()}${('0' + (new Date().getMonth() + 1)).slice(-2)}${('0' + new Date().getDate()).slice(-2)}-${('00000' + bookingId).slice(-5)}`;

      // อัปเดต booking_reference_number
      const updateQuery = `
        UPDATE bookings 
        SET booking_reference_number = ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [bookingReferenceNumber, bookingId]);

      const bookingDateQuery = `
        SELECT booking_date, booking_reference_number
        FROM bookings
        WHERE id = ?
      `;
      const [bookingDateResult] = await connection.query(bookingDateQuery, [bookingId]);
      const bookingDate = (bookingDateResult as mysql.RowDataPacket[])[0].booking_date;

      // ลดจำนวนที่นั่ง
      const updateSeatsQuery = `
        UPDATE slots
        SET available_seats = available_seats - 1
        WHERE id = ?
      `;
      await connection.query(updateSeatsQuery, [slot_id]);

      const timeSlotMessage = `${slotData.start_time}-${slotData.end_time} (จำนวนที่ว่าง: ${availableSeats - 1})`;

      return NextResponse.json({
        message: 'จองคิวสำเร็จ',
        bookingReferenceNumber,
        bookingDate,
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