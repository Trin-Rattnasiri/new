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

    // เพิ่มข้อมูลการจองคิว
    const query = `
      INSERT INTO bookings (user_name, department_id, slot_id, phone_number, id_card_number, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
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
      // ดึงหมายเลขการจองที่สร้างขึ้น
      const bookingId = (result as mysql.ResultSetHeader).insertId;

      // สร้างหมายเลขการจอง (booking_reference_number) โดยใช้ปีและลำดับการจอง
      const currentYear = new Date().getFullYear();
      const bookingCountQuery = `SELECT COUNT(*) AS booking_count FROM bookings WHERE YEAR(booking_date) = ?`;
      const [bookingCountResult] = await connection.query(bookingCountQuery, [currentYear]);
      const bookingCount = (bookingCountResult as mysql.RowDataPacket[])[0].booking_count;

      // สร้างหมายเลขการจองแบบล้วนๆ (ไม่มีเครื่องหมายขีดกลาง)
      const bookingReferenceNumber = `${currentYear}${String(bookingCount).padStart(5, '0')}`;

      // อัปเดต booking_reference_number ในฐานข้อมูล
      const updateReferenceNumberQuery = `
        UPDATE bookings
        SET booking_reference_number = ?
        WHERE id = ?
      `;
      await connection.query(updateReferenceNumberQuery, [bookingReferenceNumber, bookingId]);

      // ลดจำนวนที่นั่งในตาราง slots
      const updateSeatsQuery = `
        UPDATE slots
        SET available_seats = available_seats - 1
        WHERE id = ?
      `;
      await connection.query(updateSeatsQuery, [slot_id]);

      // ส่งกลับข้อมูลการจองพร้อมหมายเลขการจอง
      return NextResponse.json({ 
        message: 'จองคิวสำเร็จ', 
        bookingReferenceNumber 
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
