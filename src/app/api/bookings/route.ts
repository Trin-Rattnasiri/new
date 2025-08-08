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

// GET - ดึงข้อมูลแผนกและวันที่ที่สามารถเลือกได้
export async function GET(req: Request) {
  let connection;
  try {
    connection = await getConnection();
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    
    let query = 'SELECT * FROM departments';
    if (departmentId) {
      query = `
        SELECT s.slot_date
        FROM slots s
        WHERE s.department_id = ?
        GROUP BY s.slot_date`;
    }
    
    const [rows]: [mysql.RowDataPacket[], any] = await connection.query(query, departmentId ? [departmentId] : []);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching departments or dates:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนกหรือวันที่' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - บันทึกข้อมูลการจองคิว
export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { user_name, department_id, slot_id, id_card_number, created_by } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!user_name || !department_id || !slot_id) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }
    
    connection = await getConnection();
    
    // ตรวจสอบว่ายังมีที่นั่งว่างหรือไม่
    const checkQuery = 'SELECT available_seats FROM slots WHERE id = ? AND department_id = ?';
    const [checkResult]: [mysql.RowDataPacket[], any] = await connection.query(checkQuery, [slot_id, department_id]);
    
    if (!checkResult.length || checkResult[0].available_seats <= 0) {
      return NextResponse.json({ message: 'ไม่มีที่นั่งว่างในช่วงเวลานี้' }, { status: 400 });
    }
    
    // เริ่ม transaction
    await connection.beginTransaction();
    
    try {
      // สร้าง booking reference number
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      
      // หา booking number ถัดไป
      const [countResult]: [mysql.RowDataPacket[], any] = await connection.query(
        'SELECT COUNT(*) as count FROM bookings WHERE DATE(booking_date) = CURDATE()'
      );
      const bookingNumber = (countResult[0].count + 1).toString().padStart(5, '0');
      const bookingReferenceNumber = `${dateStr}-${bookingNumber}`;
      
      // บันทึกข้อมูลการจอง
      const insertQuery = `
        INSERT INTO bookings (user_name, department_id, slot_id, booking_date, booking_reference_number, id_card_number, created_by)
        VALUES (?, ?, ?, NOW(), ?, ?, ?)
      `;
      await connection.query(insertQuery, [user_name, department_id, slot_id, bookingReferenceNumber, id_card_number, created_by]);
      
      // อัพเดทจำนวนที่นั่งว่าง
      const updateQuery = `
        UPDATE slots 
        SET available_seats = available_seats - 1 
        WHERE id = ? AND available_seats > 0
      `;
      const [updateResult]: [mysql.ResultSetHeader, any] = await connection.query(updateQuery, [slot_id]);
      
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'ไม่สามารถจองได้ ที่นั่งอาจเต็มแล้ว' }, { status: 400 });
      }
      
      // commit transaction
      await connection.commit();

      // ส่งผลลัพธ์กลับ
      return NextResponse.json({ 
        message: 'จองคิวสำเร็จ',
        bookingReferenceNumber: bookingReferenceNumber
      }, { status: 201 });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการจอง', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}