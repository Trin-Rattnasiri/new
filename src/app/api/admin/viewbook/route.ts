import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const departmentId = searchParams.get('departmentId');

    // Validate required parameter
    if (!action) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action parameter is required' 
      }, { status: 400 });
    }

    const connection = await getConnection();

    // Action 1: Get available dates for a department
    if (action === 'getDepartmentDates') {
      if (!departmentId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Department ID is required' 
        }, { status: 400 });
      }

      const [rows] = await connection.execute(
        `SELECT DISTINCT slot_date FROM slots 
         WHERE department_id = ? 
         AND slot_date IS NOT NULL
         ORDER BY slot_date ASC`,
        [departmentId]
      );

      console.log(`Found ${(rows as any[]).length} dates for department ${departmentId}`);

      await connection.end();

      return NextResponse.json({ 
        success: true, 
        data: rows 
      });
    } 
    // Action 2: Get bookings for a specific date and department
    else if (action === 'getBookings') {
      const slotDate = searchParams.get('slotDate');

      if (!departmentId || !slotDate) {
        return NextResponse.json({ 
          success: false, 
          message: 'Department ID and slot date are required' 
        }, { status: 400 });
      }

      console.log(`Fetching bookings for department ID: ${departmentId} and date: ${slotDate}`);

      // Fixed JOIN syntax using INNER JOIN explicitly
      const [rows] = await connection.execute(
        `SELECT 
          b.id, 
          b.user_name, 
          b.phone_number, 
          b.id_card_number, 
          b.status, 
          b.booking_reference_number,
          b.booking_date,
          d.name as department_name,
          s.slot_date,
          s.start_time,
          s.end_time
        FROM 
          bookings b
        INNER JOIN departments d ON b.department_id = d.id
        INNER JOIN slots s ON b.slot_id = s.id
        WHERE 
          b.department_id = ?
          AND s.slot_date = ?`,
        [departmentId, slotDate]
      );

      console.log(`Found ${(rows as any[]).length} bookings for department ${departmentId} and date ${slotDate}`);

      // If no results, let's check if the slots exist for this department/date
      if ((rows as any[]).length === 0) {
        const [slotCheck] = await connection.execute(
          `SELECT id, department_id, slot_date FROM slots 
           WHERE department_id = ? AND slot_date = ?`,
          [departmentId, slotDate]
        );

        console.log(`Slot check: Found ${(slotCheck as any[]).length} slots for department ${departmentId} and date ${slotDate}`);

        if ((slotCheck as any[]).length > 0) {
          // If we found slots, check if there are any bookings for these slots
          const slotIds = (slotCheck as any[]).map(s => s.id);
          
          if (slotIds.length > 0) {
            const placeholders = slotIds.map(() => '?').join(',');
            
            const [bookingCheck] = await connection.execute(
              `SELECT id, user_name, slot_id FROM bookings WHERE slot_id IN (${placeholders})`,
              slotIds
            );

            console.log(`Booking check: Found ${(bookingCheck as any[]).length} bookings for slots [${slotIds.join(',')}]`);
          }
        }
      }

      await connection.end();

      return NextResponse.json({ 
        success: true, 
        data: rows 
      });
    } 
    // Action 3: Get all bookings for testing
    else if (action === 'getAllBookings') {
      const [rows] = await connection.execute(
        `SELECT 
           b.id, 
           b.user_name, 
           b.department_id,
           d.name as department_name,
           b.slot_id, 
           s.slot_date,
           b.booking_date, 
           b.phone_number,
           b.id_card_number,
           b.status, 
           b.booking_reference_number
         FROM 
           bookings b
         LEFT JOIN departments d ON b.department_id = d.id
         LEFT JOIN slots s ON b.slot_id = s.id
         LIMIT 50`
      );

      console.log(`Found ${(rows as any[]).length} total bookings in the system`);

      await connection.end();

      return NextResponse.json({ 
        success: true, 
        data: rows 
      });
    }
    else {
      await connection.end();

      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action parameter' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json({ 
      success: false, 
      message: 'Server error', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}