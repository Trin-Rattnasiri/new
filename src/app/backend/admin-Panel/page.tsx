'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, FileTextIcon, HashIcon } from 'lucide-react';

interface Booking {
  id: number;
  booking_reference_number: string;
  user_name: string;
  phone_number: string;
  id_card_number: string;
  hn: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  department_name: string;
  status: string;
}

interface Slot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  available_seats: number;
  department_name: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotList, setSlotList] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอดำเนินการ';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const resBookings = await fetch('/api/admin/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const resSlots = await fetch('/api/admin/slots');

        if (!resBookings.ok || !resSlots.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');

        const dataBookings = await resBookings.json();
        const dataSlots = await resSlots.json();

        setBookings(dataBookings.bookings || []);
        setSlotList(dataSlots.slots || []);
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const confirmStatusChange = (id: number, status: string) => {
    setSelectedBookingId(id);
    setSelectedStatus(status);
    setOpenConfirmModal(true);
  };

  const changeConfirmedStatus = async () => {
    if (!selectedBookingId || !selectedStatus) return;
    try {
      const res = await fetch('/api/admin/appointment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBookingId, status: selectedStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBookingId ? { ...b, status: selectedStatus } : b))
        );
      } else {
        alert('อัปเดตสถานะไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setOpenConfirmModal(false);
      setSelectedBookingId(null);
      setSelectedStatus(null);
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedBookingId(id);
    setOpenDeleteModal(true);
  };

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return;
    try {
      const res = await fetch(`/api/admin/appointment?bookingId=${selectedBookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      } else {
        alert('ลบไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะลบ');
    } finally {
      setOpenDeleteModal(false);
      setSelectedBookingId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600 animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">แผนกที่เปิด</h1>
        </div>

        {/* Slots Table */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">ตารางนัดหมาย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>แผนก</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>จำนวนที่นั่งว่าง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slotList.map((slot) => (
                    <TableRow key={slot.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>{slot.department_name}</TableCell>
                      <TableCell>{format(new Date(slot.slot_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{`${slot.start_time} - ${slot.end_time}`}</TableCell>
                      <TableCell>{slot.available_seats}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">รายการจองทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>แผนก</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>HN</TableHead>
                    <TableHead>อ้างอิง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>{b.department_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {format(new Date(b.slot_date), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          {`${b.start_time} - ${b.end_time}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          {b.user_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          {b.phone_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4 text-gray-400" />
                          {b.hn}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HashIcon className="w-4 h-4 text-gray-400" />
                          {b.booking_reference_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(b.status)}>{getStatusLabel(b.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => confirmStatusChange(b.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          ยืนยัน
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => confirmStatusChange(b.id, 'pending')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          รอดำเนินการ
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => confirmDelete(b.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          ยกเลิก
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการจองนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={deleteConfirmed}
              >
                ลบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Confirmation Modal */}
        <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะเป็น{' '}
                <strong>{getStatusLabel(selectedStatus || '')}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenConfirmModal(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={changeConfirmedStatus}
              >
                ยืนยัน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}