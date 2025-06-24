"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Phone,
  User,
  FileText,
  Clock,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AppointmentPage() {
  const router = useRouter()
  const { booking_reference_number } = useParams<{ booking_reference_number: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!booking_reference_number) return
      try {
        const res = await fetch(`/api/appointment/${booking_reference_number}`)
        if (res.ok) {
          const result = await res.json()
          setData(result)
        } else {
          setData(null)
        }
      } catch (error) {
        console.error("Error fetching appointment:", error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [booking_reference_number])

  const handleBack = () => {
    router.push("/front/user-dashboard")
  }

  const handleCancelAppointment = async () => {
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/appointment/${booking_reference_number}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
          cancelledBy: "user",
        }),
      })

      if (res.ok) {
        setShowCancelDialog(false)
        const updatedData = await fetch(`/api/appointment/${booking_reference_number}`).then((r) => r.json())
        setData(updatedData)
      } else {
        alert("ไม่สามารถยกเลิกนัดได้ กรุณาลองใหม่")
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDeleteAppointment = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/appointment/${booking_reference_number}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setShowDeleteDialog(false)
        setTimeout(() => {
          router.push("/front/user-dashboard")
        }, 500)
      } else {
        alert("ไม่สามารถลบใบนัดได้ กรุณาลองใหม่")
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsDeleting(false)
    }
  }

  // สร้างฟังก์ชันสำหรับแสดงสถานะใบนัด
  const getStatusDetails = () => {
    if (data.status === "pending") {
      return {
        icon: AlertCircle,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        badgeClass: "bg-amber-100 text-amber-700 hover:bg-amber-100",
        text: "รอการยืนยัน"
      }
    } else if (data.status === "confirmed") {
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
        text: "ยืนยันแล้ว"
      }
    } else {
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeClass: "bg-red-100 text-red-700 hover:bg-red-100",
        text: data.cancelledBy === "user" ? "ยกเลิกโดยผู้ใช้" : data.cancelledBy === "admin" ? "ยกเลิกโดยแอดมิน" : "ยกเลิก"
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-lg text-blue-600 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75"></div>
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 relative z-10" />
          </div>
          <p className="font-medium">กำลังโหลดข้อมูลนัดหมาย...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-md border border-red-100 max-w-md w-full">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-xl text-red-600 font-medium mb-2">ไม่พบข้อมูลใบนัด</p>
          <p className="text-gray-500 mb-6">ใบนัดอาจถูกยกเลิกหรือไม่มีอยู่ในระบบ</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <ChevronLeft className="h-4 w-4 mr-2" />
            กลับสู่หน้าหลัก
          </Button>
        </div>
      </div>
    )
  }

  const statusDetails = getStatusDetails();
  const StatusIcon = statusDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-xl border-blue-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 pb-6 pt-5 text-white">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack} 
              className="text-white hover:bg-blue-500/30 -ml-2 transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              กลับ
            </Button>
            <Badge className={`${statusDetails.badgeClass} font-medium px-3 py-1`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {statusDetails.text}
            </Badge>
          </div>
          <div className="flex items-center justify-center flex-col mt-3">
            <div className="bg-white/20 p-2 rounded-full mb-3">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              ใบนัดหมาย
            </CardTitle>
          </div>
          
          <div className="flex items-center justify-center mt-4 mb-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg py-1.5 px-3 text-center">
              <p className="text-xs text-white/80 font-medium">เลขใบนัด</p>
              <p className="text-sm font-mono tracking-wide text-white">
                {booking_reference_number}
              </p>
            </div>
          </div>
        </CardHeader>

        <div className={`${statusDetails.bgColor} px-5 py-3 border-y ${statusDetails.borderColor} flex items-center justify-center`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusDetails.color}`} />
            <p className={`${statusDetails.color} font-medium text-sm`}>
              {data.status === "pending" ? "รอการตรวจสอบและยืนยันจากเจ้าหน้าที่" :
               data.status === "confirmed" ? "นัดหมายได้รับการยืนยันเรียบร้อยแล้ว" : 
               "นัดหมายถูกยกเลิกแล้ว"}
            </p>
          </div>
        </div>

        <CardContent className="space-y-5 pt-5">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-blue-50 text-blue-600 flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">ชื่อผู้จอง</p>
                <p className="text-base text-gray-800 font-medium">{data.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-blue-50 text-blue-600 flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">เบอร์โทร</p>
                <p className="text-base text-gray-800">{data.phone_number || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-blue-50 text-blue-600 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">หมายเลข HN</p>
                <p className="text-base text-gray-800 font-mono">{data.hn || "-"}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-blue-50 text-blue-600 flex-shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">วันที่นัด</p>
                <p className="text-base text-gray-800 font-medium">
                  {format(parseISO(data.slot_date), "EEEEที่ d MMMM yyyy", { locale: th })}
                </p>
                <div className="mt-2 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">{data.start_time.slice(0, 5)} - {data.end_time.slice(0, 5)} น.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-blue-50 text-blue-600 flex-shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">แผนก</p>
                <p className="text-base text-gray-800 font-medium">{data.department_name || "-"}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <div className="flex flex-col gap-3">
              {data.status !== "cancelled" && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full py-5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  ยกเลิกนัดหมาย
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full py-5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                ลบใบนัด
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog ยืนยันการยกเลิกนัดหมาย */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-[350px] rounded-xl p-0 overflow-hidden border-amber-100">
          <DialogHeader className="bg-amber-50 p-5 border-b border-amber-100">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-center text-amber-700 text-xl">
              ยืนยันการยกเลิกนัด
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2 text-center">
              คุณต้องการยกเลิกนัดหมายนี้ใช่หรือไม่? ใบนัดจะยังคงอยู่ในระบบแต่จะถูกทำเครื่องหมายว่ายกเลิกโดยผู้ใช้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-5 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="bg-white border-gray-200 flex-1 sm:flex-none sm:min-w-[100px]"
              disabled={isCancelling}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleCancelAppointment}
              disabled={isCancelling}
              className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-none sm:min-w-[150px] transition-all"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  ยืนยันยกเลิกนัด
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ลบใบนัด */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[350px] rounded-xl p-0 overflow-hidden border-red-100">
          <DialogHeader className="bg-red-50 p-5 border-b border-red-100">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-red-700 text-xl">
              ยืนยันการลบใบนัด
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2 text-center">
              คุณต้องการลบใบนัดนี้ออกจากระบบใช่หรือไม่? การลบใบนัดไม่สามารถเรียกคืนได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-5 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white border-gray-200 flex-1 sm:flex-none sm:min-w-[100px]"
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleDeleteAppointment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none sm:min-w-[150px] transition-all"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  ยืนยันลบใบนัด
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}