"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiEye, FiEyeOff } from "react-icons/fi"
import Link from "next/link"
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
  const [citizenId, setCitizenId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        // ถ้าเป็นการเปิดจาก URL ที่มี parameter สำหรับ auto login
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("autoLogin") === "true") {
          handleLiffLogin()
        }
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

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13)
    setCitizenId(value)
  }

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

  // ฟังก์ชันสำหรับล็อกอินด้วย LINE แบบเดิม (เปิดหน้า LINE Login)
  const handleLineLogin = () => {
    // ถ้ามี LIFF และเปิดใน LINE แล้ว ให้ใช้ LIFF login
    if (window.liff && liffInitialized) {
      handleLiffLogin()
      return
    }

    // ถ้าไม่มี LIFF หรือไม่ได้เปิดใน LINE ให้ใช้วิธีเดิม
    const LINE_LOGIN_URL = "https://access.line.me/oauth2/v2.1/authorize"
    const clientId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID

    // ถ้าไม่มี clientId ใน process.env ให้ใช้ค่า hardcode
    // หมายเหตุ: ค่า ID นี้อาจจะหมดอายุในอนาคต ควรตั้งค่าในไฟล์ .env.local ของคุณ
    const lineChannelId = clientId || "2006488509"

    if (!lineChannelId) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE")
      console.error("LINE Login Channel ID not found")
      return
    }

    // สร้าง random state เพื่อป้องกัน CSRF
    const randomState = Math.random().toString(36).substring(2, 15)
    localStorage.setItem("lineLoginState", randomState)

    const redirectUri = encodeURIComponent(`${window.location.origin}/line-login`)

    const loginUrl = `${LINE_LOGIN_URL}?response_type=code&client_id=${lineChannelId}&redirect_uri=${redirectUri}&state=${randomState}&scope=profile`

    // นำผู้ใช้ไปยังหน้า LINE Login
    window.location.href = loginUrl
  }

  const handleLogin = async () => {
    // Reset error state
    setError(null)

    if (password.length < 6) {
      setError("กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัว")
      return
    }

    if (!citizenId || citizenId.trim().length < 3) {
      setError("กรุณากรอกชื่อผู้ใช้หรือเลขบัตรประชาชนให้ถูกต้อง")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, password }),
      })

      const data = await res.json()
      console.log("✅ login result:", data)

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        setLoading(false)
        return
      }

      // ✅ เก็บข้อมูลใน localStorage
      localStorage.setItem("user", JSON.stringify(data))
      localStorage.setItem("role", data.role)

      if (data.role === "user") {
        localStorage.setItem("citizenId", data.citizenId)
        localStorage.setItem("hn", data.hn)
        localStorage.setItem("userName", data.name)
      } else {
        localStorage.setItem("username", data.username)
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
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error)
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
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

          <div>
            <label htmlFor="citizenId" className="block mb-1 text-gray-700 font-medium">
              เลขประจำตัวประชาชน
            </label>
            <input
              id="citizenId"
              type="text"
              value={citizenId}
              onChange={handleCitizenIdChange}
              placeholder="กรอกเลข 13 หลัก"
              maxLength={13}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-gray-700 font-medium">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-xl text-gray-500 hover:text-blue-600"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>

          {/* LINE Login Button */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือ</span>
            </div>
          </div>

          <button
            onClick={handleLineLogin}
            disabled={loading}
            className={`flex items-center justify-center w-full ${
              loading ? "bg-green-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            } text-white py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.89c.501 0 .907.406.907.907 0 .502-.406.908-.907.908h-2.477v1.59h2.477c.501 0 .907.406.907.908 0 .501-.406.907-.907.907h-3.385a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h3.385zm-5.617 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.907.907a.909.909 0 01-.908-.907V10.797c0-.501.407-.908.908-.908zm-3.68 0c.501 0 .907.406.907.907v3.614c0 .501-.406.907-.908.907a.909.909 0 01-.907-.907V10.797c0-.501.406-.908.908-.908zm-2.014 0c.501 0 .908.406.908.907 0 .502-.407.908-.908.908H6.575v1.59h1.48c.5 0 .907.406.907.908 0 .501-.407.907-.908.907H5.668a.908.908 0 01-.908-.907V9.89c0-.501.407-.908.908-.908h2.387zM24 10.095C24 5.06 18.627 1 12 1S0 5.06 0 10.095c0 4.53 4.02 8.327 9.456 9.041.368.08.87.244.996.56.115.29.075.744.037.997l-.162.974c-.05.289-.23 1.13.987.617 1.218-.514 6.57-3.87 8.97-6.629C22.118 13.6 24 11.097 24 10.095z" />
                </svg>
                เข้าสู่ระบบด้วย LINE
              </>
            )}
          </button>

          <p className="text-center text-gray-600">
            ยังไม่มีบัญชี?{" "}
            <Link href="/front/user-signup" className="text-blue-700 hover:underline font-medium">
              สมัครสมาชิก
            </Link>
          </p>
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
