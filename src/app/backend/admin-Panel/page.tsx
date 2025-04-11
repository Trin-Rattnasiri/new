"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"

interface Booking {
  id: number
  booking_reference_number: string
  user_name: string
  phone_number: string
  id_card_number: string
  hn: string
  slot_date: string
  start_time: string
  end_time: string
  department_name: string
  status: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "ยืนยันแล้ว"
      case "pending":
        return "รอดำเนินการ"
      case "cancelled":
        return "ยกเลิกแล้ว"
      default:
        return status
    }
  }

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const res = await fetch("/api/admin/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")
        const data = await res.json()
        setBookings(data.bookings || [])
      } catch (err) {
        console.error(err)
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    }

    fetchAllBookings()
  }, [])

  const confirmStatusChange = (id: number, status: string) => {
    setSelectedBookingId(id)
    setSelectedStatus(status)
    setOpenConfirmModal(true)
  }

  const changeConfirmedStatus = async () => {
    if (!selectedBookingId || !selectedStatus) return
    try {
      const res = await fetch("/api/admin/appointment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBookingId, status: selectedStatus }),
      })
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBookingId ? { ...b, status: selectedStatus } : b))
        )
      } else {
        alert("อัปเดตสถานะไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาด")
    } finally {
      setOpenConfirmModal(false)
      setSelectedBookingId(null)
      setSelectedStatus(null)
    }
  }

  const confirmDelete = (id: number) => {
    setSelectedBookingId(id)
    setOpenDeleteModal(true)
  }

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return
    try {
      const res = await fetch(`/api/admin/appointment?bookingId=${selectedBookingId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId))
      } else {
        alert("ลบไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดขณะลบ")
    } finally {
      setOpenDeleteModal(false)
      setSelectedBookingId(null)
    }
  }

  if (loading) return <p className="text-center py-10">กำลังโหลดข้อมูล...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">รายการจองทั้งหมด</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>แผนก</TableCell>
            <TableCell>วันที่</TableCell>
            <TableCell>เวลา</TableCell>
            <TableCell>ชื่อ</TableCell>
            <TableCell>เบอร์โทร</TableCell>
            <TableCell>HN</TableCell>
            <TableCell>อ้างอิง</TableCell>
            <TableCell>สถานะ</TableCell>
            <TableCell>การดำเนินการ</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.department_name}</TableCell>
              <TableCell>{format(new Date(b.slot_date), "dd/MM/yyyy")}</TableCell>
              <TableCell>{`${b.start_time} - ${b.end_time}`}</TableCell>
              <TableCell>{b.user_name}</TableCell>
              <TableCell>{b.phone_number || "-"}</TableCell>
              <TableCell>{b.hn}</TableCell>
              <TableCell>{b.booking_reference_number}</TableCell>
              <TableCell>
                <Badge
                  className={`${
                    b.status === "confirmed"
                      ? "bg-green-500"
                      : b.status === "pending"
                      ? "bg-yellow-400 text-black"
                      : "bg-red-500"
                  }`}
                >
                  {getStatusLabel(b.status)}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => confirmStatusChange(b.id, "confirmed")}
                >
                  ยืนยัน
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => confirmDelete(b.id)}
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => confirmStatusChange(b.id, "pending")}
                >
                  รอดำเนินการ
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal ยืนยันลบ */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p>คุณต้องการลบรายการจองนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              ยกเลิก
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={deleteConfirmed}>
               ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal ยืนยันการเปลี่ยนสถานะ */}
      <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
          </DialogHeader>
          <p>
            คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะเป็น{" "}
            <strong>{getStatusLabel(selectedStatus || "")}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmModal(false)}>
              ยกเลิก
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={changeConfirmedStatus}>
               ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
