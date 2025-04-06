'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Appointment {
  id: number;
  department: string;
  date: string;
  time: string;
}

export default function UpcomingAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const router = useRouter()
  const citizenId = typeof window !== "undefined" ? localStorage.getItem("citizenId") : ""

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!citizenId) return
      const res = await fetch(`/api/appointment?citizenId=${citizenId}`)
      const data = await res.json()
      setAppointments(data)
    }

    fetchAppointments()
  }, [citizenId])

  if (!appointments.length) {
    return <p className="mt-4 text-gray-500 text-center">ยังไม่มีนัดหมาย</p>
  }

  return (
    <div className="w-full max-w-md mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🩺 นัดหมายที่จะถึง</h3>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            onClick={() => router.push(`/appointment/${appointment.id}`)}
            className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4 hover:bg-blue-50 cursor-pointer transition-all duration-300"
          >
            <p className="text-base font-semibold text-blue-800 mb-2">
              📅 วันที่:{" "}
              {new Date(appointment.date).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className="space-y-2 text-gray-700 text-sm">
              <p>
                <span className="font-semibold text-blue-800">🕒 เวลา:</span>{" "}
                {appointment.time}
              </p>
              <p>
                <span className="font-semibold text-blue-800">📍 แผนก:</span>{" "}
                {appointment.department}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
