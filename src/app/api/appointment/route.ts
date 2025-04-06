import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(
  req: Request,
  { params }: { params: { booking_reference_number: string } }
) {
  const connection = await pool.getConnection();

  try {
    const { booking_reference_number } = params;

    const [rows] = await connection.query(
      "SELECT * FROM bookings WHERE booking_reference_number = ?",
      [booking_reference_number]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบใบนัด" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("🚨 API ERROR:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    connection.release(); // ✅ สำคัญ: คืน connection กลับเข้า pool
  }
}
