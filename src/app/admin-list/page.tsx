'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Loader2 } from 'lucide-react';  // For loading spinner icon (optional)

interface Department {
  id: number;
  name: string;
}

const AdminPage = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch department data from API
  const fetchDepartments = async () => {
    setLoading(true);
    const response = await fetch('/api/bookings');
    const data = await response.json();
    setDepartmentList(data);
    setLoading(false);
  };

  // Fetch department data when the page loads
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Add a new department
  const handleAddDepartment = async () => {
    if (!newDepartmentName) {
      alert("กรุณากรอกชื่อแผนก");
      return;
    }

    setLoading(true);
    const response = await fetch('/api/admin/department', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newDepartmentName,
      }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      setNewDepartmentName('');
      // Fetch updated department list
      fetchDepartments();
    }

    setLoading(false);
  };

  // Delete a department
  const handleDeleteDepartment = async (departmentId: number) => {
    const response = await fetch(`/api/admin/department?departmentId=${departmentId}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      // Fetch updated department list
      fetchDepartments();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Heading level={1}>Admin Dashboard - จัดการแผนก</Heading>

      {/* Add new department form */}
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

      {/* Display department list */}
      <Card className="p-6 bg-white shadow-md rounded-lg">
        <Heading level={2} className="text-xl mb-4">แผนกที่มีอยู่ในระบบ</Heading>
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : (
          <ul className="space-y-2">
            {departmentList.length === 0 ? (
              <p>ยังไม่มีแผนกในระบบ</p>
            ) : (
              departmentList.map((dept) => (
                <li key={dept.id} className="flex justify-between items-center">
                  <span>{dept.name}</span>
                  <Button 
                    onClick={() => handleDeleteDepartment(dept.id)} 
                    className="bg-red-600 text-white p-2 rounded-md"
                  >
                    ลบ
                  </Button>
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
