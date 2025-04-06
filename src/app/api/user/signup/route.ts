import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

// ✅ ตั้งค่าการเชื่อมต่อ MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hospital_booking",
  waitForConnections: true,
  connectionLimit: 10,
});

// ✅ POST: สมัครสมาชิก
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📌 Data received from frontend:", body);

    const { citizenId, phoneNumber, password, name, birthday, prefix } = body;

    if (!citizenId || !phoneNumber || !password || !name || !birthday || !prefix) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // 🔍 ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const [existingUser] = await connection.execute(
      "SELECT * FROM user WHERE citizenId = ?",
      [citizenId]
    );

    if ((existingUser as any[]).length > 0) {
      connection.release();
      return NextResponse.json({ error: "บัญชีนี้มีอยู่แล้ว!" }, { status: 400 });
    }

    // 🔐 Hash รหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📝 เพิ่มข้อมูลลง MySQL
    await connection.execute(
      `INSERT INTO user (citizenId, phone, password, name, birthday, prefix) VALUES (?, ?, ?, ?, ?, ?)`,
      [citizenId, phoneNumber, hashedPassword, name, birthday, prefix]
    );

    connection.release();
    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ!" }, { status: 201 });
  } catch (error) {
    console.error("🚨 Signup Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัคร" }, { status: 500 });
  }
}
