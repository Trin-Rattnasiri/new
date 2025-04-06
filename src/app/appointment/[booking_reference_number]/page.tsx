'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function AppointmentPage() {
  const { booking_reference_number } = useParams<{ booking_reference_number: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/appointment/${booking_reference_number}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        setData(null)
      }
      setLoading(false)
    }

    if (booking_reference_number) fetchData()
  }, [booking_reference_number])

  if (loading) return <p className="p-6">⏳ กำลังโหลด...</p>
  if (!data) return <p className="p-6 text-red-500">❌ ไม่พบใบนัด</p>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-sky-700 mb-4">📋 รายละเอียดใบนัด</h1>
      <p><strong>ชื่อผู้จอง:</strong> {data.user_name}</p>
      <p><strong>เบอร์โทร:</strong> {data.phone_number}</p>
      <p><strong>วันที่:</strong> {data.booking_date}</p>
      <p><strong>รหัสใบนัด:</strong> {data.booking_reference_number}</p>
      <p><strong>สถานะ:</strong> {data.status}</p>
    </div>
  )
}
