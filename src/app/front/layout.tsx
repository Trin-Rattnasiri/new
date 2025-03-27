import React from 'react';
import "../globals.css"; // ✅ ให้แน่ใจว่า path ถูกต้อง


const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* คุณสามารถใส่ header, footer หรือการจัดการ layout ที่ต้องการในนี้ */}
      <div>
        
        {children} {/* นี่จะเป็นจุดที่เนื้อหาของ AdminDashboard จะถูกแสดง */}
      </div>
    </div>
  );
};

export default AdminLayout;
