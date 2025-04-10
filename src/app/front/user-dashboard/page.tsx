"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Calendar, History, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import UpcomingAppointment from "../component/UpcomingAppointment"

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
    <div className="min-h-screen bg-white flex flex-col items-center pb-10 px-2">
      {/* Header */}
      <div className="w-screen bg-[#0b47d4] text-white text-center py-3 text-xl font-bold relative">
        โรงพยาบาลแม่จัน
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-blue-900"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-1" />
          ออกจากระบบ
        </Button>
      </div>

      {/* User Info */}
      <div className="w-full max-w-md px-4 mt-4 flex items-center">
        <Avatar className="h-12 w-12 border border-white">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback>PT</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <div className="font-bold text-sm">{userInfo?.name || ""}</div>
          <div className="text-white text-sm bg-blue-700 px-2 py-0.5 rounded-md mt-1">HN {userInfo?.citizenId || "123456-78"}</div>
        </div>
      </div>

      {/* Banner */}
      <div className="w-full mt-4 px-4">
        <div className="max-w-md mx-auto overflow-hidden shadow-lg rounded-xl bg-white">
          <Image
            src="/fight.jpg"
            alt="โรงพยาบาลแม่จันร่วมต้านทุจริต"
            width={800}
            height={400}
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* รายการสำคัญ */}
      <UpcomingAppointment />

      {/* รายการหลัก */}
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
    </div>
  )
}

export default DashboardPage
