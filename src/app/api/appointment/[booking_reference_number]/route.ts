import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Helper function for error responses
const createErrorResponse = (message: string, status: number = 500, details?: any) => {
  console.error(`❌ Error (${status}):`, message, details ? details : '')
  return NextResponse.json({ 
    error: message, 
    ...(details && { details }) 
  }, { status })
}

// GET handler to fetch appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ booking_reference_number: string }> }
) {
  let connection;
  
  try {
    connection = await pool.getConnection()
    
    // รอให้ params resolve ก่อน
    const resolvedParams = await params
    const bookingReferenceNumber = resolvedParams.booking_reference_number

    // Validate booking reference number format
    if (!bookingReferenceNumber || !bookingReferenceNumber.match(/^\d{8}-\d{5}$/)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    console.log('🔍 ค้นหาข้อมูลการนัดหมาย:', bookingReferenceNumber)

    const [rows] = await connection.query(
      `SELECT 
        b.id,
        b.name,
        b.hn,
        b.phone_number,
        b.created_by,
        b.status,
        b.cancelled_by AS cancelledBy,
        b.booking_reference_number,
        b.booking_date,
        d.name AS department_name,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM bookings b
      JOIN departments d ON b.department_id = d.id
      JOIN slots s ON b.slot_id = s.id
      WHERE b.booking_reference_number = ?`,
      [bookingReferenceNumber],
    )

    console.log('🔍 ผลการค้นหา:', Array.isArray(rows) ? `พบ ${rows.length} รายการ` : 'ไม่พบข้อมูล')

    if (!rows || (rows as any[]).length === 0) {
      return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
    }

    const appointment = (rows as any[])[0]
    console.log('✅ พบข้อมูลการนัดหมาย ID:', appointment.id)
    
    return NextResponse.json(appointment)
    
  } catch (error: any) {
    return createErrorResponse(
      "เกิดข้อผิดพลาดในการดึงข้อมูล", 
      500, 
      error.message
    )
  } finally {
    if (connection) connection.release()
  }
}

// PUT handler to update appointment status
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ booking_reference_number: string }> }
) {
  let connection;
  
  try {
    connection = await pool.getConnection()
    
    // รอให้ params resolve ก่อน
    const resolvedParams = await params
    const bookingReferenceNumber = resolvedParams.booking_reference_number
    
    let requestData;
    try {
      requestData = await request.json()
    } catch (jsonError) {
      return createErrorResponse("ข้อมูล JSON ไม่ถูกต้อง", 400)
    }
    
    const { status, cancelledBy } = requestData

    // Validate required fields
    if (!status) {
      return createErrorResponse("กรุณาระบุสถานะ", 400)
    }

    // Validate status values
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`สถานะไม่ถูกต้อง ต้องเป็น: ${validStatuses.join(', ')}`, 400)
    }

    // Validate booking reference number format
    if (!bookingReferenceNumber || !bookingReferenceNumber.match(/^\d{8}-\d{5}$/)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    console.log('🔄 อัพเดทสถานะการนัดหมาย:', bookingReferenceNumber, 'เป็น:', status)

    // เริ่ม transaction เพื่อความปลอดภัยของข้อมูล
    await connection.beginTransaction()

    try {
      // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
      const [bookingRows] = await connection.query(
        "SELECT id, status, slot_id FROM bookings WHERE booking_reference_number = ?",
        [bookingReferenceNumber],
      )

      if (!bookingRows || (bookingRows as any[]).length === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
      }

      const booking = (bookingRows as any[])[0]
      console.log('🔍 ข้อมูลการจองปัจจุบัน:', { id: booking.id, status: booking.status })

      // ตรวจสอบว่าสถานะเปลี่ยนแปลงหรือไม่
      if (booking.status === status) {
        await connection.rollback()
        return NextResponse.json({ 
          message: "สถานะการนัดหมายเหมือนเดิม ไม่มีการเปลี่ยนแปลง",
          current_status: status 
        })
      }

      // อัพเดทสถานะการนัดหมาย
      const [updateResult] = await connection.query(
        "UPDATE bookings SET status = ?, cancelled_by = ? WHERE booking_reference_number = ?", 
        [status, cancelledBy || null, bookingReferenceNumber]
      )

      const affectedRows = (updateResult as any).affectedRows
      console.log('🔄 จำนวนแถวที่อัพเดท:', affectedRows)

      if (affectedRows === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่สามารถอัพเดทข้อมูลได้", 500)
      }

      // ถ้าสถานะเดิมไม่ใช่ยกเลิก และกำลังเปลี่ยนเป็นยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
      if (booking.status !== "cancelled" && status === "cancelled") {
        console.log('🔄 เพิ่มที่นั่งว่างกลับไปที่ slot:', booking.slot_id)
        
        const [slotUpdateResult] = await connection.query(
          "UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", 
          [booking.slot_id]
        )
        
        const slotAffectedRows = (slotUpdateResult as any).affectedRows
        console.log('🔄 อัพเดท slot สำเร็จ:', slotAffectedRows, 'แถว')
      }
      
      // ถ้าสถานะเดิมเป็นยกเลิก และกำลังเปลี่ยนเป็นสถานะอื่น ให้ลดจำนวนที่นั่งว่าง
      else if (booking.status === "cancelled" && status !== "cancelled") {
        console.log('🔄 ลดที่นั่งว่างจาก slot:', booking.slot_id)
        
        // ตรวจสอบที่นั่งว่างก่อน
        const [slotCheckRows] = await connection.query(
          "SELECT available_seats FROM slots WHERE id = ?", 
          [booking.slot_id]
        )
        
        if (!slotCheckRows || (slotCheckRows as any[]).length === 0) {
          await connection.rollback()
          return createErrorResponse("ไม่พบข้อมูลช่วงเวลา", 404)
        }
        
        const availableSeats = (slotCheckRows as any[])[0].available_seats
        if (availableSeats <= 0) {
          await connection.rollback()
          return createErrorResponse("ช่วงเวลานี้เต็มแล้ว ไม่สามารถเปลี่ยนสถานะได้", 400)
        }
        
        const [slotUpdateResult] = await connection.query(
          "UPDATE slots SET available_seats = available_seats - 1 WHERE id = ?", 
          [booking.slot_id]
        )
        
        console.log('🔄 ลดที่นั่งว่างสำเร็จ')
      }

      // commit transaction
      await connection.commit()
      console.log('✅ อัพเดทสถานะการนัดหมายสำเร็จ')

      return NextResponse.json({ 
        message: "อัพเดทสถานะการนัดหมายเรียบร้อย",
        booking_reference_number: bookingReferenceNumber,
        new_status: status,
        previous_status: booking.status
      })
      
    } catch (error) {
      await connection.rollback()
      throw error
    }
    
  } catch (error: any) {
    return createErrorResponse(
      "เกิดข้อผิดพลาดในการอัพเดทข้อมูล", 
      500, 
      error.message
    )
  } finally {
    if (connection) connection.release()
  }
}

// DELETE handler to remove appointment
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ booking_reference_number: string }> }
) {
  let connection;
  
  try {
    connection = await pool.getConnection()
    
    // รอให้ params resolve ก่อน
    const resolvedParams = await params
    const bookingReferenceNumber = resolvedParams.booking_reference_number

    // Validate booking reference number format
    if (!bookingReferenceNumber || !bookingReferenceNumber.match(/^\d{8}-\d{5}$/)) {
      return createErrorResponse("รูปแบบหมายเลขอ้างอิงไม่ถูกต้อง", 400)
    }

    console.log('🗑️ ลบการนัดหมาย:', bookingReferenceNumber)

    // เริ่ม transaction
    await connection.beginTransaction()

    try {
      // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
      const [bookingRows] = await connection.query(
        "SELECT id, status, slot_id, name FROM bookings WHERE booking_reference_number = ?",
        [bookingReferenceNumber],
      )

      if (!bookingRows || (bookingRows as any[]).length === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่พบข้อมูลการนัดหมาย", 404)
      }

      const booking = (bookingRows as any[])[0]
      console.log('🔍 ข้อมูลการจองที่จะลบ:', { 
        id: booking.id, 
        name: booking.name, 
        status: booking.status 
      })

      // ถ้าสถานะไม่ใช่ยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
      if (booking.status !== "cancelled") {
        console.log('🔄 เพิ่มที่นั่งว่างกลับไปที่ slot:', booking.slot_id)
        
        const [slotUpdateResult] = await connection.query(
          "UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", 
          [booking.slot_id]
        )
        
        const slotAffectedRows = (slotUpdateResult as any).affectedRows
        console.log('🔄 อัพเดท slot สำเร็จ:', slotAffectedRows, 'แถว')
      }

      // ลบการนัดหมาย
      const [deleteResult] = await connection.query(
        "DELETE FROM bookings WHERE booking_reference_number = ?", 
        [bookingReferenceNumber]
      )

      const affectedRows = (deleteResult as any).affectedRows
      console.log('🗑️ จำนวนแถวที่ลบ:', affectedRows)

      if (affectedRows === 0) {
        await connection.rollback()
        return createErrorResponse("ไม่สามารถลบข้อมูลได้", 500)
      }

      // commit transaction
      await connection.commit()
      console.log('✅ ลบการนัดหมายสำเร็จ')

      return NextResponse.json({ 
        message: "ลบการนัดหมายเรียบร้อย",
        deleted_booking_reference_number: bookingReferenceNumber,
        deleted_booking_name: booking.name
      })
      
    } catch (error) {
      await connection.rollback()
      throw error
    }
    
  } catch (error: any) {
    return createErrorResponse(
      "เกิดข้อผิดพลาดในการลบข้อมูล", 
      500, 
      error.message
    )
  } finally {
    if (connection) connection.release()
  }
}