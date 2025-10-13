"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi"

const SignUpPage = () => {
  const router = useRouter()
  const [prefix, setPrefix] = useState("")
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [citizenId, setCitizenId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noCommonPatterns: true,
    score: 0
  })

  // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
  const checkPasswordStrength = (pwd) => {
    const checks = {
      length: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      noCommonPatterns: !containsCommonPatterns(pwd)
    }

    const score = Object.values(checks).filter(Boolean).length
    return { ...checks, score }
  }

  // ตรวจสอบรูปแบบที่ไม่ปลอดภัย
  const containsCommonPatterns = (pwd) => {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abcdef/i,
      /111111/,
      /000000/,
      /654321/,
      /abc123/i,
      /admin/i,
      /user/i,
      /login/i
    ]
    
    return commonPatterns.some(pattern => pattern.test(pwd))
  }

  // อัพเดทความแข็งแกร่งของรหัสผ่านแบบเรียลไทม์
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password))
    } else {
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        noCommonPatterns: true,
        score: 0
      })
    }
  }, [password])

  // คำนวณระดับความแข็งแกร่ง
  const getStrengthLevel = (score) => {
    if (score <= 2) return { level: "อ่อนแอ", color: "text-red-600", bg: "bg-red-100" }
    if (score <= 4) return { level: "ปานกลาง", color: "text-yellow-600", bg: "bg-yellow-100" }
    if (score <= 5) return { level: "ดี", color: "text-blue-600", bg: "bg-blue-100" }
    return { level: "แข็งแกร่ง", color: "text-green-600", bg: "bg-green-100" }
  }

  const handleCitizenIdChange = (e) => {
    setCitizenId(e.target.value.replace(/\D/g, "").slice(0, 13))
  }

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
  }

  const handleSignUp = async () => {
    // ตรวจสอบข้อมูลพื้นฐาน
    if (
      !prefix ||
      name.trim() === "" ||
      birthday === "" ||
      citizenId.length < 13 ||
      phoneNumber.length < 10
    ) {
      alert("⚠ กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน")
      return
    }

    // ตรวจสอบรหัสผ่านว่าว่างไหม
    if (!password || password.length < 6) {
      alert("⚠ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    if (password !== confirmPassword) {
      alert("⚠ รหัสผ่านไม่ตรงกัน")
      return
    }

    // ไม่บังคับความแข็งแกร่งของรหัสผ่าน (แค่แสดงคำแนะนำ)

    setLoading(true)
    try {
      const response = await fetch("/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          name,
          birthday,
          citizenId,
          phoneNumber,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("✅ สมัครสมาชิกสำเร็จ!")
        router.push("/")
      } else {
        alert(`❌ สมัครไม่สำเร็จ: ${data.error ?? "ไม่ทราบสาเหตุ"}`)
      }
    } catch (error) {
      console.error("Error signing up:", error)
      alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่")
    }
    setLoading(false)
  }

  const strengthInfo = getStrengthLevel(passwordStrength.score)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/24.png"
            alt="Logo"
            width={180}
            height={90}
            className="object-contain drop-shadow-md hover:scale-105"
          />
        </div>

        <h2 className="text-3xl font-semibold text-blue-900 text-center mb-8">สมัครสมาชิก</h2>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">คำนำหน้าชื่อ</label>
          <select
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- เลือก --</option>
            <option value="นาย">นาย</option>
            <option value="นางสาว">นางสาว</option>
            <option value="นาง">นาง</option>
            <option value="เด็กชาย">เด็กชาย</option>
            <option value="เด็กหญิง">เด็กหญิง</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">วันเกิด</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">เลขประจำตัวประชาชน</label>
          <input
            type="text"
            value={citizenId}
            onChange={handleCitizenIdChange}
            placeholder="1234567890123"
            className={`w-full p-3 text-lg bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              citizenId && citizenId.length < 13 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
          />
          {citizenId && citizenId.length > 0 && citizenId.length < 13 && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <FiX className="mr-1" /> กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก 
            </p>
          )}
          {citizenId && citizenId.length === 13 && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <FiCheck className="mr-1" /> เลขบัตรประชาชนถูกต้อง
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="0812345678"
            className={`w-full p-3 text-lg bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              phoneNumber && phoneNumber.length < 10 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
          />
          {phoneNumber && phoneNumber.length > 0 && phoneNumber.length < 10 && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <FiX className="mr-1" /> กรุณากรอกเบอร์โทรให้ครบ 10 หลัก 
            </p>
          )}
          {phoneNumber && phoneNumber.length === 10 && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <FiCheck className="mr-1" /> เบอร์โทรศัพท์ถูกต้อง
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">รหัสผ่าน</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl pr-12 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          
          {/* แสดงระดับความแข็งแกร่ง (แค่เตือน ไม่บังคับ) */}
          {password && (
            <div className="mt-3">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${strengthInfo.bg} ${strengthInfo.color}`}>
                ความแข็งแกร่ง: {strengthInfo.level} ({passwordStrength.score}/6)
              </div>
              
              
            </div>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <FiX className="mr-1" /> รหัสผ่านไม่ตรงกัน
            </p>
          )}
          {confirmPassword && password === confirmPassword && password && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <FiCheck className="mr-1" /> รหัสผ่านตรงกัน
            </p>
          )}
        </div>

        {/* ⚠️ กล่องเตือนถ้ารหัสผ่านอ่อนแอ */}
       
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white text-lg font-semibold rounded-xl shadow-md hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "⏳ กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        <p className="text-gray-600 text-center mt-6">
          มีบัญชีอยู่แล้ว?{" "}
          <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => router.push("/")}>
            เข้าสู่ระบบ
          </span>
        </p>
      </div>
    </div>
  )
}

export default SignUpPage