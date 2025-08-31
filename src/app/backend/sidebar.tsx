"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LogOut,
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
  AlertCircle,
  LayoutDashboard,
} from "lucide-react"

import { cn } from "@/lib/utils"
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

interface UserData {
  username: string
  role: string
  isSuperAdmin: boolean
  permissions: string[]
}

interface SubMenuItem {
  title: string
  path: string
  icon?: React.ReactNode
  permission?: string
}

interface SidebarItem {
  title: string
  path?: string
  icon: React.ReactNode
  submenu?: SubMenuItem[]
  permission?: string
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
    permission: "view_appointments"
  },
  {
    title: "จัดการแผนก",
    icon: <Building size={20} />,
    permission: "manage_departments",
    submenu: [
      {
        title: "เพิ่มแผนก",
        path: "/backend/admin-list",
        icon: <Building size={16} />,
        permission: "add_departments"
      },
      {
        title: "เพิ่มเวลา",
        path: "/backend/admin-dashboard",
        icon: <Clock size={16} />,
        permission: "manage_schedule"
      },
    ],
  },
  {
    title: "ข่าวสาร",
    path: "/backend/admin-news",
    icon: <FileText size={20} />,
    permission: "manage_news"
  },
  {
    title: "จัดการผู้ดูแล",
    path: "/backend/admin-manage",
    icon: <ShieldCheck size={20} />,
    permission: "manage_admins"
  },
  {
    title: "เพิ่มประวัติคนไข้",
    path: "/backend/admin-patient-form",
    icon: <ShieldCheck size={20} />,
    permission: "manage_patients"
  },
]

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  
  // User state - ไม่เก็บข้อมูลสำคัญใน state
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // UI state
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  
  // Notification state
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false)
  const [newAppointmentsCount, setNewAppointmentsCount] = useState<number>(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(true)

  // ตรวจสอบสิทธิ์ผ่าน API
  const checkUserPermission = (permission: string): boolean => {
    if (!userData || !userData.permissions) return false
    return userData.permissions.includes(permission) || userData.isSuperAdmin
  }

  // ดึงข้อมูลผู้ใช้จาก server
  const fetchUserData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // รวม httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Session หมดอายุ
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUserData({
        username: data.username,
        role: data.role,
        isSuperAdmin: data.role === 'SuperAdmin',
        permissions: data.permissions || []
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Redirect to login if authentication fails
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle submenu function
  const toggleSubmenu = (index: number) => {
    setOpenSubmenu(openSubmenu === index ? null : index)
  }

  // Handle notification click
  const handleNotificationClick = async () => {
    if (hasNewNotifications) {
      try {
        await fetch('/api/admin/notifications/mark-read', {
          method: 'POST',
          credentials: 'include',
        })
        setHasNewNotifications(false)
        setNewAppointmentsCount(0)
        router.push("/backend/admin-Panel")
      } catch (error) {
        console.error('Error marking notifications as read:', error)
      }
    }
  }

  // Logout handlers - ปลอดภัยกว่าเดิม
  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // เรียก API เพื่อลบ session บน server
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      // ไม่ต้องทำ localStorage.clear() เพราะไม่ได้ใช้ localStorage
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
      // แม้ logout ล้มเหลว ก็ให้ redirect ไป login
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleCancelLogout = () => {
    setShowLogoutDialog(false)
  }

  // Fetch notifications data
  const fetchNotifications = async () => {
    if (!userData) return
    
    try {
      setIsLoadingNotifications(true)
      const res = await fetch("/api/admin/notifications", {
        credentials: 'include'
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`Failed to fetch notifications: ${res.statusText}`)
      }
      
      const data = await res.json()
      setHasNewNotifications(data.hasNew)
      setNewAppointmentsCount(data.count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setHasNewNotifications(false)
      setNewAppointmentsCount(0)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  // Get user initials
  const getInitials = () => {
    if (userData?.username) {
      return userData.username
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return userData?.isSuperAdmin ? "SA" : "AD"
  }

  // Initialize user data and permissions
  useEffect(() => {
    fetchUserData()
  }, [])

  // Fetch notifications when user data is available
  useEffect(() => {
    if (userData) {
      fetchNotifications()
    }
  }, [userData])

  // Handle route protection - ตรวจสอบทั้ง client และจะตรวจสอบที่ server ด้วย
  useEffect(() => {
    if (!userData || isLoading) return

    const protectedRoutes = [
      { path: "/backend/admin-manage", permission: "manage_admins" },
      { path: "/backend/admin-patient-form", permission: "manage_patients" }
    ]
    
    const currentRoute = protectedRoutes.find(route => 
      pathname.startsWith(route.path)
    )
    
    if (currentRoute && !checkUserPermission(currentRoute.permission)) {
      router.push("/backend/dashboard")
    }
  }, [pathname, userData, isLoading])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!userData) return
    
    const intervalId = setInterval(() => {
      fetchNotifications()
    }, 30000)
    return () => clearInterval(intervalId)
  }, [userData])

  // Mark notifications as read when visiting appointment page
  useEffect(() => {
    if (pathname === "/backend/admin-Panel" && hasNewNotifications) {
      setTimeout(() => {
        handleNotificationClick()
      }, 1000)
    }
  }, [pathname, hasNewNotifications])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen bg-white border-r flex items-center justify-center w-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect to login if no user data
  if (!userData) {
    return null
  }

  return (
    <div className="h-screen bg-white border-r flex flex-col w-64 shadow-sm">
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Image 
           src="/logo.png" 
           alt="Logo" 
           width={190} 
           height={48} 
           className="object-contain w-40 sm:w-48 animate-fade-in hover:scale-105 transition-transform duration-200" 
            priority
            onError={(e) => {
              e.currentTarget.src = "/fallback-logo.png"
            }}
          />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* User Profile Section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:border-blue-200 transition-colors">
                <Avatar className="h-9 w-9 border-2 border-blue-200">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={userData.username || "แอดมิน"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {userData.username || "แอดมิน"}
                    </p>
                    <div className="flex items-center">
                      {isLoadingNotifications ? (
                        <div className="w-3 h-3 border border-blue-300 border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        hasNewNotifications && (
                          <Bell size={14} className="text-amber-500 animate-pulse mr-1" />
                        )
                      )}
                      <ChevronDown size={14} className="text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    {userData.role}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                </div>
                <span>ข้อมูลส่วนตัว</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotificationClick}>
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                </div>
                <span>การแจ้งเตือน</span>
                {hasNewNotifications && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {newAppointmentsCount}
                  </span>
                )}
              </DropdownMenuItem>
              {checkUserPermission("manage_admins") && (
                <DropdownMenuItem onClick={() => router.push("/backend/admin-manage")}>
                  <div className="w-4 h-4 flex items-center justify-center mr-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  </div>
                  <span>จัดการระบบแอดมิน</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogoutClick} 
                className="text-red-500 focus:text-red-500 focus:bg-red-50"
              >
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
          <div className="space-y-1">
            <div className="mb-2 px-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                เมนูหลัก
              </p>
            </div>

            {sidebarItems.map((item, index) => {
              // ตรวจสอบสิทธิ์แบบปลอดภัย
              const hasPermission = !item.permission || checkUserPermission(item.permission)
              
              const isActive = item.path
                ? pathname === item.path
                : item.submenu?.some((subItem) => pathname === subItem.path)

              const isAppointmentItem = item.title === "รายการนัด"
              const showBadge = isAppointmentItem && newAppointmentsCount > 0

              if (!hasPermission) {
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-center px-2 py-2 rounded-lg cursor-not-allowed opacity-50 justify-start"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
                    <span className="ml-3 text-sm">{item.title}</span>
                    <Lock size={14} className="ml-auto text-slate-400" />
                  </div>
                )
              }

              if (item.submenu) {
                const visibleSubItems = item.submenu.filter(subItem => 
                  !subItem.permission || checkUserPermission(subItem.permission)
                )

                if (visibleSubItems.length === 0) {
                  return null
                }

                return (
                  <div key={`${item.title}-${index}`} className="mb-1">
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
                            <div className={isActive ? "text-indigo-600" : "text-slate-600"}>
                              {item.icon}
                            </div>
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
                          {visibleSubItems.map((subItem, subIndex) => {
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
                  </div>
                )
              }

              return (
                <div key={`${item.path}-${index}`} className="mb-1">
                  <Link href={item.path || "#"}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start rounded-lg relative",
                        isActive
                          ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700"
                          : "text-slate-700 hover:bg-slate-100",
                        isAppointmentItem && newAppointmentsCount > 0 ? "animate-pulse" : "",
                      )}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className={isActive ? "text-indigo-600" : "text-slate-600"}>
                          {item.icon}
                        </div>
                      </div>
                      <span className="ml-3 text-sm">{item.title}</span>
                      {showBadge && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {newAppointmentsCount} ใหม่
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
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
              onClick={handleCancelLogout}
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