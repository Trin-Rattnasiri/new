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
      INSERT INTO bookings (user_name, department_id, slot_id, phone_number, id_card_number)
      VALUES (?, ?, ?, ?, ?)
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
      return NextResponse.json({ message: 'จองคิวสำเร็จ' }, { status: 201 });
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
