"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [citizenId, setCitizenId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setCitizenId(value);
  };

  const handleLogin = async () => {
    if (citizenId.length < 13 || password.length < 6) {
      alert("⚠ กรุณากรอกเลขบัตรประชาชน 13 หลักและรหัสผ่านอย่างน้อย 6 ตัว");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, password }),
      });

      if (res.ok) {
        alert("✅ เข้าสู่ระบบสำเร็จ!");
        localStorage.setItem("citizenId", citizenId);
        router.push("/front/user-dashboard");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      {/* Logo */}
      <Image
        src="/24.png"
        alt="โรงพยาบาลแม่จัน"
        width={180}
        height={80}
        className="mb-8"
        priority
      />

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-800 text-center">เข้าสู่ระบบ</h2>

        {/* Citizen ID */}
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

        {/* Password */}
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

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 text-white font-semibold rounded-lg transition-colors ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        {/* Sign up link */}
        <p className="text-center text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <Link href="/front/user-signup" className="text-blue-700 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-sm text-gray-500">© 2025 โรงพยาบาลแม่จัน | All Rights Reserved</footer>
    </div>
  );
}
