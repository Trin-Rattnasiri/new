"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const DashboardPage = () => {
  const router = useRouter()

  const handleLogout = () => {
    const confirmLogout = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")
    if (confirmLogout) {
      localStorage.clear()
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex flex-col items-center pb-10 px-2">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-blue-700 to-blue-900 py-3 px-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="border-2 border-white h-9 w-9 shrink-0">
            <AvatarImage src="/man.png" alt="Profile" />
            <AvatarFallback>MCH</AvatarFallback>
          </Avatar>
          <div className="relative w-[120px] sm:w-[150px] overflow-hidden">
            <div className="whitespace-nowrap text-white text-xs sm:text-sm font-medium animate-marquee">
              โรงพยาบาลแม่จัน ยินดีต้อนรับ
            </div>
          </div>
        </div>

        <h1 className="text-white text-base sm:text-xl font-bold tracking-wide text-center flex-1 hidden sm:block">MCH</h1>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="text-sm">ออกจากระบบ</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ออกจากระบบ</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {/* Banner */}
      <div className="w-full max-w-md mt-6 px-4">
        <Card className="border-none overflow-hidden shadow-lg rounded-xl">
          <CardContent className="p-0">
            <Image
              src="/fight.jpg"
              alt="hospital-banner"
              width={600}
              height={200}
              className="w-full h-auto object-cover"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Menu */}
      <div className="w-full max-w-md mt-8 px-4">
        <div className="flex items-center mb-4">
          <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
          <h2 className="text-lg font-bold text-slate-800">รายการหลัก</h2>
        </div>

        <div className="space-y-4">
          <Link href="/front/user-booking" className="block">
            <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center sm:flex-row flex-col">
                  <div className="w-full sm:w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <div className="bg-white/20 rounded-full p-3">
                      <Image
                        src="/medical (1).png"
                        alt="calendar"
                        width={30}
                        height={30}
                        className="filter brightness-0 invert"
                      />
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
            <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center sm:flex-row flex-col">
                  <div className="w-full sm:w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                    <div className="bg-white/20 rounded-full p-3">
                      <Image
                        src="/patient.png"
                        alt="history"
                        width={30}
                        height={30}
                        className="filter brightness-0 invert"
                      />
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
          <div className="h-8 w-1 bg-purple-600 rounded-full mr-3"></div>
          <h2 className="text-lg font-bold text-slate-800">ข้อมูลส่วนบุคคล</h2>
        </div>

        <Link href="/front/user-profile" className="block">
          <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center sm:flex-row flex-col">
                <div className="w-full sm:w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <div className="bg-white/20 rounded-full p-3">
                    <Image
                      src="/user.png"
                      alt="user-info"
                      width={30}
                      height={30}
                      className="filter brightness-0 invert"
                    />
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
