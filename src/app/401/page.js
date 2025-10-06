'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Custom401() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // แสดง popup หลังจาก load หน้า 1000ms
    const popupTimer = setTimeout(() => {
      setShowPopup(true)
    }, 1000)

    return () => {
      clearTimeout(popupTimer)
    }
  }, [])

  useEffect(() => {
    // เริ่มนับถอยหลัง
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownTimer)
    }
  }, [router])

  useEffect(() => {
    if (showPopup) {
      if (window.confirm('คุณต้องการเข้าสู่ระบบใหม่หรือไม่?')) {
        router.push('/')
      } else {
        setShowPopup(false)
      }
    }
  }, [showPopup, router])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* Error Code */}
        <h1 className="text-8xl font-bold text-blue-500 mb-6">
          401
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ไม่ได้รับอนุญาตให้เข้าถึง
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </p>
        <p className="text-gray-600 mb-4">
          กรุณาเข้าสู่ระบบหรือติดต่อผู้ดูแลระบบ
        </p>

        {/* Countdown */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-700">
            จะกลับไปหน้าหลักอัตโนมัติใน{' '}
            <span className="font-bold text-lg">{countdown}</span> วินาที
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            กลับหน้าหลัก
          </button>

          <button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            กลับหน้าก่อนหน้า
          </button>
        </div>
      
      </div>
    </div>
  )
}