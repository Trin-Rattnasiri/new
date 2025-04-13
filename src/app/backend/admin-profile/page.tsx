"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  username: string;
  position: string;
}

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role === "admin") {
        setAdmin(parsed);
      }
    }
  }, []);

  if (!admin) {
    return <p className="p-4 text-gray-600">กำลังโหลดข้อมูลแอดมิน...</p>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h1 className="text-xl font-bold mb-4">ข้อมูลแอดมิน</h1>
      <p><strong>ชื่อผู้ใช้:</strong> {admin.username}</p>
      <p><strong>ตำแหน่ง:</strong> {admin.position}</p>
    </div>
  );
}
