"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const [citizenId, setCitizenId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Citizen ID input (13 digits only)
  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setCitizenId(value);
  };

  // Handle Login submission
  const handleLogin = async () => {
    if (citizenId.length < 13 || password.length < 6) {
      alert("⚠ กรุณากรอกเลขบัตรประชาชน 13 หลักและรหัสผ่านอย่างน้อย 6 ตัว");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, password }),
      });

      if (response.ok) {
        alert("✅ เข้าสู่ระบบสำเร็จ!");
        localStorage.setItem("citizenId", citizenId);
        router.push("/login");
      } else {
        alert("❌ เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
      alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      {/* Hospital Logo */}
      <Image
        src="/24.png"
        alt="โรงพยาบาลแม่จัน"
        width={200}
        height={80}
        className="mb-12"
        priority
      />

      {/* Login Card */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-10 border border-gray-200">
        <h2 className="text-3xl font-bold text-blue-900 text-center mb-8">
          เข้าสู่ระบบ
        </h2>

        {/* Citizen ID Input */}
        <div className="mb-6">
          <label className="block text-gray-800 text-xl font-medium mb-2">
            เลขประจำตัวประชาชน
          </label>
          <input
            type="text"
            value={citizenId}
            onChange={handleCitizenIdChange}
            placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
            className="w-full p-4 text-xl text-black  border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            maxLength={13}
          />
        </div>

        {/* Password Input */}
        <div className="mb-8">
          <label className="block text-gray-800 text-xl font-medium mb-2">
            รหัสผ่าน
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              className="w-full p-4 text-xl border text-black  border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-2xl hover:text-blue-600 transition-colors"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full p-4 text-white text-xl font-semibold rounded-md bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                />
              </svg>
              กำลังเข้าสู่ระบบ...
            </>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </button>

        {/* Signup Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-lg">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/front/user-signup"
              className="text-blue-700 font-medium hover:underline hover:text-blue-900 transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-gray-500 text-sm">
        © 2025 โรงพยาบาลแม่จัน | All Rights Reserved
      </footer>
    </div>
  );
};

export default LoginPage;