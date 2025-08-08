"use client"

import { useEffect, useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import Select from "react-select"
import { format, isToday, isThisWeek } from "date-fns"

import {
  Calendar,
  Clock,
  User,
  Phone,
  Hash,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Trash2,
} from "lucide-react"

import { Toaster, toast } from "sonner"

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
  cancelled_by?: string
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "ยืนยันแล้ว",
  pending: "รอดำเนินการ",
  cancelled: "ยกเลิกแล้ว",
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
}

const STATUS_ICONS = {
  confirmed: CheckCircle,
  pending: AlertCircle,
  cancelled: XCircle,
}

export default function BookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("confirmed")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [openCancelModal, setOpenCancelModal] = useState(false)
  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      // ใช้ข้อมูลตัวอย่างแทนการ fetch จริง
      const mockBookings: Booking[] = [
        {
          id: 1,
          booking_reference_number: "REF001",
          user_name: "สมชาย ใจดี",
          phone_number: "081-234-5678",
          id_card_number: "1234567890123",
          hn: "HN001",
          slot_date: "2025-08-08",
          start_time: "09:00",
          end_time: "10:00",
          department_name: "แผนกอายุรกรรม",
          status: "confirmed",
        },
        {
          id: 2,
          booking_reference_number: "REF002",
          user_name: "สมหญิง ใจงาม",
          phone_number: "082-345-6789",
          id_card_number: "2345678901234",
          hn: "HN002",
          slot_date: "2025-08-07",
          start_time: "14:00",
          end_time: "15:00",
          department_name: "แผนกกุมารเวชศาสตร์",
          status: "pending",
        },
        {
          id: 3,
          booking_reference_number: "REF003",
          user_name: "สมศักดิ์ รักดี",
          phone_number: "083-456-7890",
          id_card_number: "3456789012345",
          hn: "HN003",
          slot_date: "2025-08-09",
          start_time: "10:30",
          end_time: "11:30",
          department_name: "แผนกศัลยกรรม",
          status: "cancelled",
          cancelled_by: "admin",
        },
      ]

      setBookings(mockBookings)

      if (refreshing) {
        toast.success("รีเฟรชข้อมูลสำเร็จ")
      }
    } catch (err) {
      console.error(err)
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      if (refreshing) {
        toast.error("ไม่สามารถรีเฟรชข้อมูลได้")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "ทุกแผนก" },
      ...Array.from(new Set(bookings.map((b) => b.department_name))).map((dept) => ({
        value: dept,
        label: dept,
      })),
    ],
    [bookings],
  )

  const statusOptions = [
    { value: "", label: "ทุกสถานะ" },
    { value: "confirmed", label: "ยืนยันแล้ว" },
    { value: "pending", label: "รอดำเนินการ" },
    { value: "cancelled", label: "ยกเลิกแล้ว" },
  ]

  const timeOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "today", label: "วันนี้" },
    { value: "week", label: "สัปดาห์นี้" },
  ]

  const filteredBookings = bookings.filter((booking) => {
    // Department filter
    if (departmentFilter && booking.department_name !== departmentFilter) return false

    // Status filter
    if (statusFilter && booking.status !== statusFilter) return false

    // Time filter
    if (timeFilter === "today" && !isToday(new Date(booking.slot_date))) return false
    if (timeFilter === "week" && !isThisWeek(new Date(booking.slot_date))) return false

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        booking.user_name.toLowerCase().includes(query) ||
        booking.phone_number.includes(query) ||
        booking.hn.includes(query) ||
        booking.booking_reference_number.toLowerCase().includes(query)
      )
    }

    return true
  })

  const confirmStatusChange = async () => {
    if (!selectedBookingId || !selectedStatus) return

    try {
      setRefreshing(true)
      
      // อัปเดตสถานะใน state
      setBookings((prev) => prev.map((b) => (b.id === selectedBookingId ? { ...b, status: selectedStatus } : b)))
      toast.success(`เปลี่ยนสถานะเป็น "${STATUS_LABELS[selectedStatus || ""]}" สำเร็จ`)

    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ")
    } finally {
      setOpenConfirmModal(false)
      setSelectedBookingId(null)
      setSelectedStatus(null)
      setRefreshing(false)
    }
  }

  const cancelBooking = async () => {
    if (!selectedBookingRef) return

    try {
      setRefreshing(true)
      
      // อัพเดทสถานะในรายการ
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_reference_number === selectedBookingRef
            ? { ...b, status: "cancelled", cancelled_by: "admin" }
            : b,
        ),
      )

      toast.success("ยกเลิกนัดหมายสำเร็จ")
    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการยกเลิกนัดหมาย")
    } finally {
      setOpenCancelModal(false)
      setSelectedBookingRef(null)
      setSelectedBookingId(null)
      setRefreshing(false)
    }
  }

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return

    try {
      setRefreshing(true)
      
      setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId))
      toast.success("ลบรายการนัดหมายสำเร็จ")
    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการลบรายการ")
    } finally {
      setOpenDeleteModal(false)
      setSelectedBookingId(null)
      setRefreshing(false)
    }
  }

  const getStatusLabel = (booking: Booking) => {
    if (booking.status === "cancelled" && booking.cancelled_by) {
      return booking.cancelled_by === "admin" ? "ยกเลิกโดยแอดมิน" : "ยกเลิกโดยผู้ใช้"
    }
    return STATUS_LABELS[booking.status] || "ไม่ทราบสถานะ"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="mx-auto">
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">รายการนัดหมายที่ยืนยันแล้ว</CardTitle>
            <CardDescription>จัดการรายการนัดหมายทั้งหมดในระบบ</CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาชื่อ, เบอร์โทร, HN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                options={departmentOptions}
                onChange={(selected) => setDepartmentFilter(selected?.value || "")}
                value={departmentOptions.find((opt) => opt.value === departmentFilter)}
                placeholder="แผนก"
                className="react-select-container"
                classNamePrefix="react-select"
              />

              <Select
                options={statusOptions}
                onChange={(selected) => setStatusFilter(selected?.value || "")}
                value={statusOptions.find((opt) => opt.value === statusFilter)}
                placeholder="สถานะ"
                className="react-select-container"
                classNamePrefix="react-select"
              />

              <Select
                options={timeOptions}
                onChange={(selected) => setTimeFilter(selected?.value || "all")}
                value={timeOptions.find((opt) => opt.value === timeFilter)}
                placeholder="ช่วงเวลา"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </CardHeader>

          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">ไม่พบรายการนัดหมาย</p>
                <p className="text-sm text-gray-400 mt-1">ลองปรับเงื่อนไขการค้นหาหรือล้างตัวกรอง</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>วันที่</TableHead>
                      <TableHead>เวลา</TableHead>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead>เบอร์โทร</TableHead>
                      <TableHead>HN</TableHead>
                      <TableHead>อ้างอิง</TableHead>
                      <TableHead className="text-right">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((b) => {
                      const StatusIcon = STATUS_ICONS[b.status as keyof typeof STATUS_ICONS] || AlertCircle

                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            <Badge className={STATUS_COLORS[b.status]}>
                              <StatusIcon className="mr-1 h-4 w-4 inline-block" />
                              {getStatusLabel(b)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{b.department_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4 text-gray-500" />
                              {format(new Date(b.slot_date), "dd/MM/yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4 text-gray-500" />
                              {`${b.start_time} - ${b.end_time}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="mr-1 h-4 w-4 text-gray-500" />
                              {b.user_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="mr-1 h-4 w-4 text-gray-500" />
                              {b.phone_number}
                            </div>
                          </TableCell>
                          <TableCell>{b.hn}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Hash className="mr-1 h-4 w-4 text-gray-500" />
                              {b.booking_reference_number}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700 px-3"
                                onClick={() => {
                                  setSelectedBookingId(b.id)
                                  setSelectedStatus("confirmed")
                                  setOpenConfirmModal(true)
                                }}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                ยืนยัน
                              </Button>
                              <Button
                                size="sm"
                                className="bg-yellow-400 text-black hover:bg-yellow-500 px-3"
                                onClick={() => {
                                  setSelectedBookingId(b.id)
                                  setSelectedStatus("pending")
                                  setOpenConfirmModal(true)
                                }}
                              >
                                <AlertCircle className="mr-1 h-4 w-4" />
                                รอดำเนินการ
                              </Button>
                              <Button
                                size="sm"
                                className="bg-amber-600 text-white hover:bg-amber-700 px-3"
                                onClick={() => {
                                  setSelectedBookingId(b.id)
                                  setSelectedBookingRef(b.booking_reference_number)
                                  setOpenCancelModal(true)
                                }}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                ยกเลิกนัด
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 text-white hover:bg-red-700 px-3"
                                onClick={() => {
                                  setSelectedBookingId(b.id)
                                  setOpenDeleteModal(true)
                                }}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                ลบนัด
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal ยืนยันการลบนัดหมาย */}
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลบนัดหมาย</DialogTitle>
              <DialogDescription>
                คุณแน่ใจว่าต้องการลบรายการนัดหมายนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenDeleteModal(false)} variant="outline">
                ยกเลิกการทำรายการ
              </Button>
              <Button onClick={deleteConfirmed} className="bg-red-600 text-white hover:bg-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                ยืนยันการลบนัดหมาย
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal ยืนยันการยกเลิกนัดหมาย */}
        <Dialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการยกเลิกนัดหมาย</DialogTitle>
              <DialogDescription>
                คุณต้องการยกเลิกนัดหมายนี้ใช่หรือไม่? นัดหมายจะยังคงอยู่ในระบบแต่จะถูกทำเครื่องหมายว่ายกเลิกโดยแอดมิน
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenCancelModal(false)} variant="outline">
                ยกเลิกการทำรายการ
              </Button>
              <Button onClick={cancelBooking} className="bg-amber-600 text-white hover:bg-amber-700">
                <XCircle className="mr-2 h-4 w-4" />
                ยืนยันการยกเลิกนัดหมาย
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal ยืนยันการเปลี่ยนสถานะ */}
        <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
              <DialogDescription>
                คุณต้องการเปลี่ยนสถานะการนัดหมายเป็น "{STATUS_LABELS[selectedStatus || ""]}" ใช่หรือไม่?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenConfirmModal(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button onClick={confirmStatusChange} className="bg-blue-600 text-white hover:bg-blue-700">
                ยืนยันการเปลี่ยนสถานะ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}