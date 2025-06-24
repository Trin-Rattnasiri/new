"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LogOut,
  Menu,
  X,
  Clock,
  UserIcon,
  ChevronDown,
  ChevronRight,
  Lock,
  FileText,
  ShieldCheck,
  Calendar,
  Building,
  Bell,
  Settings,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SubMenuItem {
  title: string
  path: string
  icon?: React.ReactNode
}

interface SidebarItem {
  title: string
  path?: string
  icon: React.ReactNode
  submenu?: SubMenuItem[]
  requireSuperAdmin?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    title: "แดชบอร์ด",
    path: "/backend/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: "รายการนัด",
    path: "/backend/admin-Panel",
    icon: <Calendar size={20} />,
  },
  {
    title: "จัดการแผนก",
    icon: <Building size={20} />,
    submenu: [
      {
        title: "เพิ่มแผนก",
        path: "/backend/admin-list",
        icon: <Building size={16} />,
      },
      {
        title: "เพิ่มเวลา",
        path: "/backend/admin-dashboard",
        icon: <Clock size={16} />,
      },
    ],
  },
  {
    title: "ข่าวสาร",
    path: "/backend/admin-news",
    icon: <FileText size={20} />,
  },
  {
    title: "จัดการผู้ดูแล",
    path: "/backend/admin-manage",
    icon: <ShieldCheck size={20} />,
    requireSuperAdmin: true,
  },
   {
    title: "เพิ่มประวัติคนไข้",
    path: "/backend/admin-patient-form",
    icon: <ShieldCheck size={20} />,
    requireSuperAdmin: true,
  },
]

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)
  const [username, setUsername] = useState<string>("")
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  const toggleSidebar = () => setCollapsed(!collapsed)

  const toggleSubmenu = (index: number) => {
    if (openSubmenu === index) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(index)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogout = () => {
    setIsLoggingOut(true)

    // จำลองการทำงานของการออกจากระบบ (อาจมีการเรียก API จริงๆ ตรงนี้)
    setTimeout(() => {
      localStorage.clear()
      router.push("/")
    }, 500)
  }

  useEffect(() => {
    const role = localStorage.getItem("role")
    const storedUsername = localStorage.getItem("username")

    if (role === "SuperAdmin") {
      setIsSuperAdmin(true)
    }

    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  // Check if user tries to access admin-manage page when not SuperAdmin
  useEffect(() => {
    if (pathname === "/backend/admin-manage" && !isSuperAdmin) {
      router.push("/backend/admin-Panel")
    }
  }, [pathname, isSuperAdmin, router])

  // ใช้ตัวอักษรแรกของ username สำหรับ AvatarFallback
  const getInitials = () => {
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return isSuperAdmin ? "S" : "A"
  }

  return (
    <div
      className={cn(
        "h-screen bg-white border-r flex flex-col transition-all duration-300 shadow-sm",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed ? (
          <div className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={120} height={40} className="object-contain" />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Image src="/logo-small.png" alt="Logo" width={28} height={28} className="object-contain" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* User Profile Section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:border-blue-200 transition-colors",
                  collapsed ? "justify-center" : "",
                )}
              >
                <Avatar className="h-9 w-9 border-2 border-blue-200">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={username || "แอดมิน"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-900 truncate">{username || "แอดมิน"}</p>
                      <ChevronDown size={14} className="text-blue-400 ml-1" />
                    </div>
                    <p className="text-xs text-blue-600">{isSuperAdmin ? "SuperAdmin" : "เจ้าหน้าที่"}</p>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"} className="w-56">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                </div>
                <span>ข้อมูลส่วนตัว</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                </div>
                <span>การแจ้งเตือน</span>
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem onClick={() => router.push("/backend/admin-manage")}>
                  <div className="w-4 h-4 flex items-center justify-center mr-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  </div>
                  <span>จัดการระบบแอดมิน</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutClick} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-2 px-3">
          <TooltipProvider>
            <div className="space-y-1">
              {!collapsed && (
                <div className="mb-2 px-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เมนูหลัก</p>
                </div>
              )}

              {sidebarItems.map((item, index) => {
                const isActive = item.path
                  ? pathname === item.path
                  : item.submenu?.some((subItem) => pathname === subItem.path)

                // Skip rendering items that require SuperAdmin if user is not SuperAdmin
                if (item.requireSuperAdmin && !isSuperAdmin) {
                  return (
                    <Tooltip key={`${item.title}-${index}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-2 py-2 rounded-lg cursor-not-allowed opacity-50",
                            collapsed ? "justify-center" : "justify-start",
                          )}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
                          {!collapsed && (
                            <>
                              <span className="ml-3 text-sm">{item.title}</span>
                              <Lock size={14} className="ml-auto text-slate-400" />
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {collapsed ? `${item.title} - สำหรับ SuperAdmin เท่านั้น` : "สำหรับ SuperAdmin เท่านั้น"}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                if (item.submenu) {
                  return (
                    <div key={`${item.title}-${index}`} className="mb-1">
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "w-full justify-center rounded-lg",
                                isActive
                                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-100",
                              )}
                              onClick={() => toggleSubmenu(index)}
                            >
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className={isActive ? "text-indigo-600" : "text-slate-600"}>{item.icon}</div>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between rounded-lg",
                              isActive
                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700"
                                : "text-slate-700 hover:bg-slate-100",
                            )}
                            onClick={() => toggleSubmenu(index)}
                          >
                            <div className="flex items-center">
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className={isActive ? "text-indigo-600" : "text-slate-600"}>{item.icon}</div>
                              </div>
                              <span className="ml-3 text-sm">{item.title}</span>
                            </div>
                            {openSubmenu === index ? (
                              <ChevronDown size={16} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={16} className="text-slate-400" />
                            )}
                          </Button>

                          {openSubmenu === index && (
                            <div className="mt-1 ml-2 pl-6 border-l-2 border-indigo-100 space-y-1">
                              {item.submenu.map((subItem, subIndex) => {
                                const isSubItemActive = pathname === subItem.path
                                return (
                                  <Link
                                    key={`${subItem.path}-${subIndex}`}
                                    href={subItem.path}
                                    className={cn(
                                      "flex items-center px-3 py-2 text-sm rounded-lg",
                                      isSubItemActive
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-slate-600 hover:bg-slate-100",
                                    )}
                                  >
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      {subItem.icon ? (
                                        <div className={isSubItemActive ? "text-indigo-600" : "text-slate-500"}>
                                          {subItem.icon}
                                        </div>
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-indigo-300" />
                                      )}
                                    </div>
                                    <span className="ml-2">{subItem.title}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={`${item.path}-${index}`} className="mb-1">
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={item.path || "#"}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "w-full justify-center rounded-lg",
                                isActive
                                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-100",
                              )}
                            >
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className={isActive ? "text-indigo-600" : "text-slate-600"}>{item.icon}</div>
                              </div>
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link href={item.path || "#"}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start rounded-lg",
                            isActive
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700"
                              : "text-slate-700 hover:bg-slate-100",
                          )}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            <div className={isActive ? "text-indigo-600" : "text-slate-600"}>{item.icon}</div>
                          </div>
                          <span className="ml-3 text-sm">{item.title}</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </TooltipProvider>
        </nav>
      </div>

      

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 text-red-500" />
              ยืนยันการออกจากระบบ
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              คุณต้องการออกจากระบบหรือไม่? การออกจากระบบจะทำให้คุณต้องเข้าสู่ระบบใหม่เพื่อใช้งานต่อ
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="bg-white"
              disabled={isLoggingOut}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-white border-t-transparent rounded-full"></span>
                  กำลังออกจากระบบ...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  ออกจากระบบ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Sidebar
