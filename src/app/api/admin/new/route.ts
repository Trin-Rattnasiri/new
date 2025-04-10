// src/app/api/admin/new/route.ts

import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

// ✅ POST: Upload image
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File
    const caption = formData.get("caption")?.toString() || ""

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${uuidv4()}-${file.name}`
    const filePath = path.join(process.cwd(), "public/news", filename)
    const imageUrl = `/news/${filename}`

    await fs.writeFile(filePath, buffer)

    const connection = await pool.getConnection()
    await connection.execute("INSERT INTO news (imageUrl, caption) VALUES (?, ?)", [imageUrl, caption])
    connection.release()

    return NextResponse.json({ message: "Uploaded successfully", imageUrl, caption })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// ✅ GET: Load images
export async function GET() {
  try {
    const connection = await pool.getConnection()
    const [rows] = await connection.query("SELECT * FROM news ORDER BY createdAt DESC")
    connection.release()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json({ error: "Failed to load news images" }, { status: 500 })
  }
}

// ✅ DELETE: ลบรูปภาพ
export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    // 🔍 ดึง path รูปจากฐานข้อมูล
    const [rows] = await connection.query("SELECT imageUrl FROM news WHERE id = ?", [id])
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const imageUrl = (rows as any[])[0].imageUrl
    const imagePath = path.join(process.cwd(), "public", imageUrl)

    // 🗑 ลบไฟล์ภาพ
    await fs.unlink(imagePath)

    // ❌ ลบข้อมูลจากฐานข้อมูล
    await connection.query("DELETE FROM news WHERE id = ?", [id])

    return NextResponse.json({ message: "Deleted" })
  } catch (err) {
    console.error("❌ Delete error:", err)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  } finally {
    connection.release()
  }
}