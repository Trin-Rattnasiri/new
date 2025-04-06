import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  ListOrdered,
  ShoppingCart,
  BookOpen,
  Shield,
  Lightbulb,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div
      className="flex flex-col h-screen p-4"
      style={{
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #E53E3E 100%)',
        color: 'white',
      }}
    >
      {/* โลโก้ */}
      <div className="flex items-center mb-8">
        <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
          A
        </div>
        <span className="ml-2 font-semibold text-lg">Aceagency</span>
      </div>

      {/* เมนู */}
      <div className="mb-8">
        <h3 className="text-gray-200 font-semibold mb-4">MENU</h3>
        <ul className="space-y-2">
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <LayoutDashboard className="h-5 w-5 mr-2 text-gray-100" />
            My Offers
          </li>
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <ListOrdered className="h-5 w-5 mr-2 text-gray-100" />
            User's Task
          </li>
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <ShoppingCart className="h-5 w-5 mr-2 text-gray-100" />
            Product Discounts
          </li>
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <BookOpen className="h-5 w-5 mr-2 text-gray-100" />
            Case Study
            <span className="ml-auto bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">
              2
            </span>
          </li>
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <Shield className="h-5 w-5 mr-2 text-gray-100" />
            Security
          </li>
          <li className="flex items-center text-gray-100 hover:bg-gray-700 p-2 rounded-md cursor-pointer">
            <Lightbulb className="h-5 w-5 mr-2 text-gray-100" />
            Your Ability
          </li>
        </ul>
      </div>

    
      {/* ผู้ใช้ */}
      <div className="mt-auto flex items-center">
        <Avatar className="w-10 h-10" />
        <div className="ml-2">
          <span className="font-semibold">Amir Baqian</span>
          <p className="text-gray-200">Product Designer</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;