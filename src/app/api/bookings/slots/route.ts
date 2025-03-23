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

// ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  
  try {
    // รองรับหลายรูปแบบของ input ที่อาจเข้ามา
    let date;
    
    // กรณีเป็น timestamp หรือ ISO string
    if (dateString.includes('T') || dateString.includes('-')) {
      date = new Date(dateString);
    } else {
      // กรณีเป็นตัวเลข (timestamp)
      date = new Date(parseInt(dateString));
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return null;
    }
    
    // แปลงเป็นรูปแบบ YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

// GET - ดึงข้อมูลเวลา (slots) สำหรับแผนกและวันที่ที่เลือก
export async function GET(req: Request) {
  let connection;
  
  try {
    // รับค่า departmentId และ date จาก query parameters
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    const dateParam = url.searchParams.get('date');
    
    console.log('Original date parameter:', dateParam);
    
    // ตรวจสอบว่ามีพารามิเตอร์ครบถ้วนหรือไม่
    if (!departmentId) {
      return NextResponse.json({ message: 'กรุณาระบุแผนก (departmentId)' }, { status: 400 });
    }
    
    if (!dateParam) {
      return NextResponse.json({ message: 'กรุณาระบุวันที่ (date)' }, { status: 400 });
    }
    
    // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD
    const formattedDate = formatDate(dateParam);
    console.log('Formatted Date:', formattedDate);
    
    if (!formattedDate) {
      return NextResponse.json({ 
        message: 'รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้รูปแบบที่รองรับ เช่น YYYY-MM-DD หรือ ISO format' 
      }, { status: 400 });
    }
    
    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();
    
    // ตรวจสอบค่าที่จะใช้ในการ query
    console.log('Query parameters:', { departmentId, formattedDate });
    
    // ดึงข้อมูลเวลา (slot) สำหรับแผนกและวันที่ที่เลือก
    const query = `
      SELECT s.id, s.time_slot, s.available_seats, d.name AS department_name
      FROM slots s
      JOIN departments d ON s.department_id = d.id
      WHERE s.department_id = ? AND DATE(s.slot_date) = ?`;
    
    const [slots]: [mysql.RowDataPacket[], any] = await connection.query(query, [departmentId, formattedDate]);
    
    // ตรวจสอบผลลัพธ์ที่ได้
    console.log(`Found ${slots.length} slots for department ${departmentId} on date ${formattedDate}`);
    
    // ส่งข้อมูลที่ได้กลับเป็น JSON
    return NextResponse.json(slots);
    
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเวลา', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
    
  } finally {
    if (connection) {
      await connection.end(); // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
    }
  }
}