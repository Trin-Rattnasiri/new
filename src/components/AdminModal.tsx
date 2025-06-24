// ✅ AdminModal.tsx
import React, { useState, useEffect } from 'react';

interface Admin {
  id: number;
  username: string;
  position: string;
  created_at: string;
  updated_at: string;
  is_approved: number;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adminData: AdminFormData) => void;
  admin: Admin | null;
  mode: 'add' | 'edit';
}

interface AdminFormData {
  username: string;
  position: string;
  password?: string;
}

interface FormData {
  username: string;
  position: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  position?: string;
  password?: string;
  confirmPassword?: string;
}

export default function AdminModal({ isOpen, onClose, onSubmit, admin, mode }: AdminModalProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    position: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (admin && mode === 'edit') {
      setFormData({
        username: admin.username || '',
        position: admin.position || '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData({ username: '', position: '', password: '', confirmPassword: '' });
    }
  }, [admin, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.username) newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    if (!formData.position) newErrors.position = 'กรุณาเลือกตำแหน่ง';
    if (mode === 'add' && !formData.password) newErrors.password = 'กรุณากรอกรหัสผ่าน';
    if ((mode === 'add' || formData.password) && formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const submitData: AdminFormData = {
      username: formData.username,
      position: formData.position,
    };
    if (formData.password) submitData.password = formData.password;
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'add' ? 'เพิ่มผู้ดูแลระบบ' : 'แก้ไขข้อมูลผู้ดูแลระบบ'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">ชื่อผู้ใช้</label>
            <input
              type="text"
              id="username"
              name="username"
              className={`w-full px-3 py-2 border rounded-lg ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="position">ตำแหน่ง</label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${errors.position ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">-- เลือกตำแหน่ง --</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
            </select>
            {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              {mode === 'add' ? 'รหัสผ่าน' : 'รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`w-full px-3 py-2 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`w-full px-3 py-2 border rounded-lg ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">ยกเลิก</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              {mode === 'add' ? 'เพิ่ม' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
