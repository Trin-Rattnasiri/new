'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';  // For loading spinner icon (optional)

interface Booking {
  booking_reference_number: string;
  user_name: string;
  department_name: string;
  start_time: string;
  end_time: string;
  booking_date: string; // Added booking_date to the interface
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Function to format the date as dd/mm/yyyy in Thai Buddhist Era (B.E.)
const formatBookingDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  const year = date.getFullYear() + 543; // Convert to Thai Buddhist Era (B.E.)

  return `${day}/${month}/${year}`;
};

const AdminSearchPage = () => {
  const [bookingReferenceNumber, setBookingReferenceNumber] = useState('');
  const [status, setStatus] = useState('');
  const [bookingData, setBookingData] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/seach?booking_reference_number=${bookingReferenceNumber}`);
      if (!res.ok) {
        throw new Error('Booking not found');
      }
      const data = await res.json();
      setBookingData(data.booking);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setBookingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/seach', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingReferenceNumber,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const data = await res.json();
      setBookingData((prevData: any) => ({ ...prevData, status: newStatus }));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Booking Search</h1>

      <div className="mb-4 flex justify-center items-center space-x-4">
        <Input
          placeholder="Enter Booking Reference Number"
          value={bookingReferenceNumber}
          onChange={(e) => setBookingReferenceNumber(e.target.value)}
          className="w-72"
        />
        <Button onClick={handleSearch} className="w-28">Search</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center my-4">
          <Loader2 className="animate-spin" size={30} />
        </div>
      )}

      {error && <div className="text-red-500 text-center mt-4">{error}</div>}

      {bookingData && (
        <Card className="mt-8 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
          <div>
            <p className="font-semibold">Booking Reference: <span className="font-normal">{bookingData.booking_reference_number}</span></p>
            <p className="font-semibold">User Name: <span className="font-normal">{bookingData.user_name}</span></p>
            <p className="font-semibold">Department: <span className="font-normal">{bookingData.department_name}</span></p>
            <p className="font-semibold">Booking Date: <span className="font-normal">{formatBookingDate(bookingData.booking_date)}</span></p> {/* Display formatted booking date */}
            <p className="font-semibold">Booking Time: <span className="font-normal">{new Date(`1970-01-01T${bookingData.start_time}Z`).toLocaleTimeString()} - {new Date(`1970-01-01T${bookingData.end_time}Z`).toLocaleTimeString()}</span></p> {/* Format and display start/end times */}
            <p className="font-semibold">Status: <span className="font-normal">{bookingData.status}</span></p>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <Button onClick={() => handleUpdateStatus('pending')} className="w-28">Set as Pending</Button>
            <Button onClick={() => handleUpdateStatus('confirmed')} className="w-28">Set as Confirmed</Button>
            <Button onClick={() => handleUpdateStatus('cancelled')} className="w-28">Set as Cancelled</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSearchPage;
