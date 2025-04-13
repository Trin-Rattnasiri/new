// ✅ ดึงข้อมูลแอดมินทั้งหมดหรือเฉพาะรออนุมัติ
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "true";

  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    showAll
      ? "SELECT id, username, position, is_approved FROM admins"
      : "SELECT id, username, position FROM admins WHERE is_approved = false"
  );
  await connection.end();

  return NextResponse.json(rows);
}
