"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Calendar, History, AlertCircle, Loader2, Smartphone, CheckCircle, X } from "lucide-react"
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
  lineUserId?: string
  lineDisplayName?: string
  linePictureUrl?: string
  isLinkedWithLine?: boolean
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

// Success Modal Component
interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  showLineIcon?: boolean
}

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  showLineIcon = false 
}: SuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl p-0 border-0 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-500 to-green-600 px-6 py-8 rounded-t-2xl">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              {/* LINE Icon Badge */}
              {showLineIcon && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center border-2 border-white">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-white text-xl font-bold text-center">
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6 bg-white rounded-b-2xl">
          <p className="text-gray-700 text-center text-base leading-relaxed mb-6">
            {message}
          </p>
          
          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-sm transition-all duration-200"
          >
            เรียบร้อย
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const DashboardPage = () => {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [bannerImages, setBannerImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)
  const [showLineLinkDialog, setShowLineLinkDialog] = useState<boolean>(false)
  const [showLineUnlinkDialog, setShowLineUnlinkDialog] = useState<boolean>(false) // เพิ่ม state สำหรับ dialog ยกเลิกการเชื่อมต่อ
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  const [isLinkingLine, setIsLinkingLine] = useState<boolean>(false)
  const [isUnlinkingLine, setIsUnlinkingLine] = useState<boolean>(false) // เพิ่ม state สำหรับ loading การยกเลิก
  const [redirectUri, setRedirectUri] = useState<string>('')
  
  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [successModalData, setSuccessModalData] = useState<{
    title: string
    message: string
    showLineIcon?: boolean
  }>({
    title: '',
    message: '',
    showLineIcon: false
  })

  // LINE Login Configuration
  const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || 'YOUR_LINE_CHANNEL_ID'
  const STATE = Math.random().toString(36).substring(2, 15)

  useEffect(() => {
    // ตั้งค่า REDIRECT_URI เมื่ออยู่ใน client-side
    if (typeof window !== 'undefined') {
      const uri = encodeURIComponent(`${window.location.origin}/api/auth/line/callback`)
      setRedirectUri(uri)
    }
  }, [])

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

    // Handle LINE Login callback
    handleLineCallback()
  }, [])

  const handleLineCallback = async () => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const lineSuccess = urlParams.get('line_success')
    const lineProfileEncoded = urlParams.get('line_profile')
    
    console.log('🔍 Checking LINE callback params:', { lineSuccess, hasProfile: !!lineProfileEncoded })

    if (lineSuccess === 'true' && lineProfileEncoded) {
      try {
        console.log('🔍 LINE login success detected, processing...')
        
        // Decode LINE profile data
        const lineProfile = JSON.parse(atob(lineProfileEncoded))
        console.log('🔍 LINE profile decoded:', lineProfile)

        // Get current user info
        const stored = localStorage.getItem("user")
        if (!stored) {
          console.error('❌ No user data found in localStorage')
          setSuccessModalData({
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่',
            showLineIcon: false
          })
          setShowSuccessModal(true)
          return
        }

        const currentUser = JSON.parse(stored)
        console.log('🔍 Current user:', { citizenId: currentUser.citizenId, role: currentUser.role })

        if (!currentUser.citizenId) {
          console.error('❌ No citizen ID found')
          setSuccessModalData({
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่พบเลขบัตรประชาชน กรุณาเข้าสู่ระบบใหม่',
            showLineIcon: false
          })
          setShowSuccessModal(true)
          return
        }

        // เรียก API เพื่อบันทึกข้อมูล LINE
        console.log('🔍 Calling /api/user/link-line...')
        const response = await fetch('/api/user/link-line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            citizenId: currentUser.citizenId,
            lineProfile: lineProfile
          }),
        })

        console.log('🔍 Link LINE API response status:', response.status)
        const responseData = await response.json()
        console.log('🔍 Link LINE API response data:', responseData)

        if (response.ok && responseData.success) {
          console.log('✅ LINE account linked successfully!')
          
          // อัพเดท userInfo state
          setUserInfo(responseData.user)
          
          // อัพเดท localStorage
          const updatedUser = {
            ...currentUser,
            isLinkedWithLine: true,
            lineUserId: lineProfile.userId,
            lineDisplayName: lineProfile.displayName,
            linePictureUrl: lineProfile.pictureUrl
          }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          
          // แสดง Success Modal แทน alert
          setSuccessModalData({
            title: 'เชื่อมต่อสำเร็จ!',
            message: 'เชื่อมต่อบัญชี LINE สำเร็จแล้ว คุณจะได้รับการแจ้งเตือนผ่าน LINE ตั้งแต่นี้เป็นต้นไป',
            showLineIcon: true
          })
          setShowSuccessModal(true)
          
        } else {
          console.error('❌ Failed to link LINE account:', responseData.error)
          setSuccessModalData({
            title: 'เกิดข้อผิดพลาด',
            message: responseData.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี LINE',
            showLineIcon: false
          })
          setShowSuccessModal(true)
        }

        // ลบ parameters จาก URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
      } catch (error) {
        console.error('❌ Error processing LINE callback:', error)
        setSuccessModalData({
          title: 'เกิดข้อผิดพลาด',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี LINE',
          showLineIcon: false
        })
        setShowSuccessModal(true)
      }
    }
    
    // ตรวจสอบข้อผิดพลาด
    const lineError = urlParams.get('line_error')
    if (lineError) {
      console.error('❌ LINE login error:', lineError)
      let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ LINE'
      
      switch (lineError) {
        case 'access_denied':
          errorMessage = 'คุณได้ยกเลิกการเชื่อมต่อ LINE'
          break
        case 'invalid_params':
          errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาลองใหม่'
          break
        case 'token_failed':
          errorMessage = 'การรับรอง Token ล้มเหลว กรุณาลองใหม่'
          break
        case 'profile_failed':
          errorMessage = 'ไม่สามารถดึงข้อมูล Profile ได้ กรุณาลองใหม่'
          break
        case 'server_error':
          errorMessage = 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่'
          break
      }
      
      setSuccessModalData({
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage,
        showLineIcon: false
      })
      setShowSuccessModal(true)
      
      // ลบ error parameter จาก URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  const initiateLineLogin = () => {
    if (!redirectUri) {
      console.error('Redirect URI not set yet')
      return
    }

    setIsLinkingLine(true)
    localStorage.setItem('line_login_state', STATE)
    
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${redirectUri}&state=${STATE}&scope=profile%20openid&nonce=${Math.random().toString(36).substring(2, 15)}`
    
    window.location.href = lineLoginUrl
  }

  // เปลี่ยนจาก unlinkLineAccount เป็น handleUnlinkClick เพื่อแสดง dialog ยืนยัน
  const handleUnlinkClick = () => {
    setShowLineUnlinkDialog(true)
  }

  // ฟังก์ชันจริงสำหรับยกเลิกการเชื่อมต่อ LINE
  const confirmUnlinkLineAccount = async () => {
    setIsUnlinkingLine(true)
    
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored)
        
        const response = await fetch('/api/user/unlink-line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            citizenId: parsed.citizenId
          }),
        })

        if (response.ok) {
          const updatedUserInfo = await response.json()
          setUserInfo(updatedUserInfo)
          localStorage.setItem("user", JSON.stringify({
            ...parsed,
            isLinkedWithLine: false,
            lineUserId: null
          }))
          
          // ปิด dialog ยืนยันก่อน
          setShowLineUnlinkDialog(false)
          
          // แสดง Success Modal สำหรับการยกเลิกการเชื่อมต่อ
          setSuccessModalData({
            title: 'ยกเลิกการเชื่อมต่อสำเร็จ',
            message: 'ยกเลิกการเชื่อมต่อบัญชี LINE เรียบร้อยแล้ว คุณจะไม่ได้รับการแจ้งเตือนผ่าน LINE อีกต่อไป',
            showLineIcon: false
          })
          setShowSuccessModal(true)
        } else {
          // ปิด dialog ยืนยันก่อน
          setShowLineUnlinkDialog(false)
          
          setSuccessModalData({
            title: 'เกิดข้อผิดพลาด',
            message: 'เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE',
            showLineIcon: false
          })
          setShowSuccessModal(true)
        }
      }
    } catch (error) {
      console.error('Error unlinking LINE account:', error)
      
      // ปิด dialog ยืนยันก่อน
      setShowLineUnlinkDialog(false)
      
      setSuccessModalData({
        title: 'เกิดข้อผิดพลาด',
        message: 'เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE',
        showLineIcon: false
      })
      setShowSuccessModal(true)
    } finally {
      setIsUnlinkingLine(false)
    }
  }

  const avatarSrc = useMemo(() => {
    // Use LINE profile picture if available
    if (userInfo?.linePictureUrl) {
      return userInfo.linePictureUrl
    }

    const prefix = userInfo?.prefix?.trim()
    if (!prefix) return "/man.png"
    if (["นาง", "นางสาว"].includes(prefix)) return "/woman.png"
    if (prefix === "เด็กหญิง") return "/girl.png"
    if (prefix === "เด็กชาย") return "/boy.png"
    return "/man.png"
  }, [userInfo?.prefix, userInfo?.linePictureUrl])

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

      <div className="w-full max-w-md px-4 mt-4">
        <div className="flex items-center">
          <Avatar className="h-12 w-12 border border-white">
            <AvatarImage src={avatarSrc || "/placeholder.svg"} />
            <AvatarFallback>PT</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="font-bold text-sm">
              {userInfo?.lineDisplayName || userInfo?.name || ""}
            </div>
            <div className="text-white text-sm bg-blue-700 px-2 py-0.5 rounded-md mt-1 inline-block">
              {userInfo?.hn || "HN00000000"}
            </div>
            {userInfo?.isLinkedWithLine && (
              <div className="flex items-center mt-1">
                <div className="w-4 h-4 bg-[#06C755] rounded-full flex items-center justify-center mr-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-xs text-green-600 font-medium">เชื่อมต่อ LINE แล้ว</span>
              </div>
            )}
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

          {/* LINE Integration in Main Menu */}
          {!userInfo?.isLinkedWithLine ? (
            <div 
              onClick={() => setShowLineLinkDialog(true)}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 h-full min-h-[100px] flex flex-col justify-center hover:bg-green-50 transition-all cursor-pointer"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center mr-3">
                  <Smartphone className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="text-slate-800 font-medium">เชื่อมต่อ LINE</div>
                  <div className="text-sm text-slate-500">รับการแจ้งเตือนผ่าน LINE</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 h-full min-h-[100px] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center mr-3">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-slate-800 font-medium">LINE: {userInfo.lineDisplayName}</div>
                    <div className="text-sm text-slate-500">จะได้รับการแจ้งเตือนผ่าน LINE</div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleUnlinkClick} // เปลี่ยนจาก unlinkLineAccount เป็น handleUnlinkClick
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successModalData.title}
        message={successModalData.message}
        showLineIcon={successModalData.showLineIcon}
      />

      {/* LINE Link Confirmation Dialog */}
      <Dialog open={showLineLinkDialog} onOpenChange={setShowLineLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#06C755]">
              <div className="w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
              เชื่อมต่อกับ LINE
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              เชื่อมต่อกับ LINE เพื่อรับการแจ้งเตือนเกี่ยวกับ:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 ml-4">
              <li>• การยืนยันนัดหมาย</li>
              <li>• การเตือนก่อนนัดหมาย</li>
              <li>• ผลการตรวจสุขภาพ</li>
              <li>• ข่าวสารจากโรงพยาบาล</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              คุณสามารถยกเลิกการเชื่อมต่อได้ตลอดเวลา
            </p>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLineLinkDialog(false)}
              disabled={isLinkingLine}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={initiateLineLogin}
              disabled={isLinkingLine || !redirectUri}
              className="bg-[#06C755] hover:bg-[#05b048] text-white"
            >
              {isLinkingLine ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเชื่อมต่อ...
                </>
              ) : (
                'เชื่อมต่อ LINE'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE Unlink Confirmation Dialog - เพิ่ม Dialog ใหม่ */}
      <Dialog open={showLineUnlinkDialog} onOpenChange={setShowLineUnlinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5 text-red-500" />
              ยืนยันการยกเลิกการเชื่อมต่อ LINE
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              คุณต้องการยกเลิกการเชื่อมต่อบัญชี LINE หรือไม่?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>หมายเหตุ:</strong> หากยกเลิกการเชื่อมต่อ คุณจะไม่ได้รับการแจ้งเตือนผ่าน LINE อีกต่อไป
              </p>
            </div>
            {userInfo?.lineDisplayName && (
              <p className="text-sm text-gray-600">
                บัญชี LINE: <strong>{userInfo.lineDisplayName}</strong>
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLineUnlinkDialog(false)}
              disabled={isUnlinkingLine}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={confirmUnlinkLineAccount}
              disabled={isUnlinkingLine}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUnlinkingLine ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังยกเลิก...
                </>
              ) : (
                'ยืนยันยกเลิกการเชื่อมต่อ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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