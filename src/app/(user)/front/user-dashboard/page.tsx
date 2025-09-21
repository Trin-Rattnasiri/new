"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Calendar, History, AlertCircle, Loader2, Smartphone, CheckCircle, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import UpcomingAppointment from "../component/UpcomingAppointment"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSwipeable } from "react-swipeable"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  showLineIcon?: boolean
}

const SuccessModal = ({ isOpen, onClose, title, message, showLineIcon = false }: SuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl p-0 border-0 shadow-2xl">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>

        <div className="relative bg-gradient-to-br from-green-500 to-green-600 px-6 py-8 rounded-t-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              {showLineIcon && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center border-2 border-white">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          <h3 className="text-white text-xl font-bold text-center">{title}</h3>
        </div>

        <div className="px-6 py-6 bg-white rounded-b-2xl">
          <p className="text-gray-700 text-center text-base leading-relaxed mb-6">{message}</p>
          <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-sm">
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showLineLinkDialog, setShowLineLinkDialog] = useState(false)
  const [showLineUnlinkDialog, setShowLineUnlinkDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLinkingLine, setIsLinkingLine] = useState(false)
  const [isUnlinkingLine, setIsUnlinkingLine] = useState(false)
  const [redirectUri, setRedirectUri] = useState("")

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{ title: string; message: string; showLineIcon?: boolean }>({
    title: "", message: "", showLineIcon: false
  })

  // ตั้ง redirectUri จาก ENV ถ้ามี ไม่งั้นใช้ origin ปัจจุบัน แล้ว encode ทันที
  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const uri = encodeURIComponent(`${base}/api/auth/line/callback`)
      setRedirectUri(uri)
    }
  }, [])

  // auto slide
  useEffect(() => {
    if (bannerImages.length <= 1) return
    const t = setInterval(() => setCurrentIndex((p) => (p + 1) % bannerImages.length), 5000)
    return () => clearInterval(t)
  }, [bannerImages.length])

  // โหลดโปรไฟล์จากคุกกี้ + แบนเนอร์ + handle line callback
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (res.status === 401) {
          router.replace("/"); return
        }
        const data = await res.json()
        const p = data.profile
        setUserInfo({
          prefix: p.prefix ?? "",
          name: p.name ?? p.username ?? "",
          citizenId: p.citizenId ?? "",
          hn: p.hn ?? "",
          isLinkedWithLine: !!p.lineUserId || !!p.lineDisplayName || !!p.linePictureUrl,
          lineUserId: p.lineUserId ?? undefined,
          lineDisplayName: p.lineDisplayName ?? undefined,
          linePictureUrl: p.linePictureUrl ?? undefined,
        })
      } catch (e) {
        console.error("Failed to load /api/auth/me", e)
        router.replace("/")
      }
    })()

    fetch("/api/admin/new")
      .then((r) => r.json())
      .then((d) => setBannerImages(d.map((x: any) => x.imageUrl)))
      .catch((e) => console.error("Error loading banner images:", e))

    handleLineCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLineCallback = async () => {
    if (typeof window === "undefined") return
    const urlParams = new URLSearchParams(window.location.search)
    const lineSuccess = urlParams.get("line_success")
    const lineProfileEncoded = urlParams.get("line_profile")
    const lineError = urlParams.get("line_error")

    try {
      if (lineSuccess === "true") {
        if (lineProfileEncoded) {
          const lineProfile: LineProfile = JSON.parse(atob(lineProfileEncoded))
          const response = await fetch("/api/user/link-line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineProfile }),
          })
          const resJson = await response.json()
          if (!response.ok || (resJson?.success === false)) {
            throw new Error(resJson?.error || "Link-line failed")
          }
          setUserInfo((prev) => ({
            ...(prev ?? { prefix: "", name: "", citizenId: "" }),
            isLinkedWithLine: true,
            lineUserId: lineProfile.userId,
            lineDisplayName: lineProfile.displayName,
            linePictureUrl: lineProfile.pictureUrl,
          }))
        } else {
          // กรณีไม่มี line_profile แนบมา ให้รีเฟรชจาก /api/me
          const me = await fetch("/api/auth/me", { cache: "no-store" })
          const data = await me.json()
          const p = data.profile || {}
          setUserInfo({
            prefix: p.prefix ?? "",
            name: p.name ?? p.username ?? "",
            citizenId: p.citizenId ?? "",
            hn: p.hn ?? "",
            isLinkedWithLine: !!p.lineUserId || !!p.lineDisplayName || !!p.linePictureUrl,
            lineUserId: p.lineUserId ?? undefined,
            lineDisplayName: p.lineDisplayName ?? undefined,
            linePictureUrl: p.linePictureUrl ?? undefined,
          })
        }

        setSuccessModalData({
          title: "เชื่อมต่อสำเร็จ!",
          message: "เชื่อมต่อบัญชี LINE สำเร็จแล้ว คุณจะได้รับการแจ้งเตือนผ่าน LINE ตั้งแต่นี้เป็นต้นไป",
          showLineIcon: true,
        })
        setShowSuccessModal(true)
        return
      }

      if (lineError) {
        let msg = "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE"
        if (lineError === "access_denied") msg = "คุณได้ยกเลิกการเชื่อมต่อ LINE"
        if (lineError === "invalid_params") msg = "ข้อมูลไม่ถูกต้อง กรุณาลองใหม่"
        if (lineError === "invalid_state") msg = "การตรวจสอบความปลอดภัยไม่ผ่าน กรุณาลองใหม่"
        if (lineError === "token_failed") msg = "การรับรอง Token ล้มเหลว กรุณาลองใหม่"
        if (lineError === "profile_failed") msg = "ไม่สามารถดึงข้อมูล Profile ได้ กรุณาลองใหม่"
        if (lineError === "already_linked") msg = "บัญชี LINE นี้ถูกเชื่อมกับผู้ใช้อื่นแล้ว"
        if (lineError === "session_expired") msg = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
        if (lineError === "session_invalid") msg = "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่"
        if (lineError === "user_not_found") msg = "ไม่พบผู้ใช้สำหรับเชื่อมต่อ กรุณาติดต่อเจ้าหน้าที่"

        setSuccessModalData({ title: "เกิดข้อผิดพลาด", message: msg, showLineIcon: false })
        setShowSuccessModal(true)
        return
      }
    } catch (e) {
      console.error("Error processing LINE callback:", e)
      setSuccessModalData({ title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี LINE", showLineIcon: false })
      setShowSuccessModal(true)
    } finally {
      // ล้าง query ออกจาก URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

 // แทนที่ฟังก์ชัน initiateLineLogin ใน DashboardPage.tsx
const initiateLineLogin = async () => {
  if (!redirectUri) return
  setIsLinkingLine(true)

  try {
    console.log("🚀 Starting LINE login process...")

    // ใช้ citizenId จาก userInfo โดยตรง
    if (!userInfo?.citizenId) {
      throw new Error("CitizenId not found in user info")
    }

    const citizenId = userInfo.citizenId
    console.log("📋 Using citizenId from userInfo:", citizenId)

    // สร้าง random และเก็บเป็นคุกกี้
    const randomState = Math.random().toString(36).slice(2)
    
    // เก็บ state cookie พร้อมการตั้งค่าที่เหมาะสม
    const isSecure = window.location.protocol === 'https:'
    document.cookie = `line_login_state=${randomState}; Max-Age=600; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
    
    // เก็บ citizenId ไว้ใน localStorage ชั่วคราว (เพื่อกู้คืน session)
    localStorage.setItem('temp_citizen_id', citizenId)
    localStorage.setItem('temp_login_timestamp', Date.now().toString())

    // เข้ารหัส state
    const stateData = {
      random: randomState,
      citizenId: citizenId,
      timestamp: Date.now(),
    }
    const encodedState = btoa(JSON.stringify(stateData))
    console.log("🔐 Created encoded state:", encodedState)
    console.log("📦 State data:", stateData)

    // ตรวจ client_id
    const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID
    if (!LINE_CHANNEL_ID) {
      throw new Error("NEXT_PUBLIC_LINE_CHANNEL_ID is missing")
    }

    // เตรียม URL ไป LINE
    const nonce = Math.random().toString(36).slice(2)
    const lineAuthUrl =
      `https://access.line.me/oauth2/v2.1/authorize` +
      `?response_type=code` +
      `&client_id=${LINE_CHANNEL_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&state=${encodedState}` +
      `&scope=profile%20openid` +
      `&nonce=${nonce}`

    console.log("🔗 Redirecting to LINE:", lineAuthUrl)
    window.location.href = lineAuthUrl
  } catch (error) {
    console.error("❌ Error initiating LINE login:", error)
    // ลบ temp data หากเกิด error
    localStorage.removeItem('temp_citizen_id')
    localStorage.removeItem('temp_login_timestamp')
    
    setSuccessModalData({
      title: "เกิดข้อผิดพลาด",
      message: "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE กรุณาลองใหม่อีกครั้ง",
      showLineIcon: false,
    })
    setShowSuccessModal(true)
    setIsLinkingLine(false)
  }
}
  const confirmUnlinkLineAccount = async () => {
    setIsUnlinkingLine(true)
    try {
      const response = await fetch("/api/user/unlink-line", { method: "POST" })
      const res = await response.json()
      if (response.ok && (res?.success ?? true)) {
        setUserInfo((prev) =>
          prev ? { ...prev, isLinkedWithLine: false, lineUserId: undefined, lineDisplayName: undefined, linePictureUrl: undefined } : prev
        )
        setShowLineUnlinkDialog(false)
        setSuccessModalData({ title: "ยกเลิกการเชื่อมต่อสำเร็จ", message: "คุณจะไม่ได้รับการแจ้งเตือนผ่าน LINE อีกต่อไป", showLineIcon: false })
        setShowSuccessModal(true)
      } else {
        setShowLineUnlinkDialog(false)
        setSuccessModalData({ title: "เกิดข้อผิดพลาด", message: res?.error || "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE", showLineIcon: false })
        setShowSuccessModal(true)
      }
    } catch (e) {
      console.error("Error unlinking LINE account:", e)
      setShowLineUnlinkDialog(false)
      setSuccessModalData({ title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE", showLineIcon: false })
      setShowSuccessModal(true)
    } finally {
      setIsUnlinkingLine(false)
    }
  }

  const handleLogoutClick = () => setShowLogoutDialog(true)
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/user/logout", { method: "POST" })
    } finally {
      router.replace("/")
    }
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((p) => (bannerImages.length ? (p + 1) % bannerImages.length : 0)),
    onSwipedRight: () => setCurrentIndex((p) => (bannerImages.length ? (p - 1 + bannerImages.length) % bannerImages.length : 0)),
    trackMouse: true,
  })

  const avatarSrc = useMemo(() => {
    if (userInfo?.linePictureUrl) return userInfo.linePictureUrl
    const prefix = userInfo?.prefix?.trim()
    if (!prefix) return "/man.png"
    if (["นาง", "นางสาว"].includes(prefix)) return "/woman.png"
    if (prefix === "เด็กหญิง") return "/girl.png"
    if (prefix === "เด็กชาย") return "/boy.png"
    return "/man.png"
  }, [userInfo?.prefix, userInfo?.linePictureUrl])

  const displayName = useMemo(() => {
    if (!userInfo) return ""
    return userInfo.isLinkedWithLine && userInfo.lineDisplayName ? userInfo.lineDisplayName : userInfo.name ?? ""
  }, [userInfo])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-10 px-2">
      {/* Header */}
      <div className="w-screen bg-[#0b47d4] py-3 relative flex justify-center items-center">
        <div className="bg-white rounded-lg p-1 shadow-sm">
          <Image src="/logo.png" alt="โรงพยาบาลแม่จัน" width={150} height={38} className="object-contain" priority />
        </div>
        <Button variant="ghost" size="sm" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-blue-900" onClick={handleLogoutClick}>
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
            <div className="font-bold text-sm">{displayName}</div>
            <div className="text-white text-sm bg-blue-700 px-2 py-0.5 rounded-md mt-1 inline-block">{userInfo?.hn || "HN00000000"}</div>
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
            <span key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? "bg-blue-600" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>

      <UpcomingAppointment />

      <div className="w-full max-w-md mt-6 px-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">รายการหลัก</h3>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/front/user-booking" className="block">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 min-h-[100px] flex flex-col justify-center hover:bg-blue-50 transition-all">
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
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 min-h-[100px] flex flex-col justify-center hover:bg-blue-50 transition-all">
              <div className="flex items-center">
                <History className="text-teal-500 mr-3" />
                <div>
                  <div className="text-slate-800 font-medium">ประวัติการรักษา</div>
                  <div className="text-sm text-slate-500">ดูประวัติการรักษาของคุณ</div>
                </div>
              </div>
            </div>
          </Link>

          {!userInfo?.isLinkedWithLine ? (
            <div onClick={() => setShowLineLinkDialog(true)} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 min-h-[100px] flex flex-col justify-center hover:bg-green-50 transition-all cursor-pointer">
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
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 min-h-[100px] flex flex-col justify-center">
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
                <Button size="sm" variant="outline" onClick={() => setShowLineUnlinkDialog(true)} className="text-red-600 border-red-300 hover:bg-red-50">
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

      {/* LINE Link Dialog */}
      <Dialog open={showLineLinkDialog} onOpenChange={setShowLineLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogDescription>เชื่อมต่อบัญชี LINE เพื่อรับการแจ้งเตือน</DialogDescription></VisuallyHidden>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[#06C755]">
            <div className="w-6 h-6 bg-[#06C755] rounded-full flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-white" />
            </div>เชื่อมต่อกับ LINE
          </DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">เชื่อมต่อกับ LINE เพื่อรับการแจ้งเตือนเกี่ยวกับ:</p>
            <ul className="text-sm text-gray-600 space-y-2 ml-4">
              <li>• การยืนยันนัดหมาย</li>
              <li>• การเตือนก่อนนัดหมาย</li>
              <li>• ผลการตรวจสุขภาพ</li>
              <li>• ข่าวสารจากโรงพยาบาล</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">คุณสามารถยกเลิกการเชื่อมต่อได้ตลอดเวลา</p>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowLineLinkDialog(false)} disabled={isLinkingLine}>ยกเลิก</Button>
            <Button type="button" onClick={initiateLineLogin} disabled={isLinkingLine || !redirectUri} className="bg-[#06C755] hover:bg-[#05b048] text-white">
              {isLinkingLine ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังเชื่อมต่อ...</>) : ("เชื่อมต่อ LINE")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE Unlink Dialog */}
      <Dialog open={showLineUnlinkDialog} onOpenChange={setShowLineUnlinkDialog}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogDescription>ยืนยันการยกเลิกการเชื่อมต่อบัญชี LINE ของคุณ</DialogDescription></VisuallyHidden>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5 text-red-500" />ยืนยันการยกเลิกการเชื่อมต่อ LINE
          </DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">คุณต้องการยกเลิกการเชื่อมต่อบัญชี LINE หรือไม่?</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800"><strong>หมายเหตุ:</strong> หากยกเลิกการเชื่อมต่อ คุณจะไม่ได้รับการแจ้งเตือนผ่าน LINE อีกต่อไป</p>
            </div>
            {userInfo?.lineDisplayName && <p className="text-sm text-gray-600">บัญชี LINE: <strong>{userInfo.lineDisplayName}</strong></p>}
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowLineUnlinkDialog(false)} disabled={isUnlinkingLine}>ยกเลิก</Button>
            <Button type="button" onClick={confirmUnlinkLineAccount} disabled={isUnlinkingLine} className="bg-red-600 hover:bg-red-700 text-white">
              {isUnlinkingLine ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังยกเลิก...</>) : ("ยืนยันยกเลิกการเชื่อมต่อ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogDescription>ยืนยันการออกจากระบบจากบัญชีผู้ใช้ของคุณ</DialogDescription></VisuallyHidden>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 text-red-600" />ยืนยันการออกจากระบบ
          </DialogTitle></DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowLogoutDialog(false)} className="bg-white" disabled={isLoggingOut}>ยกเลิก</Button>
            <Button type="button" onClick={handleLogout} disabled={isLoggingOut} className="bg-red-600 hover:bg-yellow-500 text-white">
              {isLoggingOut ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังออกจากระบบ...</>) : (<><LogOut className="mr-2 h-4 w-4" />ยืนยันออกจากระบบ</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DashboardPage
