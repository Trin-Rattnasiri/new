'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  ShoppingCart, 
  Settings, 
  BarChart, 
  HelpCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react';

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Sidebar items configuration
const sidebarItems = [
  { title: 'แดชบอร์ด', path: '/backend/admin-dashboard', icon: <Home size={20} /> },
  { title: 'เพิ่มแผนก', path: '/backend/admin-list', icon: <Users size={20} /> },
  { title: 'เพิ่มslotเวลา', path: '/backend/admin-slot', icon: <ShoppingCart size={20} /> },
  { title: 'booking', path: '/backend/admin-bookingcheck', icon: <BarChart size={20} /> },
  { title: 'ดูเวลาต่างๆ', path: '/backend/admin-view', icon: <Settings size={20} /> },
  
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      "h-screen bg-background border-r flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header with Logo */}
      <div className="flex items-center justify-between p-4">
        {!collapsed ? (
          <div className="flex items-center">
            {/* Full Logo (with text) for expanded sidebar */}
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={120} 
              height={40} 
              className="object-contain" 
            />
          </div>
        ) : (
          <div className="mx-auto">
            {/* Small Logo (icon only) for collapsed sidebar */}
            <Image 
              src="/logo-small.png" 
              alt="Logo" 
              width={28} 
              height={28} 
              className="object-contain" 
            />
          </div>
        )}
        
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
      </div>
      
      <Separator />

      {/* Sidebar Navigation */}
      <nav className="mt-4 flex-1">
        <TooltipProvider>
          <ul className="space-y-1 px-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.path} className="block">
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            size="icon"
                            className="w-full justify-center"
                          >
                            {item.icon}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link href={item.path} className="block">
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.title}</span>
                      </Button>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="แอดมิน" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              แอดมิน - ผู้ดูแลระบบ
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="แอดมิน" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">แอดมิน</p>
                  <p className="text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>บัญชีผู้ใช้</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default Sidebar;