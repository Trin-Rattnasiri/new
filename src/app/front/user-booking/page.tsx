'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { th } from 'date-fns/locale';
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [idCardNumber, setIdCardNumber] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  useEffect(() => {
    async function fetchDepartments() {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setDepartments(data);
    }
    fetchDepartments();
  }, []);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy', { locale: th });
  };

  const fetchDates = async (departmentId: string) => {
    const response = await fetch(`/api/bookings?departmentId=${departmentId}`);
    const data = await response.json();
    setDates(data);
  };

  const fetchSlots = async (departmentId: string, date: Date | undefined) => {
    if (!date) return;
    const formattedDate = format(date, 'yyyy-MM-dd');
    console.log('Sending date to API:', formattedDate);

    const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`);
    const data = await response.json();
    if (Array.isArray(data)) {
      setSlots(data);
    } else {
      console.error('Data from API is not an array:', data);
      setSlots([]);
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedDate(undefined);
    setSelectedSlot('');
    if (departmentId) {
      fetchDates(departmentId);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDepartment && date) {
      fetchSlots(selectedDepartment, date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate || !phoneNumber || !idCardNumber) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    const response = await fetch('/api/admin/que', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    if (result.message === 'จองคิวสำเร็จ') {
      alert(result.message);
      if (result.bookingReferenceNumber) {
        router.push(`/appointment/${result.bookingReferenceNumber}`); // ✅ พาไปหน้ารายละเอียด
      } else {
        window.location.reload(); // fallback
      }
    }
    
  };

  const disabledDates = dates.filter(date => new Date(date.slot_date) < new Date()).map(date => new Date(date.slot_date));
  const availableDates = dates.map(date => parseISO(date.slot_date));

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-semibold text-center mb-4">นัดหมายออนไลน์</h1>
      <p className="text-center mb-4">กรุณาระบุข้อมูลให้ครบถ้วน เพื่อทำการจองคิว</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="department">แผนก</label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="p-2 border border-gray-300 rounded-md"
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
                className={formatDate(selectedDate) ? "w-full justify-start text-left font-normal" : "w-full justify-start text-left font-normal text-muted-foreground"}
              >
                {formatDate(selectedDate) ? formatDate(selectedDate) : <span>วว / ดด / ปป</span>}
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
                  disabled: disabledDates
                }}
                modifiersStyles={{
                  available: { color: 'blue' },
                  disabled: { color: '#d1d5db', pointerEvents: 'none' },
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="slot">เวลา</label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(slots) && slots.map((slot) => (
              <Button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`text-sm ${selectedSlot === slot.id ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}
              >
                {`${slot.start_time} - ${slot.end_time} (จำนวนที่ว่าง: ${slot.available_seats})`}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="userName">ชื่อผู้จอง:</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="phoneNumber">เบอร์โทร:</label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="idCardNumber">บัตรประชาชน:</label>
          <input
            id="idCardNumber"
            type="text"
            value={idCardNumber}
            onChange={(e) => setIdCardNumber(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <Button className="w-full py-2 bg-blue-600 text-white rounded-md" type="submit">นัดหมายออนไลน์</Button>
      </form>
    </div>
  );
};

export default Page;
