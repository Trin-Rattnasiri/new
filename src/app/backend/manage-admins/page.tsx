"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Trash2, Clock, CheckSquare, XCircle, RefreshCw } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "pending" | "delete" | null>(null);

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
      showToast("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    }
    setLoading(false);
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all transform translate-y-0 opacity-100 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white font-medium`;
    toast.innerText = message;
    document.body.appendChild(toast);

    // Animation
    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const handleAction = (username: string, action: "approve" | "pending" | "delete") => {
    setSelectedAdmin(username);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedAdmin || !actionType) return;

    try {
      let res, data;
      
      switch (actionType) {
        case "approve":
          res = await fetch(`/api/admin/approve/${selectedAdmin}`, {
            method: "PATCH",
          });
          data = await res.json();
          showToast(`✅ อนุมัติผู้ใช้ ${selectedAdmin} เรียบร้อยแล้ว`);
          break;
        case "pending":
          res = await fetch(`/api/admin/pending-action/${selectedAdmin}`, {
            method: "PATCH",
          });
          data = await res.json();
          showToast(`⏱️ กำหนดให้ผู้ใช้ ${selectedAdmin} รอดำเนินการเรียบร้อยแล้ว`);
          break;
        case "delete":
          res = await fetch(`/api/admin/delete/${selectedAdmin}`, {
            method: "DELETE",
          });
          data = await res.json();
          showToast(`🗑️ ลบผู้ใช้ ${selectedAdmin} เรียบร้อยแล้ว`);
          break;
      }
      
      setShowConfirmModal(false);
      fetchAdmins();
    } catch (error) {
      console.error(`Error during ${actionType} action:`, error);
      showToast(`❌ เกิดข้อผิดพลาดในการดำเนินการ`, "error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter admins based on search term
  const filteredAdmins = allAdmins.filter(admin => 
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalAdmins = allAdmins.length;
  const approvedAdmins = allAdmins.filter(admin => admin.is_approved).length;
  const pendingCount = allAdmins.filter(admin => !admin.is_approved).length;

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2 animate-fade-in">
            ระบบจัดการแอดมิน
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            จัดการผู้ใช้งานระบบ อนุมัติคำขอเข้าใช้งาน และกำหนดสถานะแอดมินในระบบ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">จำนวนแอดมินทั้งหมด</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalAdmins}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-green-100 flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckSquare size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">อนุมัติแล้ว</p>
              <h3 className="text-2xl font-bold text-gray-800">{approvedAdmins}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-yellow-100 flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">รอดำเนินการ</p>
              <h3 className="text-2xl font-bold text-gray-800">{pendingCount}</h3>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 animate-slide-up">
          {/* Search and Refresh */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
              📋 รายการแอดมินทั้งหมด
            </h2>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาโดยชื่อผู้ใช้หรือตำแหน่ง..."
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
              </div>
              <button
                onClick={fetchAdmins}
                className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw size={18} className="mr-2" />
                รีเฟรช
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">ไม่พบข้อมูลแอดมินที่ตรงกับการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">หมายเลขประจำตัว</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ตำแหน่ง</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admin.position}</td>
                      <td className="px-6 py-4 text-sm">
                        {admin.is_approved ? (
                          <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium text-xs">
                            <CheckCircle size={14} className="mr-1" />
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-300 px-3 py-1 rounded-full font-medium text-xs">
                            <Clock size={14} className="mr-1" />
                            รอดำเนินการ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAction(admin.username, "approve")}
                            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={14} className="mr-1" />
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleAction(admin.username, "pending")}
                            className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            <Clock size={14} className="mr-1" />
                            รอดำเนินการ
                          </button>
                          <button
                            onClick={() => handleAction(admin.username, "delete")}
                            className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            <Trash2 size={14} className="mr-1" />
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-zoom-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ยืนยันการดำเนินการ</h3>
            <p className="text-gray-600 mb-6">
              {actionType === "approve" && `คุณต้องการอนุมัติผู้ใช้ ${selectedAdmin} ใช่หรือไม่?`}
              {actionType === "pending" && `คุณต้องการกำหนดให้ผู้ใช้ ${selectedAdmin} รอดำเนินการใช่หรือไม่?`}
              {actionType === "delete" && `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${selectedAdmin}?`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg text-white ${
                  actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                  actionType === "pending" ? "bg-yellow-500 hover:bg-yellow-600" :
                  "bg-red-600 hover:bg-red-700"
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-in-out;
        }
        .animate-zoom-in {
          animation: zoomIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}