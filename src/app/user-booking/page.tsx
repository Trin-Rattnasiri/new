'use client';

import { useState, useEffect } from 'react';

const Page = () => {
  const [departments, setDepartments] = useState<any[]>([]); // สำหรับแผนกทั้งหมด
  const [dates, setDates] = useState<any[]>([]); // สำหรับวันที่ที่สามารถเลือกได้
  const [slots, setSlots] = useState<any[]>([]); // สำหรับเวลาที่สามารถจองได้
  const [userName, setUserName] = useState<string>(''); // ชื่อผู้จอง
  const [selectedDepartment, setSelectedDepartment] = useState<string>(''); // แผนกที่เลือก
  const [selectedDate, setSelectedDate] = useState<string>(''); // วันที่เลือก
  const [selectedSlot, setSelectedSlot] = useState<string>(''); // เวลาที่เลือก

  useEffect(() => {
    async function fetchDepartments() {
      const response = await fetch('/api/bookings');
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

    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: userName,
        department_id: selectedDepartment,
        slot_id: selectedSlot,
      }),
    });

    const result = await response.json();
    alert(result.message);
  };

  return (
    <div>
      <h1>ระบบจองคิวโรงพยาบาล</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ชื่อผู้จอง:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>เลือกแผนก:</label>
          <select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
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
        <div>
          <label>เลือกวันที่:</label>
          <select
            value={selectedDate}
            onChange={handleDateChange}
            required
          >
            <option value="">เลือกวันที่</option>
            {dates.map((date) => {
              // แปลงวันที่เป็นรูปแบบ YYYY-MM-DD สำหรับการแสดงผล
              const displayDate = formatDate(date.slot_date);
              return (
                <option key={date.slot_date} value={date.slot_date}>
                  {displayDate}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label>เลือกเวลา:</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            required
          >
            <option value="">เลือกเวลา</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.time_slot} (ที่นั่งว่าง: {slot.available_seats})
              </option>
            ))}
          </select>
        </div>
        <button type="submit">จองคิว</button>
      </form>
    </div>
  );
};

export default Page;