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

// POST - เพิ่มแผนก
export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'กรุณาระบุชื่อแผนก' }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();

    // เพิ่มแผนก
    const query = 'INSERT INTO departments (name) VALUES (?)';
    const [result] = await connection.query(query, [name]);

    // ตรวจสอบว่าได้เพิ่มแผนกสำเร็จ
    if ((result as mysql.ResultSetHeader).affectedRows > 0) {
      return NextResponse.json({ message: 'เพิ่มแผนกสำเร็จ' }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'ไม่สามารถเพิ่มแผนกได้' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มแผนก' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end(); // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
    }
  }
}
// DELETE - ลบแผนก
export async function DELETE(req: Request) {
  let connection;
  try {
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json({ message: 'กรุณาระบุ departmentId' }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();

    // ปิดการตรวจสอบ foreign key
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // ลบแผนก
    const query = 'DELETE FROM departments WHERE id = ?';
    const [result] = await connection.query(query, [departmentId]);

    // ตรวจสอบว่า affectedRows มากกว่า 0 หมายถึงมีการลบแผนกสำเร็จ
    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ message: 'ไม่พบแผนกที่ต้องการลบ' }, { status: 404 });
    }

    // เปิดการตรวจสอบ foreign key หลังจากลบข้อมูลเสร็จ
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    return NextResponse.json({ message: 'ลบแผนกสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบแผนก' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end(); // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
    }
  }
}
