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
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

interface Department {
  id: number;
  name: string;
}

interface Slot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  available_seats: number;
  department_name: string;
}

const AdminDashboard = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [slotList, setSlotList] = useState<Slot[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState<number>(0);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setDepartmentList(data);
    };
    fetchDepartments();
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    const res = await fetch('/api/admin/slots');
    const data = await res.json();
    setSlotList(data.slots || []);
  };

  const handleAddSlot = async () => {
    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: selectedDepartment,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        available_seats: availableSeats,
      }),
    });
    const result = await res.json();
    alert(result.message);
    setOpenConfirmModal(false);
    setSelectedDepartment(''); setSlotDate(''); setStartTime(''); setEndTime(''); setAvailableSeats(0);
    fetchSlots();
  };

  const handleDelete = async () => {
    if (!deleteSlotId) return;
    await fetch(`/api/admin/slots?slotId=${deleteSlotId}`, { method: 'DELETE' });
    setOpenDeleteModal(false);
    setDeleteSlotId(null);
    fetchSlots();
  };

  const handleEdit = (slot: Slot) => {
    setEditSlot(slot);
    setOpenEditModal(true);
  };

  const handleUpdateSlot = async () => {
    if (!editSlot) return;
    await fetch('/api/admin/slots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editSlot),
    });
    setOpenEditModal(false);
    fetchSlots();
  };

  return (
    <div className="w-full min-h-screen bg-white p-6"> {/* เปลี่ยนจาก bg-slate-50 เป็น bg-white */}
      <h1 className="text-3xl font-bold mb-6">เพิ่มตารางเวลา</h1>

      {/* ฟอร์มเพิ่ม */}
      <Card className="p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>เลือกแผนก:</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกแผนก" />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>วันที่:</Label>
            <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>เวลาเริ่ม:</Label>
            <Input
              type="text"
              placeholder="เช่น 08:00"
              pattern="^([01]\d|2[0-3]):([0-5]\d)$"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>เวลาสิ้นสุด:</Label>
            <Input
              type="text"
              placeholder="เช่น 14:30"
              pattern="^([01]\d|2[0-3]):([0-5]\d)$"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>จำนวนที่จะเปิดให้จอง:</Label>
            <Input type="number" value={availableSeats} onChange={(e) => setAvailableSeats(Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => setOpenConfirmModal(true)}>เพิ่มเวลา</Button>
        </div>
      </Card>

      {/* ตาราง slot */}
      <h2 className="text-2xl font-bold mb-3">ตารางเวลา</h2>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>แผนก</TableCell>
              <TableCell>เวลา</TableCell>
              <TableCell>จำนวนที่นั่งว่าง</TableCell>
              <TableCell>การจัดการ</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slotList.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>{format(new Date(slot.slot_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{slot.department_name}</TableCell>
                <TableCell>{slot.start_time} - {slot.end_time}</TableCell>
                <TableCell>{slot.available_seats}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" onClick={() => handleEdit(slot)}>แก้ไข</Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDeleteSlotId(slot.id);
                      setOpenDeleteModal(true);
                    }}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal เพิ่ม */}
      <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการเพิ่ม</DialogTitle>
          </DialogHeader>
          <p>เพิ่มเวลาใหม่ใช่หรือไม่?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmModal(false)}>ยกเลิก</Button>
            <Button onClick={handleAddSlot}>เพิ่ม</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal แก้ไข */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไข Slot</DialogTitle>
          </DialogHeader>
          {editSlot && (
            <div className="space-y-4">
              <Input type="date" value={editSlot.slot_date} onChange={(e) => setEditSlot({ ...editSlot, slot_date: e.target.value })} />
              <Input type="text" placeholder="HH:mm" value={editSlot.start_time} onChange={(e) => setEditSlot({ ...editSlot, start_time: e.target.value })} />
              <Input type="text" placeholder="HH:mm" value={editSlot.end_time} onChange={(e) => setEditSlot({ ...editSlot, end_time: e.target.value })} />
              <Input type="number" value={editSlot.available_seats} onChange={(e) => setEditSlot({ ...editSlot, available_seats: Number(e.target.value) })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditModal(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateSlot}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal ลบ */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p>คุณต้องการลบ slot นี้ใช่หรือไม่?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;