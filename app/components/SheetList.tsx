"use client";

import Link from "next/link";
import { DeleteModal } from "./modal/DeleteModal";
import { useSheetList } from "../(main)/sheet/hooks/useSheetList";
import { Sheet } from "../types";
import { Edit, Trash2 } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function SheetList() {
 const {
  searchQuery,
  setSearchQuery,
  editingId,
  setEditingId,
  editName,
  setEditName,
  isAddingNew,
  setIsAddingNew,
  newSheetName,
  setNewSheetName,
  isShow,
  setIsShow,
  setDeletedId,
  sheets,
  isLoadingData,
  status,
  handleEdit,
  handleDelete,
  handleSave,
  handleAddNewSheet,
 } = useSheetList();

 const { currentUser } = useAuth();



 if (isLoadingData) {
  return (
   <div className="p-4 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
   </div>
  );
 }

 if (status === 403) {
  return (
   <div className="p-4 py-10 text-center">
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
     <p className="text-yellow-700">
      You do not have permission to view the sheet list.
     </p>
    </div>
   </div>
  );
 }

 return (
  <>
   <div className="flex justify-between items-center mb-4">
    <h1 className="text-xl font-bold">Sheets</h1>
    {!isAddingNew && currentUser.role === "SuperAdmin" && (
     <button
      onClick={() => setIsAddingNew(true)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
     >
      <svg
       xmlns="http://www.w3.org/2000/svg"
       className="h-5 w-5"
       viewBox="0 0 20 20"
       fill="currentColor"
      >
       <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
       />
      </svg>
      New Sheet
     </button>
    )}
   </div>
   {/* Search Bar */}
   <div className="mb-4">
    <div className="relative">
     <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search sheets by name..."
      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
     />
     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg
       className="h-5 w-5 text-gray-400"
       xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 20 20"
       fill="currentColor"
      >
       <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
       />
      </svg>
     </div>
    </div>
   </div>
   {!sheets || (sheets.length === 0 && !isAddingNew) ? (
    <>
     <div className="p-4 py-10">
      <div className="p-4 py-10 text-center">
       <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-700">{"No sheets found in the list"}</p>
       </div>
      </div>
     </div>
    </>
   ) : (
    <>
     <div className="p-4 py-10">
      <DeleteModal
       agreeFunction={handleDelete}
       title="Delete User?"
       description="Are you sure you want to delete User?"
       isShow={isShow}
       setIsShow={setIsShow}
      />

      {isAddingNew && (
       <div className="mb-4 flex gap-2 items-center bg-white p-3 rounded border border-gray-200">
        <input
         type="text"
         value={newSheetName}
         onChange={(e) => setNewSheetName(e.target.value)}
         placeholder="Enter sheet name"
         className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
         autoFocus
        />
        <button
         onClick={handleAddNewSheet}
         className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
        >
         <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
         >
          <path
           fillRule="evenodd"
           d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
           clipRule="evenodd"
          />
         </svg>
        </button>
        <button
         onClick={() => {
          setIsAddingNew(false);
          setNewSheetName("");
         }}
         className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
        >
         <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
         >
          <path
           fillRule="evenodd"
           d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
           clipRule="evenodd"
          />
         </svg>
        </button>
       </div>
      )}

      <div className="grid grid-cols-2 gap-4">
       {sheets?.map((sheet: Sheet) => (
        <div
         key={sheet.id}
         className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
        >
         {editingId === sheet.id ? (
          <div className="flex w-full p-4 items-center justify-between">
           <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
            autoFocus
           />
           <div className="flex gap-2 ml-2">
            <button
             onClick={() => handleSave(sheet.id)}
             className="text-green-600 hover:text-green-800"
            >
             <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
             >
              <path
               fillRule="evenodd"
               d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
               clipRule="evenodd"
              />
             </svg>
            </button>
            <button
             onClick={() => setEditingId(null)}
             className="text-red-600 hover:text-red-800"
            >
             <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
             >
              <path
               fillRule="evenodd"
               d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
               clipRule="evenodd"
              />
             </svg>
            </button>
           </div>
          </div>
         ) : (
          <div className="flex items-center">
           <Link className="flex-1 block p-4" href={`/sheet/${sheet.id}`}>
            <div className="flex flex-col">
             <span className="font-medium truncate max-w-[290px] inline-block" title={sheet.name}>{sheet.name}</span>
             <div className="text-sm text-gray-600 mt-1">
              <span>
               {sheet?.columns?.length} columns • {sheet?.sheetData?.length}{" "}
               rows
              </span>
             </div>
            </div>
           </Link>
           <div className="flex items-center gap-3 pr-4 ">
            { currentUser.role === "SuperAdmin" && (
             <button
              onClick={() => handleEdit(sheet)}
              className="text-blue-600 hover:text-blue-800"
             >
              <Edit className="w-4 h-4" />
             </button>
            )}
            { currentUser.role === "SuperAdmin"&& (
             <button
              onClick={() => {
               setIsShow(true);
               setDeletedId(Number(sheet.id));
              }}
              className="text-red-600 hover:text-red-800"
             >
              <Trash2 className="w-4 h-4" />
             </button>
            )}
           </div>
          </div>
         )}
        </div>
       ))}
      </div>
     </div>
    </>
   )}
  </>
 );
}
