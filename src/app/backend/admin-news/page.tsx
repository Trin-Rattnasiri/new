"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

const AdminNewsPage = () => {
  const [newsImages, setNewsImages] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [caption, setCaption] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    const res = await fetch("/api/admin/new")
    const data = await res.json()
    setNewsImages(data)
  }

  const handleUpload = async () => {
    if (!file) return alert("กรุณาเลือกไฟล์ภาพ")
    const formData = new FormData()
    formData.append("image", file)
    formData.append("caption", caption)

    const res = await fetch("/api/admin/new", {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      alert("✅ อัปโหลดสำเร็จ")
      await fetchNews()
      setFile(null)
      setPreviewUrl("")
      setCaption("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } else {
      alert("❌ อัปโหลดไม่สำเร็จ")
    }
  }

  const handleDelete = async (id: number) => {
    const confirmDel = confirm("ต้องการลบรูปนี้หรือไม่?")
    if (!confirmDel) return

    const res = await fetch(`/api/admin/new?id=${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchNews()
    } else {
      alert("ลบไม่สำเร็จ")
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">จัดการภาพข่าวสาร</h1>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => {
            const selected = e.target.files?.[0] || null
            setFile(selected)
            if (selected) setPreviewUrl(URL.createObjectURL(selected))
          }}
        />
        <input
          type="text"
          placeholder="คำอธิบายภาพ"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md text-sm w-[250px]"
        />
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          อัปโหลดรูป
        </button>
      </div>

      {previewUrl && (
        <div className="mb-6">
          <Image
            src={previewUrl}
            alt="preview"
            width={400}
            height={300}
            className="rounded-md object-cover"
          />
        </div>
      )}

      <h2 className="text-lg font-semibold mt-10 mb-4">รายการภาพข่าวที่มี</h2>

      {newsImages.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีภาพข่าว</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newsImages.map((item) => (
            <div key={item.id} className="relative text-center bg-white shadow rounded-lg overflow-hidden">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.caption || "ข่าว"}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 opacity-90"
                >
                  ลบ
                </button>
              </div>
              <p className="text-sm text-gray-700 px-3 py-2">{item.caption || "(ไม่มีคำอธิบาย)"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminNewsPage
