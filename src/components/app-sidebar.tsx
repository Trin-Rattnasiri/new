import React from "react";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Menu items with improved structure
const navigationItems = [
  {
    title: "Bookings",
    url: "/",
    icon: Home,
  },
  {
    title: "Add-time",
    url: "admin-dashboard",
    icon: Inbox,
  },
  {
    title: "Add-แผนก",
    url: "admin-list",
    icon: Calendar,
  },
  {
    title: "Slotเวลาต่างๆ",
    url: "admin-slot",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];
export function AppSidebarAdmin() {
  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-4 flex flex-col h-full">
        {/* Logo area */}
        <div className="mb-6 px-2 flex items-center gap-2">
          {/* ทำให้โลโก้มีความสูงเต็มพื้นที่ของ sidebar */}
          <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
        </div>

        <Separator className="bg-slate-700 mb-4" />

        {/* User profile */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <Avatar className="h-10 w-10 border-2 border-slate-700">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-slate-700">CN</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Admin User</p>
            <p className="text-xs text-slate-400">admin@example.com</p>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2 px-2">Application</p>
          <nav>
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.title}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-200 hover:bg-slate-800 hover:text-white"
                    asChild
                  >
                    <a href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}