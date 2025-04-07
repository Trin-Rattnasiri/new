'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Appointment {
  booking_reference_number: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  department: string;
  user_name: string; // ✅ ได้จาก API
  status: string;
}

export default function UpcomingAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const router = useRouter()
  const createdBy = typeof window !== "undefined" ? localStorage.getItem("citizenId") : ""

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

  if (!appointments.length) {
    return <p className="mt-4 text-gray-500 text-center">ยังไม่มีนัดหมาย</p>
  }

  return (
    <div className="w-full max-w-md mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🩺 นัดหมายที่จะถึง</h3>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
        {appointments.map((appointment) => (
          <div
            key={appointment.booking_reference_number}
            onClick={() => router.push(`/appointment/${appointment.booking_reference_number}`)}
            className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <p className="text-sm text-gray-600 mb-3 text-center">
              👤 ผู้จอง: <span className="text-blue-800 font-semibold">{appointment.user_name}</span>
            </p>

            <p className="text-base font-semibold text-blue-800 mb-2">
              📅 {new Date(appointment.slot_date).toLocaleDateString("th-TH")}
            </p>
            <p className="text-sm text-gray-700">
              <strong>🕒 เวลา:</strong> {appointment.start_time} - {appointment.end_time}
            </p>
            <p className="text-sm text-gray-700">
              <strong>📍 แผนก:</strong> {appointment.department}
            </p>
            <p className={`text-sm mt-2 font-medium ${
              appointment.status === "pending" ? "text-yellow-600" :
              appointment.status === "confirmed" ? "text-green-600" : "text-red-600"
            }`}>
              {appointment.status === "pending" ? "รอการยืนยัน" :
              appointment.status === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิก"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
