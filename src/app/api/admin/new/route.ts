// src/app/api/admin/new/route.ts

import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import { getPool } from "@/lib/db"

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
    
    // 🔧 สร้างโฟลเดอร์ public/news/ ถ้ายังไม่มี
    const uploadDir = path.join(process.cwd(), "public", "news")
    try {
      await fs.mkdir(uploadDir, { recursive: true })
    } catch (err) {
      console.log("Directory already exists or created")
    }

    const filePath = path.join(uploadDir, filename)
    const imageUrl = `/news/${filename}`

    // 💾 บันทึกไฟล์
    await fs.writeFile(filePath, buffer)
    console.log("✅ File saved:", filePath)

    // 💾 บันทึกลง Database
    const pool = getPool()
    await pool.execute(
      "INSERT INTO news (imageUrl, caption) VALUES (?, ?)", 
      [imageUrl, caption]
    )
    console.log("✅ Database updated:", imageUrl)

    return NextResponse.json({ 
      message: "Uploaded successfully", 
      imageUrl, 
      caption 
    })
  } catch (error) {
    console.error("❌ Upload error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// ✅ GET: Load all images
export async function GET() {
  try {
    const pool = getPool()
    const [rows] = await pool.query("SELECT * FROM news ORDER BY createdAt DESC")

    console.log("✅ Fetched images:", (rows as any[]).length)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("❌ GET error:", error)
    return NextResponse.json({ 
      error: "Failed to load news images",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// ✅ DELETE: Remove image
export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 })
  }

  try {
    const pool = getPool()
    
    // 🔍 ดึง path รูปจากฐานข้อมูล
    const [rows] = await pool.query("SELECT imageUrl FROM news WHERE id = ?", [id])
    
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    const imageUrl = (rows as any[])[0].imageUrl
    const imagePath = path.join(process.cwd(), "public", imageUrl)

    // 🗑️ ลบไฟล์ภาพ
    try {
      await fs.unlink(imagePath)
      console.log("✅ File deleted:", imagePath)
    } catch (fileErr) {
      console.warn("⚠️ File not found, continuing with DB deletion:", imagePath)
    }

    // ❌ ลบข้อมูลจากฐานข้อมูล
    await pool.query("DELETE FROM news WHERE id = ?", [id])
    console.log("✅ Database record deleted:", id)

    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err) {
    console.error("❌ Delete error:", err)
    return NextResponse.json({ 
      error: "Failed to delete image",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}