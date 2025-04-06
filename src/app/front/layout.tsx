// components/Layout.tsx

import { ReactNode } from 'react';

import Navbar from '@/components/navbar'; // import navbar component
import Sidebar from '@/components/sb';  // ใช้ 'Sidebar' พิมพ์ใหญ่


interface LayoutProps {
  children: ReactNode; // React node to render content inside layout
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <div className="p-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
