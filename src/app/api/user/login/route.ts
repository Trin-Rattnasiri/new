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

// ✅ POST: ล็อกอิน
export async function POST(req: Request) {
  try {
    const { citizenId, password } = await req.json();
    console.log("📌 Data received from frontend:", { citizenId, password });

    if (!citizenId || !password) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    console.log("🔍 Checking user in database...");
    
    const [rows] = await connection.execute(
      "SELECT * FROM user WHERE citizenId = ?",
      [citizenId]
    );

    connection.release();

    const users = rows as any[];
    if (users.length === 0) {
      console.error("❌ User not found!");
      return NextResponse.json({ error: "เลขบัตรประชาชนไม่มีอยู่ในระบบ" }, { status: 404 });
    }

    const user = users[0];
    console.log("🔐 Checking password...");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.error("❌ Incorrect password!");
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    console.log("✅ Login successful!");
    
    // ✅ เพิ่ม citizenId ใน response เพื่อให้ frontend ใช้
    return NextResponse.json({ 
      message: "เข้าสู่ระบบสำเร็จ!", 
      citizenId: user.citizenId 
    }, { status: 200 });

  } catch (error) {
    console.error("🚨 Login Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  }
}

