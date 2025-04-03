import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  idCard: string;
}

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as RegisterData;
    const { username, password, confirmPassword, email, firstName, lastName, phone, idCard } = data;

    // ตรวจสอบข้อมูลที่รับมา
    if (!username || !password || !confirmPassword || !email || !firstName || !lastName || !phone || !idCard) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ตรงกัน' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // ตรวจสอบการมีชื่อผู้ใช้ซ้ำ
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ? OR email = ? OR id_card = ?',
      [username, email, idCard]
    );
    
    const existingUsers = rows as any[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลนี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      );
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // บันทึกข้อมูลลงในฐานข้อมูล
    await connection.execute(
      'INSERT INTO users (username, password, email, first_name, last_name, phone, id_card) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, firstName, lastName, phone, idCard]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
}
