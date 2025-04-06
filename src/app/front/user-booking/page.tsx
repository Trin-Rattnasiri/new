"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Calendar, FileText, ArrowLeft } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

const Page = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [idCardNumber, setIdCardNumber] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingReference, setBookingReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      setDepartments(data);
    }
    fetchDepartments();
  }, []);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy", { locale: th });
  };

  const fetchDates = async (departmentId: string) => {
    const response = await fetch(`/api/bookings?departmentId=${departmentId}`);
    const data = await response.json();
    setDates(data);
  };

  const fetchSlots = async (departmentId: string, date: Date | undefined) => {
    if (!date) return;
    const formattedDate = format(date, "yyyy-MM-dd");
    const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`);
    const data = await response.json();
    if (Array.isArray(data)) {
      setSlots(data);
    } else {
      console.error("Data from API is not an array:", data);
      setSlots([]);
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedDate(undefined);
    setSelectedSlot("");
    if (departmentId) fetchDates(departmentId);
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

    setIsSubmitting(true);
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
      });
      const result = await response.json();
      if (result.message === "จองคิวสำเร็จ") {
        alert(result.message);
        if (result.bookingReferenceNumber) {
          router.replace(`/appointment/${result.bookingReferenceNumber}`);
        } else {
          window.location.reload();
        }
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

  const handleBack = () => {
    router.back(); // ย้อนกลับไปยังหน้าเดิม
  };

  const disabledDates = dates
    .filter((date) => new Date(date.slot_date) < new Date())
    .map((date) => new Date(date.slot_date));
  const availableDates = dates.map((date) => parseISO(date.slot_date));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {/* ปุ่มย้อนกลับ */}
        <Button
          onClick={handleBack}
          variant="outline"
          className="mb-4 flex items-center gap-2 text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          ย้อนกลับ
        </Button>

        <h1 className="text-2xl font-bold text-center mb-4 text-sky-700">นัดหมายออนไลน์</h1>
        <p className="text-center mb-6 text-sm text-gray-600">กรุณาระบุข้อมูลให้ครบถ้วน เพื่อทำการจองคิว</p>

        {/* ส่วนดูใบนัด */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            ดูใบนัดที่มีอยู่
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="กรอกรหัสใบนัด (เช่น 20250406-00001)"
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={handleViewAppointment}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white"
            >
              ดูใบนัด
            </Button>
          </div>
        </div>

        {/* ฟอร์มจองคิว */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="department">แผนก</label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="p-2 border border-gray-300 rounded-md w-full"
              required
            >
              <option value="">เลือกแผนก</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="date">วันที่</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${
                    !formatDate(selectedDate) && "text-muted-foreground"
                  }`}
                >
                  {formatDate(selectedDate) || "เลือกวันที่นัดหมาย"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={disabledDates}
                  locale={th}
                  modifiers={{ available: availableDates, disabled: disabledDates }}
                  modifiersStyles={{
                    available: { color: "blue" },
                    disabled: { color: "#d1d5db", pointerEvents: "none" },
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="slot">เวลา</label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(slots) && slots.length > 0 ? (
                slots.map((slot) => (
                  <Button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`text-sm ${
                      selectedSlot === slot.id
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                    disabled={slot.available_seats <= 0}
                  >
                    {`${slot.start_time} - ${slot.end_time} (ว่าง: ${slot.available_seats})`}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-gray-500">ไม่มีช่วงเวลาที่ว่าง</p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="userName">ชื่อผู้จอง</label>
            <Input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="phoneNumber">เบอร์โทร</label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full"
              required
              pattern="[0-9]{10}"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="idCardNumber">เลขบัตรประชาชน</label>
            <Input
              id="idCardNumber"
              type="text"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              className="w-full"
              required
              pattern="[0-9]{13}"
            />
          </div>

          <Button
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังดำเนินการ..." : "นัดหมายออนไลน์"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Page;