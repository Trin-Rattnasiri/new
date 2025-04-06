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

interface UserData {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: object;
  message?: string;
}

export default function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      const data: LoginResponse = await response.json();

      if (!data) {
        throw new Error('ไม่สามารถรับข้อมูลจากเซิร์ฟเวอร์ได้');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/front/user-booking');
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
      style={{ 
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #E53E3E 100%)' 
      }}>
      
      {/* Background wave effect */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            fill="rgba(255,255,255,0.1)" 
          />
        </svg>
      </div>
      
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl flex bg-white rounded-lg shadow-xl overflow-hidden z-10">
        {/* Left side - Login form */}
        <div className="w-full p-6 md:p-8">
          <CardHeader className="space-y-1">
            <Image
              src="/logo.png"
              alt="โลโก้โรงพยาบาลแม่จัน"
              width={150}
              height={150}
              className="mx-auto"
            />
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">
              เข้าสู่ระบบ
            </CardTitle>
            <p className="text-center text-gray-600">กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
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
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input type="checkbox" id="rememberMe" className="mr-2 accent-blue-600" />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600">จดจำฉัน</Label>
                </div>
                <Link href="#" className="text-sm text-blue-700 hover:text-blue-500">ลืมรหัสผ่าน?</Link>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-medium"
                style={{ 
                  background: 'linear-gradient(to right, #E53E3E, #1E40AF)',
                  color: 'white',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>

            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm mt-8 text-center">
              <p className="mb-4">ยังไม่มีบัญชีผู้ใช้งาน?</p>
              <Link href="user-regis">
                <Button className="bg-white text-blue-800 hover:bg-gray-100 font-medium">
                  ลงทะเบียน
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}