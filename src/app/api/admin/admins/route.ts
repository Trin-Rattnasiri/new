// app/api/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Database connection function
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// Types
interface Admin {
  id: number;
  username: string;
  position: string;
  password?: string;
  created_at: string;
  updated_at: string;
  is_approved: number;
}

interface AdminCreateData {
  username: string;
  position: string;
  password: string;
}

interface AdminUpdateData {
  username?: string;
  position?: string;
  password?: string;
  is_approved?: number;
}

// GET all admins
export async function GET() {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT id, username, position, created_at, updated_at, is_approved FROM admins');
    await conn.end();
    
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admins' }, { status: 500 });
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AdminCreateData;
    const { username, position, password } = body;
    
    // Input validation
    if (!username || !position || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const conn = await getConnection();
    
    // Check if username already exists
    const [existingUser] = await conn.execute('SELECT id FROM admins WHERE username = ?', [username]);
    if ((existingUser as any[]).length > 0) {
      await conn.end();
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
    }
    
    // Insert new admin
    const [result] = await conn.execute(
      'INSERT INTO admins (username, position, password) VALUES (?, ?, ?)',
      [username, position, hashedPassword]
    );
    await conn.end();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully', 
      data: { id: (result as any).insertId } 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create admin' }, { status: 500 });
  }
}