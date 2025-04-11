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
    const { department_id, slot_date, start_time, end_time, available_seats } = body;

    // ตรวจสอบให้แน่ใจว่ามีการกรอกข้อมูลครบถ้วน
    if (!department_id || !slot_date || !start_time || !end_time || !available_seats) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    connection = await getConnection();

    // เพิ่มเวลา (slot) ให้แผนกที่มีอยู่แล้ว
    const query = 'INSERT INTO slots (department_id, slot_date, start_time, end_time, available_seats) VALUES (?, ?, ?, ?, ?)';
    await connection.query(query, [department_id, slot_date, start_time, end_time, available_seats]);

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
// GET - ดึง slot ทั้งหมดพร้อมชื่อแผนก
export async function GET() {
  let connection;
  try {
    connection = await getConnection();

    const [slots] = await connection.execute(`
      SELECT 
        s.id,
        s.slot_date,
        s.start_time,
        s.end_time,
        s.available_seats,
        d.name AS department_name
      FROM slots s
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.slot_date ASC, s.start_time
    `);

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล slot' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}


// PUT - แก้ไข slot
export async function PUT(req: NextRequest) {
  let connection
  try {
    const body = await req.json()
    const { id, slot_date, start_time, end_time, available_seats } = body

    if (!id || !slot_date || !start_time || !end_time || available_seats == null) {
      return NextResponse.json({ message: 'กรอกข้อมูลไม่ครบ' }, { status: 400 })
    }

    connection = await getConnection()
    await connection.execute(
      `UPDATE slots SET slot_date = ?, start_time = ?, end_time = ?, available_seats = ? WHERE id = ?`,
      [slot_date, start_time, end_time, available_seats, id]
    )

    return NextResponse.json({ message: 'แก้ไขเวลาเรียบร้อย' }, { status: 200 })
  } catch (error) {
    console.error('Error updating slot:', error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// DELETE - ลบ slot
export async function DELETE(req: NextRequest) {
  let connection
  try {
    const { searchParams } = new URL(req.url)
    const slotId = searchParams.get('slotId')

    if (!slotId) {
      return NextResponse.json({ message: 'ไม่พบ slotId' }, { status: 400 })
    }

    connection = await getConnection()
    await connection.execute(`DELETE FROM slots WHERE id = ?`, [slotId])

    return NextResponse.json({ message: 'ลบ slot สำเร็จ' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting slot:', error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดขณะลบ' }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}