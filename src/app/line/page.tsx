"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Script from "next/script"

// LINE LIFF types
declare global {
  interface Window {
    liff: any
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [loginData, setLoginData] = useState<any>(null)
  const [liffInitialized, setLiffInitialized] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)

  // LIFF ID จาก LINE Developers Console
  const LIFF_ID = "2007308199-K3qboOWl"

  // ฟังก์ชันสำหรับเริ่มต้น LIFF
  const initializeLiff = async () => {
    try {
      await window.liff.init({
        liffId: LIFF_ID,
      })
      console.log("LIFF initialized successfully")
      setLiffInitialized(true)

      // ตรวจสอบว่าเปิดใน LINE หรือไม่ และล็อกอินแล้วหรือยัง
      if (window.liff.isLoggedIn()) {
        console.log("User is logged in to LINE")
        // ล็อกอินอัตโนมัติเมื่อเปิดใน LINE และล็อกอินแล้ว
        handleLiffLogin()
      }
    } catch (err: any) {
      console.error("LIFF initialization failed", err)
      setLiffError(`ไม่สามารถเริ่มต้น LIFF ได้: ${err.message}`)
    }
  }

  // โหลด LIFF SDK เมื่อหน้าเว็บโหลด
  useEffect(() => {
    // ตรวจสอบว่ามี window.liff หรือไม่
    if (window.liff) {
      initializeLiff()
    }
  }, [])

  // ฟังก์ชันสำหรับล็อกอินด้วย LINE LIFF
  const handleLiffLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      if (!window.liff) {
        throw new Error("LIFF SDK ไม่พร้อมใช้งาน")
      }

      if (!window.liff.isLoggedIn()) {
        // ถ้ายังไม่ได้ล็อกอิน LINE ให้ล็อกอินก่อน
        window.liff.login()
        return
      }

      // ดึงข้อมูลโปรไฟล์ LINE
      const profile = await window.liff.getProfile()
      console.log("LINE Profile:", profile)

      // ส่งข้อมูลไปยัง API เพื่อล็อกอินหรือลงทะเบียน
      const res = await fetch("/api/user/line-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        }),
      })

      const data = await res.json()
      console.log("✅ LINE login result:", data)

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE")
        setLoading(false)
        return
      }

      // ✅ เก็บข้อมูลใน localStorage
      localStorage.setItem("user", JSON.stringify(data))
      localStorage.setItem("role", data.role)
      localStorage.setItem("lineLoggedIn", "true")

      if (data.role === "user") {
        localStorage.setItem("citizenId", data.citizenId || "")
        localStorage.setItem("hn", data.hn || "")
        localStorage.setItem("userName", data.name || profile.displayName)
      } else {
        localStorage.setItem("username", data.username || profile.displayName)
      }

      // แสดงข้อความสำเร็จสั้นๆ
      setLoginData(data)
      setShowSuccessDialog(true)

      // ตั้งเวลาให้ redirect อัตโนมัติหลังจาก 1.5 วินาที
      setTimeout(() => {
        if (data.role === "SuperAdmin" || data.role === "เจ้าหน้าที่") {
          router.push("/backend/dashboard")
        } else {
          router.push("/front/user-dashboard")
        }
      }, 1500)
    } catch (error: any) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE:", error)
      setError(`เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <>
      {/* โหลด LIFF SDK */}
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        onLoad={() => {
          console.log("LIFF SDK loaded")
          if (window.liff) {
            initializeLiff()
          }
        }}
        onError={(e) => {
          console.error("Failed to load LIFF SDK", e)
          setLiffError("ไม่สามารถโหลด LIFF SDK ได้")
        }}
      />

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
        <Image src="/24.png" alt="โรงพยาบาลแม่จัน" width={180} height={80} className="mb-8" priority />

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-blue-800 text-center">เข้าสู่ระบบ</h2>

          {error && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {liffError && (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <AlertDescription>{liffError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.89c.501 0 .907.406.907.907 0 .502-.406.908-.907.908h-2.477v1.59h2.477c.501 0 .907.406.907.908 0 .501-.406.907-.907.907h-3.385a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h3.385zm-5.617 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.907.907a.909.909 0 01-.908-.907V10.797c0-.501.407-.908.908-.908zm-3.68 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.908.907a.909.909 0 01-.907-.907V10.797c0-.501.406-.908.908-.908zm-2.014 0c.501 0 .908.406.908.907 0 .502-.407.908-.908.908H6.575v1.59h1.48c.5 0 .907.406.907.908 0 .501-.407.907-.908.907H5.668a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h2.387zM24 10.095C24 5.06 18.627 1 12 1S0 5.06 0 10.095c0 4.53 4.02 8.327 9.456 9.041.368.08.87.244.996.56.115.29.075.744.037.997l-.162.974c-.05.289-.23 1.13.987.617 1.218-.514 6.57-3.87 8.97-6.629C22.118 13.6 24 11.097 24 10.095z" />
              </svg>
            </div>
            <p className="text-gray-600 text-center mb-6">เข้าสู่ระบบด้วยบัญชี LINE ของคุณเพื่อใช้งานระบบนัดหมาย</p>
          </div>

          <button
            onClick={handleLiffLogin}
            disabled={loading}
            className={`flex items-center justify-center w-full ${
              loading ? "bg-green-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            } text-white py-4 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.89c.501 0 .907.406.907.907 0 .502-.406.908-.907.908h-2.477v1.59h2.477c.501 0 .907.406.907.908 0 .501-.406.907-.907.907h-3.385a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h3.385zm-5.617 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.907.907a.909.909 0 01-.908-.907V10.797c0-.501.407-.908.908-.908zm-3.68 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.908.907a.909.909 0 01-.907-.907V10.797c0-.501.406-.908.908-.908zm-2.014 0c.501 0 .908.406.908.907 0 .502-.407.908-.908.908H6.575v1.59h1.48c.5 0 .907.406.907.908 0 .501-.407.907-.908.907H5.668a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h2.387zM24 10.095C24 5.06 18.627 1 12 1S0 5.06 0 10.095c0 4.53 4.02 8.327 9.456 9.041.368.08.87.244.996.56.115.29.075.744.037.997l-.162.974c-.05.289-.23 1.13.987.617 1.218-.514 6.57-3.87 8.97-6.629C22.118 13.6 24 11.097 24 10.095z" />
                </svg>
                เข้าสู่ระบบด้วย LINE
              </>
            )}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
            <a href="#" className="text-blue-600 hover:underline">
              เงื่อนไขการใช้งาน
            </a>{" "}
            และ{" "}
            <a href="#" className="text-blue-600 hover:underline">
              นโยบายความเป็นส่วนตัว
            </a>
          </div>
        </div>

        <footer className="mt-8 text-sm text-gray-500">© 2025 โรงพยาบาลแม่จัน | All Rights Reserved</footer>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl text-green-700 mb-2">เข้าสู่ระบบสำเร็จ</DialogTitle>
              <DialogDescription className="text-slate-600">
                {loginData?.role === "SuperAdmin" || loginData?.role === "เจ้าหน้าที่" ? (
                  <>
                    คุณกำลังเข้าสู่ระบบในฐานะ <span className="font-semibold text-blue-600">{loginData?.role}</span>
                    <br />
                  </>
                ) : null}
                กำลังนำคุณไปยังหน้าหลัก...
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
