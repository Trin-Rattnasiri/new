'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  idCard: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    idCard: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }

      router.push('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #E53E3E 100%)',
      }}
    >
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="rgba(255,255,255,0.1)"
          />
        </svg>
      </div>

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl flex bg-white rounded-lg shadow-xl overflow-hidden z-10">
        <div className="w-full p-6 md:p-8">
          <CardHeader className="space-y-1">
            <Image src="/logo.png" alt="โลโก้โรงพยาบาลแม่จัน" width={150} height={150} className="mx-auto" />
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">สมัครสมาชิก</CardTitle>
            <p className="text-center text-gray-600">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>เกิดข้อผิดพลาด!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">ชื่อจริง</Label>
                  <Input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">นามสกุล</Label>
                  <Input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
                <Input id="idCard" name="idCard" type="text" required maxLength={13} value={formData.idCard} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <Button type="submit" disabled={loading} className="w-full font-medium" style={{ background: 'linear-gradient(to right, #E53E3E, #1E40AF)', color: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
              </Button>
            </form>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm mt-8 text-center">
              <p className="mb-4">มีบัญชีอยู่แล้ว?</p>
              <Link href="/" className="font-medium text-blue-800 hover:text-blue-600">
                เข้าสู่ระบบ
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}