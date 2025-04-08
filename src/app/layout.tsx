import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maechanhospital",
  description: "ระบบบริการออนไลน์ของโรงพยาบาลแม่จัน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-screen w-full`}
      >
        <div className="flex w-full h-full">
          <main className="flex-1 w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
