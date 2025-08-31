'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';


interface Department {
  id: number;
  name: string;
}

interface SlotDate {
  slot_date: string;
}

interface Booking {
  id: number;
  user_name: string;
  phone_number: string;
  id_card_number: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_reference_number: string;
  booking_date: string;
  department_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

export default function ViewBookingsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<SlotDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Fetch departments on page load
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/departments');

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setDepartments(data.data);
        } else {
          setError('Failed to load departments: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        setError('An error occurred while fetching departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch available dates when department is selected
  useEffect(() => {
    if (!selectedDepartment) return;

    const fetchDates = async () => {
      try {
        setLoading(true);
        setSelectedDate(null);
        setBookings([]);
        setError(null);

        const response = await fetch(`/api/admin/viewbook?action=getDepartmentDates&departmentId=${selectedDepartment}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setAvailableDates(data.data);
          if (data.data.length === 0) {
            console.log('No dates found for department', selectedDepartment);
          }
        } else {
          setError('Failed to load dates: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        setError('An error occurred while fetching dates');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, [selectedDepartment]);

  // Fetch bookings when date is selected
  useEffect(() => {
    if (!selectedDepartment || !selectedDate) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/viewbook?action=getBookings&departmentId=${selectedDepartment}&slotDate=${selectedDate}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setBookings(data.data);
          if (data.data.length === 0) {
            console.log(`No bookings found for department ${selectedDepartment} and date ${selectedDate}`);
          } else {
            console.log(`Found ${data.data.length} bookings`);
          }
        } else {
          setError('Failed to load bookings: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        setError('An error occurred while fetching bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDepartment, selectedDate]);

  // Fetch all bookings for debugging
  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/viewbook?action=getAllBookings`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAllBookings(data.data);
        console.log("All bookings:", data.data);
      } else {
        setError('Failed to load all bookings: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('An error occurred while fetching all bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';

    try {
      // Use parseISO to handle ISO format dates properly
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Date format error:', error);
      return dateString; // Return original if formatting fails
    }
  };

  // Handle department selection
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      setSelectedDepartment(null);
      setAvailableDates([]);
      setSelectedDate(null);
      setBookings([]);
    } else {
      const departmentId = parseInt(val);
      setSelectedDepartment(departmentId);
    }
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      fetchAllBookings();
    }
  };

  // Format time for display (HH:MM)
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return 'ไม่ระบุ';
    return timeString.substring(0, 5);
  };

  // Get status display text and class
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: 'ยืนยันแล้ว', className: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { text: 'ยกเลิก', className: 'bg-red-100 text-red-800' };
      default:
        return { text: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">ระบบดูการจองคิว</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Department Selection */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">เลือกแผนก</label>
          <select 
            className="w-full px-4 py-2 border rounded-md"
            onChange={handleDepartmentChange}
            value={selectedDepartment || ''}
            disabled={loading}
          >
            <option value="">-- เลือกแผนก --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">เลือกวันที่</label>
          <select 
            className="w-full px-4 py-2 border rounded-md"
            onChange={handleDateChange}
            value={selectedDate || ''}
            disabled={!selectedDepartment || availableDates.length === 0 || loading}
          >
            <option value="">-- เลือกวันที่ --</option>
            {availableDates.map((date, index) => (
              <option key={index} value={date.slot_date}>
                {formatDate(date.slot_date)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debug Button */}
      <div className="my-4">
        <button 
          onClick={toggleDebugMode} 
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          {debugMode ? 'ปิดโหมดตรวจสอบ' : 'เปิดโหมดตรวจสอบ'}
        </button>
      </div>

      {/* Debug Info */}
      {debugMode && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold mb-2">ข้อมูลการจองทั้งหมดในระบบ</h3>

          {allBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">ชื่อผู้จอง</th>
                    <th className="px-4 py-2 border">แผนก</th>
                    <th className="px-4 py-2 border">Slot ID</th>
                    <th className="px-4 py-2 border">วันที่ของ Slot</th>
                    <th className="px-4 py-2 border">วันที่จอง</th>
                    <th className="px-4 py-2 border">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-2 border">{booking.id}</td>
                      <td className="px-4 py-2 border">{booking.user_name}</td>
                      <td className="px-4 py-2 border">{booking.department_name || booking.department_id}</td>
                      <td className="px-4 py-2 border">{booking.slot_id}</td>
                      <td className="px-4 py-2 border">{booking.slot_date ? formatDate(booking.slot_date) : 'ไม่ระบุ'}</td>
                      <td className="px-4 py-2 border">{formatDate(booking.booking_date)}</td>
                      <td className="px-4 py-2 border">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusDisplay(booking.status).className}`}>
                          {getStatusDisplay(booking.status).text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>ไม่พบข้อมูลการจองในระบบ</p>
          )}

          <div className="mt-4">
            <h4 className="font-medium">สถานะปัจจุบัน:</h4>
            <p>แผนกที่เลือก: {selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : 'ไม่ได้เลือก'}</p>
            <p>วันที่เลือก: {selectedDate ? formatDate(selectedDate) : 'ไม่ได้เลือก'}</p>
            <p>จำนวนวันที่ที่พบ: {availableDates.length}</p>
            <p>จำนวนการจองที่พบ: {bookings.length}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Bookings Table */}
      {selectedDate && bookings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            รายการจองของวันที่ {formatDate(selectedDate)}
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">ลำดับ</th>
                  <th className="px-4 py-2 border">เลขอ้างอิง</th>
                  <th className="px-4 py-2 border">ชื่อผู้จอง</th>
                  <th className="px-4 py-2 border">เบอร์โทรศัพท์</th>
                  <th className="px-4 py-2 border">เลขบัตรประชาชน</th>
                  <th className="px-4 py-2 border">เวลาเริ่ม-สิ้นสุด</th>
                  <th className="px-4 py-2 border">วันที่จอง</th>
                  <th className="px-4 py-2 border">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2 border text-center">{index + 1}</td>
                    <td className="px-4 py-2 border">{booking.booking_reference_number || '-'}</td>
                    <td className="px-4 py-2 border">{booking.user_name}</td>
                    <td className="px-4 py-2 border">{booking.phone_number || '-'}</td>
                    <td className="px-4 py-2 border">{booking.id_card_number || '-'}</td>
                    <td className="px-4 py-2 border text-center">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusDisplay(booking.status).className}`}>
                        {getStatusDisplay(booking.status).text}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Bookings Message */}
      {selectedDate && bookings.length === 0 && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <p className="text-yellow-700">ไม่พบข้อมูลการจองสำหรับวันที่ {formatDate(selectedDate)}</p>
        </div>
      )}
    </div>
  );
}