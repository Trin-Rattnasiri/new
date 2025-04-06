import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// ✅ Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ GET: ดึงข้อมูลใบนัดด้วย booking_reference_number
export async function GET(
  req: Request,
  { params }: { params: { booking_reference_number: string } }
) {
  const connection = await pool.getConnection();
  try {
    const { booking_reference_number } = params;

    if (!booking_reference_number) {
      return NextResponse.json({ error: "กรุณาระบุรหัสใบนัด" }, { status: 400 });
    }

    const [rows] = await connection.query(
      `
        SELECT b.*, d.name AS department_name,
               s.slot_date, s.start_time, s.end_time
        FROM bookings b
        JOIN departments d ON b.department_id = d.id
        JOIN slots s ON b.slot_id = s.id
        WHERE b.booking_reference_number = ?
        LIMIT 1
      `,
      [booking_reference_number]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบใบนัด" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("🚨 GET API ERROR:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    connection.release();
  }
}

// ✅ DELETE: ลบใบนัดด้วย booking_reference_number
export async function DELETE(
  req: Request,
  { params }: { params: { booking_reference_number: string } }
) {
  const connection = await pool.getConnection();

  try {
    const { booking_reference_number } = params;

    if (!booking_reference_number) {
      return NextResponse.json({ error: "กรุณาระบุรหัสใบนัด" }, { status: 400 });
    }

    const [result] = await connection.query(
      "DELETE FROM bookings WHERE booking_reference_number = ?",
      [booking_reference_number]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ message: "ไม่พบใบนัด" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบใบนัดสำเร็จ" });
  } catch (error) {
    console.error("🚨 DELETE API ERROR:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 });
  } finally {
    connection.release();
  }
}
