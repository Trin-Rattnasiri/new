"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckCircle, Trash2, RefreshCw, AlertCircle, Search, Plus, Edit2, UserCog, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Admin {
  id: number
  username: string
  position: string
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [formData, setFormData] = useState({ username: "", position: "", password: "", confirmPassword: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/admins")
      const data = await res.json()
      setAdmins(data.data)
      setError(null)
    } catch (err: any) {
      setError("ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleAdd = () => {
    setFormData({ username: "", position: "", password: "", confirmPassword: "" })
    setModalMode("add")
    setCurrentAdmin(null)
    setShowModal(true)
  }

  const handleEdit = (admin: Admin) => {
    setFormData({ username: admin.username, position: admin.position, password: "", confirmPassword: "" })
    setModalMode("edit")
    setCurrentAdmin(admin)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    setDeleteId(id)
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/admins/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      fetchAdmins()
      setShowConfirmModal(false)
      setSuccessMessage("✅ ลบผู้ดูแลระบบเรียบร้อยแล้ว")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      setError("ลบไม่สำเร็จ")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.position) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsSubmitting(true)
    try {
      const method = modalMode === "add" ? "POST" : "PUT"
      const url = modalMode === "add" ? "/api/admin/admins" : `/api/admin/admins/${currentAdmin?.id}`
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          position: formData.position,
          password: formData.password || undefined,
        }),
      })
      if (!res.ok) throw new Error("ผิดพลาด")
      setShowModal(false)
      fetchAdmins()
      setSuccessMessage(modalMode === "add" ? "✅ เพิ่มผู้ดูแลระบบสำเร็จ" : "✅ แก้ไขข้อมูลสำเร็จ")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      setError("เกิดข้อผิดพลาด")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.position.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8 relative">
      <Card className="max-w-6xl mx-auto shadow-md border-slate-200">
        <CardHeader className="bg-white border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <UserCog className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-indigo-900">จัดการผู้ดูแลระบบ</CardTitle>
                <CardDescription className="text-indigo-700">เพิ่ม แก้ไข หรือลบผู้ดูแลระบบ</CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 w-full sm:w-64 bg-white border-slate-200"
                  placeholder="ค้นหาชื่อหรือตำแหน่ง..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={fetchAdmins} className="bg-white hover:bg-slate-100">
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus size={16} className="mr-1" /> เพิ่มผู้ดูแล
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5">
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5">
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-2 text-indigo-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500 text-lg">ไม่พบข้อมูลผู้ดูแลระบบ</p>
              {searchTerm && <p className="mt-2 text-slate-400">ไม่พบผลลัพธ์สำหรับ "{searchTerm}"</p>}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("")
                  fetchAdmins()
                }}
              >
                ล้างการค้นหา
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((admin, index) => (
                    <TableRow key={admin.id} className="hover:bg-slate-50">
                      <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-medium">{admin.username}</TableCell>
                      <TableCell>
                        <Badge variant={admin.position === "SuperAdmin" ? "default" : "secondary"}>
                          {admin.position}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(admin)}
                            className="h-8 px-2 bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                          >
                            <Edit2 size={14} className="mr-1" /> แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(admin.id)}
                            className="h-8 px-2 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 size={14} className="mr-1" /> ลบ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ยืนยันลบ */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-white border-red-200">
          <DialogHeader className="bg-red-50 pb-4 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <DialogTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              ยืนยันการลบผู้ดูแลระบบ
            </DialogTitle>
            <DialogDescription className="text-red-700">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ คุณแน่ใจหรือไม่ว่าต้องการลบผู้ดูแลระบบนี้?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)} className="bg-white">
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  ยืนยันลบ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal เพิ่ม/แก้ไข */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white border-blue-200">
          <DialogHeader className="bg-blue-50 pb-4 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <DialogTitle className="text-indigo-900 flex items-center gap-2">
              {modalMode === "add" ? (
                <>
                  <Plus className="h-5 w-5 text-indigo-600" />
                  เพิ่มผู้ดูแลระบบใหม่
                </>
              ) : (
                <>
                  <Edit2 className="h-5 w-5 text-indigo-600" />
                  แก้ไขข้อมูลผู้ดูแลระบบ
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-indigo-700">
              {modalMode === "add" ? "กรอกข้อมูลเพื่อเพิ่มผู้ดูแลระบบใหม่" : "แก้ไขข้อมูลของผู้ดูแลระบบ"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-indigo-900">
                ชื่อผู้ใช้
              </Label>
              <Input
                id="username"
                type="text"
                className="border-indigo-200 focus:border-indigo-300"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position" className="text-indigo-900">
                ตำแหน่ง
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger className="border-indigo-200 focus:border-indigo-300">
                  <SelectValue placeholder="-- เลือกตำแหน่ง --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                  <SelectItem value="เจ้าหน้าที่">เจ้าหน้าที่</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-indigo-900">
                รหัสผ่าน{" "}
                {modalMode === "edit" && <span className="text-xs text-slate-500">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                className="border-indigo-200 focus:border-indigo-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={modalMode === "edit" ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "กรอกรหัสผ่าน"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-indigo-900">
                ยืนยันรหัสผ่าน
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="border-indigo-200 focus:border-indigo-300"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="bg-white">
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : modalMode === "add" ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มผู้ดูแล
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    บันทึกข้อมูล
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
