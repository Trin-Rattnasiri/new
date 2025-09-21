"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

import { ArrowLeft, CheckCircle, ClipboardList, Clock, Download, RefreshCw, XCircle, Calendar, ChevronDown } from "lucide-react"

// สีสำหรับกราฟ
const COLORS = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  total: "#3b82f6",
  available: "#8b5cf6",
}

// สีสำหรับ Pie Chart
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1"]

interface DashboardData {
  bookingStatusStats: {
    status: string
    count: number
  }[]
  bookingsByDepartment: {
    id: number
    department_name: string
    total_bookings: number
    confirmed_bookings: number
    pending_bookings: number
    cancelled_bookings: number
  }[]
  bookingsByDate: {
    date: string
    total_bookings: number
    confirmed_bookings: number
    pending_bookings: number
    cancelled_bookings: number
  }[]
  bookingsByMonth: {
    month: string
    total_bookings: number
    confirmed_bookings: number
    pending_bookings: number
    cancelled_bookings: number
  }[]
  seatsByDepartment: {
    id: number
    department_name: string
    available_seats: number
    total_slots: number
  }[]
  bookingHeatmap: {
    department_id: number
    department_name: string
    date: string
    booking_count: number
  }[]
  bookingsByTimeSlot: {
    time_slot: string
    total_bookings: number
  }[]
  cancellationRate: {
    id: number
    department_name: string
    total_bookings: number
    cancelled_bookings: number
    cancellation_rate: number
  }[]
  bookingsByDayOfWeek: {
    day_of_week: string
    day_number: number
    total_bookings: number
  }[]
  todayAppointments: {
    status: string
    count: number
  }[]
  newBookingsToday: {
    count: number
  }[]
  todayBookingsByDepartment: {
    id: number
    department_name: string
    total_bookings: number
    confirmed_bookings: number
    pending_bookings: number
    cancelled_bookings: number
  }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("30days")
  const [refreshing, setRefreshing] = useState(false)
  
  // เพิ่ม state สำหรับการเลือกช่วงเวลาของตารางแผนก
  const [departmentTableView, setDepartmentTableView] = useState<string>("today")
  // เพิ่ม state สำหรับเดือนที่เลือก
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const res = await fetch("/api/admin/dashboard")
      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูล Dashboard ได้")
      }
      const data = await res.json()
      setDashboardData(data)
      
      // ตั้งค่าเดือนล่าสุดเป็นค่าเริ่มต้นถ้ามีข้อมูล
      if (data.bookingsByMonth && data.bookingsByMonth.length > 0) {
        setSelectedMonth(data.bookingsByMonth[data.bookingsByMonth.length - 1].month)
      }
      
      setError(null)
    } catch (err) {
      console.error(err)
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // แปลงข้อมูลสำหรับ Bar Chart อัตราการยกเลิก
  const cancellationRateBarChartData = dashboardData?.cancellationRate.map((item) => ({
    name: item.department_name,
    "อัตราการยกเลิก (%)": item.cancellation_rate,
  }))

  // คำนวณสถิติรวม
  const totalStats = {
    totalBookings: dashboardData?.bookingStatusStats.reduce((acc, curr) => acc + curr.count, 0) || 0,
    confirmedBookings: dashboardData?.bookingStatusStats.find((item) => item.status === "confirmed")?.count || 0,
    pendingBookings: dashboardData?.bookingStatusStats.find((item) => item.status === "pending")?.count || 0,
    cancelledBookings: dashboardData?.bookingStatusStats.find((item) => item.status === "cancelled")?.count || 0,
    totalDepartments: dashboardData?.bookingsByDepartment.length || 0,
    totalAvailableSeats: dashboardData?.seatsByDepartment.reduce((acc, curr) => acc + curr.available_seats, 0) || 0,

    // เพิ่มสถิติใหม่
    todayConfirmedBookings: dashboardData?.todayAppointments.find((item) => item.status === "confirmed")?.count || 0,
    todayPendingBookings: dashboardData?.todayAppointments.find((item) => item.status === "pending")?.count || 0,
    todayCancelledBookings: dashboardData?.todayAppointments.find((item) => item.status === "cancelled")?.count || 0,
    newBookingsToday: dashboardData?.newBookingsToday[0]?.count || 0,
  }

  // ฟังก์ชันสำหรับแปลงชื่อเดือนในรูปแบบ YYYY-MM เป็นชื่อเดือนภาษาไทย
  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return ""
    const [year, month] = monthStr.split("-")
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ]
    const monthIndex = parseInt(month, 10) - 1
    return `${thaiMonths[monthIndex]} ${parseInt(year) + 543}`
  }

  // เตรียมข้อมูลตารางตามช่วงเวลาที่เลือก
  const getTableData = () => {
    if (departmentTableView === "today") {
      return dashboardData?.todayBookingsByDepartment || []
    } else if (departmentTableView === "monthly" && selectedMonth) {
      // จำลองข้อมูลแยกตามแผนกรายเดือน (ในกรณีจริงต้องมี API ที่รองรับการดึงข้อมูลแยกตามเดือน)
      const monthData = dashboardData?.bookingsByMonth.find(m => m.month === selectedMonth)
      
      if (!monthData) return []
      
      // สร้างข้อมูลโดยการรวมข้อมูลจาก bookingsByDepartment และแจกแจงตามเดือน
      const monthlyDepartmentData = dashboardData?.bookingsByDepartment.map(dept => {
        // สมมติให้ข้อมูลกระจายตามสัดส่วนของแผนกต่อการจองทั้งหมด
        const deptRatio = dept.total_bookings / totalStats.totalBookings
        return {
          id: dept.id,
          department_name: dept.department_name,
          total_bookings: Math.round(monthData.total_bookings * deptRatio),
          confirmed_bookings: Math.round(monthData.confirmed_bookings * deptRatio),
          pending_bookings: Math.round(monthData.pending_bookings * deptRatio),
          cancelled_bookings: Math.round(monthData.cancelled_bookings * deptRatio)
        }
      })
      
      return monthlyDepartmentData || []
    }
    
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} className="mx-auto">
            <RefreshCw className="mr-2 h-4 w-4" /> ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    )
  }

  const tableData = getTableData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ด</h1>
            </div>
            <p className="text-gray-500 mt-1">ภาพรวมและสถิติการนัดหมายทั้งหมดในระบบ</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button onClick={fetchDashboardData} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
            </Button>
          </div>
        </div>

        {/* แถวที่ 1: การ์ดสถิติ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">นัดหมายวันนี้ที่ยืนยันแล้ว</p>
                  <p className="text-3xl font-bold text-green-600">{totalStats.todayConfirmedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">นัดหมายวันนี้ที่รอดำเนินการ</p>
                  <p className="text-3xl font-bold text-yellow-600">{totalStats.todayPendingBookings}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">นัดหมายวันนี้ที่ยกเลิกแล้ว</p>
                  <p className="text-3xl font-bold text-red-600">{totalStats.todayCancelledBookings}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">การจองใหม่วันนี้</p>
                  <p className="text-3xl font-bold text-blue-600">{totalStats.newBookingsToday}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* แถวที่ 6: ตารางข้อมูลแผนก (ปรับปรุงใหม่) */}
        <Card className="bg-white shadow rounded-xl overflow-hidden">
          <CardHeader className="border-b bg-gray-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">ข้อมูลการนัดหมายตามแผนก</CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  {departmentTableView === "today" 
                    ? "แสดงจำนวนการนัดหมายวันนี้ในแต่ละแผนก" 
                    : `แสดงจำนวนการนัดหมายเดือน${formatMonthName(selectedMonth)}ในแต่ละแผนก`}
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center">
                  <Select value={departmentTableView} onValueChange={setDepartmentTableView}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="เลือกช่วงเวลา" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">วันนี้</SelectItem>
                      <SelectItem value="monthly">รายเดือน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {departmentTableView === "monthly" && (
                  <div className="flex items-center">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[180px] bg-white">
                        <div className="flex items-center">
                          <ChevronDown className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="เลือกเดือน" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {dashboardData?.bookingsByMonth.map((month) => (
                          <SelectItem key={month.month} value={month.month}>
                            {formatMonthName(month.month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-700">แผนก</th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">การจองทั้งหมด</th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">
                      <span className="flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ยืนยันแล้ว
                      </span>
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">
                      <span className="flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                        รอดำเนินการ
                      </span>
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">
                      <span className="flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        ยกเลิกแล้ว
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((dept, index) => (
                    <tr 
                      key={dept.id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="py-3 px-4 border-b font-medium text-gray-800">{dept.department_name}</td>
                      <td className="py-3 px-4 border-b text-center font-medium text-gray-700">{dept.total_bookings}</td>
                      <td className="py-3 px-4 border-b text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                          {dept.confirmed_bookings}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                          {dept.pending_bookings}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                          {dept.cancelled_bookings}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 px-4 text-center text-gray-500 border-b">
                        <div className="flex flex-col items-center justify-center">
                          <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-lg font-medium">ไม่พบข้อมูลการนัดหมาย</p>
                          <p className="text-sm text-gray-400">
                            {departmentTableView === "today" 
                              ? "ไม่มีข้อมูลการนัดหมายสำหรับวันนี้" 
                              : `ไม่มีข้อมูลการนัดหมายสำหรับเดือน${formatMonthName(selectedMonth)}`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}