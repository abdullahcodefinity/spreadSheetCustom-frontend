"use client";

import Link from "next/link";
import useAuth from "../hooks/useAuth";


export default function Sidebar() {
  const { currentUser } = useAuth()

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  return (
    <aside className="hidden md:block w-64 bg-gray-50 border-r border-gray-200 h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-10">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">Navigation</h2>
        <nav className="space-y-1">
          <Link
            href="/sheet"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">📊</span>
            Sheets
          </Link>
          {isSuperAdmin && (
            <Link
              href="/users"
              className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-2">🕒</span>
              Users
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}