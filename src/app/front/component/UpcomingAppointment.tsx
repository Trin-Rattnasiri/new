"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, FileText, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface Appointment {
  booking_reference_number: string
  slot_date: string
  start_time: string
  end_time: string
  department: string
  user_name: string
  status: string
  cancelledBy?: string // เพิ่มฟิลด์ cancelledBy
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
    return (
      <div className="w-full max-w-md mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">นัดหมายที่จะถึง</h3>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 text-center">
          <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">ยังไม่มีนัดหมาย</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">นัดหมายที่จะถึง</h3>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
        {/* การแสดงรายการการนัดหมาย */}
        {appointments.map((appointment) => (
          <div
            key={appointment.booking_reference_number}
            onClick={() => router.push(`/appointment/${appointment.booking_reference_number}`)}
            className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="flex flex-col space-y-1 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-800" />
                <span className="text-purple-800">ผู้จอง:</span>
                <span className="text-blue-800 font-semibold">{appointment.user_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">เลขใบนัด:</span>
                <span className="text-blue-700 font-mono">{appointment.booking_reference_number}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">วันที่:</span>
                <span>{new Date(appointment.slot_date).toLocaleDateString("th-TH")}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-700" />
                <span>เวลา:</span>
                <span>
                  {appointment.start_time} - {appointment.end_time}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-700" />
                <span>แผนก:</span>
                <span>{appointment.department}</span>
              </div>

              {/* สถานะการจอง */}
              <div className="flex items-center gap-2 mt-1">
                {appointment.status === "pending" ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : appointment.status === "confirmed" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    appointment.status === "pending"
                      ? "text-yellow-600"
                      : appointment.status === "confirmed"
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
                >
                  {appointment.status === "pending"
                    ? "รอการยืนยัน"
                    : appointment.status === "confirmed"
                      ? "ยืนยันแล้ว"
                      : appointment.cancelledBy === "user"
                        ? "ยกเลิกโดยผู้ใช้"
                        : appointment.cancelledBy === "admin"
                          ? "ยกเลิกโดยแอดมิน"
                          : "ยกเลิก"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
