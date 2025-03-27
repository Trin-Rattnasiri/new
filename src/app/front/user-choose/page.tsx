"use client";

import Image from "next/image";
import Link from "next/link";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-10">
      {/* Top Bar */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-blue-900 py-3 relative shadow">

        <div className="absolute top-2 left-4">
          <Image
            src="/man.png"
            alt="profile"
            width={36}
            height={36}
            className="rounded-full border-2 border-white"
          />
        </div>
        <h1 className="text-white text-center text-xl font-semibold tracking-wide">
          MCH
        </h1>
      </div>

      {/* Banner */}
      <div className="w-full max-w-md mt-3 px-4">
        <Image
          src="/fight.jpg"
          alt="hospital-banner"
          width={600}
          height={200}
          className="rounded-md shadow w-full h-auto object-cover"
        />
      </div>

      {/* Main Menu */}
      <div className="w-full max-w-md mt-6 px-4 space-y-6">
        {/* Section 1 */}
        <h2 className="text-lg font-bold text-blue-900">รายการหลัก</h2>

        <Link href="/front/appointment">
          <div className="flex items-center gap-4 p-4 border-2 text-blue-900 rounded-xl bg-white shadow-sm hover:bg-blue-50 transition cursor-pointer">
            <Image src="/appointment.png" alt="calendar" width={48} height={48} />
            <span className="text-lg text-black font-medium">นัดหมายออนไลน์</span>
          </div>
        </Link>

        <Link href="/front/user-history">
          <div className="flex items-center gap-4 p-4 border-2 text-blue-900 rounded-xl bg-white shadow-sm hover:bg-blue-50 transition cursor-pointer">
            <Image src="/medical-history.png" alt="history" width={48} height={48} />
            <span className="text-lg text-black font-medium">ประวัติการรักษา</span>
          </div>
        </Link>

        {/* Section 2 */}
        <h2 className="text-lg font-bold text-blue-900">ข้อมูลส่วนบุคคล</h2>

        <Link href="/front/user-history">
          <div className="flex items-center gap-4 p-4 border-2 text-blue-900 rounded-xl bg-white shadow-sm hover:bg-blue-50 transition cursor-pointer">
            <Image src="/grandmother.png" alt="user-info" width={48} height={48} />
            <span className="text-lg text-black font-medium">ข้อมูลผู้ใช้งาน</span>
          </div>
        </Link>
      </div>
      </div>

  );
};

export default DashboardPage;
