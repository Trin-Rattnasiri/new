// /app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// สร้าง connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        b.booking_reference_number,
        b.status,
        u.hn, 
        u.name AS user_name,
        u.phone AS phone_number,
        b.created_by AS id_card_number,
        s.slot_date,
        s.start_time,
        s.end_time,
        d.name AS department
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN departments d ON b.department_id = d.id
      LEFT JOIN user u ON b.created_by = u.citizenId
      ORDER BY s.slot_date ASC, s.start_time ASC
    `);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ API ERROR:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}