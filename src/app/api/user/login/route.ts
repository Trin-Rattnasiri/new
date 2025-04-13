import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function POST(req: Request) {
  try {
    const { citizenId, password } = await req.json();
    console.log("📌 Data received from frontend:", { citizenId, password });

    if (!citizenId || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // 🔍 เช็คใน user ก่อน
    const [userRows] = await connection.execute("SELECT * FROM user WHERE citizenId = ?", [citizenId]);
    const users = userRows as any[];

    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
      }

      return NextResponse.json({
        message: "เข้าสู่ระบบสำเร็จ!",
        role: "user",
        citizenId: user.citizenId,
        name: user.name,
        hn: user.hn,
      });
    }

    // 🔍 ถ้าไม่เจอใน user → เช็คใน admins
    const [adminRows] = await connection.execute("SELECT * FROM admins WHERE username = ?", [citizenId]);
    const admins = adminRows as any[];

    if (admins.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
    }

    const admin = admins[0];

    if (!admin.is_approved) {
      return NextResponse.json({ error: "บัญชีแอดมินยังไม่ได้รับการอนุมัติ" }, { status: 403 });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ!",
      role: "admin",
      username: admin.username,
      position: admin.position,
    });

  } catch (error) {
    console.error("🚨 Login Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  }
}
