import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// ✅ ตั้งค่าการเชื่อมต่อ MySQL
const pool = mysql.createPool({
  host: "db",  // ✅ ใช้ IP แทน localhost
  port: 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hospital_booking",
  waitForConnections: true,
  connectionLimit: 50,
  connectTimeout: 10000,
});

// ✅ POST: สมัครสมาชิก
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📌 Data received from frontend:", body);
  

    const { prefix, citizenId, phoneNumber, password, name, birthday } = body;

    if (!prefix || !citizenId || !phoneNumber || !password || !name || !birthday) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔢 สร้าง HN ใหม่
    const [hnResult] = await connection.execute(
      "SELECT hn FROM user WHERE hn IS NOT NULL ORDER BY id DESC LIMIT 1"
    );

    let nextHNNumber = 1;
    if ((hnResult as any[]).length > 0) {
      const lastHN = (hnResult as any[])[0].hn;
      const lastNumber = parseInt(lastHN.replace("HN", ""));
      nextHNNumber = lastNumber + 1;
    }

    const newHN = `HN${String(nextHNNumber).padStart(8, "0")}`;

    // 📝 เพิ่มผู้ใช้ใหม่ลง DB พร้อม prefix
    await connection.execute(
      `INSERT INTO user (prefix, citizenId, phone, password, name, birthday, hn, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [prefix, citizenId, phoneNumber, hashedPassword, name, birthday, newHN]
    );

    connection.release();
    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ!", hn: newHN }, { status: 201 });
  } catch (error) {
    console.error("🚨 Signup Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัคร" }, { status: 500 });
  }
}
