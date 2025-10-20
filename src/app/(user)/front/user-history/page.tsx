// src/app/front/user-history/page.tsx
'use client'

import { FiChevronLeft } from "react-icons/fi"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface PatientInfo {
  prefix: string
  name: string
  age: string
  IdCard: string
  hn: string 
  bloodType: string
  DrugAllergy: string
  chronicDisease: string
  phone: string 
}

interface MedicalRecord {
  id: string
  date: string
  visitDate: string
  department: string
  diagnosis: string
  patientType: string
}

interface MonthData {
  month: string
  records: MedicalRecord[]
}

interface YearData {
  year: number
  months: MonthData[]
}

const MedicalHistoryPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<YearData[]>([])

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    prefix: "",
    name: "",
    age: "",
    IdCard: "",
    hn: "", 
    bloodType: "",
    DrugAllergy: "",
    chronicDisease: "",
    phone: "", 
  })

  useEffect(() => {
    // เรียกทั้ง 2 API พร้อมกัน
    fetchPatientData()
    fetchMedicalHistory()
  }, [])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      setError(null)

      // ✅ เรียก API โดยไม่ต้องส่ง citizenId (API จะดึงจาก JWT Token เอง)
      const res = await fetch("/api/auth/me", { 
        cache: "no-store",
        credentials: 'include' // ✅ สำคัญ! เพื่อส่ง Cookie ไปด้วย
      })
      
      // ถ้า Unauthorized (401) = ไม่มี session หรือ token หมดอายุ
      if (res.status === 401) {
        console.log('⚠️ Unauthorized - redirecting to login')
        router.replace("/")
        return
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('🔍 API /auth/me Response:', data)

      if (data.ok && data.profile) {
        const profile = data.profile
        
        setPatientInfo({
          prefix: profile.prefix || "",
          name: profile.name || "",
          age: profile.age || "-",
          IdCard: profile.citizenId || "",
          hn: profile.hn || "-",
          bloodType: profile.bloodType || "ไม่ระบุ", 
          DrugAllergy: profile.drugAllergy || "ไม่ระบุ",
          chronicDisease: profile.chronicDisease || "ไม่มี",
          phone: profile.phone || "-",
        })
      } else {
        throw new Error(data.error || 'ไม่สามารถโหลดข้อมูลได้')
      }

    } catch (err: any) {
      console.error('❌ Error fetching patient data:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const fetchMedicalHistory = async () => {
    try {
      // ✅ เรียก API โดยไม่ต้องส่ง citizenId (API จะดึงจาก JWT Token เอง)
      const res = await fetch("/api/medical-history", {
        cache: "no-store",
        credentials: 'include' // ✅ สำคัญ! เพื่อส่ง Cookie ไปด้วย
      })

      if (res.status === 401) {
        console.log('⚠️ Unauthorized - redirecting to login')
        router.replace("/")
        return
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('🔍 API /medical-history Response:', data)

      if (data.ok && data.history) {
        setHistoryData(data.history)
      } else {
        setHistoryData([])
      }

    } catch (err: any) {
      console.error('❌ Error fetching medical history:', err)
      // ไม่ set error เพราะอาจไม่มีประวัติ (ไม่ใช่ error จริง)
      setHistoryData([])
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                setError(null)
                fetchPatientData()
                fetchMedicalHistory()
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ลองอีกครั้ง
            </button>
            <button
              onClick={() => router.push("/front/user-dashboard")}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(to right, #1e40af, #1e3a8a)",
            color: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            padding: "1.5rem 2rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => router.push("/front/user-dashboard")}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "9999px",
              padding: "0.5rem",
              color: "white",
              transition: "all 0.3s",
              cursor: "pointer",
              border: "none",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")}
          >
            <FiChevronLeft className="text-2xl sm:text-3xl" />
          </button>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide">ประวัติการรักษา</h2>
        </div>

        {/* Patient Info */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-8 transition-all duration-300 hover:shadow-xl border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900">ข้อมูลผู้ป่วย</h3>
            <button
              onClick={() => {
                fetchPatientData()
                fetchMedicalHistory()
              }}
              className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors"
            >
              รีเฟรชข้อมูล
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">ชื่อ:</strong> {patientInfo.prefix} {patientInfo.name || "-"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">อายุ:</strong> {patientInfo.age || "-"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">เลข HN:</strong> {patientInfo.hn || "-"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">เลขบัตรประชาชน:</strong> {patientInfo.IdCard || "-"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">หมู่เลือด:</strong> {patientInfo.bloodType || "ไม่ระบุ"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">โรคประจำตัว:</strong> {patientInfo.chronicDisease || "ไม่มี"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">ประวัติการแพ้ยา:</strong> {patientInfo.DrugAllergy || "ไม่ระบุ"}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">เบอร์โทรศัพท์:</strong> {patientInfo.phone || "-"}
            </p>
          </div>
        </div>

        {/* Medical History */}
        {historyData.length === 0 ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h3 className="text-xl text-gray-600 mb-2">ไม่พบประวัติการรักษา</h3>
            <p className="text-gray-500">ยังไม่มีข้อมูลการรักษาในระบบ</p>
          </div>
        ) : (
          historyData.map((yearData, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-8 transition-all duration-300 hover:shadow-xl border border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900 mb-6">ปี {yearData.year}</h3>
              {yearData.months.map((monthData, monthIndex) => (
                <div key={monthIndex} className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4">{monthData.month}</h4>
                  {monthData.records.map((record, recordIndex) => (
                    <Link href={`/front/results/${record.visitDate}`} key={recordIndex}>
                      <div className="group p-4 sm:p-5 bg-gray-50 rounded-xl shadow-sm mb-4 hover:bg-blue-50 hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-200">
                        <p className="text-lg sm:text-xl text-blue-900 font-semibold">วันที่ {record.date}</p>
                        <p className="text-base sm:text-lg text-gray-800">
                          <strong className="text-blue-900">แผนก:</strong> {record.department}
                        </p>
                        <p className="text-base sm:text-lg text-gray-700">
                          <strong className="text-blue-900">วินิจฉัย:</strong> {record.diagnosis}
                        </p>
                        <p className="text-base sm:text-lg text-gray-600">
                          <strong className="text-blue-900">ประเภทผู้ป่วย:</strong> {record.patientType}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MedicalHistoryPage