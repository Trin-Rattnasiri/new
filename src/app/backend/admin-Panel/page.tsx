'use client';

import { useEffect, useState, useMemo } from 'react';
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
import Select from 'react-select';
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

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'ยืนยันแล้ว',
  pending: 'รอดำเนินการ',
  cancelled: 'ยกเลิกแล้ว',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bookingRes, slotRes] = await Promise.all([
          fetch('/api/admin/appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }),
          fetch('/api/admin/slots'),
        ]);

        if (!bookingRes.ok || !slotRes.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');

        const bookingData = await bookingRes.json();
        const slotData = await slotRes.json();

        setBookings(bookingData.bookings || []);
        setSlots(slotData.slots || []);
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const departmentOptions = useMemo(
    () => [
      { value: '', label: 'ทุกแผนก' },
      ...Array.from(new Set(bookings.map((b) => b.department_name))).map((dept) => ({
        value: dept,
        label: dept,
      })),
    ],
    [bookings]
  );

  const filteredBookings = departmentFilter
    ? bookings.filter((b) => b.department_name === departmentFilter)
    : bookings;

  const sortedSlotList = [...slots].sort(
    (a, b) => new Date(a.slot_date).getTime() - new Date(b.slot_date).getTime()
  );

  const confirmStatusChange = async () => {
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
    } finally {
      setOpenConfirmModal(false);
      setSelectedBookingId(null);
      setSelectedStatus(null);
    }
  };

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return;
    try {
      const res = await fetch(`/api/admin/appointment?bookingId=${selectedBookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOpenDeleteModal(false);
      setSelectedBookingId(null);
    }
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="shadow-lg">
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
                  {sortedSlotList.map((slot) => (
                    <TableRow key={slot.id}>
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

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <CardTitle className="text-2xl font-bold text-gray-800">รายการนัดหมาย</CardTitle>
          
          </div>
            <div className="w-full sm:w-64">
              <Select
                options={departmentOptions}
                onChange={(selected) => setDepartmentFilter(selected?.value || '')}
                value={departmentOptions.find((opt) => opt.value === departmentFilter)}
                placeholder="เลือกแผนก"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
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
                  {filteredBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.department_name}</TableCell>
                      <TableCell>{format(new Date(b.slot_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{`${b.start_time} - ${b.end_time}`}</TableCell>
                      <TableCell>{b.user_name}</TableCell>
                      <TableCell>{b.phone_number}</TableCell>
                      <TableCell>{b.hn}</TableCell>
                      <TableCell>{b.booking_reference_number}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => { setSelectedBookingId(b.id); setSelectedStatus('confirmed'); setOpenConfirmModal(true); }}>ยืนยัน</Button>
                        <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => { setSelectedBookingId(b.id); setSelectedStatus('pending'); setOpenConfirmModal(true); }}>รอดำเนินการ</Button>
                        <Button size="sm" onClick={() => { setSelectedBookingId(b.id); setOpenDeleteModal(true); }} className="bg-red-600 text-white">ยกเลิก</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
              <DialogDescription>คุณแน่ใจว่าต้องการลบรายการนี้?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenDeleteModal(false)} variant="outline">ยกเลิก</Button>
              <Button onClick={deleteConfirmed} className="bg-red-600 text-white">ลบ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
              <DialogDescription>คุณต้องการเปลี่ยนสถานะเป็น {STATUS_LABELS[selectedStatus || '']}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenConfirmModal(false)} variant="outline">ยกเลิก</Button>
              <Button onClick={confirmStatusChange} className="bg-blue-600 text-white">ยืนยัน</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}