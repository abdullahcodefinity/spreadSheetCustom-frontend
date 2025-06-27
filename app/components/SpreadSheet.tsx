"use client";

import { useEffect, useState, useRef } from "react";
import {
 DndContext,
 closestCenter,
 PointerSensor,
 useSensor,
 useSensors,
} from "@dnd-kit/core";
import {
 arrayMove,
 SortableContext,
 useSortable,
 horizontalListSortingStrategy,
 verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import useDeviceType from "@/app/hooks/useDeviceType";
import { useSheetData } from "../(main)/sheet/hooks/useSheetData";
import { useParams, useRouter } from "next/navigation";
import ContextMenu from "./ContextMenu";

function SortableHeader({ id, children, ...props }: any) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({ id });
 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
  cursor: "grab",
  background: isDragging ? "#e0e7ff" : undefined,
  zIndex: isDragging ? 10 : undefined,
 };
 return (
  <th
   ref={setNodeRef}
   style={style}
   {...attributes}
   {...listeners}
   className={`relative group ${props.className || ""}`}
   onClick={(e) => {
    // Stop propagation to prevent drag handlers from interfering
    e.stopPropagation();
    if (props.onClick) {
     props.onClick(e);
    }
   }}
  >
   <div className="flex items-center justify-center gap-1">
    {children}
    <span style={{ cursor: "grab", marginLeft: 4 }}>⠿</span>
    <button
     type="button"
     className="ml-2 text-xl opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
     onClick={(e) => {
      e.stopPropagation(); // Prevent click from bubbling to parent
      props.onMenuClick(e);
     }}
    >
     ⋮
    </button>
   </div>
  </th>
 );
}

function SortableRow({ id, children, ...props }: any) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({ id });
 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
  background: isDragging ? "#e0e7ff" : undefined,
  zIndex: isDragging ? 10 : undefined,
 };
 return (
  <tr ref={setNodeRef} style={style} {...attributes} {...listeners} {...props}>
   {children}
  </tr>
 );
}

export default function Spreadsheet() {
 const params = useParams();
 const sheetId = params?.id;
 const deviceType = useDeviceType();
 const router = useRouter();
 const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
 const preventSingleClickRef = useRef(false);

 // Use the enhanced useSheetData hook that contains all the business logic
 const {
  data,
  columnHeaders,
  dropdownColumns,
  editingCell,
  tempValue,
  editingHeader,
  tempHeader,
  spreadsheetName,
  valueSets,
  users,
  isLoading,
  canUpdateSheet,
  contextMenu,
  isShareModalOpen,
  selectedUser,
  canUpdateColumnHeader,

  handleAttachDropDown,
  setEditingHeader,
  setTempHeader,
  setContextMenu,
  setIsShareModalOpen,
  setSelectedUser,
  setEditingCell,
  setTempValue,
  setColumnHeaders,
  setData,
  saveCell,
  saveHeader,
  handleHeaderClick,
  handleCellClick,
  handleRowOperation,
  handleColumnOperation,
  handleShare,
  exportToCSV,
  getColumnLabel,

 } = useSheetData(sheetId as string);

 const [headerMenu, setHeaderMenu] = useState<{
  colIndex: number;
  x: number;
  y: number;
 } | null>(null);
 const [dropdownModal, setDropdownModal] = useState<{
  colIndex: number;
 } | null>(null);

 useEffect(() => {
  const handleClick = (e: MouseEvent) => {
   const target = e.target as HTMLElement;
   if (!target.closest(".custom-context-menu")) {
    setContextMenu(null);
   }
  };
  const handleEsc = (e: KeyboardEvent) => {
   if (e.key === "Escape") setContextMenu(null);
  };
  window.addEventListener("click", handleClick);
  window.addEventListener("keydown", handleEsc);
  return () => {
   window.removeEventListener("click", handleClick);
   window.removeEventListener("keydown", handleEsc);
  };
 }, []);

 const handleColumnDragEnd = async (event: any) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = Number(active.id);
  const newIndex = Number(over.id);

  try {
   const newHeaders = arrayMove(columnHeaders, oldIndex, newIndex);

   const newData = data.map((row) => arrayMove(row, oldIndex, newIndex));

   await handleColumnOperation("move", {
    sourceIndex: oldIndex,
    targetIndex: newIndex,
   });
   setColumnHeaders(newHeaders);
   setData(newData);
  } catch (err) {
   console.log(err, "RRRRRR");
  }
 };

 const handleRowDragEnd = async (event: any) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = Number(active.id);
  const newIndex = Number(over.id);
  try {
   await handleRowOperation("move", {
    sourceIndex: oldIndex,
    targetIndex: newIndex,
   });
   const newData = arrayMove(data, oldIndex, newIndex);
   setData(newData);
  } catch (err) {
   console.log(err, "Error moving row");
  }
 };

 return (
  <>
   <div className="p-6 space-y-4 py-10 relative">
    <div className="mb-6">
     <h1 className="text-3xl font-bold text-gray-800 capitalize inline-block pb-2 border-b-2 border-blue-500">
      {spreadsheetName}
     </h1>
    </div>
    {/* Permission Status Indicator */}
    <div className="mb-4">
     {canUpdateSheet ? (
      <div className="bg-green-50 border border-green-200 rounded-md p-3">
       <div className="flex items-center">
        <svg
         className="h-5 w-5 text-green-600 mr-2"
         fill="currentColor"
         viewBox="0 0 20 20"
        >
         <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
         />
        </svg>
        <span className="text-green-800 font-medium">
         Edit Mode - You can modify this spreadsheet
        </span>
       </div>
      </div>
     ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
       <div className="flex items-center">
        <svg
         className="h-5 w-5 text-yellow-600 mr-2"
         fill="currentColor"
         viewBox="0 0 20 20"
        >
         <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
         />
        </svg>
        <span className="text-yellow-800 font-medium">
         Read-Only Mode - You can view but cannot modify this spreadsheet
        </span>
       </div>
      </div>
     )}
    </div>

    <div className="flex justify-between items-center">
     <div className="flex flex-wrap gap-2">
      {canUpdateSheet && (
       <button
        onClick={() => setIsShareModalOpen(true)}
        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
       >
        Share
       </button>
      )}
      <button
       onClick={exportToCSV}
       className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
       Export CSV
      </button>
     </div>
    </div>

    {/* Share Modal */}
    {isShareModalOpen && (
     <div
      style={{ marginTop: "0px" }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
     >
      <div className="bg-white rounded-lg p-6 w-96">
       <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Share Sheet</h3>
        <button
         onClick={() => setIsShareModalOpen(false)}
         className="text-gray-500 hover:text-gray-700"
        >
         ✕
        </button>
       </div>

       <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
         Select User
        </label>
        <select
         value={selectedUser || ""}
         onChange={(e) => setSelectedUser(Number(e.target.value))}
         className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
         <option value="">Select a user</option>
         {users?.map((user: { id: number; name: string }) => (
          <option key={user.id} value={user.id}>
           {user.name}
          </option>
         ))}
        </select>
       </div>

       <div className="flex justify-end gap-2">
        <button
         onClick={() => setIsShareModalOpen(false)}
         className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
         Cancel
        </button>
        <button
         onClick={() => {
          handleShare(selectedUser);
          setIsShareModalOpen(false);
          router.push("/sheet");
         }}
         disabled={isLoading}
         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
         {isLoading ? "Sharing..." : "Share"}
        </button>
       </div>
      </div>
     </div>
    )}

    <div className="overflow-auto">
     <table className="min-w-full border border-gray-300 text-sm text-left">
      <DndContext
       sensors={useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
       )}
       collisionDetection={closestCenter}
       onDragEnd={handleColumnDragEnd}
      >
       <SortableContext
        items={columnHeaders.map((_, i) => i.toString())}
        strategy={horizontalListSortingStrategy}
       >
        <thead className="bg-gray-100">
         <tr>
          <th className="border border-gray-300 px-3 py-2 text-center">#</th>
          {columnHeaders.map((header, colIndex) => (
           <SortableHeader
            key={colIndex}
            id={colIndex.toString()}
            onClick={() => handleHeaderClick(colIndex)}
            onMenuClick={(e: React.MouseEvent) => {
             const rect = (e.target as HTMLElement).getBoundingClientRect();
             setHeaderMenu({
              colIndex,
              x: rect.right,
              y: rect.bottom,
             });
            }}
            className={`border border-gray-300 px-3 py-2 text-center`}
           >
            {isLoading ? (
             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            ) : editingHeader === colIndex ? (
             <input
              value={tempHeader}
              autoFocus
              onChange={(e) => setTempHeader(e.target.value)}
              onBlur={() => saveHeader(colIndex)}
              onKeyDown={(e) => {
               if (e.key === "Enter") saveHeader(colIndex);
               if (e.key === "Escape") setEditingHeader(null);
              }}
              className="w-full px-1 py-0.5 border rounded outline-none"
             />
            ) : (
             <div className="flex items-center justify-center gap-1">
              {header}
             </div>
            )}
           </SortableHeader>
          ))}
         </tr>
        </thead>
       </SortableContext>
      </DndContext>
      <DndContext
       sensors={useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
       )}
       collisionDetection={closestCenter}
       onDragEnd={handleRowDragEnd}
      >
       <SortableContext
        items={data.map((_, i) => i.toString())}
        strategy={verticalListSortingStrategy}
       >
        <tbody>
         {data.map((row, rowIndex) => (
          <SortableRow key={rowIndex} id={rowIndex.toString()}>
           <td className="border border-gray-300 px-3 py-2 text-center font-medium bg-gray-50">
            <span style={{ cursor: "grab" }}>⠿</span> {rowIndex + 1}
           </td>
           {row.map((cell, colIndex) => {
            const colName = columnHeaders[colIndex];
            const isEditing =
             editingCell &&
             editingCell.row === rowIndex &&
             editingCell.col === colIndex;
            const isDropdown = dropdownColumns[colName];

            if (isEditing) {
             return (
              <td
               key={colIndex}
               className="border border-gray-300 px-3 py-2 relative group min-w-[100px]"
              >
               {canUpdateSheet && (
                <button
                 className="absolute top-1 right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-2xl"
                 onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({
                   row: rowIndex,
                   col: colIndex,
                   x: deviceType.mobile
                    ? e.currentTarget.getBoundingClientRect().left - 190
                    : deviceType.tab
                    ? e.currentTarget.getBoundingClientRect().left - 360
                    : e.currentTarget.getBoundingClientRect().left - 430,
                   y: deviceType.mobile
                    ? e.currentTarget.getBoundingClientRect().bottom +
                      window.scrollY -
                      150
                    : e.currentTarget.getBoundingClientRect().bottom +
                      window.scrollY -
                      165,
                  });
                 }}
                >
                 ⋮
                </button>
               )}

               <div
                onClick={() => {
                 if (clickTimerRef.current) {
                  clearTimeout(clickTimerRef.current);
                  clickTimerRef.current = null;
                 }
                 if (preventSingleClickRef.current) {
                  preventSingleClickRef.current = false;
                  return;
                 }
                 clickTimerRef.current = setTimeout(() => {
                  handleCellClick(rowIndex, colIndex);
                  clickTimerRef.current = null;
                 }, 200);
                }}
                onDoubleClick={() => {
                 if (clickTimerRef.current) {
                  clearTimeout(clickTimerRef.current);
                  clickTimerRef.current = null;
                 }
                 preventSingleClickRef.current = true;
                 if (
                  !(
                   editingCell?.row === rowIndex &&
                   editingCell?.col === colIndex
                  ) &&
                  typeof cell === "string" &&
                  /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(
                   cell.trim()
                  )
                 ) {
                  let url = cell.trim();
                  if (!/^https?:\/\//.test(url)) {
                   url = "https://" + url;
                  }
                  window.open(url, "_blank", "noopener,noreferrer");
                 }
                }}
                className={`min-h-[20px] ${
                 canUpdateSheet
                  ? "cursor-pointer hover:bg-gray-100"
                  : "cursor-not-allowed opacity-75"
                }`}
               >
                {isDropdown ? (
                 <select
                  value={tempValue}
                  autoFocus
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => saveCell(rowIndex, colIndex)}
                  className="w-full px-2 py-1 border rounded outline-none bg-white"
                 >
                  <option value="">Select option</option>
                  {dropdownColumns[colName].map((option) => (
                   <option key={option} value={option}>
                    {option}
                   </option>
                  ))}
                 </select>
                ) : (
                 <input
                  type="text"
                  value={tempValue}
                  autoFocus
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => saveCell(rowIndex, colIndex)}
                  onKeyDown={(e) => {
                   if (e.key === "Enter") saveCell(rowIndex, colIndex);
                   if (e.key === "Escape") {
                    setEditingCell(null);
                    setTempValue(data[rowIndex][colIndex]);
                   }
                  }}
                  className="w-full px-2 py-1 border rounded outline-none"
                 />
                )}
               </div>
              </td>
             );
            }

            return (
             <td
              key={colIndex}
              className="border border-gray-300 px-3 py-2 relative group min-w-[100px]"
             >
              {canUpdateSheet && (
               <button
                className="absolute top-1 right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-2xl"
                onClick={(e) => {
                 e.stopPropagation();
                 setContextMenu({
                  row: rowIndex,
                  col: colIndex,
                  x: deviceType.mobile
                   ? e.currentTarget.getBoundingClientRect().left - 190
                   : deviceType.tab
                   ? e.currentTarget.getBoundingClientRect().left - 360
                   : e.currentTarget.getBoundingClientRect().left - 430,
                  y: deviceType.mobile
                   ? e.currentTarget.getBoundingClientRect().bottom +
                     window.scrollY -
                     150
                   : e.currentTarget.getBoundingClientRect().bottom +
                     window.scrollY -
                     165,
                 });
                }}
               >
                ⋮
               </button>
              )}

              <div
               onClick={() => {
                if (clickTimerRef.current) {
                 clearTimeout(clickTimerRef.current);
                 clickTimerRef.current = null;
                }
                if (preventSingleClickRef.current) {
                 preventSingleClickRef.current = false;
                 return;
                }
                clickTimerRef.current = setTimeout(() => {
                 handleCellClick(rowIndex, colIndex);
                 clickTimerRef.current = null;
                }, 200);
               }}
               onDoubleClick={() => {
                if (clickTimerRef.current) {
                 clearTimeout(clickTimerRef.current);
                 clickTimerRef.current = null;
                }
                preventSingleClickRef.current = true;
                if (
                 !(
                  editingCell?.row === rowIndex && editingCell?.col === colIndex
                 ) &&
                 typeof cell === "string" &&
                 /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(
                  cell.trim()
                 )
                ) {
                 let url = cell.trim();
                 if (!/^https?:\/\//.test(url)) {
                  url = "https://" + url;
                 }
                 window.open(url, "_blank", "noopener,noreferrer");
                }
               }}
               className={`min-h-[20px] ${
                canUpdateSheet
                 ? "cursor-pointer hover:bg-gray-100"
                 : "cursor-not-allowed opacity-75"
               }`}
              >
               {typeof cell === "string" &&
               /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(
                cell.trim()
               ) ? (
                <span
                 className="text-blue-600 underline cursor-pointer"
                 title="Double-click to open link"
                >
                 {cell}
                </span>
               ) : (
                <span
                 className={
                  cell ? `px-2 py-1 rounded border text-xs font-medium ` : ""
                 }
                >
                 {cell || "-"}
                </span>
               )}
              </div>
             </td>
            );
           })}
          </SortableRow>
         ))}
        </tbody>
       </SortableContext>
      </DndContext>
     </table>
    </div>
    <ContextMenu
     contextMenu={contextMenu}
     setContextMenu={setContextMenu}
     //@ts-ignore
     handleRowOperation={handleRowOperation}
     //@ts-ignore
     handleColumnOperation={handleColumnOperation}
     columnHeaders={columnHeaders}
     getColumnLabel={getColumnLabel}
    />
    {headerMenu && canUpdateColumnHeader && (
     <div
      className="fixed z-50 bg-white border rounded shadow-lg"
      style={{ left: headerMenu.x - 70, top: headerMenu.y }}
     >
      <button
       className="block w-full px-4 py-2 text-left hover:bg-gray-100"
       onClick={() => {
        setHeaderMenu(null);
        setDropdownModal({ colIndex: headerMenu.colIndex });
       }}
      >
       Attach Dropdown
      </button>
     </div>
    )}
    {dropdownModal && (
     <div
      style={{ marginTop: "0px" }}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
     >
      <div className="bg-white rounded-lg p-6 w-80">
       <h3 className="text-lg font-semibold mb-4">Select Key for Dropdown</h3>
       <ul>
        {valueSets.map((kv: { id: number; name: string }) => (
         <li key={kv.id}>
          <button
           className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
           onClick={() => {
            handleAttachDropDown(
             columnHeaders[dropdownModal.colIndex],
             Number(kv.id)
            );
         
            setDropdownModal(null);
           }}
          >
           {kv.name}
          </button>
         </li>
        ))}
       </ul>
       <button
        className="mt-4 px-4 py-2 bg-gray-200 rounded"
        onClick={() => setDropdownModal(null)}
       >
        Cancel
       </button>
      </div>
     </div>
    )}
   </div>
  </>
 );
}
