"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LineLoginCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function handleLineCallback() {
      try {
        // ดึง URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")
        const error = urlParams.get("error")
        const errorDescription = urlParams.get("error_description")

        // ตรวจสอบข้อผิดพลาด
        if (error) {
          throw new Error(`LINE Login Error: ${error} - ${errorDescription}`)
        }

        // ตรวจสอบว่ามี code หรือไม่
        if (!code) {
          throw new Error("ไม่พบรหัสการเข้าสู่ระบบจาก LINE")
        }

        // ตรวจสอบ state เพื่อป้องกัน CSRF
        const savedState = localStorage.getItem("lineLoginState")
        if (state !== savedState) {
          throw new Error("การตรวจสอบความปลอดภัยล้มเหลว (state mismatch)")
        }

        // ส่งรหัสไปยัง API เพื่อแลกเปลี่ยนเป็น access token
        const response = await fetch("/api/user/line-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE")
        }

        const data = await response.json()

        // บันทึกข้อมูลผู้ใช้
        localStorage.setItem("user", JSON.stringify(data))
        localStorage.setItem("role", data.role)
        localStorage.setItem("lineLoggedIn", "true")

        if (data.role === "user") {
          localStorage.setItem("citizenId", data.citizenId || "")
          localStorage.setItem("hn", data.hn || "")
          localStorage.setItem("userName", data.name || data.displayName)
        } else {
          localStorage.setItem("username", data.username || data.displayName)
        }

        // นำทางไปยังหน้าที่เหมาะสม
        if (data.role === "SuperAdmin" || data.role === "เจ้าหน้าที่") {
          router.push("/backend/dashboard")
        } else {
          router.push("/front/user-dashboard")
        }
      } catch (err: any) {
        console.error("LINE Login Error:", err)
        setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE")
        // หลังจาก 3 วินาที ให้กลับไปหน้าล็อกอิน
        setTimeout(() => {
          router.push("/front/login")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleLineCallback()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        {loading ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-4 border-green-500 animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-green-500 animate-pulse" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">กำลังเข้าสู่ระบบด้วย LINE</h2>
            <p className="text-gray-600">โปรดรอสักครู่...</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">กำลังนำคุณกลับไปยังหน้าล็อกอิน...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">เข้าสู่ระบบสำเร็จ</h2>
            <p className="text-gray-600">กำลังนำคุณไปยังหน้าหลัก...</p>
          </>
        )}
      </div>
    </div>
  )
}
