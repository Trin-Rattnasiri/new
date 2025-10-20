// src/app/api/medical-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getClinicPool } from '@/lib/db'

export async function GET(request: NextRequest) {
  let connection: any = null
  
  try {
    console.log('🔐 Verifying session...')
    
    // ✅ ตรวจสอบ JWT Token
    const session = await verifySession(request)
    
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { ok: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    console.log('✅ Session verified:', {
      userId: session.userId,
      citizenId: session.citizenId
    })

    // ✅ ตรวจสอบว่ามี citizenId หรือไม่
    const citizenId = session.citizenId
    
    if (!citizenId) {
      console.log('❌ No citizenId in session')
      return NextResponse.json(
        { ok: false, error: 'ไม่พบเลขบัตรประชาชนในระบบ' },
        { status: 400 }
      )
    }

    console.log(`🔍 Fetching medical history for citizenId: ${citizenId}`)

    // ✅ เชื่อมต่อฐานข้อมูล HIS (Clinic)
    const pool = getClinicPool()
    connection = await pool.getConnection()
    console.log('✅ Connected to Clinic (HIS) database')

    // ✅ Step 1: ดึงข้อมูลผู้ป่วยจาก HIS
    console.log('📋 Querying patient data from HIS...')
    
    const [patientData]: any = await connection.execute(`
      SELECT 
        CONCAT(p.pname, ' ', p.fname, ' ', p.lname) as PatientName,
        TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) as years,
        TIMESTAMPDIFF(MONTH, p.birthday, CURDATE()) % 12 as months,
        DATEDIFF(
          CURDATE(), 
          DATE_ADD(p.birthday, INTERVAL TIMESTAMPDIFF(MONTH, p.birthday, CURDATE()) MONTH)
        ) as days,
        p.cid,
        p.mobile_phone_number,
        p.hn,
        p.bloodgrp,
        p.drugallergy,
        p.congenital_disease
      FROM patient p
      WHERE p.cid = ?
      LIMIT 1
    `, [citizenId])

    // ✅ ตรวจสอบว่าพบข้อมูลผู้ป่วยหรือไม่
    if (!patientData || patientData.length === 0) {
      console.log('⚠️ Patient not found in HIS database')
      return NextResponse.json({
        ok: false,
        error: 'ไม่พบข้อมูลผู้ป่วยในระบบโรงพยาบาล',
        message: 'เลขบัตรประชาชนนี้ยังไม่เคยมารับบริการที่โรงพยาบาล'
      }, { status: 404 })
    }

    const patient = patientData[0]
    console.log('✅ Patient found:', {
      name: patient.PatientName,
      hn: patient.hn,
      cid: citizenId
    })

    // ✅ Step 2: ดึงประวัติการรักษา (vn_stat)
    console.log('📋 Querying medical history from HIS...')
    
    const [visits]: any = await connection.execute(`
      SELECT 
        v.vstdate,
        v.vsttime,
        s.name as department_name,
        v.pdx,
        i.name as diagnosis_name,
        v.spclty,
        v.hn,
        v.vn
      FROM vn_stat v
      LEFT JOIN spclty s ON s.spclty = v.spclty
      LEFT JOIN icd101 i ON i.code = v.pdx
      WHERE v.cid = ?
      ORDER BY v.vstdate DESC, v.vsttime DESC
      LIMIT 500
    `, [citizenId])

    console.log(`✅ Found ${visits.length} medical records`)

    // ✅ Return ข้อมูลทั้งหมด
    // ✅ จัดกลุ่มข้อมูลตามปีและเดือน
    const groupedHistory = groupVisitsByYearMonth(visits)

    return NextResponse.json({
      ok: true,
      // ส่งข้อมูลผู้ป่วยแยกออกมา (ถ้า Frontend ต้องการ)
      patient: {
        name: patient.PatientName,
        age: {
          years: patient.years || 0,
          months: patient.months || 0,
          days: patient.days || 0
        },
        citizenId: patient.cid,
        hn: patient.hn,
        mobilePhone: patient.mobile_phone_number,
        bloodGroup: patient.bloodgrp,
        drugAllergy: patient.drugallergy || 'ไม่ระบุ',
        chronicDisease: patient.congenital_disease || 'ไม่มี'
      },
      // ✅ ส่งประวัติการรักษาในรูปแบบที่ Frontend คาดหวัง
      history: groupedHistory
    })

// ✅ ฟังก์ชันจัดกลุ่มข้อมูลตามปีและเดือน (เพิ่มก่อน try-catch)
function groupVisitsByYearMonth(visits: any[]) {
  const grouped: { [year: number]: { [month: string]: any[] } } = {}

  visits.forEach((visit: any) => {
    const date = new Date(visit.vstdate)
    const year = date.getFullYear() + 543 // แปลงเป็น พ.ศ.
    const monthName = date.toLocaleDateString('th-TH', { 
      month: 'long' 
    })

    if (!grouped[year]) {
      grouped[year] = {}
    }

    if (!grouped[year][monthName]) {
      grouped[year][monthName] = []
    }

    grouped[year][monthName].push({
      id: visit.vn,
      date: new Date(visit.vstdate).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      visitDate: visit.vstdate,
      department: visit.department_name || 'ไม่ระบุแผนก',
      diagnosis: visit.diagnosis_name || 'ไม่มีการวินิจฉัย',
      patientType: visit.pdx || 'ไม่ระบุ'
    })
  })

  // แปลงเป็น Array ตาม format ที่ Frontend ต้องการ
  return Object.entries(grouped)
    .map(([year, months]) => ({
      year: parseInt(year),
      months: Object.entries(months).map(([month, records]) => ({
        month,
        records
      }))
    }))
    .sort((a, b) => b.year - a.year) // เรียงปีจากใหม่ไปเก่า
}

  } catch (error: any) {
    console.error('❌ Error in /api/medical-history:', error)
    
    // ✅ แยกประเภท Error
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        ok: false,
        error: 'ไม่พบตารางในฐานข้อมูล',
        message: 'กรุณาตรวจสอบการตั้งค่าฐานข้อมูล HIS',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        ok: false,
        error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        message: 'กรุณาตรวจสอบการตั้งค่า HIS_DB_* ใน .env',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
    
  } finally {
    if (connection) {
      connection.release()
      console.log('🔌 HIS database connection released')
    }
  }
}