//backend/admin-list/page.tsx
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Loader2, PlusCircle, Pencil, Trash2, Building2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster, toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Department {
  id: number
  name: string
}

const AdminPage = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedName, setEditedName] = useState<string>("")

  const [openAddModal, setOpenAddModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletingName, setDeletingName] = useState<string>("")

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bookings")
      if (!response.ok) {
        throw new Error("การโหลดข้อมูลแผนกล้มเหลว")
      }
      const data = await response.json()
      setDepartmentList(data)
      setFilteredDepartments(data)
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลแผนกได้ โปรดลองอีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = departmentList.filter((dept) => dept.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredDepartments(filtered)
    } else {
      setFilteredDepartments(departmentList)
    }
  }, [searchQuery, departmentList])

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error("ชื่อแผนกห้ามเป็นค่าว่าง")
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch("/api/admin/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDepartmentName }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "การเพิ่มแผนกล้มเหลว")
      }

      setNewDepartmentName("")
      setOpenAddModal(false)
      toast.success(`เพิ่มแผนก "${newDepartmentName}" เรียบร้อยแล้ว`)
      fetchDepartments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "การเพิ่มแผนกล้มเหลว")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!deletingId) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/department?departmentId=${deletingId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "การลบแผนกล้มเหลว")
      }

      setOpenDeleteModal(false)
      setDeletingId(null)
      setDeletingName("")
      toast.success(`ลบแผนก "${deletingName}" เรียบร้อยแล้ว`)
      fetchDepartments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "การลบแผนกล้มเหลว")
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id)
    setEditedName(name)
    setOpenEditModal(true)
  }

  const handleStartDelete = (id: number, name: string) => {
    setDeletingId(id)
    setDeletingName(name)
    setOpenDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      toast.error("ชื่อแผนกห้ามเป็นค่าว่าง")
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/department`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editedName }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "การแก้ไขแผนกล้มเหลว")
      }

      setEditingId(null)
      setEditedName("")
      setOpenEditModal(false)
      toast.success(`แก้ไขชื่อแผนกเป็น "${editedName}" เรียบร้อยแล้ว`)
      fetchDepartments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "การแก้ไขแผนกล้มเหลว")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <div className="container mx-auto py-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="mb-6">
            <Heading level={1} className="text-3xl font-bold">
              จัดการแผนก
            </Heading>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
            จำนวนแผนกที่เปิดจอง: {departmentList.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-5 bg-white shadow-lg rounded-lg border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                เพิ่มแผนกใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <Input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="กรอกชื่อแผนกที่ต้องการเพิ่ม"
                  className="border rounded-md flex-grow"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setOpenAddModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" /> เพิ่มแผนก
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-7 bg-white shadow-lg rounded-lg border-none">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  แผนกทั้งหมดในระบบ
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="ค้นหาแผนก..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Separator className="my-4" />

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className=" font-bold w-16 text-center">ลำดับ</TableHead>
                        <TableHead className="font-bold text-center">ชื่อแผนก</TableHead>
                        <TableHead className="font-bold text-right  ">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center">
                            {searchQuery ? (
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Search className="h-8 w-8 mb-2" />
                                <p>ไม่พบแผนกที่ตรงกับ "{searchQuery}"</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Building2 className="h-8 w-8 mb-2" />
                                <p>ยังไม่มีแผนกในระบบ</p>
                                <Button variant="link" className="mt-2" onClick={() => setOpenAddModal(true)}>
                                  เพิ่มแผนกใหม่
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDepartments.map((dept, index) => (
                          <TableRow key={dept.id} className="hover:bg-gray-50">
                            <TableCell className="text-center font-medium text-gray-500">{index + 1}</TableCell>
                            <TableCell className="text-center">{dept.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartEdit(dept.id, dept.name)}
                                  className="h-8 px-2 bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                                >
                                  <Pencil className="h-4 w-4 mr-1" /> แก้ไข
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStartDelete(dept.id, dept.name)}
                                  className="h-8 px-2 bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> ลบ
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal เพิ่มแผนก */}
        <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                ยืนยันเพิ่มแผนก
              </DialogTitle>
              <DialogDescription>กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน</DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md bg-gray-50 my-2">
              <p className="text-sm text-gray-500 mb-1">ชื่อแผนกที่ต้องการเพิ่ม:</p>
              <p className="font-medium">{newDepartmentName || "-"}</p>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAddModal(false)} disabled={actionLoading}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddDepartment}
                disabled={actionLoading}
                className="min-w-24 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเพิ่ม...
                  </>
                ) : (
                  <>ยืนยัน</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal แก้ไขแผนก */}
        <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                แก้ไขชื่อแผนก
              </DialogTitle>
              <DialogDescription>กรุณากรอกชื่อแผนกใหม่ที่ต้องการแก้ไข</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อแผนกเดิม:</label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {departmentList.find((dept) => dept.id === editingId)?.name || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="new-name" className="text-sm font-medium">
                  ชื่อแผนกใหม่:
                </label>
                <Input
                  id="new-name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="col-span-3"
                  placeholder="กรอกชื่อแผนกใหม่"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEditModal(false)} disabled={actionLoading}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="min-w-24 bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>บันทึก</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal ลบแผนก */}
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                ยืนยันการลบแผนก
              </DialogTitle>
              <DialogDescription>การลบแผนกไม่สามารถเรียกคืนได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ</DialogDescription>
            </DialogHeader>
            <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5 my-2">
              <p className="text-sm text-gray-700 mb-1">กำลังจะลบแผนก:</p>
              <p className="font-medium text-destructive">{deletingName}</p>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDeleteModal(false)} disabled={actionLoading}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDepartment}
                disabled={actionLoading}
                className="min-w-24"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>ลบแผนก</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminPage
