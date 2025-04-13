'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import Select from 'react-select';
import { format, isToday, isThisWeek } from 'date-fns';

import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  FileTextIcon,
  HashIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  LayoutGrid, // ✅ ใช้แทน ThLarge
} from 'lucide-react';

import { Toaster, toast } from 'sonner'; // ✅ ใช้ครั้งเดียวพอ



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

const STATUS_ICONS = {
  confirmed: CheckCircle,
  pending: AlertCircle,
  cancelled: XCircle,
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('bookings');

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [bookingRes, slotRes] = await Promise.all([
        fetch('/api/admin/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        fetch('/api/admin/slots'),
      ]);

      if (!bookingRes.ok || !slotRes.ok) {
        throw new Error('โหลดข้อมูลไม่สำเร็จ');
      }

      const bookingData = await bookingRes.json();
      const slotData = await slotRes.json();

      setBookings(bookingData.bookings || []);
      setSlots(slotData.slots || []);
      
      if (refreshing) {
        toast.success('รีเฟรชข้อมูลสำเร็จ');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      if (refreshing) {
        toast.error('ไม่สามารถรีเฟรชข้อมูลได้');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const statusOptions = [
    { value: '', label: 'ทุกสถานะ' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'cancelled', label: 'ยกเลิกแล้ว' },
  ];

  const timeOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'today', label: 'วันนี้' },
    { value: 'week', label: 'สัปดาห์นี้' },
  ];

  const filteredBookings = bookings.filter((booking) => {
    // Department filter
    if (departmentFilter && booking.department_name !== departmentFilter) return false;
    
    // Status filter
    if (statusFilter && booking.status !== statusFilter) return false;
    
    // Time filter
    if (timeFilter === 'today' && !isToday(new Date(booking.slot_date))) return false;
    if (timeFilter === 'week' && !isThisWeek(new Date(booking.slot_date))) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.user_name.toLowerCase().includes(query) ||
        booking.phone_number.includes(query) ||
        booking.hn.includes(query) ||
        booking.booking_reference_number.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const sortedSlotList = [...slots].sort(
    (a, b) => new Date(a.slot_date).getTime() - new Date(b.slot_date).getTime()
  );

  const confirmStatusChange = async () => {
    if (!selectedBookingId || !selectedStatus) return;
    
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/appointment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBookingId, status: selectedStatus }),
      });
      
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBookingId ? { ...b, status: selectedStatus } : b))
        );
        
        toast.success(`เปลี่ยนสถานะเป็น "${STATUS_LABELS[selectedStatus]}" สำเร็จ`);
      } else {
        toast.error('อัปเดตสถานะไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setOpenConfirmModal(false);
      setSelectedBookingId(null);
      setSelectedStatus(null);
      setRefreshing(false);
    }
  };

  const deleteConfirmed = async () => {
    if (!selectedBookingId) return;
    
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/appointment?bookingId=${selectedBookingId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
        toast.success('ลบรายการนัดหมายสำเร็จ');
      } else {
        toast.error('ลบรายการไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setOpenDeleteModal(false);
      setSelectedBookingId(null);
      setRefreshing(false);
    }
  };

  // คำนวณสถิติ
  const stats = useMemo(() => {
    const today = new Date();
    
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const todayBookings = bookings.filter(b => isToday(new Date(b.slot_date))).length;
    
    const totalSlots = slots.reduce((acc, slot) => acc + slot.available_seats, 0);
    
    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      todayBookings,
      totalSlots
    };
  }, [bookings, slots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="mx-auto">
            <RefreshCw className="mr-2 h-4 w-4" /> ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการตารางนัดหมาย</h1>
            <p className="text-gray-500 mt-1">จัดการการนัดหมายและตารางเวลาสำหรับทุกแผนก</p>
          </div>
          <Button onClick={fetchData} disabled={refreshing} className="mt-4 sm:mt-0">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* แถวที่ 1 */}
  <Card className="bg-white shadow rounded-xl w-full">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">นัดหมายทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
        </div>
        <LayoutGrid className="h-6 w-6 text-blue-500 opacity-80" />
      </div>
    </CardContent>
  </Card>

  <Card className="bg-white shadow rounded-xl w-full">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">นัดหมายวันนี้</p>
          <p className="text-2xl font-bold text-blue-600">{stats.todayBookings}</p>
        </div>
        <Calendar className="h-6 w-6 text-blue-500 opacity-80" />
      </div>
    </CardContent>
  </Card>

  {/* แถวที่ 2 */}
  <Card className="bg-white shadow rounded-xl w-full">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">ยืนยันแล้ว</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
        </div>
        <CheckCircle className="h-6 w-6 text-green-500 opacity-80" />
      </div>
    </CardContent>
  </Card>

  <Card className="bg-white shadow rounded-xl w-full">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">รอดำเนินการ</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
        </div>
        <AlertCircle className="h-6 w-6 text-yellow-500 opacity-80" />
      </div>
    </CardContent>
  </Card>
</div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bookings" className="text-base py-3">
              <UserIcon className="mr-2 h-4 w-4" /> รายการนัดหมาย
            </TabsTrigger>
            <TabsTrigger value="slots" className="text-base py-3">
              <CalendarIcon className="mr-2 h-4 w-4" /> ตารางเวลา
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">รายการนัดหมาย</CardTitle>
                <CardDescription>จัดการรายการนัดหมายทั้งหมดในระบบ</CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="ค้นหาชื่อ, เบอร์โทร, HN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select
                    options={departmentOptions}
                    onChange={(selected) => setDepartmentFilter(selected?.value || '')}
                    value={departmentOptions.find((opt) => opt.value === departmentFilter)}
                    placeholder="แผนก"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  
                  <Select
                    options={statusOptions}
                    onChange={(selected) => setStatusFilter(selected?.value || '')}
                    value={statusOptions.find((opt) => opt.value === statusFilter)}
                    placeholder="สถานะ"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  
                  <Select
                    options={timeOptions}
                    onChange={(selected) => setTimeFilter(selected?.value || 'all')}
                    value={timeOptions.find((opt) => opt.value === timeFilter)}
                    placeholder="ช่วงเวลา"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">ไม่พบรายการนัดหมาย</p>
                    <p className="text-sm text-gray-400 mt-1">ลองปรับเงื่อนไขการค้นหาหรือล้างตัวกรอง</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>แผนก</TableHead>
                          <TableHead>วันที่</TableHead>
                          <TableHead>เวลา</TableHead>
                          <TableHead>ชื่อ</TableHead>
                          <TableHead>เบอร์โทร</TableHead>
                          <TableHead>HN</TableHead>
                          <TableHead>อ้างอิง</TableHead>
                          <TableHead className="text-right">การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((b) => {
                          const StatusIcon = STATUS_ICONS[b.status] || AlertCircle;
                          
                          return (
                            <TableRow key={b.id}>
                              <TableCell>
                                <Badge className={STATUS_COLORS[b.status]}>
                                  <StatusIcon className="mr-1 h-4 w-4 inline-block" />
                                  {STATUS_LABELS[b.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{b.department_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {format(new Date(b.slot_date), 'dd/MM/yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <ClockIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {`${b.start_time} - ${b.end_time}`}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <UserIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.user_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <PhoneIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.phone_number}
                                </div>
                              </TableCell>
                              <TableCell>{b.hn}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <HashIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {b.booking_reference_number}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 text-white hover:bg-green-700 px-3" 
                                    onClick={() => { 
                                      setSelectedBookingId(b.id); 
                                      setSelectedStatus('confirmed'); 
                                      setOpenConfirmModal(true); 
                                    }}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    ยืนยัน
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-yellow-400 text-black hover:bg-yellow-500 px-3"
                                    onClick={() => { 
                                      setSelectedBookingId(b.id); 
                                      setSelectedStatus('pending'); 
                                      setOpenConfirmModal(true); 
                                    }}
                                  >
                                    <AlertCircle className="mr-1 h-4 w-4" />
                                    รอดำเนินการ
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-red-600 text-white hover:bg-red-700 px-3"
                                    onClick={() => { 
                                      setSelectedBookingId(b.id); 
                                      setOpenDeleteModal(true); 
                                    }}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    ยกเลิก
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slots">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">ตารางเวลาที่เปิดให้จอง</CardTitle>
                <CardDescription>รายการช่วงเวลาที่เปิดให้จองและจำนวนที่นั่งทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedSlotList.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">ไม่มีตารางเวลา</p>
                    <p className="text-sm text-gray-400 mt-1">ยังไม่มีการกำหนดตารางเวลาสำหรับการนัดหมาย</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>แผนก</TableHead>
                          <TableHead>วันที่</TableHead>
                          <TableHead>เวลา</TableHead>
                          <TableHead>จำนวนที่นั่งว่าง</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSlotList.map((slot) => {
                          const isAvailable = slot.available_seats > 0;
                          const slotDate = new Date(slot.slot_date);
                          const isPast = slotDate < new Date();
                          
                          let statusBadge;
                          if (isPast) {
                            statusBadge = <Badge className="bg-gray-100 text-gray-800">ผ่านไปแล้ว</Badge>;
                          } else if (!isAvailable) {
                            statusBadge = <Badge className="bg-red-100 text-red-800">เต็ม</Badge>;
                          } else if (isToday(slotDate)) {
                            statusBadge = <Badge className="bg-blue-100 text-blue-800">วันนี้</Badge>;
                          } else {
                            statusBadge = <Badge className="bg-green-100 text-green-800">เปิดจอง</Badge>;
                          }
                          
                          return (
                            <TableRow key={slot.id} className={isPast ? "opacity-60" : ""}>
                              <TableCell className="font-medium">{slot.department_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {format(slotDate, 'dd/MM/yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <ClockIcon className="mr-1 h-4 w-4 text-gray-500" />
                                  {`${slot.start_time} - ${slot.end_time}`}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={
                                  slot.available_seats > 5 
                                    ? "text-green-600 font-medium" 
                                    : slot.available_seats > 0 
                                      ? "text-yellow-600 font-medium"
                                      : "text-red-600 font-medium"
                                }>
                                  {slot.available_seats}
                                </span> ที่นั่ง
                              </TableCell>
                              <TableCell>{statusBadge}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการยกเลิกนัดหมาย</DialogTitle>
              <DialogDescription>
                คุณแน่ใจว่าต้องการยกเลิกรายการนัดหมายนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenDeleteModal(false)} variant="outline">ยกเลิกการทำรายการ</Button>
              <Button onClick={deleteConfirmed} className="bg-red-600 text-white hover:bg-red-700">
                <XCircle className="mr-2 h-4 w-4" />
                ยืนยันการยกเลิกนัดหมาย
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
              <DialogDescription>
                คุณต้องการเปลี่ยนสถานะการนัดหมายเป็น "{STATUS_LABELS[selectedStatus || '']}" ใช่หรือไม่?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpenConfirmModal(false)} variant="outline">ยกเลิก</Button>
              <Button onClick={confirmStatusChange} className="bg-blue-600 text-white hover:bg-blue-700">
                ยืนยันการเปลี่ยนสถานะ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}