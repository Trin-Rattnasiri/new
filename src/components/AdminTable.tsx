// ✅ AdminTable.tsx
import React from 'react';

interface Admin {
  id: number;
  username: string;
  position: string;
  created_at: string;
  updated_at: string;
  is_approved: number;
}

interface AdminTableProps {
  admins: Admin[];
  onEdit: (admin: Admin) => void;
  onDelete: (adminId: number) => void;
  onApprove: (adminId: number, isApproved: boolean) => void;
}

export default function AdminTable({ admins, onEdit, onDelete, onApprove }: AdminTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left border border-gray-200">ชื่อผู้ใช้</th>
            <th className="py-3 px-4 text-left border border-gray-200">ตำแหน่ง</th>
            <th className="py-3 px-4 text-left border border-gray-200">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {admins.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 px-4 text-center border border-gray-200">
                ไม่พบข้อมูลผู้ดูแลระบบ
              </td>
            </tr>
          ) : (
            admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border border-gray-200">{admin.username}</td>
                <td className="py-2 px-4 border border-gray-200">{admin.position}</td>
                <td className="py-2 px-4 border border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(admin)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => onDelete(admin.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
