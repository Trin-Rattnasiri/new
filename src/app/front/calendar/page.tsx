'use client';
import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Button } from "@/components/ui/button";

const CustomCalendar = ({ selectedDate, onDateChange, availableDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // แปลงวันที่ที่ใช้งานได้ให้อยู่ในรูปแบบ Date objects
  const availableDateObjects = availableDates.map(date => 
    typeof date === 'string' ? parseISO(date) : date
  );

  // ตรวจสอบว่าวันที่นั้นใช้งานได้หรือไม่
  const isDateAvailable = (date) => {
    return availableDateObjects.some(availableDate => 
      isSameDay(date, availableDate)
    );
  };

  // ตัดสินใจว่าวันนี้ควรถูก disable หรือไม่
  const isDateDisabled = (date) => {
    // ปิดการใช้งานวันที่ผ่านมาแล้ว
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    // ถ้ามีรายการวันที่ใช้งานได้ ให้ปิดการใช้งานวันที่ไม่อยู่ในรายการ
    if (availableDateObjects.length > 0) {
      return !isDateAvailable(date);
    }
    
    return false;
  };

  // สร้างตารางวันที่
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth;
  };

  // ไปเดือนก่อนหน้า
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // ไปเดือนถัดไป
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // สร้างวัน
  const renderDays = () => {
    const days = getDaysInMonth();
    
    // แบ่งวันเป็นสัปดาห์
    const weeks = [];
    let week = [];
    
    // เติมช่องว่างสำหรับวันเริ่มต้นเดือน
    const firstDayOfMonth = days[0].getDay(); // 0 = วันอาทิตย์, 1 = วันจันทร์, ...
    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push(<td key={`empty-${i}`} className="p-0"></td>);
    }
    
    // เพิ่มวันในเดือน
    days.forEach((day, index) => {
      const isToday = isSameDay(day, new Date());
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isAvailable = isDateAvailable(day);
      const disabled = isDateDisabled(day);
      
      const dayClass = `
        w-10 h-10 text-center 
        ${isToday ? 'font-bold' : ''} 
        ${isSelected ? 'bg-blue-600 text-white rounded-full' : ''} 
        ${isAvailable && !isSelected ? 'bg-slate-600 text-white rounded-full' : ''} 
        ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'} 
      `;
      
      week.push(
        <td key={day.toString()} className="p-0">
          <div 
            className={dayClass}
            onClick={() => !disabled && onDateChange(day)}
          >
            {format(day, 'd')}
          </div>
        </td>
      );
      
      // เมื่อครบ 7 วัน (สัปดาห์) หรือเป็นวันสุดท้ายของเดือน
      if ((firstDayOfMonth + index + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
        week = [];
      }
    });
    
    return weeks;
  };

  return (
    <div className="custom-calendar p-4 bg-white rounded-lg shadow">
      <div className="header flex justify-between items-center mb-4">
        <Button onClick={prevMonth} variant="ghost" className="p-2 rounded-full">&lt;</Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: th })}
        </h2>
        <Button onClick={nextMonth} variant="ghost" className="p-2 rounded-full">&gt;</Button>
      </div>
      
      <table className="w-full">
        <thead>
          <tr>
            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => (
              <th key={day} className="p-2 text-center font-medium text-gray-600">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderDays()}
        </tbody>
      </table>
    </div>
  );
};

export default CustomCalendar;