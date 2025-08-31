import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

// Rate limiting storage (ใน production ใช้ Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string, citizenId: string): boolean {
  const key = `${ip}:${citizenId}`;
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  
  if (!attempt) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  // รีเซ็ตหลัง 15 นาที
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempt.count >= 10) {
    return false; // ถูกล็อก
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

export async function POST(req: NextRequest) {
  let connection: any = null;
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    const { citizenId, password } = await req.json();
    
    // Input validation
    if (!citizenId || !password) {
      console.warn(`⚠️ Invalid input from ${clientIP}`);
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    
    // Rate limiting
    if (!checkRateLimit(clientIP, citizenId)) {
      console.warn(`🚨 Rate limit exceeded: ${citizenId} from ${clientIP}`);
      return NextResponse.json({ 
        error: "มีการเข้าสู่ระบบผิดพลาดมากเกินไป กรุณารอ 15 นาที" 
      }, { status: 429 });
    }
    
    console.log(`🔐 Login attempt: ${citizenId} from ${clientIP} at ${new Date().toISOString()}`);
    
    const pool = getPool();
    connection = await pool.getConnection();
    
    // Dummy hash สำหรับป้องกัน timing attack
    const dummyHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    let userFound = false;
    let passwordMatch = false;
    let userData: any = null;
    
    // 1) เช็คในตาราง user ก่อน
    const [userRows] = await connection.execute(
      "SELECT citizenId, password, name, hn, prefix FROM `user` WHERE citizenId = ?",
      [citizenId]
    );
    const users = userRows as any[];
    
    if (users.length > 0) {
      userFound = true;
      const user = users[0];
      passwordMatch = await bcrypt.compare(password, user.password);
      
      if (passwordMatch) {
        userData = {
          sub: user.citizenId,
          role: "user",
          kind: "user",
          name: user.name,
          hn: user.hn
        };
      }
    } else {
      // ทำ dummy comparison เพื่อป้องกัน timing attack
      await bcrypt.compare(password, dummyHash);
    }
    
    // 2) ถ้าไม่เจอใน user → เช็คใน admins
    if (!userFound) {
      const [adminRows] = await connection.execute(
        "SELECT username, password, position, is_approved FROM admins WHERE username = ?",
        [citizenId]
      );
      const admins = adminRows as any[];
      
      if (admins.length > 0) {
        userFound = true;
        const admin = admins[0];
        
        if (!admin.is_approved) {
          console.warn(`⚠️ Unapproved admin login attempt: ${citizenId} from ${clientIP}`);
          // ยังคงทำ bcrypt เพื่อป้องกัน timing attack
          await bcrypt.compare(password, admin.password);
          return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }
        
        passwordMatch = await bcrypt.compare(password, admin.password);
        
        if (passwordMatch) {
          userData = {
            sub: admin.username,
            role: admin.position,
            kind: "admin"
          };
        }
      } else {
        // ทำ dummy comparison เพื่อป้องกัน timing attack
        await bcrypt.compare(password, dummyHash);
      }
    }
    
    // Authentication failed
    if (!userFound || !passwordMatch) {
      console.warn(`⚠️ Failed login: ${citizenId} from ${clientIP}`);
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    
    // Success - Clear rate limit
    const key = `${clientIP}:${citizenId}`;
    loginAttempts.delete(key);
    
    // สร้าง JWT token
    const token = signSession(userData);
    
    const response = NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ!",
      ok: true,
      role: userData.role,
      ...(userData.kind === "user" ? {
        citizenId: userData.sub,
        name: userData.name,
        hn: userData.hn
      } : {
        username: userData.sub
      })
    });
    
    // Set secure httpOnly cookie
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 1, // ลดลงเป็น 1 วัน
    });
    
    console.log(`✅ Successful login: ${userData.sub} (${userData.role}) from ${clientIP}`);
    return response;
    
  } catch (error) {
    console.error("🚨 Login Error:", {
      message: (error as Error).message,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}