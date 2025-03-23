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
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT slots.*, departments.name AS department_name
       FROM slots
       JOIN departments ON slots.department_id = departments.id
       ORDER BY slot_date ASC`
    );
    await connection.end();
    
    if (Array.isArray(rows)) {
      return NextResponse.json(rows, { status: 200 });
    } else {
      throw new Error('Expected rows to be an array');
    }
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    const id = body.id;
    const force = body.force === true; // Check if force delete is requested

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    connection = await getConnection();
    
    // Start a transaction
    await connection.beginTransaction();

    // Check if the slot exists
    const [slotRows]: any = await connection.execute('SELECT * FROM slots WHERE id = ?', [id]);
    
    if (!Array.isArray(slotRows) || slotRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if the slot has any bookings
    const [bookingRows]: any = await connection.execute('SELECT COUNT(*) as bookingCount FROM bookings WHERE slot_id = ?', [id]);
    
    const hasBookings = bookingRows[0].bookingCount > 0;
    
    if (hasBookings) {
      if (force) {
        // If force delete is requested, delete bookings first
        await connection.execute('DELETE FROM bookings WHERE slot_id = ?', [id]);
      } else {
        // Otherwise, return error
        await connection.rollback();
        return NextResponse.json({ 
          error: 'Cannot delete slot that has existing bookings',
          details: 'Use force=true to delete bookings along with the slot'
        }, { status: 409 });
      }
    }

    // Delete the slot
    const [result]: any = await connection.execute('DELETE FROM slots WHERE id = ?', [id]);
    
    // Commit the transaction
    await connection.commit();
    
    if (result.affectedRows > 0) {
      return NextResponse.json({ 
        message: hasBookings && force ? 
          'Slot and associated bookings deleted successfully' : 
          'Slot deleted successfully' 
      }, { status: 200 });
    } else {
      await connection.rollback();
      return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
    }
  } catch (error: any) {
    // Rollback the transaction in case of error
    if (connection) {
      await connection.rollback();
    }
    
    console.error('Error deleting slot:', error);
    
    return NextResponse.json({ 
      error: 'Failed to delete slot', 
      details: error.message 
    }, { status: 500 });
  } finally {
    // Close the connection regardless of success or failure
    if (connection) {
      await connection.end();
    }
  }
}