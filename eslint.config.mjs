import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ต้องรวมให้ครอบคลุม component ทั้งหมด
  ],
  theme: {
    extend: {}, // ถ้าไม่ได้ตัดค่า default ออก gradient จะทำงาน
  },
  plugins: [],
};


export default eslintConfig;
