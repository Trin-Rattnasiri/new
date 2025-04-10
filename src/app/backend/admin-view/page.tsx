'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Department {
  id: number;
  name: string;
}

interface Slot {
  id: number;
  department_id: number;
  slot_date: string;
  available_seats: number;
  start_time: string;
  end_time: string;
}

interface Booking {
  id: number;
  user_name: string;
  hn: string;
  phone_number: string;
  id_card_number: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_reference_number: string;
  booking_date: string;
  department_name: string;
  start_time: string;
  end_time: string;
  slot_date: string;
}

export default function AppointmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/appointment');
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        setDepartments(data.departments);
      } catch (err) {
        setError('Error fetching departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleDepartmentChange = async (value: string) => {
    setSelectedDepartment(value);
    setSelectedSlot('');
    setBookings([]);
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: value }),
      });
      if (!response.ok) throw new Error('Failed to fetch slots');
      const data = await response.json();
      setSlots(data.slots);
    } catch (err) {
      setError('Error fetching slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = async (value: string) => {
    setSelectedSlot(value);
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDepartment,
          slotId: value,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.bookings);
    } catch (err) {
      setError('Error fetching bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const response = await fetch('/api/admin/appointment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));

      // Refresh slots
      const slotRes = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: selectedDepartment }),
      });
      if (slotRes.ok) {
        const data = await slotRes.json();
        setSlots(data.slots);
      }
    } catch (err) {
      setError('Error updating booking status');
      console.error(err);
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/appointment?bookingId=${bookingId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete booking');

      setBookings(bookings.filter(b => b.id !== bookingId));
      const slotRes = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: selectedDepartment }),
      });
      if (slotRes.ok) {
        const data = await slotRes.json();
        setSlots(data.slots);
      }
    } catch (err) {
      setError('Error deleting booking');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (str: string) => format(new Date(str), 'dd/MM/yyyy');
  const formatTime = (time: string) => time?.substring(0, 5) || 'N/A';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Appointment Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Department</label>
              <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDepartment && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <Select value={selectedSlot} onValueChange={handleSlotChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a date" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.length > 0 ? slots.map(slot => (
                      <SelectItem key={slot.id} value={slot.id.toString()}>
                        {formatDate(slot.slot_date)} ({formatTime(slot.start_time)} - {formatTime(slot.end_time)}) - {slot.available_seats} seats
                      </SelectItem>
                    )) : <SelectItem value="none" disabled>No available slots</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedSlot && (
              <div>
                <h3 className="text-lg font-medium mb-4">Bookings</h3>
                {bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>HN</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID Card</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.booking_reference_number}</TableCell>
                          <TableCell>{b.user_name}</TableCell>
                          <TableCell>{b.hn}</TableCell>
                          <TableCell>{b.phone_number}</TableCell>
                          <TableCell>{b.id_card_number}</TableCell>
                          <TableCell>{formatDate(b.booking_date)}</TableCell>
                          <TableCell>{formatTime(b.start_time)} - {formatTime(b.end_time)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {['pending', 'confirmed', 'cancelled'].filter(s => s !== b.status).map(s => (
                                <Button
                                  key={s}
                                  variant="outline"
                                  size="sm"
                                  className={`bg-${s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'yellow'}-50 text-${s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'yellow'}-700 hover:bg-${s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'yellow'}-100`}
                                  onClick={() => updateBookingStatus(b.id, s as any)}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Button>
                              ))}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="bg-gray-50 text-gray-700 hover:bg-gray-100">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this booking?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteBooking(b.id)} disabled={isDeleting}>
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-gray-500">No bookings found for this slot</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
