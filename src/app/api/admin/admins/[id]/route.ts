// app/api/admins/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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
interface AdminUpdateData {
  username?: string;
  position?: string;
  password?: string;
  is_approved?: number;
}

// GET single admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, username, position, created_at, updated_at, is_approved FROM admins WHERE id = ?',
      [id]
    );
    await conn.end();
    
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: (rows as any[])[0] });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admin' }, { status: 500 });
  }
}

// PUT - Update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json() as AdminUpdateData;
    const { username, position, password, is_approved } = body;
    
    const conn = await getConnection();
    
    // Check if username already exists (and it's not this admin's current username)
    if (username) {
      const [existingUser] = await conn.execute(
        'SELECT id FROM admins WHERE username = ? AND id != ?', 
        [username, id]
      );
      if ((existingUser as any[]).length > 0) {
        await conn.end();
        return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
      }
    }
    
    // Build update query dynamically based on provided fields
    let updateQuery = 'UPDATE admins SET ';
    const updateValues: any[] = [];
    
    if (username) {
      updateQuery += 'username = ?, ';
      updateValues.push(username);
    }
    
    if (position) {
      updateQuery += 'position = ?, ';
      updateValues.push(position);
    }
    
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateQuery += 'password = ?, ';
      updateValues.push(hashedPassword);
    }
    
    if (is_approved !== undefined) {
      updateQuery += 'is_approved = ?, ';
      updateValues.push(is_approved);
    }
    
    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    
    updateQuery += ' WHERE id = ?';
    updateValues.push(id);
    
    // Execute update query
    const [result] = await conn.execute(updateQuery, updateValues);
    await conn.end();
    
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update admin' }, { status: 500 });
  }
}

// DELETE - Remove admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const conn = await getConnection();
    
    const [result] = await conn.execute('DELETE FROM admins WHERE id = ?', [id]);
    await conn.end();
    
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete admin' }, { status: 500 });
  }
}