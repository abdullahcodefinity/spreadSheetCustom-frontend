"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 bg-gray-50 border-r border-gray-200 h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-10">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">Navigation</h2>
        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">📊</span>
            Sheets
          </Link>
          <Link
            href="/recent"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">🕒</span>
            Recent
          </Link>
          <Link
            href="/shared"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">👥</span>
            Shared
          </Link>
        </nav>
      </div>
    </aside>
  );
}