// src/app/admin/appointment/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Types
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

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/appointment');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data.departments);
        setLoading(false);
      } catch (err) {
        setError('Error fetching departments');
        setLoading(false);
        console.error(err);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch slots when department is selected
  const handleDepartmentChange = async (value: string) => {
    setSelectedDepartment(value);
    setSelectedSlot('');
    setBookings([]);
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentId: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      
      const data = await response.json();
      setSlots(data.slots);
      setLoading(false);
    } catch (err) {
      setError('Error fetching slots');
      setLoading(false);
      console.error(err);
    }
  };

  // Fetch bookings when slot is selected
  const handleSlotChange = async (value: string) => {
    setSelectedSlot(value);
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          departmentId: selectedDepartment,
          slotId: value 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings);
      setLoading(false);
    } catch (err) {
      setError('Error fetching bookings');
      setLoading(false);
      console.error(err);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: number, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const response = await fetch('/api/admin/appointment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingId,
          status 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }
      
      // Update the local state after successful update
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
    } catch (err) {
      setError('Error updating booking status');
      console.error(err);
    }
  };

  // Delete booking
  const deleteBooking = async (bookingId: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/appointment?bookingId=${bookingId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      // Remove the deleted booking from the state
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      setIsDeleting(false);
    } catch (err) {
      setError('Error deleting booking');
      setIsDeleting(false);
      console.error(err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return 'N/A';
    return timeString.substring(0, 5);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
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
            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Department</label>
              <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date/Slot Selection */}
            {selectedDepartment && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <Select value={selectedSlot} onValueChange={handleSlotChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a date" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.length > 0 ? (
                      slots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {formatDate(slot.slot_date)} ({formatTime(slot.start_time)} - {formatTime(slot.end_time)}) - {slot.available_seats} seats
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No available slots</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bookings Table */}
            {selectedSlot && (
              <div>
                <h3 className="text-lg font-medium mb-4">Bookings</h3>
                {bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID Card</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.booking_reference_number || 'N/A'}</TableCell>
                          <TableCell>{booking.user_name}</TableCell>
                          <TableCell>{booking.phone_number}</TableCell>
                          <TableCell>{booking.id_card_number}</TableCell>
                          <TableCell>{formatDate(booking.booking_date)}</TableCell>
                          <TableCell>
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {booking.status !== 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                  onClick={() => updateBookingStatus(booking.id, 'pending')}
                                >
                                  Pending
                                </Button>
                              )}
                              {booking.status !== 'confirmed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                              )}
                              {booking.status !== 'cancelled' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this booking? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteBooking(booking.id)}
                                      disabled={isDeleting}
                                    >
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
                ) : (
                  <p className="text-gray-500">No bookings found for this slot</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}