"use client";

import { FiChevronLeft } from "react-icons/fi";
import Link from "next/link";
import { IdCard } from "lucide-react";

const MedicalHistoryPage = () => {
  const patientInfo = {
    name: "ปุณยวีร์ พร้อมมูล",
    age: 21,
    bloodType: "B",
    IdCard:1909802814890,
    DrugAllergy: "NSAIDs",
    chronicDisease: "ไม่มี",
  };

  const historyData = [
    {
      year: 2567,
      months: [
        {
          month: "ตุลาคม",
          records: [
            {
              id: "1",
              date: 20,
              department: "ตรวจโรคทั่วไป",
              diagnosis: "Urticaria - Allergic urticaria",
              patientType: "ผู้ป่วยนอก",
            },
          ],
        },
        {
          month: "มิถุนายน",
          records: [
            {
              id: "2",
              date: 25,
              department: "อายุรกรรม",
              diagnosis: "Non-Gonococcal urethritis",
              patientType: "ผู้ป่วยนอก",
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg flex items-center gap-4 mb-8">
          <Link href="/front/user-choose" className="text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105">
            <FiChevronLeft className="text-3xl sm:text-4xl" />
          </Link>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide">ประวัติการรักษา</h2>
        </div>

        {/* Patient Info */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-8 transition-all duration-300 hover:shadow-xl border border-gray-100">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900 mb-6">ข้อมูลผู้ป่วย</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">ชื่อ:</strong> {patientInfo.name}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">อายุ:</strong> {patientInfo.age} ปี
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">หมู่เลือด:</strong> {patientInfo.bloodType}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">โรคประจำตัว:</strong> {patientInfo.chronicDisease}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">ประวัติการแพ้ยา:</strong> {patientInfo.DrugAllergy}
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              <strong className="text-blue-900">เลขบัตรประชาชน:</strong> {patientInfo.IdCard}
            </p>
          </div>
        </div>

        {/* Medical History */}
        {historyData.map((yearData, index) => (
          <div
            key={index}
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-md mb-8 transition-all duration-300 hover:shadow-xl border border-gray-100"
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900 mb-6">ปี {yearData.year}</h3>
            {yearData.months.map((monthData, monthIndex) => (
              <div key={monthIndex} className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4">{monthData.month}</h4>
                {monthData.records.map((record, recordIndex) => (
                  <Link href={`/front/user-history/results/${record.id}`} key={recordIndex}>
                    <div className="group p-4 sm:p-5 bg-gray-50 rounded-xl shadow-sm mb-4 hover:bg-blue-50 hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-200">
                      <p className="text-lg sm:text-xl text-blue-900 font-semibold">
                        วันที่ {record.date}
                      </p>
                      <p className="text-base sm:text-lg text-gray-800">
                        <strong className="text-blue-900">แผนก:</strong> {record.department}
                      </p>
                      <p className="text-base sm:text-lg text-gray-700">
                        <strong className="text-blue-900">วินิจฉัย:</strong> {record.diagnosis}
                      </p>
                      <p className="text-base sm:text-lg text-gray-600">
                        <strong className="text-blue-900">ประเภทผู้ป่วย:</strong> {record.patientType}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalHistoryPage;




