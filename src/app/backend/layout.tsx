"use client";

import React, { ReactNode } from 'react';
import Sidebar from './sidebar';
import {
  BellIcon,
  User,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter(); // ✅ เรียกใช้งาน Router

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2 lg:gap-4" />
           
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
