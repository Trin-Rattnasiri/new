
"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Calendar, FileText, ArrowLeft } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Select from "react-select";

interface Department {
  id: string;
  name: string;
}

interface DateSlot {
  slot_date: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available_seats: number;
}

const Page = () => {
  const router = useRouter();
  const backTo = "/front/user-dashboard";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [dates, setDates] = useState<DateSlot[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [idCardNumber, setIdCardNumber] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingReference, setBookingReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    console.log("👤 citizenId จาก localStorage:", localStorage.getItem("citizenId"));
    async function fetchDepartments() {
      try {
        const response = await fetch("/api/bookings");
        const data = await response.json();
        console.log("Fetched departments:", data);
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          console.error("Departments data is not an array:", data);
          setDepartments([]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      }
    }
    fetchDepartments();
  }, []);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "เลือกวันที่นัดหมาย";
    return format(date, "dd MMMM yyyy", { locale: th });
  };

  const fetchDates = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/bookings?departmentId=${departmentId}`);
      const data = await response.json();
      console.log("Fetched dates:", data);
      setDates(data);
    } catch (error) {
      console.error("Error fetching dates:", error);
      setDates([]);
    }
  };

  const fetchSlots = async (departmentId: string, date: Date | undefined) => {
    if (!date) return;
    const formattedDate = format(date, "yyyy-MM-dd");
    try {
      const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    }
  };

  const handleDepartmentChange = (selectedOption: { value: string; label: string } | null) => {
    const value = selectedOption ? selectedOption.value : "";
    console.log("Selected department:", value);
    setSelectedDepartment(value);
    setSelectedDate(undefined);
    setSelectedSlot("");
    if (value) fetchDates(value);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot("");
    if (selectedDepartment && date) fetchSlots(selectedDepartment, date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate || !phoneNumber || !idCardNumber) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const created_by = localStorage.getItem("citizenId");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/que", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          department_id: selectedDepartment,
          slot_id: selectedSlot,
          phone_number: phoneNumber,
          id_card_number: idCardNumber,
          created_by,
        }),
      });

      const result = await response.json();
      if (result.message === "จองคิวสำเร็จ") {
        alert(result.message);
        result.bookingReferenceNumber 
          ? router.replace(`/appointment/${result.bookingReferenceNumber}`)
          : window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการจองคิว");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAppointment = () => {
    if (!bookingReference) {
      alert("กรุณากรอกรหัสใบนัด");
      return;
    }
    router.push(`/appointment/${bookingReference}`);
  };

  // วันที่ที่มีอยู่ในฐานข้อมูล
  const availableDates = dates.map((date) => parseISO(date.slot_date));

  // ฟังก์ชันสำหรับตรวจสอบว่าวันที่ควรถูกปิดใช้งานหรือไม่
  const isDateDisabled = (date: Date) => {
    // ปิดใช้งานถ้าเป็นวันที่ผ่านมาแล้ว
    const isPastDate = date < new Date();
    // ปิดใช้งานถ้าไม่มีใน availableDates
    const isUnavailable = !availableDates.some((availableDate) => isSameDay(date, availableDate));
    return isPastDate || isUnavailable;
  };

  // ฟังก์ชันสำหรับตรวจสอบว่าวันที่ควรเป็นสีเทา (ไม่มีในฐานข้อมูล)
  const isDateUnavailable = (date: Date) => {
    return !availableDates.some((availableDate) => isSameDay(date, availableDate));
  };

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <Card className="border-0 shadow-sm">
          <CardHeader className="space-y-1">
            <Button
              onClick={() => router.push(backTo)}
              variant="ghost"
              className="w-fit hover:bg-blue-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
            </Button>
            <CardTitle className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Calendar className="h-6 w-6" /> นัดหมายออนไลน์
            </CardTitle>
            <p className="text-sm text-gray-500">กรุณากรอกข้อมูลเพื่อทำการจองคิว</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">ดูใบนัด</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="รหัสใบนัด (เช่น 20250406-00001)"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                    className="flex-1 border-gray-300"
                  />
                  <Button 
                    onClick={handleViewAppointment}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ตรวจสอบ
                  </Button>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="department">แผนก</Label>
                <Select
                  options={departmentOptions}
                  onChange={handleDepartmentChange}
                  value={departmentOptions.find((option) => option.value === selectedDepartment) || null}
                  placeholder="เลือกแผนก"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#d1d5db",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#9ca3af",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label>วันที่</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-300"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(selectedDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date: Date) => isDateDisabled(date)}
                      locale={th}
                      modifiers={{
                        available: (date: Date) => !isDateUnavailable(date),
                        unavailable: (date: Date) => isDateUnavailable(date),
                      }}
                      modifiersStyles={{
                        available: { backgroundColor: "#dbeafe", color: "#1e40af" },
                        unavailable: { color: "#d1d5db", pointerEvents: "none" },
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label>เวลา</Label>
                <div className="grid grid-cols-2 gap-2">
                  {slots.length > 0 ? (
                    slots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot === slot.id ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot.id)}
                        disabled={slot.available_seats <= 0}
                        className="justify-start border-gray-300 text-left whitespace-nowrap px-3 py-2"
                        style={{ minWidth: "fit-content" }}
                      >
                        {`${slot.start_time} - ${slot.end_time} (ว่าง: ${slot.available_seats})`}
                      </Button>
                    ))
                  ) : (
                    <p className="col-span-2 text-sm text-gray-500">ไม่มีช่วงเวลาว่าง</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="userName">ชื่อ</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="idCardNumber">เลขบัตรประชาชน</Label>
                <Input
                  id="idCardNumber"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  pattern="[0-9]{13}"
                  required
                  className="border-gray-300"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังจอง..." : "ยืนยันการนัดหมาย"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
