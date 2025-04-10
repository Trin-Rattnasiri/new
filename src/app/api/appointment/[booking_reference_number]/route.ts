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

// GET /api/appointment/[booking_reference_number]
export async function GET(
  req: Request,
  { params }: { params: { booking_reference_number: string } }
) {
  const { booking_reference_number } = params;
  console.log("📌 รับค่า booking_reference_number:", booking_reference_number);

  try {
    const connection = await getConnection();

    const [rows] = await connection.execute(
      `SELECT 
        b.id,
        b.name,
        b.hn,
        b.status,
        b.booking_reference_number,
        b.booking_date,
        d.name AS department_name,
        s.slot_date,
        s.start_time,
        s.end_time,
        u.phone AS phone_number        -- ✅ เพิ่มตรงนี้
      FROM bookings b
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN slots s ON b.slot_id = s.id
      LEFT JOIN user u ON b.created_by = u.citizenId    -- ✅ join กับ user ด้วย citizenId
      WHERE b.booking_reference_number = ?
      LIMIT 1`,
      [booking_reference_number]
    );
    

    await connection.end();

    const result = (rows as any[])[0];

    if (!result) {
      return NextResponse.json({ message: 'ไม่พบใบนัดในระบบ' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching appointment by reference:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบนัด' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointment/[booking_reference_number]
export async function DELETE(
  req: Request,
  { params }: { params: { booking_reference_number: string } }
) {
  const { booking_reference_number } = params;

  try {
    const connection = await getConnection();
    await connection.beginTransaction();

    // ตรวจสอบว่า booking มีจริงหรือไม่ และดึง slot_id
    const [rows] = await connection.execute(
      `SELECT id, slot_id FROM bookings WHERE booking_reference_number = ?`,
      [booking_reference_number]
    );

    const booking = (rows as any[])[0];

    if (!booking) {
      await connection.end();
      return NextResponse.json({ message: "ไม่พบใบนัดในระบบ" }, { status: 404 });
    }

    const bookingId = booking.id;
    const slotId = booking.slot_id;

    // ลบ booking
    await connection.execute(
      `DELETE FROM bookings WHERE id = ?`,
      [bookingId]
    );

    // คืนจำนวนที่นั่ง
    await connection.execute(
      `UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?`,
      [slotId]
    );

    await connection.commit();
    await connection.end();

    return NextResponse.json({ message: "ลบใบนัดสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting appointment:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบใบนัด" },
      { status: 500 }
    );
  }
}
