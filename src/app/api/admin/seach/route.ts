import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Function to connect to the database
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// Handler for searching booking by reference number and fetching details
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingReferenceNumber = url.searchParams.get('booking_reference_number') || '';

  if (!bookingReferenceNumber) {
    return NextResponse.json({ error: 'Booking reference number is required.' }, { status: 400 });
  }

  try {
    const connection = await getConnection();

    // SQL Query: Join bookings with departments and slots to get department name, start and end time, and booking date
    const [rows] = await connection.execute<any[]>(
      `SELECT 
        b.booking_reference_number, 
        b.user_name, 
        d.name AS department_name, 
        s.start_time, 
        s.end_time, 
        b.status,
        b.booking_date
      FROM bookings b
      JOIN departments d ON b.department_id = d.id
      JOIN slots s ON b.slot_id = s.id
      WHERE b.booking_reference_number = ?`,
      [bookingReferenceNumber]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Return the booking data with the booking date
    return NextResponse.json({ booking: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the booking.' }, { status: 500 });
  }
}

// Handler for updating booking status
export async function PATCH(request: Request) {
  const { bookingReferenceNumber, status } = await request.json();

  if (!bookingReferenceNumber || !status) {
    return NextResponse.json({ error: 'Booking reference number and status are required.' }, { status: 400 });
  }

  const validStatuses = ['pending', 'confirmed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    const connection = await getConnection();
    const [result] = await connection.execute<any>(
      'UPDATE bookings SET status = ? WHERE booking_reference_number = ?',
      [status, bookingReferenceNumber]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Booking not found or no change made.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Booking status updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'An error occurred while updating the booking status.' }, { status: 500 });
  }
}
