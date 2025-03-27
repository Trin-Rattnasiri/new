"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SignUpPage = () => {
  const router = useRouter();
  const [citizenId, setCitizenId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Filter input to numbers only
  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitizenId(e.target.value.replace(/\D/g, "").slice(0, 13));
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
  };

  // ✅ Handle signup submission
  const handleSignUp = async () => {
    if (citizenId.length < 13 || phoneNumber.length < 10 || password.length < 6 || password !== confirmPassword) {
      alert("⚠ กรุณากรอกข้อมูลให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, phoneNumber, password }),
      });

      if (response.ok) {
        alert("✅ สมัครสมาชิกสำเร็จ! ระบบกำลังพากลับไปยังหน้าแรก...");
        router.push("/");
      } else {
        alert("❌ ไม่สามารถสมัครสมาชิกได้");
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
        {/* ✅ Hospital Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/24.png"
            alt="Maechan Hospital Logo"
            width={180}
            height={90}
            className="object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* ✅ Form Header */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-blue-900 text-center mb-6 sm:mb-8 tracking-wide">
          สมัครสมาชิก
        </h2>

        {/* ✅ Citizen ID */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-700 mb-2">
            เลขประจำตัวประชาชน
          </label>
          <input
            type="text"
            value={citizenId}
            onChange={handleCitizenIdChange}
            placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
            className="w-full p-3 sm:p-4 text-lg text-black  sm:text-xl bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
        </div>

        {/* ✅ Phone Number */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-700 mb-2">
            หมายเลขโทรศัพท์
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="กรอกหมายเลขโทรศัพท์ 10 หลัก"
            className="w-full p-3 sm:p-4 text-lg text-black  sm:text-xl bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
        </div>

        {/* ✅ Password */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-700 mb-2">
            รหัสผ่าน
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)"
              className="w-full p-3 sm:p-4 text-lg text-black  sm:text-xl bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600 transition-all duration-300"
            >
              {showPassword ? <FiEyeOff className="text-xl sm:text-2xl" /> : <FiEye className="text-xl sm:text-2xl" />}
            </button>
          </div>
        </div>

        {/* ✅ Confirm Password */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-lg sm:text-xl md:text-2xl font-medium text-gray-700 mb-2">
            ยืนยันรหัสผ่าน
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ยืนยันรหัสผ่าน"
            className="w-full p-3 sm:p-4 text-lg text-black  sm:text-xl bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
        </div>

        {/* ✅ Signup Button */}
        <button
          onClick={handleSignUp}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-800 text-white text-lg sm:text-xl md:text-2xl font-semibold rounded-xl shadow-md hover:from-green-700 hover:to-green-900 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "⏳ กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        {/* ✅ Login Link */}
        <p className="text-gray-600 text-center mt-6 text-base sm:text-lg md:text-xl">
          มีบัญชีอยู่แล้ว?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline transition-all duration-300"
            onClick={() => router.push("/")}
          >
            เข้าสู่ระบบ
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;