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

    connection = await getConnection();

    const query = 'INSERT INTO departments (name) VALUES (?)';
    const [result] = await connection.query(query, [name]);

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
      await connection.end();
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

    connection = await getConnection();

    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    const query = 'DELETE FROM departments WHERE id = ?';
    const [result] = await connection.query(query, [departmentId]);

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ message: 'ไม่พบแผนกที่ต้องการลบ' }, { status: 404 });
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    return NextResponse.json({ message: 'ลบแผนกสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบแผนก' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// PUT - แก้ไขชื่อแผนก
export async function PUT(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ message: 'กรุณาระบุ id และชื่อแผนก' }, { status: 400 });
    }

    connection = await getConnection();
    const query = 'UPDATE departments SET name = ? WHERE id = ?';
    const [result] = await connection.query(query, [name, id]);

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ message: 'ไม่พบแผนกที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({ message: 'แก้ไขชื่อแผนกสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการแก้ไขแผนก' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
