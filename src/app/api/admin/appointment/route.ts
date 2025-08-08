import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

// Function to connect to the database
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
}

// GET handler to retrieve all appointments (for admin)
export async function GET(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()

    const [rows] = await connection.query(
      `SELECT 
        b.id,
        b.name AS user_name,
        b.hn,
        u.phone AS phone_number,
        u.citizenId AS id_card_number,
        b.created_by,
        b.status,
        b.cancelled_by,
        b.booking_reference_number,
        b.booking_date,
        d.name AS department_name,
        s.slot_date,
        s.start_time,
        s.end_time
      FROM bookings b
      JOIN departments d ON b.department_id = d.id
      JOIN slots s ON b.slot_id = s.id
      LEFT JOIN user u ON b.created_by = u.citizenId
      ORDER BY s.slot_date DESC, s.start_time ASC`,
    )

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// POST handler for filtered appointments (for admin)
export async function POST(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    const { filters } = await req.json()

    let query = `SELECT 
      b.id,
      b.name AS user_name,
      b.hn,
      u.phone AS phone_number,
      u.citizenId AS id_card_number,
      b.created_by,
      b.status,
      b.cancelled_by,
      b.booking_reference_number,
      b.booking_date,
      d.name AS department_name,
      s.slot_date,
      s.start_time,
      s.end_time
    FROM bookings b
    JOIN departments d ON b.department_id = d.id
    JOIN slots s ON b.slot_id = s.id
    LEFT JOIN user u ON b.created_by = u.citizenId`

    const queryParams: any[] = []

    // Add filters if provided
    if (filters && Object.keys(filters).length > 0) {
      query += " WHERE "
      const conditions = []

      if (filters.department) {
        conditions.push("d.id = ?")
        queryParams.push(filters.department)
      }

      if (filters.status) {
        conditions.push("b.status = ?")
        queryParams.push(filters.status)
      }

      if (filters.date) {
        conditions.push("s.slot_date = ?")
        queryParams.push(filters.date)
      }

      if (filters.search) {
        conditions.push("(b.name LIKE ? OR b.hn LIKE ? OR b.booking_reference_number LIKE ?)")
        const searchTerm = `%${filters.search}%`
        queryParams.push(searchTerm, searchTerm, searchTerm)
      }

      query += conditions.join(" AND ")
    }

    query += " ORDER BY s.slot_date DESC, s.start_time ASC"

    const [rows] = await connection.query(query, queryParams)

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("Error fetching filtered appointments:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// PUT handler to update appointment status with LINE notification
export async function PUT(req: NextRequest) {
  console.log('🔄 PUT /api/admin/appointment - Updating appointment status');
  
  let connection
  try {
    connection = await getConnection()
    
    let body;
    try {
      body = await req.json()
      console.log('📝 Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }
    
    const { bookingId, status, admin_note, updated_by } = body;

    if (!bookingId || !status) {
      console.log('❌ Missing required fields:', { bookingId, status });
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน (ต้องมี bookingId และ status)" }, { status: 400 })
    }

    // ตรวจสอบสถานะที่อนุญาต
    const allowedStatuses = ['pending', 'confirmed', 'approved', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      console.log('❌ Invalid status:', status);
      return NextResponse.json({ 
        error: `สถานะต้องเป็นหนึ่งใน: ${allowedStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query(`
      SELECT 
        b.id, 
        b.status, 
        b.slot_id, 
        b.created_by, 
        b.booking_reference_number,
        b.name,
        d.name as department_name,
        s.start_time,
        s.end_time,
        s.slot_date
      FROM bookings b
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN slots s ON b.slot_id = s.id
      WHERE b.id = ?
    `, [bookingId])

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      console.log('❌ Booking not found:', bookingId);
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]
    const oldStatus = booking.status;

    console.log('📋 Current status:', oldStatus, '→ New status:', status);

    // อัพเดทสถานะการนัดหมาย
    await connection.query("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId])
    console.log('✅ Booking status updated successfully');

    // จัดการที่นั่งตามสถานะ
    if (oldStatus !== "cancelled" && status === "cancelled") {
      // ยกเลิก -> คืนที่นั่ง
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])
      
      // อัปเดต cancelled_by
      await connection.query("UPDATE bookings SET cancelled_by = ? WHERE id = ?", [updated_by || "admin", bookingId])
      
      console.log('🔄 คืนที่นั่งให้ slot แล้ว (ยกเลิก)');
    } 
    else if (['rejected', 'cancelled', 'pending'].includes(oldStatus) && 
             ['confirmed', 'approved'].includes(status)) {
      // ยืนยัน/อนุมัติ -> หักที่นั่ง
      const [slotCheck] = await connection.query(
        'SELECT available_seats FROM slots WHERE id = ?',
        [booking.slot_id]
      );
      const slotData = (slotCheck as any[])[0];
      
      if (slotData && slotData.available_seats > 0) {
        await connection.query("UPDATE slots SET available_seats = available_seats - 1 WHERE id = ?", [booking.slot_id])
        console.log('🔄 หักที่นั่งออกจาก slot แล้ว (ยืนยัน)');
      } else {
        console.log('❌ ไม่สามารถยืนยันได้ เนื่องจากที่นั่งเต็ม');
        return NextResponse.json({ 
          error: 'ไม่สามารถยืนยันได้ เนื่องจากที่นั่งเต็มแล้ว' 
        }, { status: 400 });
      }
    }

    // ===== ส่งแจ้งเตือนไป LINE =====
    let lineNotificationStatus = 'ไม่ได้ส่ง';
    
    try {
      console.log('🔍 เริ่มการส่งแจ้งเตือนการอัปเดตสถานะไป LINE...');
      
      if (!booking.created_by) {
        console.log('❌ ไม่มี citizenId');
        lineNotificationStatus = 'ไม่มี citizenId';
      } else {
        // หา LINE ID ของผู้ใช้
        const [userRows]: [any[], any] = await connection.query(
          "SELECT line_id, citizenId FROM user WHERE citizenId = ?",
          [booking.created_by]
        );
        
        const user = userRows[0];
        
        if (!user || !user.line_id) {
          console.log('❌ ไม่พบ LINE ID');
          lineNotificationStatus = 'ไม่พบ LINE ID';
        } else if (!process.env.NEXT_PUBLIC_BASE_URL) {
          console.log('❌ ไม่พบ BASE_URL');
          lineNotificationStatus = 'ไม่พบ BASE_URL';
        } else {
          // เตรียมข้อมูลสำหรับแจ้งเตือน
          const statusMessage = {
            'confirmed': 'ได้รับการยืนยันแล้ว',
            'approved': 'ได้รับการอนุมัติแล้ว',
            'rejected': 'ถูกปฏิเสธ',
            'cancelled': 'ถูกยกเลิก',
            'pending': 'อยู่ในขั้นตอนการพิจารณา'
          };

          const statusUpdateDetails = {
            referenceNumber: booking.booking_reference_number,
            department: booking.department_name || 'ไม่ระบุแผนก',
            date: booking.slot_date ? new Date(booking.slot_date).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่',
            time: booking.start_time && booking.end_time ? `${booking.start_time} - ${booking.end_time}` : 'ไม่ระบุเวลา',
            oldStatus: oldStatus,
            newStatus: status,
            statusMessage: statusMessage[status] || status,
            adminNote: admin_note || null,
            notificationType: 'status_update'
          };

          console.log('📤 เตรียมส่งข้อมูลอัปเดตสถานะไป LINE:', statusUpdateDetails);

          // ส่งแจ้งเตือนไป LINE
          const lineApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/line-notification`;
          
          const lineResponse = await fetch(lineApiUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userId: user.line_id,
              statusUpdateDetails
            }),
          });

          console.log('📤 LINE API Response Status:', lineResponse.status);

          if (lineResponse.ok) {
            console.log('✅ ส่งแจ้งเตือนการอัปเดตสถานะไป LINE สำเร็จ');
            lineNotificationStatus = 'ส่งสำเร็จ';
          } else {
            console.log('❌ ส่งแจ้งเตือนการอัปเดตสถานะไป LINE ไม่สำเร็จ');
            lineNotificationStatus = `ส่งไม่สำเร็จ: ${lineResponse.status}`;
          }
        }
      }
    } catch (lineError) {
      console.error("❌ Error ในการส่งแจ้งเตือนการอัปเดตสถานะไป LINE:", lineError);
      lineNotificationStatus = `Error: ${lineError.message}`;
    }

    console.log('✅ PUT appointment status update successful');
    
    return NextResponse.json({ 
      message: "อัพเดทสถานะการนัดหมายเรียบร้อย",
      booking_id: bookingId,
      old_status: oldStatus,
      new_status: status,
      admin_note: admin_note,
      lineNotificationStatus: lineNotificationStatus,
      booking_reference_number: booking.booking_reference_number
    })

  } catch (error) {
    console.error("❌ Error updating appointment:", error)
    return NextResponse.json({ 
      error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล", 
      details: error.message 
    }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// DELETE handler to delete appointment (for admin)
export async function DELETE(req: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    const url = new URL(req.url)
    const bookingId = url.searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "ไม่ระบุรหัสการนัดหมาย" }, { status: 400 })
    }

    // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
    const [bookingRows] = await connection.query("SELECT id, slot_id, status FROM bookings WHERE id = ?", [bookingId])

    if (!bookingRows || (bookingRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการนัดหมาย" }, { status: 404 })
    }

    const booking = (bookingRows as any[])[0]

    // ถ้าสถานะไม่ใช่ยกเลิก ให้เพิ่มจำนวนที่นั่งว่างในช่วงเวลานั้น
    if (booking.status !== "cancelled") {
      await connection.query("UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?", [booking.slot_id])
    }

    // ลบข้อมูลการนัดหมาย
    await connection.query("DELETE FROM bookings WHERE id = ?", [bookingId])

    return NextResponse.json({ message: "ลบข้อมูลการนัดหมายเรียบร้อย" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}