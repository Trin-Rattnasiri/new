'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';  // For loading spinner icon (optional)

interface Department {
  id: number;
  name: string;
}

interface Booking {
  booking_reference_number: string;
  user_name: string;
  status: string;
  start_time: string;
  end_time: string;
}

interface Date {
  available_date: string;
}

const AdminSearchPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/view_booking');
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        setDepartments(data.departments);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleDepartmentSelect = async (departmentId: number) => {
    setSelectedDepartment(departmentId);
    setAvailableDates([]);
    setSelectedDate('');
    setBookings([]);
    setIsLoading(true);
    try {
      // Fetch available dates for the selected department
      const res = await fetch('/api/admin/view_booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: departmentId })
      });
      if (!res.ok) throw new Error('Failed to fetch available dates');
      const data = await res.json();
      setAvailableDates(data.dates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setIsLoading(true);
    try {
      // Format the selected date to 'YYYY-MM-DD' (no time part)
      const formattedDate = new Date(date).toISOString().split('T')[0]; // Extracts '2025-03-24'

      // Fetch bookings for the selected department and formatted date
      const res = await fetch(`/api/admin/view_booking/bookings?department_id=${selectedDepartment}&selected_date=${formattedDate}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data.bookings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Booking Management</h1>

      {/* Department Selection */}
      <div>
        <h2 className="text-2xl mb-4">Select Department</h2>
        <div className="flex flex-wrap gap-4">
          {departments.map((department) => (
            <Button
              key={department.id}
              onClick={() => handleDepartmentSelect(department.id)}
              className="w-28"
            >
              {department.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Available Dates */}
      {selectedDepartment && (
        <div>
          <h2 className="text-2xl mt-8 mb-4">Available Dates</h2>
          <div>
            {availableDates.length === 0 ? (
              <p>No available dates for this department.</p>
            ) : (
              <div>
                {availableDates.map((date) => (
                  <Button
                    key={date.available_date}
                    onClick={() => handleDateSelect(date.available_date)}
                    className="w-28 mb-4"
                  >
                    {new Date(date.available_date).toLocaleDateString()}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings for the selected date */}
      {selectedDate && (
        <div>
          <h2 className="text-2xl mt-8 mb-4">Bookings for {new Date(selectedDate).toLocaleDateString()}</h2>
          {bookings.length === 0 ? (
            <p>No bookings for this date.</p>
          ) : (
            <div>
              {bookings.map((booking) => (
                <Card key={booking.booking_reference_number} className="mb-4">
                  <p>Reference: {booking.booking_reference_number}</p>
                  <p>User: {booking.user_name}</p>
                  <p>Time: {booking.start_time} - {booking.end_time}</p>
                  <p>Status: {booking.status}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <Loader2 className="animate-spin mx-auto mt-4" size={30} />}
      {error && <div className="text-red-500 text-center mt-4">{error}</div>}
    </div>
  );
};

export default AdminSearchPage;
