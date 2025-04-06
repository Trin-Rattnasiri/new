"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SignUpPage = () => {
  const router = useRouter();
  const [prefix, setPrefix] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCitizenIdChange = (e) => {
    setCitizenId(e.target.value.replace(/\D/g, "").slice(0, 13));
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleSignUp = async () => {
    if (
      !prefix ||
      name.trim() === "" ||
      birthday === "" ||
      citizenId.length < 13 ||
      phoneNumber.length < 10 ||
      password.length < 6 ||
      password !== confirmPassword
    ) {
      alert("⚠ กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signup", {
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
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ สมัครสมาชิกสำเร็จ!");
        router.push("/");
      } else {
        alert(`❌ สมัครไม่สำเร็จ: ${data.error ?? "ไม่ทราบสาเหตุ"}`);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image src="/24.png" alt="Logo" width={180} height={90} className="object-contain drop-shadow-md hover:scale-105" />
        </div>

        <h2 className="text-3xl font-semibold text-blue-900 text-center mb-8">สมัครสมาชิก</h2>

        {/* Prefix */}
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

        {/* Name */}
        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Birthday */}
        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">วันเกิด</label>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Citizen ID */}
        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">เลขประจำตัวประชาชน</label>
          <input type="text" value={citizenId} onChange={handleCitizenIdChange} className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Phone Number */}
        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
          <input type="text" value={phoneNumber} onChange={handlePhoneChange} className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Password */}
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
        </div>

        {/* Confirm Password */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
          <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Submit */}
        <button onClick={handleSignUp} disabled={loading} className="w-full py-3 bg-gradient-to-r from-green-600 to-green-800 text-white text-lg font-semibold rounded-xl shadow-md hover:scale-105 transition-all duration-300 disabled:opacity-50">
          {loading ? "⏳ กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        <p className="text-gray-600 text-center mt-6">
          มีบัญชีอยู่แล้ว?{' '}
          <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => router.push("/")}>เข้าสู่ระบบ</span>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;