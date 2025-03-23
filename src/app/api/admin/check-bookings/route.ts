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

export async function GET(req: NextRequest) {
  let connection;
  try {
    const url = new URL(req.url);
    const slotId = url.searchParams.get('slotId');

    if (!slotId) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 });
    }

    connection = await getConnection();
    
    // Check if the slot has any bookings
    const [bookingRows]: any = await connection.execute(
      'SELECT COUNT(*) as bookingCount FROM bookings WHERE slot_id = ?', 
      [slotId]
    );
    
    const hasBookings = bookingRows[0].bookingCount > 0;
    
    return NextResponse.json({ 
      hasBookings,
      bookingCount: bookingRows[0].bookingCount 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error checking bookings:', error);
    return NextResponse.json({ 
      error: 'Failed to check bookings', 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}