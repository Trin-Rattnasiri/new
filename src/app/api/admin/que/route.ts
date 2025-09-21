// src/app/api/admin/que/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// POST - จองคิว
export async function POST(req: Request) {
  console.log('🚀 POST request received at /api/admin/que');
  
  let connection;
  try {
    const body = await req.json();
    console.log('📝 Request body:', body);
    
    const {
      user_name,       // จะเก็บลง column `name`
      department_id,
      slot_id,
      id_card_number,  // จะเก็บลง column `hn`
      created_by,
      phone_number,    // ✅ เพิ่มการรับค่า phone_number
    } = body;
    
    console.log('📋 Extracted data:', { 
      user_name, 
      department_id, 
      slot_id, 
      id_card_number, 
      created_by,
      phone_number // ✅ เพิ่มใน log
    });

    if (!user_name || !department_id || !slot_id) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    connection = await getConnection();

    // ตรวจสอบที่นั่งว่างและดึง slot_date ด้วย
    const slotQuery = `
      SELECT available_seats, start_time, end_time, slot_date
      FROM slots
      WHERE id = ?
    `;
    const [slotResult] = await connection.query(slotQuery, [slot_id]);
    const slotData = (slotResult as mysql.RowDataPacket[])[0];

    if (!slotData || slotData.available_seats <= 0) {
      return NextResponse.json({ message: 'ที่นั่งเต็มแล้ว' }, { status: 400 });
    }

    const { available_seats, start_time, end_time, slot_date } = slotData;

    // ✅ แก้ไข SQL INSERT - เพิ่ม phone_number
    const insertQuery = `
      INSERT INTO bookings (created_by, name, department_id, slot_id, hn, booking_date, status, phone_number)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `;
    const [result] = await connection.query(insertQuery, [
      created_by || null,
      user_name,
      department_id,
      slot_id,
      id_card_number,
      slot_date,
      phone_number || null, // ✅ เพิ่มการบันทึก phone_number
    ]);

    if ((result as mysql.ResultSetHeader).affectedRows > 0) {
      const bookingId = (result as mysql.ResultSetHeader).insertId;
      const bookingReferenceNumber = `${slot_date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(bookingId).padStart(5, '0')}`;

      // อัปเดต booking_reference_number
      const updateQuery = `
        UPDATE bookings 
        SET booking_reference_number = ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [bookingReferenceNumber, bookingId]);

      // อัปเดตจำนวนที่ว่าง
      const updateSeatsQuery = `
        UPDATE slots
        SET available_seats = available_seats - 1
        WHERE id = ?
      `;
      await connection.query(updateSeatsQuery, [slot_id]);

      // ===== แจ้งเตือนไป LINE หลังจองคิวสำเร็จ =====
      let lineNotificationStatus = 'ไม่ได้ส่ง';
      
      try {
        console.log('🔍 เริ่มการส่งแจ้งเตือนไป LINE...');
        console.log('created_by (citizenId):', created_by);
        console.log('user_name:', user_name);
        console.log('phone_number:', phone_number); // ✅ เพิ่ม log phone_number
        
        // เพิ่มการตรวจสอบค่าก่อนค้นหา
        if (!created_by) {
          console.log('❌ created_by เป็น null หรือ undefined');
          lineNotificationStatus = 'ไม่มี citizenId';
        } else {
          // ใช้ created_by (citizenId) แทน user_name ในการหา LINE ID
          console.log('🔍 กำลังค้นหาใน database...');
          const [userRows]: [any[], any] = await connection.query(
            "SELECT line_id, citizenId FROM user WHERE citizenId = ?",
            [created_by]
          );
          
          console.log('🔍 SQL Query executed');
          console.log('🔍 จำนวนผลลัพธ์:', userRows.length);
          console.log('🔍 ผลการค้นหา user:', userRows);
          
          const user = userRows[0];

          if (!user) {
            console.log('❌ ไม่พบข้อมูลผู้ใช้ในระบบ');
            console.log('❌ ค้นหาด้วย citizenId:', created_by);
            lineNotificationStatus = 'ไม่พบข้อมูลผู้ใช้';
          } else if (!user.line_id) {
            console.log('❌ ผู้ใช้ไม่ได้เชื่อมต่อกับ LINE');
            console.log('❌ citizenId:', user.citizenId, 'line_id:', user.line_id);
            lineNotificationStatus = 'ไม่ได้เชื่อมต่อ LINE';
          } else {
            console.log('✅ พบ LINE ID:', user.line_id);
            
            // ตรวจสอบ BASE_URL
            console.log('🔍 BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
            
            if (!process.env.NEXT_PUBLIC_BASE_URL) {
              console.log('❌ ไม่พบ NEXT_PUBLIC_BASE_URL');
              lineNotificationStatus = 'ไม่พบ BASE_URL';
            } else {
              // ดึงรายละเอียดการจองพร้อมข้อมูลแผนกและเวลา
              console.log('🔍 กำลังดึงข้อมูลการจอง...');
              const [bookingRows]: [any[], any] = await connection.query(`
                SELECT 
                  b.*, 
                  d.name as department_name,
                  s.start_time,
                  s.end_time,
                  s.slot_date
                FROM bookings b
                LEFT JOIN departments d ON b.department_id = d.id
                LEFT JOIN slots s ON b.slot_id = s.id
                WHERE b.booking_reference_number = ?
              `, [bookingReferenceNumber]);
              
              console.log('🔍 จำนวนข้อมูลการจอง:', bookingRows.length);
              const booking = bookingRows[0];
              console.log('🔍 ข้อมูลการจอง:', booking);

              if (booking) {
                // เตรียมข้อมูลสำหรับแจ้งเตือน
                const appointmentDetails = {
                  referenceNumber: booking.booking_reference_number,
                  department: booking.department_name || 'ไม่ระบุแผนก',
                  date: booking.slot_date ? new Date(booking.slot_date).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่',
                  time: booking.start_time && booking.end_time ? `${booking.start_time} - ${booking.end_time}` : 'ไม่ระบุเวลา'
                };

                console.log('📤 เตรียมส่งข้อมูลไป LINE:', appointmentDetails);
                console.log('📤 LINE User ID:', user.line_id);

                // ส่งแจ้งเตือนไป LINE
                const lineApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/line/notification`;
                console.log('📤 LINE API URL:', lineApiUrl);
                
                const lineResponse = await fetch(lineApiUrl, {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    userId: user.line_id,
                    appointmentDetails
                  }),
                });

                const lineResult = await lineResponse.text();
                console.log('📤 LINE API Response Status:', lineResponse.status);
                console.log('📤 LINE API Response Headers:', Object.fromEntries(lineResponse.headers.entries()));
                console.log('📤 LINE API Response Body:', lineResult);

                if (lineResponse.ok) {
                  console.log('✅ ส่งแจ้งเตือนไป LINE สำเร็จ');
                  lineNotificationStatus = 'ส่งสำเร็จ';
                } else {
                  console.log('❌ ส่งแจ้งเตือนไป LINE ไม่สำเร็จ');
                  console.log('❌ Status:', lineResponse.status);
                  console.log('❌ Response:', lineResult);
                  lineNotificationStatus = `ส่งไม่สำเร็จ: ${lineResponse.status} - ${lineResult}`;
                }
              } else {
                console.log('❌ ไม่พบข้อมูลการจอง');
                console.log('❌ Booking Reference:', bookingReferenceNumber);
                lineNotificationStatus = 'ไม่พบข้อมูลการจอง';
              }
            }
          }
        }
      } catch (lineError) {
        console.error("❌ Error ในการส่งแจ้งเตือนไป LINE:", lineError);
        console.error("❌ Error Stack:", lineError.stack);
        console.error("❌ Error Name:", lineError.name);
        console.error("❌ Error Message:", lineError.message);
        lineNotificationStatus = `Error: ${lineError.message}`;
      }

      const timeSlotMessage = `${start_time}-${end_time} (จำนวนที่ว่าง: ${available_seats - 1})`;

      return NextResponse.json({
        message: 'จองคิวสำเร็จ',
        bookingReferenceNumber,
        bookingDate: slot_date,
        timeSlot: timeSlotMessage,
        id: bookingId,
        phoneNumber: phone_number, // ✅ เพิ่มใน response
        lineNotificationStatus: lineNotificationStatus
      }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'ไม่สามารถจองคิวได้' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error booking queue:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการจองคิว' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}