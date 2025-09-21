"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, FileText, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { parseISO, format } from "date-fns"
import { th } from "date-fns/locale"

type RawAppt = Record<string, any>

interface Appointment {
  booking_reference_number: string
  slot_date: string
  start_time: string
  end_time: string
  department: string
  user_name: string
  status: string
  cancelledBy?: string
}

export default function UpcomingAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // helper: รวม field ให้เป็นชื่อที่เราใช้เสมอ
  const normalize = (r: RawAppt): Appointment | null => {
    const ref =
      r.booking_reference_number ??
      r.bookingReferenceNumber ??
      r.reference_number ??
      r.referenceNumber

    if (!ref) return null

    const slot_date = r.slot_date ?? r.slotDate ?? ""
    const start_time = (r.start_time ?? r.startTime ?? "").slice(0, 8)
    const end_time = (r.end_time ?? r.endTime ?? "").slice(0, 8)
    const department = r.department ?? r.department_name ?? r.departmentName ?? "-"
    const user_name = r.user_name ?? r.name ?? "-"
    const status = String(r.status ?? "").toLowerCase()
    const cancelledBy = r.cancelledBy ?? r.cancelled_by

    return { booking_reference_number: ref, slot_date, start_time, end_time, department, user_name, status, cancelledBy }
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 1) ดึงข้อมูล user
        const userRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        if (userRes.status === 401) {
          router.push("/")
          return
        }
        const userData = await userRes.json()
        const citizenId = userData.profile?.citizenId
        if (!citizenId) throw new Error("ไม่พบข้อมูล Citizen ID")

        // 2) ดึงนัดหมาย
        const res = await fetch(`/api/user/upcoming?created_by=${encodeURIComponent(citizenId)}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        })

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/")
            return
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        const data = await res.json()
        // รองรับหลายทรง: array ตรง ๆ / {items:[]} / {rows:[]} / {appointments:[]}
        const list: RawAppt[] = Array.isArray(data) ? data : (data?.items ?? data?.rows ?? data?.appointments ?? [])
        const normalized = list.map(normalize).filter(Boolean) as Appointment[]

        setAppointments(normalized)
      } catch (err) {
        console.error("❌ Error fetching appointments:", err)
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [router])

  // Loading
  if (isLoading) {
    return (
      <div className="w-full max-w-md mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">นัดหมายที่จะถึง</h3>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="w-full max-w-md mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">นัดหมายที่จะถึง</h3>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // No data
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
        {appointments.map((appointment) => (
          <div
            key={appointment.booking_reference_number}
            onClick={() => router.push(`/front/${appointment.booking_reference_number}`)}  // ✅ เปลี่ยนเป็น /front/...
            className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4 last:mb-0 hover:bg-blue-50 cursor-pointer transition-all"
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
                <span>
                  {appointment.slot_date
                    ? format(parseISO(appointment.slot_date), "d MMMM yyyy", { locale: th })
                    : "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-700" />
                <span>เวลา:</span>
                <span>{appointment.start_time} - {appointment.end_time}</span>
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
