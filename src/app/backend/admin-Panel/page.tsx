"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface Booking {
  booking_reference_number: string
  user_name: string
  phone_number: string
  id_card_number: string
  hn: string
  slot_date: string
  start_time: string
  end_time: string
  department: string
  status: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/admin/bookings")
        if (!res.ok) throw new Error("Failed to fetch bookings")
        const data = await res.json()
        setBookings(data)
      } catch (err) {
        setError("Error fetching bookings")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/bookings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      })
      if (res.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.booking_reference_number === bookingId ? { ...booking, status } : booking
          )
        )
      } else {
        alert("Failed to update booking status")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while updating status")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">การจองทั้งหมด</h2>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableCell className="font-semibold text-gray-700">แผนก</TableCell>
              <TableCell className="font-semibold text-gray-700">วันที่</TableCell>
              <TableCell className="font-semibold text-gray-700">เวลา</TableCell>
              <TableCell className="font-semibold text-gray-700">ชื่อ</TableCell>
              <TableCell className="font-semibold text-gray-700">เบอร์โทร</TableCell>
              <TableCell className="font-semibold text-gray-700">HN</TableCell>
              <TableCell className="font-semibold text-gray-700">เลขที่อ้างอิง</TableCell>
              <TableCell className="font-semibold text-gray-700">สถานะ</TableCell>
              <TableCell className="font-semibold text-gray-700">การดำเนินการ</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.booking_reference_number} className="hover:bg-gray-50">
                <TableCell>{booking.department}</TableCell>
                <TableCell>{format(new Date(booking.slot_date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{`${booking.start_time} - ${booking.end_time}`}</TableCell>
                <TableCell>{booking.user_name}</TableCell>
                <TableCell>{booking.phone_number}</TableCell>
                <TableCell>{booking.hn}</TableCell>
                <TableCell>{booking.booking_reference_number}</TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      booking.status === "confirmed"
                        ? "bg-green-500"
                        : booking.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    } text-white`}
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(booking.booking_reference_number, "confirmed")}
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    ยืนยัน
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(booking.booking_reference_number, "cancelled")}
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    ยกเลิก
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}