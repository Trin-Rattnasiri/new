// src/app/api/admin/departments/route.ts
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
    const connection = await getConnection();
    
    const [rows] = await connection.execute(
      'SELECT id, name FROM departments ORDER BY name ASC'
    );
    
    await connection.end();
    
    return NextResponse.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Server error', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}