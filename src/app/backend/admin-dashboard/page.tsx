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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState<number>(0);
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [deptRes, slotsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/admin/slots')
        ]);
        
        if (!deptRes.ok || !slotsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const deptData = await deptRes.json();
        const slotsData = await slotsRes.json();
        
        setDepartmentList(deptData);
        setSlotList(slotsData.slots || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/slots');
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlotList(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!selectedDepartment) {
      setFormError('กรุณาเลือกแผนก');
      return false;
    }
    if (!slotDate) {
      setFormError('กรุณาเลือกวันที่');
      return false;
    }
    if (!startTime || !(/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime))) {
      setFormError('กรุณาระบุเวลาเริ่มให้ถูกต้อง (รูปแบบ HH:MM)');
      return false;
    }
    if (!endTime || !(/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime))) {
      setFormError('กรุณาระบุเวลาสิ้นสุดให้ถูกต้อง (รูปแบบ HH:MM)');
      return false;
    }
    if (availableSeats <= 0) {
      setFormError('จำนวนที่นั่งต้องมากกว่า 0');
      return false;
    }
    
    // ตรวจสอบเวลาเริ่มต้นน้อยกว่าเวลาสิ้นสุด
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    if (start[0] > end[0] || (start[0] === end[0] && start[1] >= end[1])) {
      setFormError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
      return false;
    }
    
    setFormError(null);
    return true;
  };

  const handleAddSlot = async () => {
    if (!validateForm()) return;
    
    try {
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
      
      if (!res.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      }
      
      setOpenConfirmModal(false);
      resetForm();
      fetchSlots();
      alert('เพิ่มข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error adding slot:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  };

  const resetForm = () => {
    setSelectedDepartment('');
    setSlotDate('');
    setStartTime('');
    setEndTime('');
    setAvailableSeats(0);
    setFormError(null);
  };

  const handleDelete = async () => {
    if (!deleteSlotId) return;
    
    try {
      const res = await fetch(`/api/admin/slots?slotId=${deleteSlotId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete slot');
      }
      
      setOpenDeleteModal(false);
      setDeleteSlotId(null);
      fetchSlots();
      alert('ลบข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleEdit = (slot: Slot) => {
    setEditSlot(slot);
    setOpenEditModal(true);
  };

  const handleUpdateSlot = async () => {
    if (!editSlot) return;
    
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
      alert('อัปเดตข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error updating slot:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const filteredSlots = filterDepartment 
    ? slotList.filter(slot => {
        const dept = departmentList.find(d => d.id === parseInt(filterDepartment));
        return slot.department_name === (dept?.name || '');
      })
    : slotList;

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการตารางเวลา</h1>
            <Button 
  onClick={fetchSlots}
  variant="default"
  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
>
  <RefreshCw size={16} />
  รีเฟรช
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
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !slotDate && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {slotDate ? format(new Date(slotDate), 'dd/MM/yyyy') : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={slotDate ? new Date(slotDate) : undefined}
                        onSelect={(date) => date && setSlotDate(format(date, 'yyyy-MM-dd'))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-gray-700">เวลาเริ่ม:</Label>
                  <div className="relative">
                    <Input
                      id="start-time"
                      type="text"
                      placeholder="เช่น 08:00"
                      pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-gray-700">เวลาสิ้นสุด:</Label>
                  <div className="relative">
                    <Input
                      id="end-time"
                      type="text"
                      placeholder="เช่น 14:30"
                      pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seats" className="text-gray-700">จำนวนที่จะเปิดให้จอง:</Label>
                  <Input 
                    id="seats"
                    type="number" 
                    min="1"
                    value={availableSeats || ''} 
                    onChange={(e) => setAvailableSeats(Number(e.target.value))} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">

              <Button
                onClick={() => {
                  if (validateForm()) {
                    setOpenConfirmModal(true);
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={16} />
                เพิ่มเวลา
              </Button>
            </CardFooter>
          </Card>
  
          {/* ส่วนแสดงตาราง */}
          <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b bg-white">

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <CardTitle className="text-xl text-gray-800">ตารางเวลาทั้งหมด</CardTitle>
                <div className="w-full sm:w-64">
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="กรองตามแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ทุกแผนก</SelectItem>
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
                <div className="flex justify-center items-center py-20 text-gray-500">
                  ไม่พบข้อมูลตารางเวลา
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">วันที่</TableHead>
                        <TableHead className="font-semibold">แผนก</TableHead>
                        <TableHead className="font-semibold">เวลา</TableHead>
                        <TableHead className="font-semibold text-center">จำนวนที่นั่งว่าง</TableHead>
                        <TableHead className="font-semibold text-right">การจัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSlots.map((slot) => (
                        <TableRow key={slot.id} className="hover:bg-gray-50">
                          <TableCell>{format(new Date(slot.slot_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{slot.department_name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex items-center">
                              <Clock size={14} className="mr-1 text-gray-500" />
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={slot.available_seats > 0 ? "outline" : "secondary"} className="px-2">
                              {slot.available_seats}
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
                                <Edit size={14} />
                                แก้ไข
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 px-2 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => {
                                  setDeleteSlotId(slot.id);
                                  setOpenDeleteModal(true);
                                }}
                              >
                                <Trash2 size={14} />
                                ลบ
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
  
          {/* Modal เพิ่ม */}
          <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl">ยืนยันการเพิ่ม</DialogTitle>
                <DialogDescription>
                  คุณต้องการเพิ่มช่วงเวลาใหม่ใช่หรือไม่?
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-gray-50 p-4 rounded-md text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="font-medium">แผนก:</div>
                  <div>{departmentList.find(d => d.id === parseInt(selectedDepartment))?.name || '-'}</div>
                  
                  <div className="font-medium">วันที่:</div>
                  <div>{slotDate ? format(new Date(slotDate), 'dd/MM/yyyy') : '-'}</div>
                  
                  <div className="font-medium">เวลา:</div>
                  <div>{startTime} - {endTime}</div>
                  
                  <div className="font-medium">จำนวนที่นั่ง:</div>
                  <div>{availableSeats}</div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenConfirmModal(false)}>ยกเลิก</Button>
                <Button onClick={handleAddSlot} className="bg-blue-600 hover:bg-blue-700 text-white">ยืนยันการเพิ่ม</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  
          {/* Modal แก้ไข */}
          <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl">แก้ไขข้อมูล</DialogTitle>
              </DialogHeader>
              {editSlot && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <Label className="mb-1 block">วันที่:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editSlot.slot_date && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editSlot.slot_date ? format(new Date(editSlot.slot_date), 'dd/MM/yyyy') : "เลือกวันที่"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editSlot.slot_date ? new Date(editSlot.slot_date) : undefined}
                          onSelect={(date) => date && setEditSlot({ ...editSlot, slot_date: format(date, 'yyyy-MM-dd') })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="mb-2">
                    <Label className="mb-1 block">เวลาเริ่ม:</Label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="HH:mm" 
                        className="pl-10"
                        value={editSlot.start_time} 
                        onChange={(e) => setEditSlot({ ...editSlot, start_time: e.target.value })} 
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <Label className="mb-1 block">เวลาสิ้นสุด:</Label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="HH:mm" 
                        className="pl-10"
                        value={editSlot.end_time} 
                        onChange={(e) => setEditSlot({ ...editSlot, end_time: e.target.value })} 
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-1 block">จำนวนที่นั่ง:</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={editSlot.available_seats} 
                      onChange={(e) => setEditSlot({ ...editSlot, available_seats: Number(e.target.value) })} 
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenEditModal(false)}>ยกเลิก</Button>
                <Button onClick={handleUpdateSlot} className="bg-green-600 hover:bg-green-700 text-white">บันทึกการแก้ไข</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  
          {/* Modal ลบ */}
          <AlertDialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl text-red-600">ยืนยันการลบ</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบช่วงเวลานี้ใช่หรือไม่? การลบข้อมูลนี้ไม่สามารถเรียกคืนได้
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  ยืนยันการลบ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };
  
  export default AdminDashboard;
