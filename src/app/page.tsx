"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiEye, FiEyeOff } from "react-icons/fi"
import Link from "next/link"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [citizenId, setCitizenId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [loginData, setLoginData] = useState<any>(null)

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13)
    setCitizenId(value)
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
  )
}