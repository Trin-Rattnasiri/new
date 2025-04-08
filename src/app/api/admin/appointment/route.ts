import { NextRequest, NextResponse } from 'next/server';
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

// GET handler to fetch departments
export async function GET() {
  try {
    const connection = await getConnection();
    const [departments] = await connection.execute('SELECT * FROM departments ORDER BY name');
    await connection.end();
    
    return NextResponse.json({ departments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST handler to fetch slots by department or bookings by slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const connection = await getConnection();
    
    // If departmentId is provided, fetch available dates (slots) for that department
    if (body.departmentId && !body.slotId) {
      const [slots] = await connection.execute(
        'SELECT * FROM slots WHERE department_id = ? ORDER BY slot_date',
        [body.departmentId]
      );
      await connection.end();
      return NextResponse.json({ slots }, { status: 200 });
    }
    
    // If both departmentId and slotId are provided, fetch bookings for that slot
    if (body.departmentId && body.slotId) {
      const [bookings] = await connection.execute(
        `SELECT b.id, b.user_name, b.phone_number, b.id_card_number, 
                b.status, b.booking_reference_number, b.booking_date,
                d.name as department_name, 
                s.start_time, s.end_time, s.slot_date
         FROM bookings b
         JOIN departments d ON b.department_id = d.id
         JOIN slots s ON b.slot_id = s.id
         WHERE b.department_id = ? AND b.slot_id = ?
         ORDER BY b.id DESC`,
        [body.departmentId, body.slotId]
      );
      await connection.end();
      return NextResponse.json({ bookings }, { status: 200 });
    }
    
    await connection.end();
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT handler to update a booking status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.bookingId || !body.status) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    // Start a transaction to ensure data consistency
    await connection.beginTransaction();
    
    try {
      // First, get the current booking status and slot_id
      const [bookingRows] = await connection.execute(
        'SELECT status, slot_id FROM bookings WHERE id = ?',
        [body.bookingId]
      );
      
      if (!bookingRows || (bookingRows as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      const currentBooking = (bookingRows as any[])[0];
      const currentStatus = currentBooking.status;
      const slotId = currentBooking.slot_id;
      
      // Update the booking status
      await connection.execute(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [body.status, body.bookingId]
      );
      
      // Handle available_seats update based on status change
      if (currentStatus !== 'cancelled' && body.status === 'cancelled') {
        // If changing from pending/confirmed to cancelled, increment available_seats
        await connection.execute(
          'UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?',
          [slotId]
        );
      } else if (currentStatus === 'cancelled' && (body.status === 'pending' || body.status === 'confirmed')) {
        // If changing from cancelled to pending/confirmed, decrement available_seats
        await connection.execute(
          'UPDATE slots SET available_seats = available_seats - 1 WHERE id = ?',
          [slotId]
        );
      }
      
      // Commit the transaction
      await connection.commit();
      await connection.end();
      
      return NextResponse.json({ message: 'Booking status updated successfully' }, { status: 200 });
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}

// DELETE handler to remove a booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    // Start a transaction to ensure data consistency
    await connection.beginTransaction();
    
    try {
      // First, get the booking status and slot_id
      const [bookingRows] = await connection.execute(
        'SELECT status, slot_id FROM bookings WHERE id = ?',
        [bookingId]
      );
      
      if (!bookingRows || (bookingRows as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      const booking = (bookingRows as any[])[0];
      
      // Only increment available_seats if the booking was not already cancelled
      if (booking.status !== 'cancelled') {
        await connection.execute(
          'UPDATE slots SET available_seats = available_seats + 1 WHERE id = ?',
          [booking.slot_id]
        );
      }
      
      // Delete the booking
      await connection.execute(
        'DELETE FROM bookings WHERE id = ?',
        [bookingId]
      );
      
      // Commit the transaction
      await connection.commit();
      await connection.end();
      
      return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}