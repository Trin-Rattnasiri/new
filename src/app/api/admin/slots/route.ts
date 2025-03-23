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

// POST - เพิ่มเวลา (slot) สำหรับแผนกที่มีอยู่แล้ว
export async function POST(req: Request) {
  let connection;
  try {
    // รับข้อมูล JSON จาก body
    const body = await req.json();
    const { department_id, slot_date, time_slot, available_seats } = body;

    if (!department_id || !slot_date || !time_slot || !available_seats) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();

    // เพิ่มเวลา (slot) ให้แผนกที่มีอยู่แล้ว
    const query = 'INSERT INTO slots (department_id, slot_date, time_slot, available_seats) VALUES (?, ?, ?, ?)';
    await connection.query(query, [department_id, slot_date, time_slot, available_seats]);

    return NextResponse.json({ message: 'เพิ่มเวลา (slot) สำเร็จ' }, { status: 201 });
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเวลา' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end(); // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
    }
  }
}
