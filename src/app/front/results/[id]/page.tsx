"use client";

import { useParams } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import Link from "next/link";

const resultsData = [
  {
    id: 1,
    diagnosis: "Urticaria - Allergic urticaria",
    cc: "คันคัน มีอาการมา 30 นาที",
    hpi: "มีผื่นคันบริเวณหน้าอกและหายใจไม่สะดวก",
    dx: "ลมพิษ",
    lab: "-",
    xray: "-",
    drug: "ยาต้านฮิสตามีน (Antihistamines), ยาสเตียรอยด์ชนิดทาภายนอก (Topical steroids)",
    cost: "2590 บ.",
  },
  {
    id: 2,
    diagnosis: "Non-Gonococcal urethritis",
    cc: "ปัสสาวะแสบขัด",
    hpi: "มีตกขาวผิดปกติ ไม่มีไข้",
    dx: "ท่อปัสสาวะอักเสบจากเชื้ออื่น",
    lab: "ตรวจปัสสาวะ",
    xray: "-",
    drug: "ยาปฏิชีวนะ (Doxycycline)",
    cost: "1500 บ.",
  },
];

const ResultPage = () => {
  const params = useParams();
  const id = params?.id?.toString();
  const result = resultsData.find((item) => item.id === parseInt(id || ""));

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-red-600 text-center tracking-wide">
          ไม่พบข้อมูลผลตรวจ
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-5 sm:p-6 md:p-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href="/front/user-history"
            className="text-blue-900 hover:text-blue-700 transition-transform duration-300 transform hover:scale-105"
          >
            <FiChevronLeft className="text-2xl sm:text-3xl md:text-4xl" />
          </Link>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900 tracking-wide">
            ผลการตรวจรักษา
          </h2>
        </div>

        {/* Result Details */}
        <div className="bg-gray-50 p-5 sm:p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md border border-gray-200">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 mb-4 sm:mb-6">
            {result.diagnosis}
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">อาการสำคัญ (C.C.):</strong> {result.cc}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">ประวัติอาการ (HPI):</strong> {result.hpi}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">การวินิจฉัย (DX):</strong> {result.dx}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">ผล LAB:</strong> {result.lab}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">ผล X-ray:</strong> {result.xray}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              <strong className="text-blue-900">ยาที่ใช้:</strong> {result.drug}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-800 font-semibold">
              <strong className="text-blue-900">ค่าใช้จ่าย:</strong> {result.cost}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
