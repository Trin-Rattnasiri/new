// PATCH: ตั้ง is_approved = false
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

export async function PATCH(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "UPDATE admins SET is_approved = false WHERE username = ?",
      [username]
    );
    await connection.end();

    return NextResponse.json({
      message: `✅ ตั้งสถานะเป็น 'รอดำเนินการ' ให้ ${username} แล้ว`,
    });
  } catch (error) {
    console.error("❌ PATCH /pending-action Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

