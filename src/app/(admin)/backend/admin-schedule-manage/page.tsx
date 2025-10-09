'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { format, parse, isValid } from 'date-fns';
import { Toaster, toast } from "sonner";

const toDate = (v?: string) => {
  if (!v) return undefined;
  const patterns = ['yyyy-MM-dd', 'dd/MM/yyyy', "yyyy-MM-dd'T'HH:mm:ssXXX", "yyyy-MM-dd'T'HH:mm:ss'Z'"];
  for (const p of patterns) {
    const d = parse(v, p, new Date());
    if (isValid(d)) return d;
  }
  const d = new Date(v);
  return isValid(d) ? d : undefined;
};

interface Department { id: number; name: string; }
interface Slot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  available_seats: number;
  department_name: string;
}

const AdminDashboard = () => {
  const ALL = 'ALL';
  const [filterDepartment, setFilterDepartment] = useState<string>(ALL);

  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [slotList, setSlotList] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalSeats, setTotalSeats] = useState<number>(0);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  
  // ⭐ เพิ่ม State สำหรับ Modal ยืนยันการลบแบบมีการจอง
  const [openForceDeleteModal, setOpenForceDeleteModal] = useState(false);
  const [deleteSlotInfo, setDeleteSlotInfo] = useState<{
    slotId: number;
    bookedSeats: number;
    slotData: Slot | null;
  } | null>(null);

  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [editDateOpen, setEditDateOpen] = useState(false);
  const editDateWrapRef = useRef<HTMLDivElement>(null);
  const bookedRef = useRef<number>(0);

// ... ต่อจาก Part 1

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [deptRes, slotsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/admin/slots'),
        ]);
        if (!deptRes.ok || !slotsRes.ok) throw new Error('Failed to fetch data');
        const deptData = await deptRes.json();
        const slotsData = await slotsRes.json();
        setDepartmentList(deptData);
        setSlotList(slotsData.slots || []);
      } catch (e) {
        console.error('Error fetching data:', e);
        toast.error("ไม่สามารถโหลดข้อมูลได้ โปรดลองอีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!editDateOpen) return;
    const onDown = (ev: MouseEvent) => {
      if (!editDateWrapRef.current) return;
      if (!editDateWrapRef.current.contains(ev.target as Node)) {
        setEditDateOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [editDateOpen]);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/slots');
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlotList(data.slots || []);
    } catch (e) {
      console.error('Error fetching slots:', e);
      toast.error("ไม่สามารถโหลดข้อมูลตารางเวลาได้ โปรดลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!selectedDepartment) { setFormError('กรุณาเลือกแผนก'); return false; }
    if (!slotDate) { setFormError('กรุณาเลือกวันที่'); return false; }
    if (!startTime || !(/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime))) {
      setFormError('กรุณาระบุเวลาเริ่มให้ถูกต้อง (รูปแบบ HH:MM)'); return false;
    }
    if (!endTime || !(/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime))) {
      setFormError('กรุณาระบุเวลาสิ้นสุดให้ถูกต้อง (รูปแบบ HH:MM)'); return false;
    }
    if (totalSeats <= 0) { setFormError('จำนวนที่นั่งต้องมากกว่า 0'); return false; }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh > eh || (sh === eh && sm >= em)) {
      setFormError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด'); return false;
    }
    setFormError(null); return true;
  };

  const handleAddSlot = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: selectedDepartment,
          slot_date: slotDate,
          start_time: startTime,
          end_time: endTime,
          total_seats: totalSeats,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');

      const deptName = departmentList.find(d => d.id === parseInt(selectedDepartment))?.name || 'แผนก';
      setOpenConfirmModal(false);
      resetForm();
      fetchSlots();
      toast.success(`เพิ่มตารางเวลา "${deptName}" ${startTime}-${endTime} ที่นั่งทั้งหมด ${totalSeats} เรียบร้อย`);
    } catch (e) {
      console.error('Error adding slot:', e);
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDepartment(''); setSlotDate(''); setStartTime(''); setEndTime('');
    setTotalSeats(0); setFormError(null);
  };
  // ... ต่อจาก Part 2

  // ⭐ ฟังก์ชัน handleDelete แบบใหม่ (มี Modal ยืนยัน)
  const handleDelete = async () => {
    if (!deleteSlotId) return;

    setActionLoading(true);
    try {
      const slotToDelete = slotList.find(slot => slot.id === deleteSlotId);
      
      // ขั้นตอนที่ 1: ลองลบครั้งแรก (ตรวจสอบ)
      const res = await fetch(`/api/admin/slots?slotId=${deleteSlotId}`, { 
        method: 'DELETE' 
      });
      const data = await res.json();

      // ถ้า status 409 = มีคนจองแล้ว ต้องยืนยัน
      if (res.status === 409 && data.needsConfirmation) {
        setOpenDeleteModal(false); // ปิด modal เดิมก่อน
        
        // เก็บข้อมูลและเปิด Modal ยืนยัน
        setDeleteSlotInfo({
          slotId: deleteSlotId,
          bookedSeats: data.bookedSeats,
          slotData: slotToDelete || null
        });
        setOpenForceDeleteModal(true);
        setActionLoading(false);
        return;
      }

      // กรณีลบสำเร็จทันที (ไม่มีคนจอง)
      if (res.ok) {
        setOpenDeleteModal(false);
        setDeleteSlotId(null);
        fetchSlots();

        if (slotToDelete) {
          toast.success(
            `ลบตารางเวลา "${slotToDelete.department_name}" วันที่ ${
              toDate(slotToDelete.slot_date) 
                ? format(toDate(slotToDelete.slot_date)!, 'dd/MM/yyyy') 
                : '-'
            } แล้ว`
          );
        } else {
          toast.success('ลบตารางเวลาเรียบร้อยแล้ว');
        }
        return;
      }

      // กรณี error อื่นๆ
      throw new Error(data.message || 'Failed to delete slot');

    } catch (e) {
      console.error('Error deleting slot:', e);
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการลบข้อมูล');
      setOpenDeleteModal(false);
      setDeleteSlotId(null);
    } finally {
      setActionLoading(false);
    }
  };

  // ⭐ ฟังก์ชันใหม่: ยืนยันลบแบบบังคับ (force delete)
  const handleForceDelete = async () => {
    if (!deleteSlotInfo) return;

    setActionLoading(true);
    try {
      // ขั้นตอนที่ 2: ลบแบบบังคับ (force=true)
      const forceRes = await fetch(
        `/api/admin/slots?slotId=${deleteSlotInfo.slotId}&force=true`,
        { method: 'DELETE' }
      );
      
      if (!forceRes.ok) {
        const forceData = await forceRes.json();
        throw new Error(forceData.message || 'Failed to force delete slot');
      }
      
      const forceData = await forceRes.json();
      
      setOpenForceDeleteModal(false);
      setDeleteSlotId(null);
      setDeleteSlotInfo(null);
      fetchSlots();
      
      if (deleteSlotInfo.slotData) {
        toast.success(
          `ลบตารางเวลา "${deleteSlotInfo.slotData.department_name}" วันที่ ${
            toDate(deleteSlotInfo.slotData.slot_date) 
              ? format(toDate(deleteSlotInfo.slotData.slot_date)!, 'dd/MM/yyyy') 
              : '-'
          } และยกเลิกการจอง ${forceData.deletedBookings} รายการแล้ว`
        );
      } else {
        toast.success(forceData.message);
      }

    } catch (e) {
      console.error('Error force deleting slot:', e);
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (slot: Slot) => {
    const d = toDate(slot.slot_date);
    bookedRef.current = Math.max(0, slot.total_seats - slot.available_seats);
    setEditSlot({ ...slot, slot_date: d ? format(d, 'yyyy-MM-dd') : '' });
    setOpenEditModal(true);
    setEditDateOpen(false);
  };

  const handleUpdateSlot = async () => {
    if (!editSlot) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSlot),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update slot');
      }

      setOpenEditModal(false);
      fetchSlots();
      toast.success(`แก้ไขตารางเวลา "${editSlot.department_name}" เรียบร้อย`);
    } catch (e) {
      console.error('Error updating slot:', e);
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSlots =
    filterDepartment === ALL
      ? slotList
      : slotList.filter((slot) => {
        const id = Number(filterDepartment);
        if (!Number.isFinite(id)) return true;
        const dept = departmentList.find(d => d.id === id);
        return slot.department_name === (dept?.name || '');
      });

      // ... ต่อจาก Part 3

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการตารางเวลา</h1>
          <Button onClick={fetchSlots} variant="default" className="bg-gray-900 text-white hover:bg-gray-700 flex items-center gap-2">
            <RefreshCw size={16} /> รีเฟรช
          </Button>
        </div>

        {/* ฟอร์มเพิ่ม */}
        <Card className="mb-10 shadow-sm border-gray-200">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-xl text-gray-800">เพิ่มตารางเวลาใหม่</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {formError && (
              <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-700">แผนก:</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department" className="w-full">
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
                <Label htmlFor="date" className="text-gray-700">วันที่:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !slotDate && "text-gray-400")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {slotDate ? format(new Date(slotDate), 'dd/MM/yyyy') : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[70]">
                    <Calendar
                      mode="single"
                      selected={slotDate ? new Date(slotDate) : undefined}
                      onSelect={(date) => {
                        if (!date) return
                        setSlotDate(format(date, 'yyyy-MM-dd'))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-gray-700">เวลาเริ่ม:</Label>
                <div className="relative">
                  <Input id="start-time" type="text" placeholder="เช่น 08:00" pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                    value={startTime} onChange={(e) => setStartTime(e.target.value)} className="pl-10" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-gray-700">เวลาสิ้นสุด:</Label>
                <div className="relative">
                  <Input id="end-time" type="text" placeholder="เช่น 14:30" pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                    value={endTime} onChange={(e) => setEndTime(e.target.value)} className="pl-10" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats" className="text-gray-700">จำนวนที่จะเปิดให้จอง:</Label>
                <Input id="seats" type="number" min="1" value={totalSeats || ''} onChange={(e) => setTotalSeats(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => { if (validateForm()) setOpenConfirmModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={16} /> เพิ่มเวลา
            </Button>
          </CardFooter>
        </Card>

        {/* ตาราง */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="text-xl text-gray-800">ตารางเวลาทั้งหมด</CardTitle>
              <div className="w-full sm:w-64">
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>ทุกแผนก</SelectItem>
                    {departmentList.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="flex justify-center items-center py-20 text-gray-500">ไม่พบข้อมูลตารางเวลา</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">วันที่</TableHead>
                      <TableHead className="font-semibold">แผนก</TableHead>
                      <TableHead className="font-semibold text-center">เวลา</TableHead>
                      <TableHead className="font-semibold text-center">จำนวนว่าง / ทั้งหมด</TableHead>
                      <TableHead className="font-semibold text-right ">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.map((slot) => (
                      <TableRow key={slot.id} className="hover:bg-gray-50">
                        <TableCell>{toDate(slot.slot_date) ? format(toDate(slot.slot_date)!, 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{slot.department_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-center ">
                          <span className="inline-flex items-center">
                            <Clock size={14} className="mr-1 text-gray-500" /> {slot.start_time} - {slot.end_time}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={slot.available_seats > 0 ? "outline" : "secondary"} className="px-2">
                            {slot.available_seats}/{slot.total_seats}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 flex items-center gap-1 bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                              onClick={() => handleEdit(slot)}
                            >
                              <Edit size={14} /> แก้ไข
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => { setDeleteSlotId(slot.id); setOpenDeleteModal(true); }}
                            >
                              <Trash2 size={14} /> ลบ
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* โค้ดส่วน Modals จะอยู่ในข้อความถัดไป เพราะยาวเกินไป */}
      </div>
      {/* วางโค้ดนี้ก่อน </div> สุดท้ายของ component (ก่อน </div> ที่ปิด max-w-7xl) */}

        {/* Modal เพิ่ม */}
        <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">ยืนยันการเพิ่ม</DialogTitle>
              <DialogDescription>คุณต้องการเพิ่มช่วงเวลาใหม่ใช่หรือไม่?</DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 p-4 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="font-medium">แผนก:</div>
                <div>{departmentList.find(d => d.id === parseInt(selectedDepartment))?.name || '-'}</div>
                <div className="font-medium">วันที่:</div>
                <div>{slotDate ? format(new Date(slotDate), 'dd/MM/yyyy') : '-'}</div>
                <div className="font-medium pl-2">เวลา:</div>
                <div>{startTime} - {endTime}</div>
                <div className="font-medium">จำนวนที่นั่ง:</div>
                <div>{totalSeats}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenConfirmModal(false)} disabled={actionLoading}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddSlot}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? "กำลังเพิ่ม..." : "ยืนยันการเพิ่ม"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal แก้ไข */}
        <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="z-50">
            <DialogHeader>
              <DialogTitle className="text-xl">แก้ไขข้อมูล</DialogTitle>
            </DialogHeader>

            {editSlot && (
              <div className="space-y-4">
                <div className="mb-2" ref={editDateWrapRef}>
                  <Label className="mb-1 block">วันที่:</Label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={editSlot.slot_date && toDate(editSlot.slot_date)
                        ? format(toDate(editSlot.slot_date)!, 'dd/MM/yyyy')
                        : ''}
                      placeholder="เลือกวันที่"
                      className="pl-10 cursor-pointer"
                      onClick={() => setEditDateOpen((o) => !o)}
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />

                    {editDateOpen && (
                      <div className="absolute left-0 mt-2 z-[70] rounded-md border bg-white p-0 shadow-lg">
                        <Calendar
                          mode="single"
                          selected={editSlot.slot_date ? toDate(editSlot.slot_date) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setEditSlot(prev => prev ? { ...prev, slot_date: format(date, 'yyyy-MM-dd') } : prev);
                            setEditDateOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <Label className="mb-1 block">เวลาเริ่ม:</Label>
                  <div className="relative">
                    <Input type="text" placeholder="HH:mm" className="pl-10"
                      value={editSlot.start_time}
                      onChange={(e) => setEditSlot(prev => prev ? ({ ...prev, start_time: e.target.value }) : prev)} />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="mb-2">
                  <Label className="mb-1 block">เวลาสิ้นสุด:</Label>
                  <div className="relative">
                    <Input type="text" placeholder="HH:mm" className="pl-10"
                      value={editSlot.end_time}
                      onChange={(e) => setEditSlot(prev => prev ? ({ ...prev, end_time: e.target.value }) : prev)} />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block">จำนวนที่นั่ง:</Label>
                  <Input type="number" min="0" value={editSlot.total_seats}
                    onChange={(e) => setEditSlot(prev => prev ? ({ ...prev, total_seats: Number(e.target.value || 0) }) : prev)} />
                  <p className="mt-1 text-xs text-gray-600">
                    จำนวนที่จองแล้วคงเดิม: <strong>{bookedRef.current}</strong> คน
                  </p>
                  <p className="mt-1 text-xs">
                    จำนวนว่างหลังบันทึก (พรีวิว):{" "}
                    <strong>{
                      Math.max(
                        0,
                        Math.min(
                          (editSlot.total_seats ?? 0) - bookedRef.current,
                          (editSlot.total_seats ?? 0)
                        )
                      )
                    }</strong>
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditModal(false)} disabled={actionLoading}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleUpdateSlot}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal ลบ (ปกติ) */}
        <AlertDialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-red-600">ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>คุณต้องการลบช่วงเวลานี้ใช่หรือไม่? การลบข้อมูลนี้ไม่สามารถเรียกคืนได้</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? "กำลังลบ..." : "ยืนยันการลบ"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ⭐ Modal ยืนยันการลบแบบมีการจอง (ใหม่!) */}
        <AlertDialog open={openForceDeleteModal} onOpenChange={setOpenForceDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-orange-600 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                คำเตือน: มีการจองแล้ว
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="text-base">
                  ตารางเวลานี้มีการจองแล้ว{' '}
                  <span className="font-bold text-orange-600 text-lg">
                    {deleteSlotInfo?.bookedSeats}
                  </span>{' '}
                  รายการ
                </p>
                
                {deleteSlotInfo?.slotData && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm">
                    <div className="font-medium text-gray-700 mb-2">ข้อมูลตารางเวลา:</div>
                    <div className="space-y-1 text-gray-600">
                      <div>แผนก: <span className="font-medium">{deleteSlotInfo.slotData.department_name}</span></div>
                      <div>วันที่: <span className="font-medium">
                        {toDate(deleteSlotInfo.slotData.slot_date) 
                          ? format(toDate(deleteSlotInfo.slotData.slot_date)!, 'dd/MM/yyyy') 
                          : '-'}
                      </span></div>
                      <div>เวลา: <span className="font-medium">
                        {deleteSlotInfo.slotData.start_time} - {deleteSlotInfo.slotData.end_time}
                      </span></div>
                    </div>
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 font-medium text-sm">
                    ⚠️ หากคุณดำเนินการต่อ การจองทั้งหมด {deleteSlotInfo?.bookedSeats} รายการจะถูกยกเลิก
                  </p>
                </div>

                <p className="text-gray-600 font-medium pt-2">
                  คุณแน่ใจหรือไม่ที่จะลบตารางเวลานี้?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setOpenForceDeleteModal(false);
                  setDeleteSlotInfo(null);
                  setDeleteSlotId(null);
                }}
                disabled={actionLoading}
              >
                ยกเลิก
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceDelete}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? "กำลังลบ..." : "ยืนยันการลบและยกเลิกการจอง"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
