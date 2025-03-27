"use client";

import Image from "next/image";
import Link from "next/link";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* ✅ Top Bar */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-blue-900 py-4 px-6 shadow-md flex items-center justify-between">
        {/* Profile Icon */}
        <div className="flex items-center space-x-3">
          <Image
            src="/man.png"
            alt="profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="text-white text-lg font-medium">ยินดีต้อนรับ</span>
        </div>
        <h1 className="text-white text-xl font-bold tracking-wider">MCH</h1>
      </div>

      {/* ✅ Banner */}
      <div className="w-full max-w-md mt-5 px-4">
        <Image
          src="/fight.jpg"
          alt="hospital-banner"
          width={600}
          height={200}
          className="rounded-lg shadow-lg w-full object-cover"
        />
      </div>

      {/* ✅ Main Menu */}
      <div className="w-full max-w-md mt-6 px-4 space-y-6">
        <h2 className="text-xl font-semibold text-blue-800"> รายการหลัก</h2>

        {/* 📅 Appointment */}
        <Link href="/front/appointment">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow transition hover:bg-blue-50 cursor-pointer">
            <Image
              src="/appointment.png"
              alt="calendar"
              width={50}
              height={50}
              className="rounded-md"
            />
            <span className="text-base sm:text-lg text-gray-800 font-medium">นัดหมายออนไลน์</span>
          </div>
        </Link>

        {/* 📖 History */}
        <Link href="/front/user-history">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow transition hover:bg-blue-50 cursor-pointer">
            <Image
              src="/medical-history.png"
              alt="history"
              width={50}
              height={50}
              className="rounded-md"
            />
            <span className="text-base sm:text-lg text-gray-800 font-medium">ประวัติการรักษา</span>
          </div>
        </Link>

        {/* 👵 Profile */}
        <h2 className="text-xl font-semibold text-blue-800 mt-8"> ข้อมูลส่วนบุคคล</h2>

        <Link href="/front/user-history">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow transition hover:bg-blue-50 cursor-pointer">
            <Image
              src="/grandmother.png"
              alt="user-info"
              width={50}
              height={50}
              className="rounded-md"
            />
            <span className="text-base sm:text-lg text-gray-800 font-medium">ข้อมูลผู้ใช้งาน</span>
          </div>
        </Link>
      </div>
      </div>

     
  );
};

export default DashboardPage;
