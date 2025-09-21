"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Clock, Building2, User, Phone, CreditCard } from "lucide-react"

export default function Page() {
  const [departments, setDepartments] = useState<any[]>([])
  const [dates, setDates] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [userName, setUserName] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [idCardNumber, setIdCardNumber] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    async function fetchDepartments() {
      const response = await fetch("/api/bookings")
      const data = await response.json()
      setDepartments(data)
    }
    fetchDepartments()
  }, [])

  const formatDate = (date: Date | undefined): string => {
    if (!date) return ""
    return format(date, "dd MMMM yyyy", { locale: th })
  }

  const fetchDates = async (departmentId: string) => {
    const response = await fetch(`/api/bookings?departmentId=${departmentId}`)
    const data = await response.json()
    setDates(data)
  }

  const fetchSlots = async (departmentId: string, date: Date | undefined) => {
    if (!date) return
    const formattedDate = format(date, "yyyy-MM-dd")
    console.log("Sending date to API:", formattedDate)

    const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`)
    const data = await response.json()
    if (Array.isArray(data)) {
      setSlots(data)
    } else {
      console.error("Data from API is not an array:", data)
      setSlots([])
    }
  }

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value)
    setSelectedDate(undefined)
    setSelectedSlot("")
    if (value) {
      fetchDates(value)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot("")
    if (selectedDepartment && date) {
      fetchSlots(selectedDepartment, date)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate || !phoneNumber || !idCardNumber) {
      alert("กรุณากรอกข้อมูลให้ครบ")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/que", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName,
          department_id: selectedDepartment,
          slot_id: selectedSlot,
          phone_number: phoneNumber,
          id_card_number: idCardNumber,
        }),
      })

      const result = await response.json()
      if (result.message === "จองคิวสำเร็จ") {
        alert(result.message)
        window.location.reload()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการจองคิว กรุณาลองใหม่อีกครั้ง")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // สร้าง array ของวันที่ที่ไม่สามารถจองได้ (สมมติว่าเป็นวันที่ในอดีต)
  const disabledDates = dates
    .filter((date) => new Date(date.slot_date) < new Date())
    .map((date) => new Date(date.slot_date))

  // สร้าง array ของวันที่ที่สามารถจองได้
  const availableDates = dates.map((date) => parseISO(date.slot_date))

  // Render a consistent UI on both server and client
  if (!isClient) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-semibold text-center mb-4">นัดหมายออนไลน์</h1>
        <p className="text-center mb-4">กรุณาระบุข้อมูลให้ครบถ้วน เพื่อทำการจองคิว</p>
        {/* Simple loading state */}
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Card className="border-t-4 border-t-sky-500 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-sky-700">นัดหมายออนไลน์</CardTitle>
          <CardDescription>กรุณาระบุข้อมูลให้ครบถ้วน เพื่อทำการจองคิว</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-600" />
                  <span>แผนก</span>
                </Label>
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-sky-600" />
                  <span>วันที่</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                    >
                      {selectedDate ? formatDate(selectedDate) : "เลือกวันที่นัดหมาย"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={disabledDates}
                      locale={th}
                      modifiers={{
                        available: availableDates,
                        disabled: disabledDates,
                      }}
                      modifiersStyles={{
                        available: { color: "blue" },
                        disabled: { color: "#d1d5db", pointerEvents: "none" },
                      }}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>เวลา</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {Array.isArray(slots) && slots.length > 0 ? (
                    slots.map((slot) => (
                      <Button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.id)}
                        variant={selectedSlot === slot.id ? "default" : "outline"}
                        className={`text-sm h-auto py-3 ${slot.available_seats <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={slot.available_seats <= 0}
                      >
                        <div className="flex flex-col">
                          <span>{`${slot.start_time} - ${slot.end_time}`}</span>
                          <span className="text-xs mt-1">{`ว่าง: ${slot.available_seats} ที่`}</span>
                        </div>
                      </Button>
                    ))
                  ) : selectedDate ? (
                    <p className="col-span-2 text-center text-muted-foreground py-2">ไม่พบช่วงเวลาที่ว่าง</p>
                  ) : null}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4 text-sky-700">ข้อมูลผู้จอง</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-sky-600" />
                      <span>ชื่อผู้จอง</span>
                    </Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-sky-600" />
                      <span>เบอร์โทร</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0xxxxxxxxx"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idCardNumber" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-sky-600" />
                      <span>เลขบัตรประชาชน</span>
                    </Label>
                    <Input
                      id="idCardNumber"
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      placeholder="x-xxxx-xxxxx-xx-x"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <CardFooter className="px-0 pt-2">
              <Button
                className="w-full py-6 bg-sky-600 hover:bg-sky-700 text-lg font-medium"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังดำเนินการ..." : "นัดหมายออนไลน์"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

