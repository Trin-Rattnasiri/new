"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FiEye, FiEyeOff } from "react-icons/fi"

const AdminSignUpPage = () => {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [position, setPosition] = useState("") // 🆕 เพิ่ม state ตำแหน่ง
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (
      username.trim() === "" ||
      !position || // ✅ เช็คว่ามีตำแหน่งหรือยัง
      password.length < 6 ||
      password !== confirmPassword
    ) {
      alert("⚠ กรุณากรอกข้อมูลให้ครบถ้วน และรหัสผ่านต้องตรงกัน")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, position }), // ✅ ส่งตำแหน่งไป backend
      })

      const data = await response.json()

      if (response.ok) {
        alert("✅ สมัครแอดมินสำเร็จ!")
        router.push("/")
      } else {
        alert(`❌ สมัครไม่สำเร็จ: ${data.error ?? "ไม่ทราบสาเหตุ"}`)
      }
    } catch (error) {
      console.error("Error signing up admin:", error)
      alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-gray-200 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">สมัครแอดมิน</h2>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">หมายเลขประจำตัว</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Position (input type text) */}
<div className="mb-4">
  <label className="block text-gray-700 mb-1">ตำแหน่ง</label>
  <input
    type="text"
    value={position}
    onChange={(e) => setPosition(e.target.value)}
    placeholder="เช่น ผู้ดูแลระบบ, เจ้าหน้าที่"
    className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
  />
</div>


        {/* Password */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">รหัสผ่าน</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 pr-12 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50"
        >
          {loading ? "⏳ กำลังสมัคร..." : "สมัครแอดมิน"}
        </button>

        <p className="text-center text-gray-600 mt-4">
          ต้องการสมัครเป็นผู้ใช้ทั่วไป?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/")}
          >
            กลับไปสมัครสมาชิกผู้ใช้
          </span>
        </p>
      </div>
    </div>
  )
}

export default AdminSignUpPage
