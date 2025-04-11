'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface Department {
  id: number;
  name: string;
}

const AdminDashboard = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [slotDate, setSlotDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [availableSeats, setAvailableSeats] = useState<number>(0);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        setDepartmentList(data); // 👈 ถ้า API คืน array ตรง ๆ
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleAddSlot = async () => {
    const response = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        department_id: selectedDepartment,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        available_seats: availableSeats,
      }),
    });
    const result = await response.json();
    alert(result.message);
    setOpenConfirmModal(false);

    // ✅ รีเซ็ตฟอร์มหลังเพิ่ม
    setSelectedDepartment('');
    setSlotDate('');
    setStartTime('');
    setEndTime('');
    setAvailableSeats(0);
  };

  const isFormValid = () =>
    selectedDepartment && slotDate && startTime && endTime && availableSeats > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full max-w-full p-6">
        <h1 className="text-3xl font-bold mb-6">เพิ่มตารางเวลา</h1>

        <Card className="w-full p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-6">เพิ่มเวลา (Slot) ให้แผนก</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="space-y-2">
              <Label>เลือกแผนก:</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departmentList.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>เลือกวันที่:</Label>
              <Input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>เลือกเวลาเริ่มต้น:</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>เลือกเวลาสิ้นสุด:</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>จำนวนที่นั่งว่าง:</Label>
              <Input
                type="number"
                value={availableSeats}
                onChange={(e) => setAvailableSeats(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => isFormValid() ? setOpenConfirmModal(true) : alert("กรุณากรอกข้อมูลให้ครบ")}
              className="w-full sm:w-auto px-6"
            >
              เพิ่มเวลา
            </Button>
          </div>
        </Card>
      </div>

      {/* ✅ Modal ยืนยันก่อนเพิ่ม */}
      <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการเพิ่มเวลา</DialogTitle>
          </DialogHeader>
          <p>
            คุณแน่ใจหรือไม่ว่าต้องการเพิ่มตารางเวลาในวันที่{" "}
            <strong>{slotDate}</strong> เวลา <strong>{startTime} - {endTime}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddSlot} className="bg-green-600 text-white hover:bg-green-700">
              ✅ เพิ่มเลย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
