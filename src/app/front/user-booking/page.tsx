"use client"
import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { Calendar, FileText, ArrowLeft, Clock, Check, User, CreditCard, Loader2 } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, parseISO, isSameDay } from "date-fns"
import { th } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Select from "react-select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

  // User data states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Existing booking states
  const [departments, setDepartments] = useState<Department[]>([])
  const [dates, setDates] = useState<DateSlot[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(1)

  // 🔥 Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      setProfileError(null)

      const res = await fetch("/api/me", {
        cache: "no-store",
        credentials: 'include'
      })

      if (res.status === 401) {
        router.replace("/")
        return
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('🔍 User Profile API Response:', data)

      if (data.ok && data.profile) {
        setUserProfile(data.profile)
      } else {
        throw new Error(data.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
      }

    } catch (err: any) {
      console.error('❌ Error fetching user profile:', err)
      setProfileError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    // Fetch user profile
    fetchUserProfile()

    // Fetch departments
    async function fetchDepartments() {
      try {
        const response = await fetch("/api/bookings")
        const data = await response.json()
        if (Array.isArray(data)) setDepartments(data)
        else setDepartments([])
      } catch (error) {
        console.error("Error fetching departments:", error)
        setDepartments([])
      }
    }
    fetchDepartments()
  }, [])

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "เลือกวันที่นัดหมาย"
    return format(date, "dd MMMM yyyy", { locale: th })
  }

  const fetchDates = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/bookings?departmentId=${departmentId}`)
      const data = await response.json()
      setDates(data)
    } catch (error) {
      console.error("Error fetching dates:", error)
      setDates([])
    }
  }

  const fetchSlots = async (departmentId: string, date: Date | undefined) => {
    if (!date) return
    const formattedDate = format(date, "yyyy-MM-dd")
    try {
      const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`)
      const data = await response.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching slots:", error)
      setSlots([])
    }
  }

  const handleDepartmentChange = (selectedOption: { value: string; label: string } | null) => {
    const value = selectedOption ? selectedOption.value : ""
    const name = selectedOption ? selectedOption.label : ""
    setSelectedDepartment(value)
    setSelectedDepartmentName(name)
    setSelectedDate(undefined)
    setSelectedSlot("")
    setSelectedSlotTime("")
    if (value) fetchDates(value)
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot("")
    setSelectedSlotTime("")
    if (selectedDepartment && date) fetchSlots(selectedDepartment, date)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot.id)
    setSelectedSlotTime(`${slot.start_time} - ${slot.end_time}`)
  }

  const handleBookingSubmit = async () => {
    if (!selectedDepartment || !selectedSlot || !selectedDate || !userProfile) {
      alert("กรุณากรอกข้อมูลให้ครบ")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/que", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userProfile.name || "",
          department_id: selectedDepartment,
          slot_id: selectedSlot,
          id_card_number: userProfile.hn || "",
          created_by: userProfile.citizenId || "",
        }),
      })

      const result = await response.json()

      if (result.message === "จองคิวสำเร็จ") {
        alert(result.message)

        // Send LINE notification if user has LINE ID
        if (userProfile.lineUserId && result.bookingReferenceNumber) {
          const departmentName = departments.find((d) => d.id === selectedDepartment)?.name || ""
          const timeSlot = slots.find((s) => s.id === selectedSlot)
          const timeRange = timeSlot ? `${timeSlot.start_time} - ${timeSlot.end_time}` : ""

          try {
            await fetch("/api/line-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userProfile.lineUserId,
                appointmentDetails: {
                  referenceNumber: result.bookingReferenceNumber,
                  department: departmentName,
                  date: format(selectedDate!, "dd MMMM yyyy", { locale: th }),
                  time: timeRange,
                },
              }),
            })
          } catch (err) {
            console.error("Failed to send LINE notification:", err)
          }
        }

        result.bookingReferenceNumber
          ? router.replace(`/appointment/${result.bookingReferenceNumber}`)
          : window.location.reload()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการจองคิว")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableDates = dates.map((date) => parseISO(date.slot_date))

  const isDateDisabled = (date: Date) => {
    const isPastDate = date < new Date()
    const isUnavailable = !availableDates.some((availableDate) => isSameDay(date, availableDate))
    return isPastDate || isUnavailable
  }

  const isDateUnavailable = (date: Date) => {
    return !availableDates.some((availableDate) => isSameDay(date, availableDate))
  }

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }))

  const nextStep = () => {
    if (currentStep === 1 && !selectedDepartment) {
      alert("กรุณาเลือกแผนก")
      return
    }
    if (currentStep === 2 && !selectedDate) {
      alert("กรุณาเลือกวันที่")
      return
    }
    if (currentStep === 3 && !selectedSlot) {
      alert("กรุณาเลือกเวลา")
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => setCurrentStep(currentStep - 1)

  // 🔥 Loading state สำหรับข้อมูลผู้ใช้
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600 text-lg">กำลังโหลดข้อมูลผู้ใช้...</span>
          </div>
        </div>
      </div>
    )
  }

  // 🔥 Error state สำหรับข้อมูลผู้ใช้
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <div className="space-x-2">
            <Button
              onClick={fetchUserProfile}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              ลองอีกครั้ง
            </Button>
            <Button
              onClick={() => router.push("/front/user-dashboard")}
              variant="outline"
            >
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
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
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold">นัดหมายออนไลน์</h1>
                <p className="text-blue-100 text-sm">ระบบนัดหมายล่วงหน้าเพื่อรับบริการ</p>
              </div>
            </div>

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

          <CardContent className="p-6 min-h-[500px]">
            {/* ขั้นตอนที่ 1: เลือกแผนก */}
            {currentStep === 1 && (
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

                <Separator className="my-4" />

                <div className="space-y-3">
                  <Label htmlFor="department" className="flex items-center gap-2 text-base font-medium">
                    เลือกแผนกที่ต้องการนัดหมาย
                  </Label>
                  <div className="relative z-50">
                    <Select
                      options={departmentOptions}
                      onChange={handleDepartmentChange}
                      value={departmentOptions.find((option) => option.value === selectedDepartment) || null}
                      placeholder="เลือกแผนกที่ต้องการนัดหมาย"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#e5e7eb",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          minHeight: "44px",
                          "&:hover": { borderColor: "#93c5fd" },
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999,
                          position: "absolute",
                          width: "100%",
                          boxShadow:
                            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                        }),
                        menuList: (base) => ({ ...base, maxHeight: "200px" }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#dbeafe" : "white",
                          color: state.isSelected ? "white" : "#111827",
                          padding: "10px 12px",
                        }),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ขั้นตอนที่ 2: เลือกวันที่ */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal px-3">
                    {selectedDepartmentName}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">เลือกวันที่นัดหมาย</Label>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={isDateDisabled}
                      locale={th}
                      className="p-3"
                      modifiers={{
                        available: (date: Date) => !isDateUnavailable(date),
                        unavailable: isDateUnavailable,
                      }}
                      modifiersStyles={{
                        available: { backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: "bold" },
                        unavailable: { color: "#d1d5db", pointerEvents: "none" },
                      }}
                    />

                    {selectedDate && (
                      <div className="bg-blue-50 p-3 text-center text-blue-800 font-medium">
                        วันที่เลือก: {formatDate(selectedDate)}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-blue-200 rounded-full"></span>
                    วันที่มีช่วงเวลาให้นัดหมาย
                  </p>
                </div>
              </div>
            )}

            {/* ขั้นตอนที่ 3: เลือกเวลา */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal px-3">
                    {selectedDepartmentName}
                  </Badge>
                  <span className="text-gray-400">•</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal px-3">
                    {formatDate(selectedDate)}
                  </Badge>
                </div>

                <div className="space-y-3">
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
                          className={`h-auto py-3 px-4 border ${
                            selectedSlot === slot.id
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200 text-blue-700"
                              : "border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                          } ${slot.available_seats <= 0 ? "opacity-50" : ""}`}
                        >
                          <div className="flex flex-col items-center w-full text-center">
                            <span className="font-medium">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <span
                              className={`text-xs mt-1 ${
                                slot.available_seats <= 3 ? "text-orange-500" : "text-green-600"
                              }`}
                            >
                              คิวว่าง: {slot.available_seats} คิว
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">ไม่มีช่วงเวลาว่างในวันที่เลือก</p>
                      <Button type="button" variant="link" onClick={prevStep} className="text-blue-600 mt-2">
                        กลับไปเลือกวันที่อื่น
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ขั้นตอนที่ 4: ยืนยันการนัดหมาย */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
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
                        <Calendar className="h-4 w-4 text-blue-600" />
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
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  ย้อนกลับ
                </Button>
              )}

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 shadow-sm ml-auto">
                  ถัดไป
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleBookingSubmit}
                  className="bg-green-600 hover:bg-green-700 shadow-sm ml-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการนัดหมาย"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default Page