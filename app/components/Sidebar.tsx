"use client";

import Link from "next/link";
import { LuFileSpreadsheet, LuUsers, LuKey } from "react-icons/lu";
import useAuth from "../hooks/useAuth";

export default function Sidebar() {
 const { currentUser } = useAuth();
 const isSuperAdmin = currentUser?.role === "SuperAdmin";

 const sidebarItems = [
   {
     label: "Sheets",
     link: "/sheet",
     icon: <LuFileSpreadsheet size={15} />
   },
   ...(isSuperAdmin ? [
     {
       label: "Users",
       link: "/users", 
       icon: <LuUsers size={15} />
     },
     {
       label: "Key Value",
       link: "/key-value",
       icon: <LuKey size={15} />
     }
   ] : [])
 ];

 return (
  <aside className="hidden md:block w-40 bg-gray-50 border-r border-gray-200 h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-10">
   <div className="p-4">
    <h2 className="text-sm font-semibold text-gray-600 mb-4">Navigation</h2>
    <nav className="space-y-1">
      {sidebarItems.map((item, index) => (
        <Link
          key={index}
          href={item.link}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
        >
          {item.icon}
          <p>{item.label}</p>
        </Link>
      ))}
    </nav>
   </div>
  </aside>
 );
}
