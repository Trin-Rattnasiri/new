"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiEye, FiEyeOff } from "react-icons/fi"
import Link from "next/link"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// (ตัวแปรนี้ยังไม่ถูกใช้งาน ถ้าจะเก็บ version ไว้แสดงผลค่อยใช้ทีหลังได้)
const PDPA_POLICY_VERSION = "v1.0-2025-08-23"

export default function LoginPage() {
  const router = useRouter()
  const [citizenId, setCitizenId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [loginData, setLoginData] = useState<any>(null)

  // ✅ สถานะ PDPA
  const [pdpaAccepted, setPdpaAccepted] = useState(false)// ต้องติ๊กก่อนเข้าสู่ระบบ
  const [marketingOptIn, setMarketingOptIn] = useState(false)// ไม่บังคับ// ✅ dialog แสดงนโยบายความเป็นส่วนตัว (PDPA)
  const [showPdpaDialog, setShowPdpaDialog] = useState(false) 

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13)
    setCitizenId(value)
  }

  const handleLogin = async () => {
    setError(null)

    if (!pdpaAccepted) {
      setError("กรุณายอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนเข้าสู่ระบบ")
      return// ต้องติ๊กก่อนเข้าสู่ระบบ
    }
    if (password.length < 6) {
      setError("กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัว")
      return// รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัว
    }
    if (!citizenId || citizenId.trim().length < 3) {// เลขบัตรประชาชนต้องมีความยาวอย่างน้อย 3 ตัว
      setError("กรุณากรอกเลขประจำตัวประชาชนให้ถูกต้อง")
      return
    }

    setLoading(true)// กำลังเข้าสู่ระบบ...
    try {
      // 1) บันทึก consent ก่อนเข้าสู่ระบบ
      try {
        await fetch("/api/consent/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },// แจ้ง server ว่าผู้ใช้ยอมรับ PDPA แล้ว
          body: JSON.stringify({
            citizenId,
            acceptedAt: new Date().toISOString(),
            marketingOptIn,
          }),
        })
      } catch {
        // ไม่บล็อกการล็อกอินถ้า log consent ล้มเหลว
        console.warn("consent log failed")
      }

      // 2) เรียก login — เซิร์ฟเวอร์จะตั้ง HttpOnly cookie ให้
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },// ส่ง citizenId กับ password ไปที่ API
        body: JSON.stringify({ citizenId, password }),
      })
      const data = await res.json()// ถ้าไม่ผ่าน จะมีสถานะไม่ใช่ ok และมีข้อความ error กลับมา

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        setLoading(false)
        return
      }

      // 3) ไม่ต้องใช้ localStorage — ใช้คุกกี้ session แทน
      setLoginData(data)
      setShowSuccessDialog(true)

      setTimeout(() => {
        if (data.role === "SuperAdmin" || data.role === "เจ้าหน้าที่") {
          router.push("/backend/dashboard")
        } else {
          router.push("/front/user-dashboard")// ผู้ใช้ทั่วไป
        }
      }, 1000)// รอ 1 วินาทีเพื่อให้ผู้ใช้เห็น dialog ว่าเข้าสู่ระบบสำเร็จ
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    }
    setLoading(false)// เสร็จสิ้นการเข้าสู่ระบบ
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
            inputMode="numeric"
            maxLength={13}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            autoComplete="username"
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
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}// กด Enter เพื่อเข้าสู่ระบบ
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xl text-gray-500 hover:text-blue-600"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}// ปุ่มแสดง/ซ่อนรหัสผ่าน
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* ✅ PDPA Consent Block */}
        <div className="space-y-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex items-start gap-3">
            <input
              id="pdpaAccept"
              type="checkbox"
              checked={pdpaAccepted}
              onChange={(e) => setPdpaAccepted(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <label htmlFor="pdpaAccept" className="text-sm text-gray-700">
              ข้าพเจ้ายินยอมให้ "โรงพยาบาลแม่จัน" เก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้าเพื่อการให้บริการ
              และได้อ่าน{" "}
              <button
                type="button"
                onClick={() => setShowPdpaDialog(true)}
                className="text-blue-700 underline underline-offset-2"
              >
                นโยบายความเป็นส่วนตัว (PDPA)
              </button>{" "}
              แล้ว
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="marketing"
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <label htmlFor="marketing" className="text-sm text-gray-700">
              ยินยอมรับข่าวสาร/ประชาสัมพันธ์จากโรงพยาบาลแม่จัน (ไม่บังคับ)
            </label>
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
                <>คุณกำลังเข้าสู่ระบบในฐานะ <span className="font-semibold text-blue-600">{loginData?.role}</span></>
              ) : null}
              <br />กำลังนำคุณไปยังหน้าหลัก... 
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDPA Dialog (ฉบับย่อ) */}
      <Dialog open={showPdpaDialog} onOpenChange={setShowPdpaDialog}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogTitle>นโยบายความเป็นส่วนตัว (PDPA) — ฉบับย่อ</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-slate-700 space-y-3 mt-2">
              <p>
                ผู้ควบคุมข้อมูล: โรงพยาบาลแม่จัน • วัตถุประสงค์: การระบุตัวตน, ให้บริการ/นัดหมาย/บัตรคิว, ความปลอดภัยระบบ,
                ติดต่อสื่อสารด้านบริการ
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>ประเภทข้อมูล: ข้อมูลระบุตัวตนและการใช้งานบริการตามความจำเป็น</li>
                <li>การเปิดเผย: เฉพาะหน่วยงานที่เกี่ยวข้องกับการให้บริการและผู้ประมวลผลข้อมูลตามสัญญา</li>
                <li>ระยะเวลาจัดเก็บ: ตามความจำเป็นของวัตถุประสงค์หรือจนกว่าจะถอนความยินยอม</li>
                <li>สิทธิของท่าน: ขอเข้าถึง/แก้ไข/ลบ/คัดค้าน/เพิกถอนความยินยอม โดยติดต่อช่องทางของโรงพยาบาล</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}

