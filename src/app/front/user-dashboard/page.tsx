"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Calendar, History, AlertCircle, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import UpcomingAppointment from "../component/UpcomingAppointment"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSwipeable } from "react-swipeable" //npm install react-swipeable
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserInfo {
  prefix: string
  name: string
  citizenId: string
  hn?: string
}

const DashboardPage = () => {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [bannerImages, setBannerImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [bannerImages.length])

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.role === "user" && parsed.citizenId) {
        fetch(`/api/user/profile?citizenId=${parsed.citizenId}`)
          .then((res) => res.json())
          .then((data) => setUserInfo(data))
          .catch((err) => console.error("Error fetching profile:", err))
      }
    }

    fetch("/api/admin/new")
      .then((res) => res.json())
      .then((data) => {
        const urls = data.map((item: any) => item.imageUrl)
        setBannerImages(urls)
      })
      .catch((err) => console.error("Error loading banner images:", err))
  }, [])

  const avatarSrc = useMemo(() => {
    const prefix = userInfo?.prefix?.trim()
    if (!prefix) return "/man.png"
    if (["นาง", "นางสาว"].includes(prefix)) return "/woman.png"
    if (prefix === "เด็กหญิง") return "/girl.png"
    if (prefix === "เด็กชาย") return "/boy.png"
    return "/man.png"
  }, [userInfo?.prefix])

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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((prev) => (prev + 1) % bannerImages.length),
    onSwipedRight: () => setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length),
    trackMouse: true,
  })

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-10 px-2">
      {/* Header with logo */}
      <div className="w-screen bg-[#0b47d4] py-3 relative flex justify-center items-center">
        <div className="bg-white rounded-lg p-1 shadow-sm">
          <Image src="/logo.png" alt="โรงพยาบาลแม่จัน" width={150} height={38} className="object-contain" priority />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-blue-900"
          onClick={handleLogoutClick}
        >
          <LogOut className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </Button>
      </div>

      <div className="w-full max-w-md px-4 mt-4 flex items-center">
        <Avatar className="h-12 w-12 border border-white">
          <AvatarImage src={avatarSrc || "/placeholder.svg"} />
          <AvatarFallback>PT</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <div className="font-bold text-sm">{userInfo?.name || ""}</div>
          <div className="text-white text-sm bg-blue-700 px-2 py-0.5 rounded-md mt-1">
            {userInfo?.hn || "HN00000000"}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="w-full mt-4 px-4" {...swipeHandlers}>
        <div className="max-w-md mx-auto overflow-hidden shadow-lg rounded-xl bg-white">
          {bannerImages.length > 0 && (
            <Image
              src={bannerImages[currentIndex] || "/placeholder.svg"}
              alt="สไลด์ภาพโรงพยาบาล"
              width={800}
              height={400}
              className="w-full h-48 object-cover transition-all duration-1000 ease-in-out"
            />
          )}
        </div>
        <div className="flex justify-center mt-2 gap-2">
          {bannerImages.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === currentIndex ? "bg-blue-600" : "bg-gray-300"}`}
            ></span>
          ))}
        </div>
      </div>

      <UpcomingAppointment />

      <div className="w-full max-w-md mt-6 px-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">รายการหลัก</h3>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/front/user-booking" className="block">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 h-full min-h-[100px] flex flex-col justify-center hover:bg-blue-50 transition-all">
              <div className="flex items-center">
                <Calendar className="text-blue-500 mr-3" />
                <div>
                  <div className="text-slate-800 font-medium">นัดหมายออนไลน์</div>
                  <div className="text-sm text-slate-500">จองคิวและนัดหมายล่วงหน้า</div>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/front/user-history" className="block">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 h-full min-h-[100px] flex flex-col justify-center hover:bg-blue-50 transition-all">
              <div className="flex items-center">
                <History className="text-teal-500 mr-3" />
                <div>
                  <div className="text-slate-800 font-medium">ประวัติการรักษา</div>
                  <div className="text-sm text-slate-500">ดูประวัติการรักษาของคุณ</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              ยืนยันการออกจากระบบ
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังออกจากระบบ...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  ยืนยันออกจากระบบ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DashboardPage
