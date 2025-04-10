'use client'

import { FiChevronLeft } from "react-icons/fi"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Appointment {
  booking_reference_number: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  department: string;
  user_name: string;
  status: string;
}

export default function UpcomingAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const router = useRouter()
  const createdBy = typeof window !== "undefined" ? localStorage.getItem("citizenId") : ""

  // ดึงข้อมูลการนัดหมายจาก API
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!createdBy) return
      try {
        const res = await fetch(`/api/user/upcoming?created_by=${createdBy}`)
        if (!res.ok) {
          console.error("ไม่สามารถโหลดข้อมูลใบนัดได้")
          return
        }
        const data = await res.json()
        setAppointments(data)
      } catch (err) {
        console.error("❌ Error fetching appointments:", err)
      }
    }

    fetchAppointments()
  }, [createdBy])

  // หากไม่มีการนัดหมายจะแสดงข้อความนี้
  if (!appointments.length) {
    return <p className="mt-4 text-gray-500 text-center">ยังไม่มีนัดหมาย</p>
  }

  return (
    <div className="w-full max-w-md mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3"> นัดหมายที่จะถึง</h3>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
        {/* การแสดงรายการการนัดหมาย */}
        {appointments.map((appointment) => (
          <div
            key={appointment.booking_reference_number}
            onClick={() => router.push(`/appointment/${appointment.booking_reference_number}`)}
            className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="flex flex-col space-y-1 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <span className="text-purple-800">👤 ผู้จอง:</span>
                <span className="text-blue-800 font-semibold">{appointment.user_name}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-gray-600">🧾 เลขใบนัด:</span>
                <span className="text-blue-700 font-mono">{appointment.booking_reference_number}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-blue-600">📅 วันที่:</span>
                <span>{new Date(appointment.slot_date).toLocaleDateString("th-TH")}</span>
              </div>

              <div className="flex items-center gap-1">
                <span>🕒 เวลา:</span>
                <span>{appointment.start_time} - {appointment.end_time}</span>
              </div>

              <div className="flex items-center gap-1">
                <span>📍 แผนก:</span>
                <span>{appointment.department}</span>
              </div>

              {/* สถานะการจอง */}
              <div className={`mt-1 font-medium ${
                appointment.status === "pending"
                  ? "text-yellow-600"
                  : appointment.status === "confirmed"
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
                {appointment.status === "pending"
                  ? "รอการยืนยัน"
                  : appointment.status === "confirmed"
                  ? "ยืนยันแล้ว"
                  : "ยกเลิก"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
