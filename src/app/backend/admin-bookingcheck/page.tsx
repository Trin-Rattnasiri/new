"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // เพิ่ม useRouter
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Search, User, Building, Calendar, Clock, Tag, CheckCircle2, XCircle, Clock3 } from "lucide-react"

interface Booking {
  booking_reference_number: string
  user_name: string
  department_name: string
  start_time: string
  end_time: string
  booking_date: string
  status: "pending" | "confirmed" | "cancelled"
}

// Function to format the date as dd/mm/yyyy in Thai Buddhist Era (B.E.)
const formatBookingDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear() + 543
  return `${day}/${month}/${year}`
}

// Function to format time in a more readable format (24-hour format)
const formatTime = (timeString: string) => {
  try {
    return new Date(`1970-01-01T${timeString}Z`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch (e) {
    return timeString
  }
}

const AdminSearchPage = () => {
  const router = useRouter() // เพิ่ม router
  const [bookingReferenceNumber, setBookingReferenceNumber] = useState("")
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSearch = async () => {
    if (!bookingReferenceNumber.trim()) {
      setError("Please enter a booking reference number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/seach?booking_reference_number=${bookingReferenceNumber}`)
      if (!res.ok) {
        throw new Error("Booking not found")
      }
      const data = await res.json()
      setBookingData(data.booking)
    } catch (err: any) {
      setError(err.message || "An error occurred while searching")
      setBookingData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/admin/seach", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingReferenceNumber,
          status: newStatus,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update status")
      }

      const data = await res.json()
      const updatedBooking = { ...bookingData, status: newStatus as any }
      setBookingData(updatedBooking)

      // ถ้าสถานะเป็น "confirmed" ให้ไปยังหน้าใบนัด
      if (newStatus === "confirmed") {
        router.push(`/admin/appointment-slip?booking_reference_number=${bookingReferenceNumber}`)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelled
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock3 className="w-3.5 h-3.5 mr-1" /> Pending
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Booking Management</h1>
        <p className="text-muted-foreground">Search and manage booking details</p>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Search Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Enter Booking Reference Number"
                value={bookingReferenceNumber}
                onChange={(e) => setBookingReferenceNumber(e.target.value)}
                className="pl-0"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !bookingReferenceNumber.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 flex items-center">
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Searching for booking...</p>
        </div>
      )}

      {bookingData && !isLoading && (
        <Card className="shadow-lg overflow-hidden transition-all duration-300 animate-in fade-in-50">
          <CardHeader className="bg-muted/50 pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              {getStatusBadge(bookingData.status)}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Tag className="h-5 w-5 mr-2 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Reference</p>
                    <p className="font-semibold">{bookingData.booking_reference_number}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Name</p>
                    <p className="font-semibold">{bookingData.user_name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Building className="h-5 w-5 mr-2 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="font-semibold">{bookingData.department_name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Date</p>
                    <p className="font-semibold">{formatBookingDate(bookingData.booking_date)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-2 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time Slot</p>
                    <p className="font-semibold">
                      {formatTime(bookingData.start_time)} - {formatTime(bookingData.end_time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="pt-6 pb-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => handleUpdateStatus("confirmed")}
              disabled={isUpdating || bookingData.status === "confirmed"}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm
            </Button>

            <Button
              onClick={() => handleUpdateStatus("pending")}
              disabled={isUpdating || bookingData.status === "pending"}
              className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
              Set Pending
            </Button>

            <Button
              onClick={() => handleUpdateStatus("cancelled")}
              disabled={isUpdating || bookingData.status === "cancelled"}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default AdminSearchPage