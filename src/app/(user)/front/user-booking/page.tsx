"use client"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, FileText, ArrowLeft, Clock, Check, User, CreditCard, Loader2 } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, parseISO, isSameDay } from "date-fns"
import { th } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Select from "react-select"
import { Separator } from "@/components/ui/separator"
import { Toaster, toast } from "sonner"

interface Department {
  id: string
  name: string
}

interface DateSlot {
  slot_date: string
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  available_seats: number
}

interface UserProfile {
  role: string
  kind: string
  name: string | null
  prefix: string | null
  hn: string | null
  citizenId: string | null
  phone: string | null
  lineUserId: string | null
}

const Page = () => {
  const router = useRouter()
  const backTo = "/front/user-dashboard"

  // User profile states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Booking states
  const [departments, setDepartments] = useState<Department[]>([])
  const [dates, setDates] = useState<DateSlot[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(1) // step for navigation

  // Auto-calculate progress step (for display only, not auto-navigation)
  const autoStep = !selectedDepartment
    ? 1
    : !selectedDate
    ? 2
    : !selectedSlot
    ? 3
    : currentStep === 4
    ? 4
    : 3 // step 3 until user clicks "ถัดไป"

  useEffect(() => {
    setCurrentStep(autoStep)
  }, [selectedDepartment, selectedDate, selectedSlot])

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      setProfileError(null)

      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (res.status === 401) {
        router.replace("/")
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

      const data = await res.json()
      if (data.ok && data.profile) setUserProfile(data.profile)
      else throw new Error(data.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้")
    } catch (err: any) {
      console.error("❌ Error fetching user profile:", err)
      setProfileError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()

    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/bookings", { cache: "no-store", headers: { Accept: "application/json" } })
        const data = await res.json()
        if (Array.isArray(data)) setDepartments(data)
        else setDepartments([])
      } catch (err) {
        console.error(err)
        setDepartments([])
        toast.error("ไม่สามารถโหลดข้อมูลแผนกได้")
      }
    }
    fetchDepartments()
  }, [])

  const formatDate = (date?: Date) => (date ? format(date, "dd MMMM yyyy", { locale: th }) : "เลือกวันที่นัดหมาย")

  const fetchDates = async (departmentId: string) => {
    try {
      const res = await fetch(`/api/bookings?departmentId=${encodeURIComponent(departmentId)}`, { cache: "no-store" })
      const data = await res.json()
      setDates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setDates([])
      toast.error("ไม่สามารถโหลดข้อมูลวันที่ได้")
    }
  }

  const fetchSlots = async (departmentId: string, date?: Date) => {
    if (!date) return
    try {
      const formatted = format(date, "yyyy-MM-dd")
      const res = await fetch(
        `/api/bookings/slots?departmentId=${encodeURIComponent(departmentId)}&date=${encodeURIComponent(formatted)}`,
        { cache: "no-store" }
      )
      const data = await res.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setSlots([])
      toast.error("ไม่สามารถโหลดข้อมูลช่วงเวลาได้")
    }
  }

  const handleDepartmentChange = (option: { value: string; label: string } | null) => {
    const val = option?.value || ""
    const name = option?.label || ""
    setSelectedDepartment(val)
    setSelectedDepartmentName(name)
    setSelectedDate(undefined)
    setSelectedSlot("")
    setSelectedSlotTime("")
    if (val) fetchDates(val)
  }

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date)
    setSelectedSlot("")
    setSelectedSlotTime("")
    if (selectedDepartment && date) fetchSlots(selectedDepartment, date)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot.id)
    setSelectedSlotTime(`${slot.start_time} - ${slot.end_time}`)
    // ❌ ไม่เปลี่ยน Step อัตโนมัติ
  }

  const handleBookingSubmit = async () => {
    if (!selectedDepartment || !selectedDate || !selectedSlot || !userProfile) {
      toast.error("กรุณากรอกข้อมูลให้ครบ")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/que", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userProfile.name || "",
          department_id: selectedDepartment,
          slot_id: selectedSlot,
          id_card_number: userProfile.hn || "",
          created_by: userProfile.citizenId || "",
          phone_number: userProfile.phone || null,
        }),
      })
      const result = await res.json()
      if (result.message === "จองคิวสำเร็จ") {
        toast.success(
          `จองคิวสำเร็จ แผนก ${selectedDepartmentName} วันที่ ${formatDate(selectedDate)} เวลา ${selectedSlotTime}`
        )
        setTimeout(() => {
          if (result?.bookingReferenceNumber) {
            router.replace(`/front/${encodeURIComponent(result.bookingReferenceNumber)}`)
          } else {
            router.refresh?.() ?? window.location.reload()
          }
        }, 2000)
      } else toast.error(result.message || "ไม่สามารถจองคิวได้")
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการจองคิว โปรดลองอีกครั้ง")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableDates = dates.map((d) => parseISO(d.slot_date))
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d < today || !availableDates.some((ad) => isSameDay(d, ad))
  }

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }))

  // Loading/Error states
  if (isLoadingProfile)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="bg-white p-8 rounded-2xl shadow-md flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600 text-lg">กำลังโหลดข้อมูลผู้ใช้...</span>
        </div>
      </div>
    )

  if (profileError)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <div className="space-x-2">
            <Button onClick={fetchUserProfile} className="bg-blue-600 text-white hover:bg-blue-700">
              ลองอีกครั้ง
            </Button>
            <Button onClick={() => router.push("/front/user-dashboard")} variant="outline">
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-md mx-auto">
        <Button
          type="button"
          onClick={() => router.push(backTo)}
          variant="outline"
          className="mb-4 flex items-center gap-2 text-blue-600 border-blue-200 shadow-sm hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปหน้าหลัก
        </Button>

        <Card className="border-0 shadow-md overflow-visible">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <div>
              <h1 className="text-2xl font-bold">นัดหมายออนไลน์</h1>
              <p className="text-blue-100 text-sm">ระบบนัดหมายล่วงหน้าเพื่อรับบริการ</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between items-center mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === step
                        ? "bg-white text-blue-600 font-bold"
                        : currentStep > step
                        ? "bg-green-400 text-white"
                        : "bg-white bg-opacity-40 text-white"
                    }`}
                  >
                    {currentStep > step ? <Check className="h-5 w-5" /> : step}
                  </div>
                  <span className="text-xs mt-1 text-blue-100">
                    {step === 1 ? "แผนก" : step === 2 ? "วันที่" : step === 3 ? "เวลา" : "ยืนยัน"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-6 min-h-[500px] space-y-8">
            {/* Step 1-3 */}
            {currentStep < 4 && (
              <>
                {/* Patient Info */}
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">ข้อมูลผู้ป่วย</h3>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-gray-500">ชื่อผู้ป่วย:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {userProfile?.prefix ? `${userProfile.prefix} ` : ""}
                          {userProfile?.name || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">เลข HN:</span>
                        <span className="ml-1 font-medium text-gray-900">{userProfile?.hn || "-"}</span>
                      </div>
                      {userProfile?.phone && (
                        <div>
                          <span className="text-gray-500">เบอร์โทร:</span>
                          <span className="ml-1 font-medium text-gray-900">{userProfile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Department */}
                <div className="space-y-3 animate-fadeIn">
                  <Label htmlFor="department" className="flex items-center gap-2 text-base font-medium">
                    เลือกแผนกที่ต้องการนัดหมาย
                  </Label>
                  <Select
                    options={departmentOptions}
                    onChange={handleDepartmentChange}
                    value={departmentOptions.find((option) => option.value === selectedDepartment) || null}
                    placeholder="เลือกแผนกที่ต้องการนัดหมาย"
                  />
                </div>

                {/* Date */}
                <div className="space-y-3 animate-fadeIn">
                  <Label className="flex items-center gap-2 text-base font-medium">เลือกวันที่นัดหมาย</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={isDateDisabled}
                    locale={th}
                    className="p-3 border rounded-lg"
                  />
                  {selectedDate && <p className="text-center text-blue-600 font-medium">วันที่เลือก: {formatDate(selectedDate)}</p>}
                </div>

                {/* Time */}
                <div className="space-y-3 animate-fadeIn">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Clock className="h-4 w-4" /> เลือกเวลานัดหมาย
                  </Label>
                  {slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.id}
                          type="button"
                          variant="outline"
                          onClick={() => handleSlotSelect(slot)}
                          disabled={slot.available_seats <= 0}
                          className={`h-auto py-3 px-4 ${
                            selectedSlot === slot.id
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200 text-blue-700"
                              : "border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                          } ${slot.available_seats <= 0 ? "opacity-50" : ""}`}
                        >
                          <div className="flex flex-col items-center w-full text-center">
                            <span className="font-medium">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <span className={`text-xs mt-1 ${slot.available_seats <= 3 ? "text-orange-500" : "text-green-600"}`}>
                              คิวว่าง: {slot.available_seats} คิว
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">ไม่มีช่วงเวลาว่าง</p>
                  )}
                </div>

                {/* Next Step */}
                {currentStep === 3 && (
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!selectedDepartment || !selectedDate || !selectedSlot}
                    >
                      ถัดไป
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Step 4: Summary / Confirm */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Summary Info */}
                <div className="rounded-lg border border-blue-100 overflow-hidden">
                  <div className="bg-blue-50 p-4">
                    <h3 className="font-semibold text-blue-900 mb-1">ข้อมูลการนัดหมาย</h3>
                    <p className="text-sm text-blue-700">โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน</p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">ชื่อผู้ป่วย</p>
                        <p className="font-medium">
                          {userProfile?.prefix ? `${userProfile.prefix} ` : ""}
                          {userProfile?.name || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">เลข HN</p>
                        <p className="font-medium">{userProfile?.hn || "-"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">แผนก</p>
                        <p className="font-medium">{selectedDepartmentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">วันที่นัด</p>
                        <p className="font-medium">{formatDate(selectedDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">เวลานัด</p>
                        <p className="font-medium">{selectedSlotTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-sm text-yellow-800">
                  <p className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                    กรุณามาก่อนเวลานัด 30 นาที เพื่อเตรียมเอกสาร
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button type="button" onClick={() => setCurrentStep(3)} variant="outline">
                    ย้อนกลับ
                  </Button>
                  <Button type="button" onClick={handleBookingSubmit} className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังดำเนินการ...
                      </span>
                    ) : (
                      "ยืนยันการนัดหมาย"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Page
