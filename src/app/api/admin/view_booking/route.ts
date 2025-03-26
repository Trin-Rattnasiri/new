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

// Handler for getting all departments
export async function GET(request: Request) {
  try {
    const connection = await getConnection();

    // SQL Query: Get all departments
    const [departments] = await connection.execute<any[]>(
      'SELECT id, name FROM departments'
    );

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'An error occurred while fetching departments.' }, { status: 500 });
  }
}

// Handler for getting available dates for a department
export async function POST(request: Request) {
  const { departmentId } = await request.json();

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
  }

  try {
    const connection = await getConnection();

    // SQL Query: Get available dates for the department
    const [dates] = await connection.execute<any[]>(
      `SELECT DISTINCT DATE(b.booking_date) AS available_date
       FROM bookings b
       WHERE b.department_id = ?
       ORDER BY available_date DESC`,
      [departmentId]
    );

    return NextResponse.json({ dates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching available dates for the department:', error);
    return NextResponse.json({ error: 'An error occurred while fetching available dates.' }, { status: 500 });
  }
}

// Handler for getting bookings for a specific date
export async function GET_BOOKINGS(request: Request) {
  const url = new URL(request.url);
  const departmentId = url.searchParams.get('department_id');
  const selectedDate = url.searchParams.get('selected_date');

  if (!departmentId || !selectedDate) {
    return NextResponse.json({ error: 'Department ID and selected date are required.' }, { status: 400 });
  }

  try {
    const connection = await getConnection();

    // Ensure that the date is in 'YYYY-MM-DD' format (no time)
    const formattedDate = selectedDate.split('T')[0]; // Extracts '2025-03-24'

    // SQL Query: Get bookings for the specific date
    const [bookings] = await connection.execute<any[]>(
      `SELECT b.booking_reference_number, b.user_name, b.status, s.start_time, s.end_time
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       WHERE s.department_id = ? AND DATE(b.booking_date) = ?`,
      [departmentId, formattedDate]
    );

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings for the selected date:', error);
    return NextResponse.json({ error: 'An error occurred while fetching bookings for the selected date.' }, { status: 500 });
  }
}
