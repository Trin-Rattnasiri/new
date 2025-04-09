"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Calendar, History, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserInfo {
  prefix: string
  name: string
  citizenId: string
}

const DashboardPage = () => {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const id = localStorage.getItem("citizenId")
    if (id) {
      fetch(`/api/user/profile?citizenId=${id}`)
        .then((res) => res.json())
        .then((data) => setUserInfo(data))
        .catch((err) => console.error("Error fetching profile:", err))
    }
  }, [])

  const avatarSrc = useMemo(() => {
    const prefix = userInfo?.prefix?.trim()
    if (!prefix) return "/man.png"
    if (["นาง", "นางสาว"].includes(prefix)) return "/woman.png"
    if (prefix === "เด็กหญิง") return "/girl.png"
    if (prefix === "เด็กชาย") return "/boy.png"
    return "/man.png"
  }, [userInfo?.prefix])

  const handleLogout = () => {
    const confirmLogout = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")
    if (confirmLogout) {
      localStorage.clear()
      router.push("/")
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center pb-10 px-2"
      style={{ background: "linear-gradient(to bottom, #f8fafc, #eff6ff)" }}
    >
      {/* Header */}
      <header
        className="w-full py-3 px-4 shadow-md flex items-center justify-between sticky top-0 z-10"
        style={{ background: "linear-gradient(to right, #1d4ed8, #1e3a8a)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="border-2 border-white h-9 w-9 shrink-0">
            <AvatarImage src={avatarSrc} alt="โปรไฟล์ผู้ใช้" />
            <AvatarFallback>MCH</AvatarFallback>
          </Avatar>
          <div className="relative w-[120px] sm:w-[150px] overflow-hidden">
            <div className="whitespace-nowrap text-white text-xs sm:text-sm font-medium animate-marquee">
              โรงพยาบาลแม่จัน ยินดีต้อนรับ
            </div>
          </div>
        </div>

        <h1 className="text-white text-sm sm:text-xl font-bold tracking-wide text-center flex-1 hidden sm:block">
          MCH
        </h1>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                style={{ backgroundColor: "#2563eb", color: "white" }}
                className="rounded-full hover:bg-blue-700 text-white whitespace-nowrap"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="text-sm hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ออกจากระบบ</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {/* Banner */}
      <div className="w-full mt-6 px-4">
  <div className="max-w-md mx-auto overflow-hidden shadow-lg rounded-2xl bg-white">
    <Image
      src="/fight.jpg"
      alt="โรงพยาบาลแม่จันร่วมต้านทุจริต"
      width={800}
      height={400}
      className="w-full h-auto object-cover"
    />
  </div>
</div>

      {/* Main Menu */}
      <div className="w-full max-w-md mt-8 px-4">
        <div className="flex items-center mb-4">
          <div className="h-8 w-1 rounded-full mr-3" style={{ backgroundColor: "#2563eb" }}></div>
          <h2 className="text-lg font-bold text-slate-800">รายการหลัก</h2>
        </div>

        <div className="space-y-4">
          <Link href="/front/user-booking" className="block">
            <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center flex-col sm:flex-row">
                  <div
                    className="w-full sm:w-20 h-20 flex items-center justify-center"
                    style={{ background: "linear-gradient(to bottom right, #3b82f6, #1d4ed8)" }}
                  >
                    <div className="bg-white/20 rounded-full p-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="p-4 text-center sm:text-left w-full">
                    <span className="text-base text-slate-800 font-medium">นัดหมายออนไลน์</span>
                    <p className="text-sm text-slate-500 mt-1">จองคิวและนัดหมายล่วงหน้า</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/front/user-history" className="block">
            <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center flex-col sm:flex-row">
                  <div
                    className="w-full sm:w-20 h-20 flex items-center justify-center"
                    style={{ background: "linear-gradient(to bottom right, #14b8a6, #0f766e)" }}
                  >
                    <div className="bg-white/20 rounded-full p-3">
                      <History className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="p-4 text-center sm:text-left w-full">
                    <span className="text-base text-slate-800 font-medium">ประวัติการรักษา</span>
                    <p className="text-sm text-slate-500 mt-1">ดูประวัติการรักษาของคุณ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="flex items-center mb-4 mt-6">
          <div className="h-8 w-1 rounded-full mr-3" style={{ backgroundColor: "#9333ea" }}></div>
          <h2 className="text-lg font-bold text-slate-800">ข้อมูลส่วนบุคคล</h2>
        </div>

        <Link href="/front/user-profile" className="block">
          <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center flex-col sm:flex-row">
                <div
                  className="w-full sm:w-20 h-20 flex items-center justify-center"
                  style={{ background: "linear-gradient(to bottom right, #a855f7, #7e22ce)" }}
                >
                  <div className="bg-white/20 rounded-full p-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="p-4 text-center sm:text-left w-full">
                  <span className="text-base text-slate-800 font-medium">ข้อมูลผู้ใช้งาน</span>
                  <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลส่วนตัวของคุณ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default DashboardPage
