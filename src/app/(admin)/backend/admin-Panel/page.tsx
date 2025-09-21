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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import Select from "react-select"
import { format, isToday, isThisWeek } from "date-fns"
import { useRouter } from "next/navigation"

import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  HashIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Calendar,
  RefreshCw,
  LayoutGrid,
  Trash2,
  IdCard,
  Edit,
  ChevronDown,
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

interface Slot {
  id: number
  slot_date: string
  start_time: string
  end_time: string
  available_seats: number
  total_seats: number
  department_name: string
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

// NEW: helper ตรวจสถานะซ้ำ
const isSameStatus = (b?: Booking | null, next?: string | null) =>
  !!b && !!next && b.status === next

export default function AdminBookingsPage() {
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
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
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
  const [activeTab, setActiveTab] = useState("bookings")
  

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/admin/departments")
      if (!res.ok) throw new Error("โหลดข้อมูลแผนกไม่สำเร็จ")
      const data = await res.json()
      setDepartments(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [bookingRes, slotRes] = await Promise.all([
        fetch("/api/admin/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
        fetch("/api/admin/slots"),
      ])

      if (!bookingRes.ok || !slotRes.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ")
      }

      const bookingData = await bookingRes.json()
      const slotData = await slotRes.json()

      setBookings(bookingData.bookings || [])
      setSlots(slotData.slots || [])

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
    fetchDepartments()
    fetchData()
  }, [])

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "ทุกแผนก" },
      ...departments.map((dept) => ({ value: dept.name, label: dept.name })),
    ],
    [departments],
  )

  const filteredBookings = bookings.filter((booking) => {
    if (departmentFilter && booking.department_name !== departmentFilter) return false
    if (statusFilter && booking.status !== statusFilter) return false
    if (timeFilter === "today" && !isToday(new Date(booking.slot_date))) return false
    if (timeFilter === "week" && !isThisWeek(new Date(booking.slot_date))) return false

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

  const sortedSlotList = [...slots].sort((a, b) => new Date(a.slot_date).getTime() - new Date(b.slot_date).getTime())
  const router = useRouter()


  const confirmStatusChange = async () => {
    if (!selectedBookingId || !selectedStatus) return

    // NEW: กันอัปเดตซ้ำสถานะเดิม
    if (isSameStatus(selectedBooking, selectedStatus)) {
      toast.info("สถานะนี้ถูกตั้งไว้แล้ว")
      setOpenConfirmModal(false)
      setSelectedBookingId(null)
      setSelectedStatus(null)
      setSelectedBooking(null)
      return
    }

    try {
      setRefreshing(true)
      const res = await fetch("/api/admin/appointment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBookingId, status: selectedStatus }),
      })

      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === selectedBookingId ? { ...b, status: selectedStatus } : b)))
        toast.success(`เปลี่ยนสถานะเป็น "${STATUS_LABELS[selectedStatus || ""]}" สำเร็จ`)
      } else {
        toast.error("อัปเดตสถานะไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ")
    } finally {
      setOpenConfirmModal(false)
      setSelectedBookingId(null)
      setSelectedStatus(null)
      setSelectedBooking(null)
      setRefreshing(false)
    }
  }

  const cancelBooking = async () => {
    if (!selectedBookingRef) return

    try {
      setRefreshing(true)
      const res = await fetch(`/api/appointment/${selectedBookingRef}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancelledBy: "admin",
        }),
      })

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.booking_reference_number === selectedBookingRef
              ? { ...b, status: "cancelled", cancelled_by: "admin" }
              : b,
          ),
        )
        toast.success("ยกเลิกนัดหมายสำเร็จ")
      } else {
        toast.error("ยกเลิกนัดหมายไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการยกเลิกนัดหมาย")
    } finally {
      setOpenCancelModal(false)
      setSelectedBookingRef(null)
      setSelectedBookingId(null)
      setSelectedBooking(null)
      setRefreshing(false)
    }
  }

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return

    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/appointment?bookingId=${selectedBookingId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId))
        toast.success("ลบรายการนัดหมายสำเร็จ")
      } else {
        toast.error("ลบรายการไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err)
      toast.error("เกิดข้อผิดพลาดในการลบรายการ")
    } finally {
      setOpenDeleteModal(false)
      setSelectedBookingId(null)
      setSelectedBooking(null)
      setRefreshing(false)
    }
  }

  const stats = useMemo(() => {
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length
    const pendingBookings = bookings.filter((b) => b.status === "pending").length
    const todayBookings = bookings.filter((b) => isToday(new Date(b.slot_date))).length
    const totalSlots = slots.reduce((acc, slot) => acc + slot.available_seats, 0)

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      todayBookings,
      totalSlots,
    }
  }, [bookings, slots])

  const getStatusLabel = (booking: Booking) => {
    if (booking.status === "cancelled" && booking.cancelled_by) {
      return booking.cancelled_by === "admin" ? "ยกเลิกโดยแอดมิน" : "ยกเลิกโดยผู้ใช้"
    }
    return STATUS_LABELS[booking.status] || "ไม่ทราบสถานะ"
  }

  // NEW: ใช้ในโมดอลยืนยัน เพื่อปิดปุ่มถ้าสถานะซ้ำ
  const sameStatus = isSameStatus(selectedBooking, selectedStatus)

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
            <RefreshCw className="mr-2 h-4 w-4" /> ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการตารางนัดหมาย</h1>
            <p className="text-gray-500 mt-1">จัดการการนัดหมายและตารางเวลาสำหรับทุกแผนก</p>
          </div>
          <Button onClick={fetchData} disabled={refreshing} className="mt-4 sm:mt-0">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* แถวที่ 1 */}
          <Card className="bg-white shadow rounded-xl w-full">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">นัดหมายทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <LayoutGrid className="h-6 w-6 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl w-full">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">นัดหมายวันนี้</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayBookings}</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          {/* แถวที่ 2 */}
          <Card
            className="bg-white shadow rounded-xl w-full hover:shadow-md cursor-pointer transition-all duration-200"
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">ยืนยันแล้ว</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl w-full">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bookings" className="text-base py-3">
              <UserIcon className="mr-2 h-4 w-4" /> รายการนัดหมาย
            </TabsTrigger>
            <TabsTrigger value="slots" className="text-base py-3">
              <CalendarIcon className="mr-2 h-4 w-4" /> ตารางเวลา
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">รายการนัดหมาย</CardTitle>
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

                          // NEW: ปุ่มยืนยันปิดถ้าสถานะเป็น confirmed แล้ว
                          const confirmDisabled = isSameStatus(b, "confirmed")

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
                                  <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {format(new Date(b.slot_date), "dd/MM/yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <ClockIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {`${b.start_time} - ${b.end_time}`}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <UserIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.user_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <PhoneIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.phone_number}
                                </div>
                              </TableCell>
                              <TableCell>{b.hn}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <HashIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.booking_reference_number}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 justify-end">
                                  {/* ปุ่มยืนยัน */}
                                  <Button
                                    size="sm"
                                    disabled={confirmDisabled}
                                    className={
                                      confirmDisabled
                                        ? "px-4 bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                                        : "px-4 bg-green-600 text-white hover:bg-green-700"
                                    }
                                    onClick={() => {
                                      if (confirmDisabled) return
                                      setSelectedBookingId(b.id)
                                      setSelectedBooking(b)
                                      setSelectedStatus("confirmed")
                                      setOpenConfirmModal(true)
                                    }}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    {confirmDisabled ? "ยืนยันแล้ว" : "ยืนยัน"}
                                  </Button>

                                  {/* ปุ่มแก้ไข - Dropdown Menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        type="button"
                                        className="px-4 text-black bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black"
                                      >
                                        <Edit className="mr-1 h-4 w-4" />
                                        จัดการ
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                      align="end"
                                      className="w-56 p-1 rounded-xl border shadow-xl backdrop-blur-md
               bg-gradient-to-b from-white via-sky-50 to-emerald-50
               dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800
               border-slate-200/60 dark:border-slate-700"
                                    >
                                      {/* รอดำเนินการ */}
                                      <DropdownMenuItem
                                        disabled={isSameStatus(b, "pending")}
                                        onSelect={() => {
                                          if (isSameStatus(b, "pending")) return
                                          setSelectedBookingId(b.id)
                                          setSelectedBooking(b)
                                          setSelectedStatus("pending")
                                          setOpenCancelModal(false)
                                          setOpenDeleteModal(false)
                                          requestAnimationFrame(() => setOpenConfirmModal(true))
                                        }}
                                        className="rounded-md cursor-pointer hover:bg-yellow-50 focus:bg-yellow-50"
                                      >
                                        <AlertCircle className="mr-2 h-4 w-4 text-yellow-600" />
                                        <span className="text-yellow-700 font-medium">
                                          รอดำเนินการ{isSameStatus(b, "pending") ? " (สถานะปัจจุบัน)" : ""}
                                        </span>
                                      </DropdownMenuItem>

                                      {/* ยกเลิกนัด */}
                                      <DropdownMenuItem
                                        disabled={isSameStatus(b, "cancelled")}
                                        onSelect={() => {
                                          if (isSameStatus(b, "cancelled")) return
                                          setSelectedBookingId(b.id)
                                          setSelectedBooking(b)
                                          setSelectedBookingRef(b.booking_reference_number)
                                          setOpenConfirmModal(false)
                                          setOpenDeleteModal(false)
                                          requestAnimationFrame(() => setOpenCancelModal(true))
                                        }}
                                        className="rounded-md cursor-pointer hover:bg-orange-50 focus:bg-orange-50"
                                      >
                                        <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                                        <span className="text-orange-700 font-medium">
                                          ยกเลิกนัด{isSameStatus(b, "cancelled") ? " (สถานะปัจจุบัน)" : ""}
                                        </span>
                                      </DropdownMenuItem>

                                      {/* ลบนัด */}
                                      <DropdownMenuItem
                                        onSelect={() => {
                                          setSelectedBookingId(b.id)
                                          setSelectedBooking(b)
                                          setOpenConfirmModal(false)
                                          setOpenCancelModal(false)
                                          requestAnimationFrame(() => setOpenDeleteModal(true))
                                        }}
                                        className="rounded-md cursor-pointer hover:bg-red-50 focus:bg-red-50"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                        <span className="text-red-700 font-medium">ลบนัด</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
          </TabsContent>

          <TabsContent value="slots">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">ตารางเวลาที่เปิดให้จอง</CardTitle>
                <CardDescription>รายการช่วงเวลาที่เปิดให้จองและจำนวนที่นั่งทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedSlotList.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">ไม่มีตารางเวลา</p>
                    <p className="text-sm text-gray-400 mt-1">ยังไม่มีการกำหนดตารางเวลาสำหรับการนัดหมาย</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>แผนก</TableHead>
                          <TableHead>วันที่</TableHead>
                          <TableHead>เวลา</TableHead>
                          <TableHead>จำนวนที่นั่งว่าง</TableHead>
                          <TableHead>จำนวนที่นั่งทั้งหมด</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSlotList.map((slot) => {
                          const isAvailable = slot.available_seats > 0
                          const slotDate = new Date(slot.slot_date)
                          const isPast = slotDate < new Date()
                          const bookedSeats = slot.total_seats - slot.available_seats

                          let statusBadge
                          if (isPast) {
                            statusBadge = <Badge className="bg-gray-100 text-gray-800">ผ่านไปแล้ว</Badge>
                          } else if (!isAvailable) {
                            statusBadge = <Badge className="bg-red-100 text-red-800">เต็ม</Badge>
                          } else if (isToday(slotDate)) {
                            statusBadge = <Badge className="bg-blue-100 text-blue-800">วันนี้</Badge>
                          } else {
                            statusBadge = <Badge className="bg-green-100 text-green-800">เปิดจอง</Badge>
                          }

                          return (
                            <TableRow key={slot.id} className={isPast ? "opacity-60" : ""}>
                              <TableCell className="font-medium">{slot.department_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {format(slotDate, "dd/MM/yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <ClockIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {`${slot.start_time} - ${slot.end_time}`}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={
                                    slot.available_seats > 5
                                      ? "text-green-600 font-medium"
                                      : slot.available_seats > 0
                                        ? "text-yellow-600 font-medium"
                                        : "text-red-600 font-medium"
                                  }
                                >
                                  {slot.available_seats}
                                </span>{" "}
                                ที่นั่ง
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col text-sm">
                                  <span className="font-bold text-lg text-blue-600">
                                    {slot.total_seats} ที่นั่ง
                                  </span>
                                  <span className="text-gray-500">
                                    (จองแล้ว{" "}
                                    <span
                                      className={`font-medium ${
                                        bookedSeats === 0
                                          ? "text-green-600"
                                          : bookedSeats >= slot.total_seats * 0.8
                                          ? "text-red-600"
                                          : bookedSeats >= slot.total_seats * 0.5
                                          ? "text-orange-600"
                                          : "text-yellow-600"
                                      }`}
                                    >
                                      {bookedSeats}
                                    </span>{" "}
                                    ที่นั่ง)
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{statusBadge}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal ยืนยันการลบนัดหมาย */}
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
                <Trash2 className="mr-2 h-5 w-5" />
                ยืนยันการลบนัดหมาย
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                คุณแน่ใจว่าต้องการลบรายการนัดหมายนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="bg-gray-50 rounded-lg p-4 my-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">ข้อมูลการนัดหมาย</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">ชื่อ:</span>
                    <span className="ml-2">{selectedBooking.user_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เบอร์โทร:</span>
                    <span className="ml-2">{selectedBooking.phone_number}</span>
                  </div>
                  <div className="flex items-center">
                    <IdCard className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">HN:</span>
                    <span className="ml-2">{selectedBooking.hn}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">วันที่:</span>
                    <span className="ml-2">{format(new Date(selectedBooking.slot_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เวลา:</span>
                    <span className="ml-2">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                  <div className="flex items-center">
                    <HashIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">รหัสอ้างอิง:</span>
                    <span className="ml-2">{selectedBooking.booking_reference_number}</span>
                  </div>
                </div>
              </div>
            )}

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

        {/* Modal ยืนยันการยกเลิกนัดหมาย (ไม่ลบออกจากระบบ) */}
        <Dialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-600 flex items-center">
                <XCircle className="mr-2 h-5 w-5" />
                ยืนยันการยกเลิกนัดหมาย
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                คุณต้องการยกเลิกนัดหมายนี้ใช่หรือไม่? นัดหมายจะยังคงอยู่ในระบบแต่จะถูกทำเครื่องหมายว่ายกเลิกโดยแอดมิน
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="bg-gray-50 rounded-lg p-4 my-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">ข้อมูลการนัดหมาย</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">ชื่อ:</span>
                    <span className="ml-2">{selectedBooking.user_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เบอร์โทร:</span>
                    <span className="ml-2">{selectedBooking.phone_number}</span>
                  </div>
                  <div className="flex items-center">
                    <IdCard className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">HN:</span>
                    <span className="ml-2">{selectedBooking.hn}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">วันที่:</span>
                    <span className="ml-2">{format(new Date(selectedBooking.slot_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เวลา:</span>
                    <span className="ml-2">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                  <div className="flex items-center">
                    <HashIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">รหัสอ้างอิง:</span>
                    <span className="ml-2">{selectedBooking.booking_reference_number}</span>
                  </div>
                </div>
              </div>
            )}

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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-600 flex items-center">
                {selectedStatus === "confirmed" ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <AlertCircle className="mr-2 h-5 w-5" />
                )}
                ยืนยันการเปลี่ยนสถานะ
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                คุณต้องการเปลี่ยนสถานะการนัดหมายเป็น "{STATUS_LABELS[selectedStatus || ""]}" ใช่หรือไม่?
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="bg-gray-50 rounded-lg p-4 my-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">ข้อมูลการนัดหมาย</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">ชื่อ:</span>
                    <span className="ml-2">{selectedBooking.user_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เบอร์โทร:</span>
                    <span className="ml-2">{selectedBooking.phone_number}</span>
                  </div>
                  <div className="flex items-center">
                    <IdCard className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">HN:</span>
                    <span className="ml-2">{selectedBooking.hn}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">วันที่:</span>
                    <span className="ml-2">{format(new Date(selectedBooking.slot_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium">เวลา:</span>
                    <span className="ml-2">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className={STATUS_COLORS[selectedBooking.status]}>
                      สถานะปัจจุบัน: {getStatusLabel(selectedBooking)}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge className={STATUS_COLORS[selectedStatus || ""]}>
                      สถานะใหม่: {STATUS_LABELS[selectedStatus || ""]}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setOpenConfirmModal(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button
                onClick={confirmStatusChange}
                disabled={sameStatus || refreshing}
                className={
                  sameStatus
                    ? "bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }
              >
                ยืนยันการเปลี่ยนสถานะ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
