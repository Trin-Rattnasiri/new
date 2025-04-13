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
    if (password.length < 6) {
      alert("⚠ กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัว");
      return;
    }
  
    if (!citizenId || citizenId.trim().length < 3) {
      alert("⚠ กรุณากรอกชื่อผู้ใช้หรือเลขบัตรประชาชนให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ ${data.error}`);
        setLoading(false);
        return;
      }

      // ✅ เก็บข้อมูลใน localStorage
      localStorage.setItem("user", JSON.stringify(data));
localStorage.setItem("citizenId", data.citizenId); // เพื่อใช้สร้างคิว
localStorage.setItem("hn", data.hn);               // ✅ เพิ่มตรงนี้!
localStorage.setItem("userName", data.name);       // ✅ และตรงนี้!
      

      alert("✅ เข้าสู่ระบบสำเร็จ!");

      // ✅ redirect ตาม role
      if (data.role === "admin") {
        router.push("/backend/admin-dashboard");
      } else {
        router.push("/front/user-dashboard");
      }

    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
      alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <Image
        src="/24.png"
        alt="โรงพยาบาลแม่จัน"
        width={180}
        height={80}
        className="mb-8"
        priority
      />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-800 text-center">เข้าสู่ระบบ</h2>

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
          className={`w-full py-3 text-white font-semibold rounded-lg transition-colors ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="text-center text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <Link href="/front/user-signup" className="text-blue-700 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      <footer className="mt-8 text-sm text-gray-500">© 2025 โรงพยาบาลแม่จัน | All Rights Reserved</footer>
    </div>
  );
}
