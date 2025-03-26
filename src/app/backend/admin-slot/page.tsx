'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Slot = {
  id: number;
  department_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  available_seats: number;
  has_bookings?: boolean; // Flag to indicate if slot has bookings
};

const AdminSlots = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

  // Fetch slots and check which ones have bookings
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/slotview');

      if (!res.ok) {
        throw new Error(`Failed to fetch slots: ${res.statusText}`);
      }

      const data: Slot[] = await res.json();
      
      // Enhance data with booking information
      const enhancedData = await Promise.all(data.map(async (slot) => {
        const bookingRes = await fetch(`/api/admin/check-bookings?slotId=${slot.id}`);
        const bookingData = await bookingRes.json();
        return {
          ...slot,
          has_bookings: bookingData.hasBookings
        };
      }));

      setSlots(enhancedData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      setError('Failed to load slots. Please try again later.');
      setLoading(false);
    }
  };

  // Handle deletion with confirmation
  const initiateDelete = (id: number) => {
    setSlotToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!slotToDelete) return;
    
    setIsDeleting(slotToDelete);
    try {
      const res = await fetch(`/api/admin/slotview`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: slotToDelete,
          force: true // Optional: Add this if you want to force delete even with bookings
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          const confirmForceDelete = window.confirm(
            'This slot has existing bookings. Would you like to delete the bookings along with this slot?'
          );
          
          if (confirmForceDelete) {
            // If user confirms, delete bookings and slot
            const forceRes = await fetch(`/api/admin/slotview`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                id: slotToDelete,
                force: true 
              }),
            });
            
            if (forceRes.ok) {
              alert('Slot and associated bookings deleted successfully');
              fetchSlots();
            } else {
              const forceData = await forceRes.json();
              throw new Error(forceData.error || 'Failed to delete slot and bookings');
            }
          }
        } else {
          throw new Error(data.error || data.details || 'Failed to delete slot');
        }
      } else {
        alert('Slot deleted successfully');
        fetchSlots();
      }
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      alert(`Error deleting slot: ${error.message}`);
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirmation(false);
      setSlotToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setSlotToDelete(null);
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display (HH:MM)
  const formatTime = (timeString: string) => {
    const date = new Date(`1970-01-01T${timeString}Z`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <p className="text-center">Loading slots...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Available Slots</h1>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Available Slots for Scheduling</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Available Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.length > 0 ? (
              slots.map((slot) => (
                <TableRow key={slot.id} className="hover:bg-gray-100">
                  <TableCell>{slot.department_name}</TableCell>
                  <TableCell>{formatDate(slot.slot_date)}</TableCell>
                  <TableCell>{formatTime(slot.start_time)}</TableCell>
                  <TableCell>{formatTime(slot.end_time)}</TableCell>
                  <TableCell>{slot.available_seats}</TableCell>
                  <TableCell>
                    {slot.has_bookings ? (
                      <span className="bg-yellow-100 text-yellow-800 py-1 px-2 rounded text-xs">
                        Has Bookings
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 py-1 px-2 rounded text-xs">
                        No Bookings
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => initiateDelete(slot.id)} 
                      className="bg-red-600 text-white hover:bg-red-700"
                      disabled={isDeleting === slot.id}
                    >
                      {isDeleting === slot.id ? "Deleting..." : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No slots available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this slot? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <Button 
                onClick={cancelDelete}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSlots;
