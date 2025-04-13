"use client";

import { useEffect, useState } from "react";

interface Admin {
  id: number;
  username: string;
  position: string;
  is_approved?: boolean;
}

export default function ManageAdminsPage() {
  const [pendingAdmins, setPendingAdmins] = useState<Admin[]>([]);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch("/api/admin/pending"),
        fetch("/api/admin/pending?all=true")
      ]);
      const [pendingData, allData] = await Promise.all([
        pendingRes.json(),
        allRes.json()
      ]);
      setPendingAdmins(pendingData);
      setAllAdmins(allData);
    } catch (error) {
      console.error("Error fetching admins:", error);
      alert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
    setLoading(false);
  };

  const approveAdmin = async (username: string) => {
    try {
      const res = await fetch(`/api/admin/approve/${username}`, {
        method: "PATCH",
      });
      const data = await res.json();
      alert(data.message);
      fetchAdmins();
    } catch (error) {
      console.error("Error approving admin:", error);
      alert("❌ เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const processPending = async (username: string) => {
    try {
      const res = await fetch(`/api/admin/pending-action/${username}`, {
        method: "PATCH",
      });
      const data = await res.json();
      alert(data.message);
      fetchAdmins();
    } catch (error) {
      console.error("Error processing pending action:", error);
      alert("❌ เกิดข้อผิดพลาดในการดำเนินการ");
    }
  };

  const deleteAdmin = async (username: string) => {
    const confirmDelete = confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${username} นี้?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/delete/${username}`, {
        method: "DELETE",
      });
      const data = await res.json();
      alert(data.message);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("❌ ลบไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="flex-h-screen w-full to-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        <h2 className="text-3xl font-bold text-blue-900 text-center mb-10 animate-fade-in">
          จัดการแอดมินที่รออนุมัติ
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            <p className="ml-4 text-lg text-gray-600">กำลังโหลด...</p>
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📋 ตารางแอดมินทั้งหมด</h3>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">หมายเลขประจำตัว</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ตำแหน่ง</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admin.position}</td>
                      <td className="px-6 py-4 text-sm">
                        {admin.is_approved ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm">
                            ✅ อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="bg-yellow-50 text-yellow-700 border border-yellow-300 px-3 py-1 rounded-full font-semibold text-sm">
                            รอดำเนินการ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => approveAdmin(admin.username)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-semibold"
                        >
                          ยืนยัน
                        </button>
                        <button
                          onClick={() => processPending(admin.username)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-semibold"
                        >
                          รอดำเนินการ
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin.username)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-semibold"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}