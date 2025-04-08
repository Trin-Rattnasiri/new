"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, User, FileText, Clock } from "lucide-react";

export default function AppointmentPage() {
  const router = useRouter();
  const { booking_reference_number } = useParams<{ booking_reference_number: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!booking_reference_number) return;
      const res = await fetch(`/api/appointment/${booking_reference_number}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setData(null);
      }
      setLoading(false);
    }

    fetchData();
  }, [booking_reference_number]);

  const handleBack = () => {
    router.back(); // เหมือน history.back()
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-lg text-gray-600 flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          ⏳ กำลังโหลด...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-lg text-red-500 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ❌ ไม่พบใบนัด
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-sky-500">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-sky-700 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6" />
            ใบนัดหมาย
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-sky-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">ชื่อผู้จอง</p>
                <p className="text-base text-gray-800">{data.user_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-sky-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">เบอร์โทร</p>
                <p className="text-base text-gray-800">{data.phone_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-sky-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">วันที่</p>
                <p className="text-base text-gray-800">{data.booking_date}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-sky-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">รหัสใบนัด</p>
                <p className="text-base text-gray-800">{data.booking_reference_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-sky-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">สถานะ</p>
                <p
                  className={`text-base font-medium ${
                    data.status === "pending"
                      ? "text-yellow-600"
                      : data.status === "confirmed"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {data.status === "pending"
                    ? "รอการยืนยัน"
                    : data.status === "confirmed"
                    ? "ยืนยันแล้ว"
                    : "ยกเลิก"}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleBack}
            className="w-full mt-6 bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-md"
          >
            กลับสู่หน้าหลัก
          </Button>
          <Button
  variant="destructive"
  onClick={async () => {
    const confirmDelete = confirm("คุณแน่ใจว่าต้องการยกเลิกนัดหมาย?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/appointment/${booking_reference_number}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("ยกเลิกนัดหมายเรียบร้อยแล้ว");
      router.push("/front/user-booking");
    } else {
      alert("ไม่สามารถยกเลิกใบนัดได้ กรุณาลองใหม่");
    }
  }}
  className="w-full mt-2 py-2"
>
   ยกเลิกนัดหมาย
</Button>

        </CardContent>
      </Card>
    </div>
  );
}