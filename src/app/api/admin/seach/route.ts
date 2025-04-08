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

// GET handler to fetch booking details
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingReferenceNumber = url.searchParams.get('booking_reference_number') || '';

  if (!bookingReferenceNumber) {
    console.log('GET: Missing booking_reference_number');
    return NextResponse.json({ error: 'Booking reference number is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    console.log(`GET: Fetching booking for ${bookingReferenceNumber}`);
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
      console.log(`GET: Booking not found for ${bookingReferenceNumber}`);
      return NextResponse.json({ error: `Booking not found: ${bookingReferenceNumber}` }, { status: 404 });
    }

    return NextResponse.json({ booking: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('GET: Error fetching booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch booking', details: errorMessage }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
};

// PATCH handler to update booking status
export async function PATCH(request: Request) {
  const body = await request.json();
  const { bookingReferenceNumber, status } = body;

  if (!bookingReferenceNumber || !status) {
    console.log('PATCH: Missing bookingReferenceNumber or status');
    return NextResponse.json({ error: 'Booking reference number and status are required' }, { status: 400 });
  }

  const validStatuses = ['pending', 'confirmed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    console.log(`PATCH: Invalid status: ${status}`);
    return NextResponse.json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    console.log(`PATCH: Updating booking ${bookingReferenceNumber} to status ${status}`);

    // Start transaction
    await connection.beginTransaction();

    // Check if booking exists and lock it
    const [bookingRows] = await connection.execute<any[]>(
      'SELECT status, slot_id FROM bookings WHERE booking_reference_number = ? FOR UPDATE',
      [bookingReferenceNumber]
    );

    if (bookingRows.length === 0) {
      await connection.rollback();
      console.log(`PATCH: Booking not found: ${bookingReferenceNumber}`);
      return NextResponse.json({ error: `Booking not found: ${bookingReferenceNumber}` }, { status: 404 });
    }

    const currentBooking = bookingRows[0];
    const currentStatus = currentBooking.status;
    const slotId = currentBooking.slot_id;

    // Only update available_seats if transitioning to/from cancelled
    if (currentStatus !== status) {
      if (currentStatus === 'cancelled' && (status === 'pending' || status === 'confirmed')) {
        const [slotRows] = await connection.execute<any[]>(
          'SELECT available_seats FROM slots WHERE id = ? FOR UPDATE',
          [slotId]
        );
        if (slotRows.length === 0 || slotRows[0].available_seats <= 0) {
          await connection.rollback();
          console.log(`PATCH: No available seats for slot ${slotId}`);
          return NextResponse.json({ error: 'No available seats for this slot' }, { status: 400 });
        }
        await connection.execute(
          'UPDATE slots SET available_seats = available_seats - 1 WHERE id = ?',
          [slotId]
        );
      } else if (currentStatus !== 'cancelled' && status === 'cancelled') {
        await connection.execute(
          'UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?',
          [slotId]
        );
      }
      // No change in available_seats when switching between pending and confirmed
    }

    // Update booking status
    await connection.execute(
      'UPDATE bookings SET status = ? WHERE booking_reference_number = ?',
      [status, bookingReferenceNumber]
    );

    await connection.commit();
    console.log(`PATCH: Successfully updated ${bookingReferenceNumber} to ${status}`);
    return NextResponse.json({ message: `Booking ${bookingReferenceNumber} updated to ${status}` }, { status: 200 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('PATCH: Error updating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update booking', details: errorMessage }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}