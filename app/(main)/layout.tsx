


import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthGuard from "../components/AuthGaurd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpreadSheet App",
  description: "A modern spreadsheet application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">


      <Header />
      <Sidebar />
      <main className=" min-h-screen pt-10 bg-gray-50 md:ml-64 transition-all">
        <div className="p-4 sm:p-6">{children}</div>
      </main>

    </AuthGuard>
  );
}