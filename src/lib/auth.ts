// แก้ไขใน lib/auth.ts โดยเพิ่ม validation เข้าไปใน function เดิม

import jwt from "jsonwebtoken"
const SECRET = process.env.JWT_SECRET!

export function signSession(payload: Record<string, any>) {
  // ตรวจสอบให้แน่ใจว่า sub ไม่เป็น undefined
  if (!payload.sub || payload.sub === 'undefined') {
    throw new Error('Invalid session payload: sub is required and cannot be undefined')
  }
  
  return jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "1d" })
}

export function verifySession(token: string) {
  const decoded = jwt.verify(token, SECRET) as any
  
  // ตรวจสอบให้แน่ใจว่า sub ไม่เป็น undefined
  if (!decoded.sub || decoded.sub === 'undefined') {
    throw new Error('Invalid session: sub is undefined or null')
  }
  
  return decoded
}