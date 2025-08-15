
import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { RowDataPacket } from "mysql2"
import { connectToDatabase } from 'src/lib/mysql'

export async function GET() {
  const connection = await connectToDatabase()

  try {
    const [rows] = await connection.query(
      "SELECT COUNT(*) as pendingCount FROM bookings WHERE status = 'pending'"
    )

    const pendingCount = (rows as any[])[0]?.pendingCount || 0

    return NextResponse.json({
      hasNew: pendingCount > 0,
      count: pendingCount
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  } finally {
    connection.end()
  }
}