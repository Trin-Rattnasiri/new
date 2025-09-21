"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon, AlertTriangle } from "lucide-react"
import { Toaster, toast } from "sonner"

const AdminNewsPage = () => {
  const [newsImages, setNewsImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [deleteId, setDeleteId] = useState(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/admin/new")
      
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลข่าวได้")
      }
      
      const data = await res.json()
      setNewsImages(data)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null
    
    if (!selected) return
    
    // ตรวจสอบประเภทไฟล์
    if (!selected.type.startsWith('image/')) {
      toast.error("กรุณาเลือกไฟล์ภาพเท่านั้น")
      return
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB")
      return
    }
    
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const resetForm = () => {
    setFile(null)
    setPreviewUrl("")
    setCaption("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์ภาพ")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("image", file)
      formData.append("caption", caption)

      const res = await fetch("/api/admin/new", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("อัปโหลดไม่สำเร็จ")
      }

      toast.success("อัปโหลดสำเร็จ")
      await fetchNews()
      resetForm()
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message
      })
    } finally {
      setIsUploading(false)
    }
  }

  const confirmDelete = (id) => {
    setDeleteId(id)
    setOpenDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      const res = await fetch(`/api/admin/new?id=${deleteId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("ลบไม่สำเร็จ")
      }

      toast.success("ลบภาพสำเร็จ")
      await fetchNews()
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error.message
      })
    } finally {
      setOpenDeleteModal(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">จัดการภาพข่าวสาร</h1>
        <p className="text-gray-500">อัปโหลดและจัดการภาพข่าวสารสำหรับแสดงบนเว็บไซต์</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">เพิ่มภาพข่าวใหม่</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนอัปโหลดรูปภาพ */}
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition cursor-pointer flex flex-col items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={previewUrl}
                      alt="preview"
                      fill
                      className="rounded-md object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 5MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="text-sm text-gray-500">
                <p className="flex items-center"><ImageIcon className="h-4 w-4 mr-2" /> แนะนำขนาดภาพ: 1200 x 900 พิกเซล</p>
                <p className="flex items-center mt-1"><AlertTriangle className="h-4 w-4 mr-2" /> ภาพที่อัปโหลดจะแสดงบนหน้าข่าวสารของเว็บไซต์</p>
              </div>
            </div>

            {/* ส่วนรายละเอียด */}
            <div className="space-y-4">
              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบายภาพ
                </label>
                <Input
                  id="caption"
                  placeholder="ระบุคำอธิบายภาพ"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">คำอธิบายจะแสดงใต้ภาพเมื่อนำไปแสดงบนเว็บไซต์</p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleUpload} 
                  className="w-full"
                  disabled={isUploading || !file}
                >
                  {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพข่าว"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">รายการภาพข่าวทั้งหมด</h2>
        <p className="text-sm text-gray-500">ภาพทั้งหมดที่แสดงบนเว็บไซต์</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : newsImages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">ยังไม่มีภาพข่าว</p>
          <p className="text-sm text-gray-400">อัปโหลดภาพแรกของคุณที่ด้านบน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newsImages.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.caption || "ข่าว"}
                  fill
                  className="object-cover"
                />
                <Button
                  onClick={() => confirmDelete(item.id)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4 mr-1" /> ลบ
                </Button>
              </div>
              <CardContent className="p-3">
                <p className="text-sm text-gray-700">
                  {item.caption || "(ไม่มีคำอธิบาย)"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal ยืนยันการลบ */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบภาพข่าว</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminNewsPage