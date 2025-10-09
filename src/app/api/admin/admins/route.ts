// src/app/api/admin/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose'; // เปลี่ยนจาก jsonwebtoken เป็น jose

// Database connection function
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// JWT Secret (ใช้ format เดียวกับ middleware)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Authentication helper function (เปลี่ยนใหม่)
const verifyAuth = async (request: NextRequest) => {
  // อ่าน session จาก cookie
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    throw new Error('No session provided');
  }

  try {
    // ใช้ jwtVerify แทน jwt.verify
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, {
      algorithms: ["HS256"]
    });

    // 🔍 DEBUG: ดู payload structure
    console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));

    // ตรวจสอบว่าผู้ใช้ได้รับการอนุมัติแล้วหรือไม่
    // ปรับให้รองรับทั้ง string และ number, และหลาย field names
    const isApproved = payload.is_approved === 1 ||
      payload.is_approved === '1' ||
      payload.approved === 1 ||
      payload.approved === '1' ||
      payload.status === 1 ||
      payload.status === '1' ||
      payload.role === 'SuperAdmin'; // SuperAdmin ไม่ต้องเช็ค approval

    if (!isApproved) {
      console.log('❌ User not approved. Payload approval fields:', {
        is_approved: payload.is_approved,
        approved: payload.approved,
        status: payload.status,
        role: payload.role
      });
      throw new Error('User not approved');
    }

    return payload;
  } catch (error) {
    if (error.message === 'User not approved') {
      throw error; // ส่งต่อ error เดิม
    }
    console.error('JWT Verification Error:', error);
    throw new Error('Invalid token');
  }
};

// Authorization helper function
const requireSuperAdmin = (user: any) => {
  // เช็คทั้ง position และ role field
  const userPosition = user.position || user.role;

  if (userPosition !== 'SuperAdmin') {
    console.log(`❌ Access denied. User position: ${userPosition}, required: SuperAdmin`);
    throw new Error('Requires SuperAdmin access');
  }

  console.log(`✅ SuperAdmin access granted for: ${userPosition}`);
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

// GET all admins - ต้องเป็น SuperAdmin เท่านั้น
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ Authentication
    const user = await verifyAuth(request);

    // ตรวจสอบ Authorization - ต้องเป็น SuperAdmin
    requireSuperAdmin(user);

    const conn = await getConnection();
    const [rows] = await conn.execute(
      `SELECT id, username, position, created_at, updated_at, is_approved 
   FROM admins 
   ORDER BY position = 'SuperAdmin' DESC, created_at DESC`
    );
    await conn.end();

    return NextResponse.json({
      success: true,
      data: rows,
      message: `Retrieved ${(rows as any[]).length} admins`
    });

  } catch (error: any) {
    console.error('GET admins error:', error);

    // Handle authentication/authorization errors
    if (error.message === 'No session provided') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. Please login first.'
      }, { status: 401 });
    }

    if (error.message === 'Invalid token' || error.message === 'User not approved') {
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication or user not approved.'
      }, { status: 403 });
    }

    if (error.message === 'Requires SuperAdmin access') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      }, { status: 403 });
    }

    // Database or other errors
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch admins'
    }, { status: 500 });
  }
}


// POST - Create new admin - ต้องเป็น SuperAdmin เท่านั้น
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Authentication
    const user = await verifyAuth(request);

    // ตรวจสอบ Authorization - ต้องเป็น SuperAdmin
    requireSuperAdmin(user);

    const body = await request.json() as AdminCreateData;
    const { username, position, password } = body;

    // Input validation
    if (!username || !position || !password) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: username, position, password'
      }, { status: 400 });
    }

    // Validate username format
    if (username.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'Username must be at least 4 characters long'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const conn = await getConnection();

    // Check if username already exists
    const [existingUser] = await conn.execute(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if ((existingUser as any[]).length > 0) {
      await conn.end();
      return NextResponse.json({
        success: false,
        message: 'Username already exists'
      }, { status: 400 });
    }

    // ✅ เปลี่ยนจาก 0 เป็น 1 (อนุมัติอัตโนมัติ)
    const [result] = await conn.execute(
      'INSERT INTO admins (username, position, password, is_approved) VALUES (?, ?, ?, ?)',
      [username, position, hashedPassword, 1] // ✅ เปลี่ยนตรงนี้
    );
    await conn.end();

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully.', // ✅ ลบข้อความ "Pending approval"
      data: {
        id: (result as any).insertId,
        username,
        position,
        is_approved: 1 // ✅ เปลี่ยนตรงนี้
      }
    });

  } catch (error: any) {
    console.error('POST admins error:', error);

    // Handle authentication/authorization errors
    if (error.message === 'No session provided') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. Please login first.'
      }, { status: 401 });
    }

    if (error.message === 'Invalid token' || error.message === 'User not approved') {
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication or user not approved.'
      }, { status: 403 });
    }

    if (error.message === 'Requires SuperAdmin access') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      }, { status: 403 });
    }

    // Database or other errors
    return NextResponse.json({
      success: false,
      message: 'Failed to create admin'
    }, { status: 500 });
  }
}