'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import UpcomingAppointment from "../component/UpcomingAppointment";

interface UserInfo {
  citizenId: string
  name: string
  prefix: string
  phone: string
  birthday: string
}

export default function HomePage() {
  const router = useRouter()
  const [citizenId, setCitizenId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('citizenId')
    if (id) {
      setCitizenId(id)
      fetch(`/api/user/profile?citizenId=${id}`)
        .then((res) => res.json())
        .then((data) => setUserInfo(data))
        .catch((err) => console.error("❌ Error loading user info:", err))
    }
  }, [])

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  // ✅ แก้ตรงนี้: ใช้ตัวแปร avatarSrc เพื่อให้แน่ใจว่า React จะ render ใหม่เมื่อ prefix เปลี่ยน
  const avatarSrc = useMemo(() => {
    const prefix = userInfo?.prefix?.trim()
    if (!prefix) return "/man.png"
  
    if (["นาง", "นางสาว"].includes(prefix)) return "/woman.png"
    if (prefix === "เด็กหญิง") return "/girl.png"
    if (prefix === "เด็กชาย") return "/boy.png"
    return "/man.png"
  }, [userInfo?.prefix])
  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 relative">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 text-blue-500"
        >
          <ArrowLeft />
        </button>

        {/* User Info */}
        <div className="flex items-center flex-col mt-8">
          <img
            src={avatarSrc}
            alt="Avatar"
            className="w-20 h-20 rounded-full border"
          />
          <h2 className="text-lg font-bold mt-2">
            {userInfo ? `${userInfo.prefix} ${userInfo.name}` : 'กำลังโหลด...'}
          </h2>
          <p className="text-gray-500 text-sm">
            {citizenId ?? 'กำลังโหลด...'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-around mt-6 gap-4">
          {/* นัดหมายออนไลน์ */}
          <button
            onClick={() => router.push('/front/user-booking')}
            className="flex flex-col items-center bg-white p-4 rounded-xl shadow border border-blue-200 hover:bg-blue-50 transition w-32"
          >
            <div className="text-blue-600 text-3xl">📅</div>
            <p className="text-sm font-semibold text-blue-800 mt-2">นัดหมายออนไลน์</p>
          </button>

          {/* ประวัติการรักษา */}
          <button
            onClick={() => router.push('/front/user-history')}
            className="flex flex-col items-center bg-white p-4 rounded-xl shadow border border-blue-200 hover:bg-blue-50 transition w-32"
          >
            <div className="text-blue-600 text-3xl">📨</div>
            <p className="text-sm font-semibold text-blue-800 mt-2">ประวัติการรักษา</p>
          </button>
        </div>
      </div>

      {/* นัดหมายที่จะถึง */}
      <UpcomingAppointment />

      {/* ข้อมูลผู้ใช้งาน */}
      <div className="w-full max-w-md mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">ข้อมูลผู้ใช้งาน</h3>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-blue-800">📞 เบอร์โทร:</span>{' '}
                {userInfo?.phone ?? '—'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-blue-800">🎂 วันเกิด:</span>{' '}
                {userInfo?.birthday ? formatDate(userInfo.birthday) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
