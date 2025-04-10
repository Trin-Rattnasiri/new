'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Loader2 } from 'lucide-react';

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
    if (!newDepartmentName) {
      alert("กรุณากรอกชื่อแผนก");
      return;
    }

    setLoading(true);
    const response = await fetch('/api/admin/department', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDepartmentName }),
    });

    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      setNewDepartmentName('');
      fetchDepartments();
    }
    setLoading(false);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    const response = await fetch(`/api/admin/department?departmentId=${departmentId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) fetchDepartments();
  };

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditedName(name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedName('');
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
          <Button onClick={handleAddDepartment} disabled={loading} className="w-32">
            {loading ? <Loader2 className="animate-spin" /> : 'เพิ่มแผนก'}
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
                <li key={dept.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  {editingId === dept.id ? (
                    <>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-grow"
                      />
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button onClick={handleSaveEdit} className="bg-green-600 text-white px-4 py-1 rounded-md">บันทึก</Button>
                        <Button onClick={handleCancelEdit} className="bg-gray-400 text-white px-4 py-1 rounded-md">ยกเลิก</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">{dept.name}</span>
                      <div className="flex gap-2">
                        <Button onClick={() => handleStartEdit(dept.id, dept.name)} className="bg-yellow-500 text-white px-3 py-1 rounded-md">แก้ไข</Button>
                        <Button onClick={() => handleDeleteDepartment(dept.id)} className="bg-red-600 text-white px-3 py-1 rounded-md">ลบ</Button>
                      </div>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AdminPage;
