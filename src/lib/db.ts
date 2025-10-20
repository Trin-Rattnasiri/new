// src/lib/db.ts
import mysql from "mysql2/promise"

// Pool สำหรับแต่ละฐานข้อมูล
let _mainPool: mysql.Pool | null = null
let _clinicPool: mysql.Pool | null = null

// ฟังก์ชันสร้าง Pool Configuration
function createPoolConfig(
  host: string,
  user: string,
  password: string,
  database: string
): mysql.PoolOptions {
  // 🔍 Debug logging
  console.log('🔧 Database Config:', {
    host,
    user,
    database,
    password: password ? '***' : 'MISSING'
  })

  return {
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 25,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    idleTimeout: 60000,
    charset: 'utf8mb4_unicode_ci',
    connectTimeout: 10000,
    acquireTimeout: 10000,
  }
}

// ฟังก์ชัน Setup Event Listeners
function setupPoolListeners(pool: mysql.Pool, name: string, resetFn: () => void) {
  pool.on('connection', (connection) => {
    console.log(`🔗 [${name}] New connection established: ${connection.threadId}`)
  })

  pool.on('acquire', (connection) => {
    console.log(`📌 [${name}] Connection acquired: ${connection.threadId}`)
  })

  pool.on('release', (connection) => {
    console.log(`🔓 [${name}] Connection released: ${connection.threadId}`)
  })

  pool.on('error', (err) => {
    console.error(`🚨 [${name}] Pool error:`, err.message)
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log(`🔄 [${name}] Recreating connection pool...`)
      resetFn()
    }
  })
}

// ฐานข้อมูลหลัก (ระบบเดิม)
export function getMainPool(): mysql.Pool {
  if (_mainPool) return _mainPool

  console.log('🏗️  Creating Main Database Pool...')
  
  // ✅ เพิ่ม default values และ validation
  const dbHost = process.env.DB_HOST || 'db'
  const dbUser = process.env.DB_USER || 'root'
  const dbPassword = process.env.DB_PASSWORD || ''
  const dbName = process.env.DB_NAME || 'hospital_booking'

  // ⚠️ Warning ถ้าไม่มี environment variables
  if (!process.env.DB_HOST) {
    console.warn('⚠️  DB_HOST not set, using default: db')
  }

  _mainPool = mysql.createPool(
    createPoolConfig(dbHost, dbUser, dbPassword, dbName)
  )

  setupPoolListeners(_mainPool, 'Main DB', () => {
    _mainPool = null
  })

  return _mainPool
}

// ฐานข้อมูลคลินิก (ระบบประวัติการรักษา)
export function getClinicPool(): mysql.Pool {
  if (_clinicPool) return _clinicPool

  console.log('🏗️  Creating Clinic Database Pool...')
  
  // ✅ เพิ่ม default values
  const clinicHost = process.env.CLINIC_DB_HOST || process.env.DB_HOST || 'db'
  const clinicUser = process.env.CLINIC_DB_USER || process.env.DB_USER || 'root'
  const clinicPassword = process.env.CLINIC_DB_PASSWORD || process.env.DB_PASSWORD || ''
  const clinicName = process.env.CLINIC_DB_NAME || 'hospital_clinic'

  _clinicPool = mysql.createPool(
    createPoolConfig(clinicHost, clinicUser, clinicPassword, clinicName)
  )

  setupPoolListeners(_clinicPool, 'Clinic DB', () => {
    _clinicPool = null
  })

  return _clinicPool
}

// ฟังก์ชันสำหรับเพิ่มฐานข้อมูลอื่นๆ ในอนาคต
export function getPool(dbType: 'main' | 'clinic' = 'main'): mysql.Pool {
  switch (dbType) {
    case 'main':
      return getMainPool()
    case 'clinic':
      return getClinicPool()
    default:
      throw new Error(`Unknown database type: ${dbType}`)
  }
}

// ปิด Connection Pool ทั้งหมด (สำหรับ graceful shutdown)
export async function closeAllPools() {
  const closingPools: Promise<void>[] = []

  if (_mainPool) {
    console.log('🔐 Closing Main Database Pool...')
    closingPools.push(
      _mainPool.end().then(() => {
        _mainPool = null
        console.log('✅ Main Database Pool closed')
      })
    )
  }

  if (_clinicPool) {
    console.log('🔐 Closing Clinic Database Pool...')
    closingPools.push(
      _clinicPool.end().then(() => {
        _clinicPool = null
        console.log('✅ Clinic Database Pool closed')
      })
    )
  }

  await Promise.all(closingPools)
  console.log('✅ All database pools closed successfully')
}

// ตรวจสอบสถานะ Connection Pool
export function getPoolStatus() {
  return {
    main: {
      active: _mainPool !== null,
      connections: _mainPool ? 'Connected' : 'Disconnected'
    },
    clinic: {
      active: _clinicPool !== null,
      connections: _clinicPool ? 'Connected' : 'Disconnected'
    }
  }
}

// Helper function สำหรับ backward compatibility
export function getPoolLegacy() {
  return getMainPool()
}