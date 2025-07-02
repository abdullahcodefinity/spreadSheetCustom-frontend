"use client";

import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { useUserList } from "./hooks/useUserList";
import { useRouter } from "next/navigation";
import SearchBar from "@/app/components/SearchBar";
import UserTable from "@/app/components/UserTable";
import EditSheetPermissionModal from "@/app/components/modal/EditSheeTPermissionModal";
import { useState } from "react";
import useUpdateData from "@/app/hooks/ useUpdateData";
import { Url } from "@/src/api";

export default function UserList() {




 const {
  searchQuery,
  sheetModal,
  setSheetModal,
  handleUpdateSheetPermissions,
  handleRemoveAccess,
  filteredUsers,
  deleteModal,
  isDeleting,
  isLoading,
  setDeleteModal,
  setSearchQuery,
  handleEdit,
  handleDelete,
  confirmDelete,
  formatDate,
 } = useUserList();

 const router = useRouter();



 if (isLoading) {
  return (
   <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4">
     <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-50 py-8">
   <DeleteModal
    isShow={deleteModal.isShow}
    setIsShow={(show) => setDeleteModal((prev) => ({ ...prev, isShow: show }))}
    title="Delete User"
    description={`Are you sure you want to delete "${deleteModal.userName}"? This action cannot be undone.`}
    agreeFunction={confirmDelete}
   />
   <EditSheetPermissionModal
    isOpen={sheetModal.state}
    onClose={() => setSheetModal({ state: false, selectedUser: null })}
    onUpdate={handleUpdateSheetPermissions}
    userData={sheetModal.selectedUser || { sheets: [] }}
    handleRemoveAccess={handleRemoveAccess}
   />
   <div className="max-w-7xl mx-auto px-4">
    <div className="bg-white rounded-lg shadow-md p-6">
     <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <button
       onClick={() => router.push("/users/create")}
       className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
       Create New User
      </button>
     </div>

     <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search users by name or email..."
     />

     <UserTable
      filteredUsers={filteredUsers}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
      isDeleting={isDeleting}
      formatDate={formatDate}
      // set={(user) => setSheetModal({ state: true, selectedUser: user })}
      setSheetModal={setSheetModal}
     />
    </div>
   </div>
  </div>
 );
}
