'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Page = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setNotification({
          message: 'ไม่สามารถดึงข้อมูลแผนกได้ กรุณาลองใหม่อีกครั้ง',
          type: 'error'
        });
      }
    }
    fetchDepartments();
  }, []);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format date for display in Thai format
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // อาทิตย์, จันทร์, อังคาร, พุธ, พฤหัสบดี, ศุกร์, เสาร์
      const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const day = thaiDays[date.getDay()];
      const month = thaiMonths[date.getMonth()];
      const dateNum = date.getDate();
      const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
      
      return `วัน${day}ที่ ${dateNum} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateString;
    }
  };

  const fetchDates = async (departmentId: string) => {
    try {
      setNotification(null);
      const response = await fetch(`/api/bookings?departmentId=${departmentId}`);
      const data = await response.json();
      setDates(data);
    } catch (error) {
      console.error('Error fetching dates:', error);
      setNotification({
        message: 'ไม่สามารถดึงข้อมูลวันที่ได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error'
      });
    }
  };

  const fetchSlots = async (departmentId: string, date: string) => {
    try {
      setNotification(null);
      const formattedDate = formatDate(date);
      console.log('Sending date to API:', formattedDate);
      
      const response = await fetch(`/api/bookings/slots?departmentId=${departmentId}&date=${formattedDate}`);
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setNotification({
        message: 'ไม่สามารถดึงข้อมูลช่วงเวลาได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error'
      });
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedDate('');
    setSelectedSlot('');
    if (value) {
      fetchDates(value);
    }
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedSlot('');
    if (selectedDepartment && value) {
      fetchSlots(selectedDepartment, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    if (!userName || !selectedDepartment || !selectedSlot || !selectedDate) {
      setNotification({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        type: 'error'
      });
      setIsSubmitting(false);
      return;
    }

    try {
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
      
      setNotification({
        message: result.message || 'จองคิวสำเร็จ',
        type: response.ok ? 'success' : 'error'
      });
      
      // ถ้าสำเร็จ รีเซ็ตฟอร์ม
      if (response.ok) {
        setUserName('');
        setSelectedDepartment('');
        setSelectedDate('');
        setSelectedSlot('');
        setDates([]);
        setSlots([]);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setNotification({
        message: 'เกิดข้อผิดพลาดในการจองคิว กรุณาลองใหม่อีกครั้ง',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ดึงชื่อแผนกจาก ID
  const getDepartmentName = (id: string) => {
    const department = departments.find(dept => dept.id === id);
    return department ? department.name : '';
  };

  // ดึงข้อมูลเวลาจาก slot ID
  const getSlotInfo = (id: string) => {
    const slot = slots.find(s => s.id === id);
    return slot ? `${slot.time_slot} (ที่นั่งว่าง: ${slot.available_seats})` : '';
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <CardTitle className="text-xl">ระบบจองคิวโรงพยาบาล</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            กรุณากรอกข้อมูลเพื่อทำการจองคิว
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {notification && (
              <Alert className={notification.type === 'success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                <AlertDescription>
                  {notification.message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อผู้จอง</Label>
              <Input
                id="name"
                placeholder="กรุณากรอกชื่อ-นามสกุล"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">เลือกแผนก</Label>
              <Select
                value={selectedDepartment}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger id="department" className="w-full">
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
              <Label htmlFor="date">เลือกวันที่</Label>
              <Select
                value={selectedDate}
                onValueChange={handleDateChange}
                disabled={!selectedDepartment || dates.length === 0}
              >
                <SelectTrigger id="date" className="w-full">
                  <SelectValue placeholder={!selectedDepartment ? "กรุณาเลือกแผนกก่อน" : "เลือกวันที่"} />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((date) => (
                    <SelectItem key={date.slot_date} value={date.slot_date}>
                      {formatDateForDisplay(date.slot_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">เลือกเวลา</Label>
              <Select
                value={selectedSlot}
                onValueChange={setSelectedSlot}
                disabled={!selectedDate || slots.length === 0}
              >
                <SelectTrigger id="time" className="w-full">
                  <SelectValue placeholder={!selectedDate ? "กรุณาเลือกวันที่ก่อน" : "เลือกเวลา"} />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.time_slot} (ที่นั่งว่าง: {slot.available_seats})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังทำรายการ...' : 'จองคิว'}
            </Button>
            
            {selectedDepartment && (
              <div className="w-full p-4 rounded-lg bg-slate-50 text-sm">
                <p className="font-medium">สรุปการจอง:</p>
                <p>ชื่อผู้จอง: {userName}</p>
                <p>แผนก: {getDepartmentName(selectedDepartment)}</p>
                {selectedDate && <p>วันที่: {formatDateForDisplay(selectedDate)}</p>}
                {selectedSlot && <p>เวลา: {getSlotInfo(selectedSlot)}</p>}
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Page;