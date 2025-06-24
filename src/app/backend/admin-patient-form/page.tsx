'use client'

import { useState } from 'react'

export default function AdminPatientForm() {
  const [form, setForm] = useState({
    prefix: '',
    name: '',
    birthday: '',
    age: '',
    hn: '',
    national_id: '',
    blood_type: '',
    drug_allergy: '',
    chronic_disease: '',
    phone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/add-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      alert('เพิ่มข้อมูลเรียบร้อยแล้ว')
    } else {
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-blue-800 mb-6">เพิ่มข้อมูลผู้ป่วย</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <input name="prefix" placeholder="คำนำหน้า" value={form.prefix} onChange={handleChange} className="border p-2 rounded" required />
        <input name="name" placeholder="ชื่อ-นามสกุล" value={form.name} onChange={handleChange} className="border p-2 rounded" required />
        <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className="border p-2 rounded" required />
        <input name="age" placeholder="อายุ เช่น 34 ปี 1 เดือน 2 วัน" value={form.age} onChange={handleChange} className="border p-2 rounded" />
        <input name="hn" placeholder="เลข HN" value={form.hn} onChange={handleChange} className="border p-2 rounded" required />
        <input name="national_id" placeholder="เลขบัตรประชาชน" value={form.national_id} onChange={handleChange} className="border p-2 rounded" required />
        <input name="blood_type" placeholder="หมู่เลือด" value={form.blood_type} onChange={handleChange} className="border p-2 rounded" />
        <input name="drug_allergy" placeholder="ประวัติแพ้ยา" value={form.drug_allergy} onChange={handleChange} className="border p-2 rounded" />
        <input name="chronic_disease" placeholder="โรคประจำตัว" value={form.chronic_disease} onChange={handleChange} className="border p-2 rounded" />
        <input name="phone" placeholder="เบอร์โทรศัพท์" value={form.phone} onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
          บันทึกข้อมูล
        </button>
      </form>
    </div>
  )
}
