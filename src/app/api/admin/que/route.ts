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
    const { user_name, department_id, slot_id, phone_number, id_card_number } = body;

    // ตรวจสอบค่าที่จำเป็น
    if (!user_name || !department_id || !slot_id || !phone_number || !id_card_number) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();

    // เช็คจำนวนที่นั่งใน slot ว่ามีมากกว่า 0 หรือไม่
    const slotQuery = `
      SELECT available_seats, start_time, end_time
      FROM slots
      WHERE id = ?
    `;
    const [slotResult] = await connection.query(slotQuery, [slot_id]);
    const slotData = (slotResult as mysql.RowDataPacket[])[0];

    const availableSeats = slotData?.available_seats;

    // หากที่นั่งไม่เพียงพอ (0 หรือจำนวนติดลบ)
    if (availableSeats <= 0) {
      return NextResponse.json({ message: 'ที่นั่งเต็มแล้ว' }, { status: 400 });
    }

    // เพิ่มข้อมูลการจองคิว โดยใช้ CURRENT_DATE เพื่อเก็บเฉพาะวันที่
    const query = `
      INSERT INTO bookings (user_name, department_id, slot_id, phone_number, id_card_number, booking_date, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 'pending')
    `;
    const [result] = await connection.query(query, [
      user_name,
      department_id,
      slot_id,
      phone_number,
      id_card_number,
    ]);

    // ตรวจสอบว่าได้เพิ่มข้อมูลการจองสำเร็จ
    if ((result as mysql.ResultSetHeader).affectedRows > 0) {
      // ดึงหมายเลขการจองที่สร้างขึ้นจาก ID ล่าสุด
      const bookingId = (result as mysql.ResultSetHeader).insertId;

      // สร้างหมายเลขการจอง (booking_reference_number) โดยใช้วันที่ปัจจุบัน + id ที่เพิ่มขึ้น
      const bookingReferenceNumber = `${new Date().getFullYear()}${('0' + (new Date().getMonth() + 1)).slice(-2)}${('0' + new Date().getDate()).slice(-2)}-${('00000' + bookingId).slice(-5)}`;

      // อัพเดต booking_reference_number ในตาราง bookings
      const updateQuery = `
        UPDATE bookings 
        SET booking_reference_number = ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [bookingReferenceNumber, bookingId]);

      // ดึงวันที่จองจากฐานข้อมูล
      const bookingDateQuery = `
        SELECT booking_date, booking_reference_number
        FROM bookings
        WHERE id = ?
      `;
      const [bookingDateResult] = await connection.query(bookingDateQuery, [bookingId]);
      const bookingDate = (bookingDateResult as mysql.RowDataPacket[])[0].booking_date;

      // ลดจำนวนที่นั่งในตาราง slots
      const updateSeatsQuery = `
        UPDATE slots
        SET available_seats = available_seats - 1
        WHERE id = ?
      `;
      await connection.query(updateSeatsQuery, [slot_id]);

      // สร้างข้อความแสดงเวลาและจำนวนที่นั่งว่าง
      const timeSlotMessage = `${slotData.start_time}-${slotData.end_time} (จำนวนที่ว่าง: ${availableSeats - 1})`;

      // ส่งกลับข้อมูลการจองพร้อมหมายเลขการจอง, วันที่, และเวลาที่มีให้เลือก
      return NextResponse.json({
        message: 'จองคิวสำเร็จ',
        bookingReferenceNumber: bookingReferenceNumber,
        bookingDate: bookingDate,
        timeSlot: timeSlotMessage,
        id: bookingId // ✅ เพิ่มตรงนี้
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'ไม่สามารถจองคิวได้' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error booking queue:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการจองคิว' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end(); // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
    }
  }
}
