// /app/api/admin/approve/[username]/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  }
export async function PATCH(_: Request, { params }: { params: { username: string } }) {
  const connection = await mysql.createConnection(dbConfig);

  await connection.execute(
    "UPDATE admins SET is_approved = true WHERE username = ?",
    [params.username]
  );

  await connection.end();

  return NextResponse.json({ message: `✅ อนุมัติ ${params.username} สำเร็จ` });
}
