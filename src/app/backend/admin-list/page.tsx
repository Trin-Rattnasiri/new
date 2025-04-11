'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Department {
  id: number;
  name: string;
}

const AdminPage = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState<string>('');

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState<string>('');

  const fetchDepartments = async () => {
    setLoading(true);
    const response = await fetch('/api/bookings');
    const data = await response.json();
    setDepartmentList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDepartmentName) return;
    setLoading(true);
    const response = await fetch('/api/admin/department', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDepartmentName }),
    });
    const result = await response.json();
    
    if (response.ok) {
      setNewDepartmentName('');
      setOpenAddModal(false);
      fetchDepartments();
    }
    setLoading(false);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingId) return;
    const response = await fetch(`/api/admin/department?departmentId=${deletingId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (response.ok) {
      setOpenDeleteModal(false);
      setDeletingId(null);
      setDeletingName('');
      fetchDepartments();
    }
  };

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditedName(name);
    setOpenEditModal(true);
  };

  const handleStartDelete = (id: number, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setOpenDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      alert("ชื่อแผนกห้ามว่าง");
      return;
    }
    setLoading(true);
    const response = await fetch(`/api/admin/department`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, name: editedName }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      setEditingId(null);
      setEditedName('');
      setOpenEditModal(false);
      fetchDepartments();
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <Heading level={1}>จัดการแผนก</Heading>

      <Card className="p-6 bg-white shadow-md rounded-lg">
        <Heading level={2} className="text-xl mb-4">เพิ่มแผนกใหม่</Heading>
        <div className="flex gap-4 items-center">
          <Input
            type="text"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            placeholder="ชื่อแผนก"
            className="border p-2 rounded-md flex-grow"
          />
          <Button onClick={() => setOpenAddModal(true)} className="w-32">
            เพิ่มแผนก
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-md rounded-lg">
        <Heading level={2} className="text-xl mb-4">แผนกที่มีอยู่ในระบบ</Heading>
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : (
          <ul className="space-y-3">
            {departmentList.length === 0 ? (
              <p>ยังไม่มีแผนกในระบบ</p>
            ) : (
              departmentList.map((dept) => (
                <li key={dept.id} className="flex justify-between items-center gap-2">
                  <span className="text-lg">{dept.name}</span>
                  <div className="flex gap-2">
                    <Button onClick={() => handleStartEdit(dept.id, dept.name)} className="bg-yellow-500 text-white px-3 py-1 rounded-md">แก้ไข</Button>
                    <Button onClick={() => handleStartDelete(dept.id, dept.name)} className="bg-red-600 text-white px-3 py-1 rounded-md">ลบ</Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </Card>

      {/* Modal เพิ่มแผนก */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันเพิ่มแผนก</DialogTitle>
          </DialogHeader>
          <p>คุณต้องการเพิ่มแผนก "{newDepartmentName}" หรือไม่?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddModal(false)}>ยกเลิก</Button>
            <Button onClick={handleAddDepartment}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal แก้ไขแผนก */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการแก้ไข</DialogTitle>
          </DialogHeader>
          <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="my-3" />
          <p>คุณต้องการเปลี่ยนชื่อแผนกเป็น "{editedName}" ใช่หรือไม่?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditModal(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveEdit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal ลบแผนก */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p>คุณแน่ใจหรือไม่ว่าต้องการลบแผนก "{deletingName}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDeleteDepartment}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
