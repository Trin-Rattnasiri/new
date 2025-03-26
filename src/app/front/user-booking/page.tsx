'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';

const Page = () => {
  const [departments, setDepartments] = useState<any[]>([]); // สำหรับแผนกทั้งหมด
  const [dates, setDates] = useState<any[]>([]); // สำหรับวันที่ที่สามารถเลือกได้
  const [slots, setSlots] = useState<any[]>([]); // สำหรับเวลาที่สามารถจองได้
  const [userName, setUserName] = useState<string>(''); // ชื่อผู้จอง
  const [phoneNumber, setPhoneNumber] = useState<string>(''); // เบอร์โทร
  const [idCardNumber, setIdCardNumber] = useState<string>(''); // บัตรประชาชน
  const [selectedDepartment, setSelectedDepartment] = useState<string>(''); // แผนกที่เลือก
  const [selectedDate, setSelectedDate] = useState<string>(''); // วันที่เลือก
  const [selectedSlot, setSelectedSlot] = useState<string>(''); // เวลาที่เลือก

  useEffect(() => {
    async function fetchDepartments() {
      const response = await fetch('/api/bookings'); // คุณอาจต้องเปลี่ยน URL ให้เหมาะสม
      const data = await response.json();
      setDepartments(data);
    }
    fetchDepartments();
  }, []);

  // ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // ถ้าแปลงไม่ได้ ส่งค่าเดิมกลับไป
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // ถ้าเกิด error ส่งค่าเดิมกลับไป
    }
  };

  // ดึงข้อมูลวันที่ที่สามารถเลือกได้เมื่อเลือกแผนก
  const fetchDates = async (departmentId: string) => {
    const response = await fetch(`/api/bookings?departmentId=${departmentId}`);
    const data = await response.json();
    setDates(data);
  };

  // ดึงข้อมูลเวลาที่สามารถจองได้เมื่อเลือกวันที่
  const fetchSlots = async (departmentId: string, date: string) => {
    const formattedDate = formatDate(date); // แปลงวันที่ก่อนส่งไป API
    console.log('Sending date to API:', formattedDate);

    const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`);
    const data = await response.json();
    setSlots(data);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedDate('');
    setSelectedSlot('');
    if (departmentId) {
      fetchDates(departmentId); // ดึงวันที่ที่สามารถเลือกได้เมื่อเลือกแผนก
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDepartment && date) {
      fetchSlots(selectedDepartment, date); // ดึงเวลาเมื่อเลือกวันที่
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate || !phoneNumber || !idCardNumber) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
  
    const response = await fetch('/api/admin/que', { // ใช้ URL ใหม่ของ API ที่สร้างขึ้น
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: userName,
        department_id: selectedDepartment,
        slot_id: selectedSlot,
        phone_number: phoneNumber, // ส่งเบอร์โทร
        id_card_number: idCardNumber, // ส่งบัตรประชาชน
      }),
    });
  
    const result = await response.json();
  
    if (result.message === 'จองคิวสำเร็จ') {
      alert(result.message);
      window.location.reload();  // รีเฟรชหน้าเมื่อจองสำเร็จ
    } else {
      alert(result.message);
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">ระบบจองคิวโรงพยาบาล</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ฟิลด์ชื่อผู้จอง */}
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2" htmlFor="userName">ชื่อผู้จอง:</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* ฟิลด์เบอร์โทร */}
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2" htmlFor="phoneNumber">เบอร์โทร:</label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* ฟิลด์บัตรประชาชน */}
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2" htmlFor="idCardNumber">บัตรประชาชน:</label>
          <input
            id="idCardNumber"
            type="text"
            value={idCardNumber}
            onChange={(e) => setIdCardNumber(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* ฟิลด์เลือกแผนก */}
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2" htmlFor="department">เลือกแผนก:</label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="p-3 border border-gray-300 rounded-md"
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

        {/* ฟิลด์เลือกวันที่ */}
        <div className="flex flex-col">
          <label className="text-lg font-medium mb-2" htmlFor="date">เลือกวันที่:</label>
          <select
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="p-3 border border-gray-300 rounded-md"
            required
          >
            <option value="">เลือกวันที่</option>
            {dates.map((date) => {
              const displayDate = formatDate(date.slot_date);
              return (
                <option key={date.slot_date} value={date.slot_date}>
                  {displayDate}
                </option>
              );
            })}
          </select>
        </div>

       {/* ฟิลด์เลือกเวลา */}
<div className="flex flex-col">
  <label className="text-lg font-medium mb-2" htmlFor="slot">เลือกเวลา:</label>
  <select
    id="slot"
    value={selectedSlot}
    onChange={(e) => setSelectedSlot(e.target.value)}
    className="p-3 border border-gray-300 rounded-md"
    required
  >
    <option value="">เลือกเวลา</option>
    {slots.map((slot) => (
      <option key={slot.id} value={slot.id}>
        {`${slot.start_time} - ${slot.end_time}`} (ที่นั่งว่าง: {slot.available_seats})
      </option>
    ))}
  </select>
</div>


        <Button className="w-full py-3 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700" type="submit">จองคิว</Button>
      </form>
    </div>
  );
};

export default Page;
