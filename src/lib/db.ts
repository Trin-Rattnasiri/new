
import mysql from "mysql2/promise"

let _pool: mysql.Pool | null = null

export function getPool() {
  if (_pool) return _pool
  
  _pool = mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit: 25,         // เพิ่มจำนวน connection
    queueLimit: 0,              // ไม่จำกัด queue
    enableKeepAlive: true,      // เปิดใช้ keep-alive
    keepAliveInitialDelay: 0,   
    idleTimeout: 60000,         // ลด idle timeout เป็น 1 นาที
    charset: 'utf8mb4_unicode_ci',
    connectTimeout: 10000,      // timeout การเชื่อมต่อ 10 วินาที
    acquireTimeout: 10000,      // timeout การรอ connection 10 วินาที
  })
  
  // เพิ่ม error handling
  _pool.on('connection', (connection) => {
    console.log('🔗 New DB connection established:', connection.threadId)
  })
  
  _pool.on('error', (err) => {
    console.error('🚨 Database pool error:', err)
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔄 Recreating connection pool...')
      _pool = null // reset pool จะถูกสร้างใหม่ครั้งถัดไป
    }
  })
  
  return _pool
}

// เพิ่ม helper function สำหรับ graceful shutdown
export async function closePool() {
  if (_pool) {
    await _pool.end()
    _pool = null
    console.log('🔐 Database pool closed')
  }
}