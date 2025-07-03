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
import ShareModal from "./modal/ShareModal";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";

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
    {/* <span style={{ cursor: "grab", marginLeft: 4 }}>⠿</span> */}

    <button
     type="button"
     className="ml-7 hover:border hover:border-gray-400 rounded w-8 text-xl opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
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
 const tableContainerRef = useRef<HTMLDivElement>(null);
 const {errorToast}=useToast()

 const { currentUser } = useAuth();

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
  contextMenu,
  isShareModalOpen,

  // Permission flags
  hasAddColumn,
  hasDeleteColumn,
  hasUpdateColumn,
  hasAddRow,
  hasDeleteRow,
  hasUpdateRow,

  handleAttachDropDown,
  setEditingHeader,
  setTempHeader,
  setContextMenu,
  setIsShareModalOpen,
  setEditingCell,
  setTempValue,
  setColumnHeaders,
  setData,
  saveCell,
  saveHeader,
  handleHeaderClick,
  handleCellClickWithScroll,
  handleRowOperation,
  handleColumnOperation,
  handleShare,
  exportToCSV,
  getColumnLabel,
 } = useSheetData(sheetId as string);

 console.log(
  hasAddColumn,
  hasDeleteColumn,
  hasUpdateColumn,
  hasAddRow,
  hasDeleteRow,
  hasUpdateRow,
  "PERMISSIONS"
 );

 const [headerMenu, setHeaderMenu] = useState<{
  colIndex: number;
  x: number;
  y: number;
 } | null>(null);
 const [dropdownModal, setDropdownModal] = useState<{
  colIndex: number;
 } | null>(null);
 const [isSaving, setIsSaving] = useState(false);

 // Save scroll position before making changes
 const saveScrollPosition = () => {
  if (tableContainerRef.current) {
   const scrollPosition = tableContainerRef.current.scrollTop;
   sessionStorage.setItem('spreadsheetScrollPosition', scrollPosition.toString());
  }
 };

 // Restore scroll position after data changes
 const restoreScrollPosition = () => {
  const scrollPosition = sessionStorage.getItem('spreadsheetScrollPosition');
  if (scrollPosition && tableContainerRef.current) {
   // Use requestAnimationFrame to ensure DOM is ready
   requestAnimationFrame(() => {
    if (tableContainerRef.current) {
     tableContainerRef.current.scrollTop = parseInt(scrollPosition, 10);
     sessionStorage.removeItem('spreadsheetScrollPosition');
    }
   });
  }
 };

 // Enhanced saveCell function with scroll persistence
 const handleSaveCell = async (rowIndex: number, colIndex: number) => {
  saveScrollPosition();
  await saveCell(rowIndex, colIndex);
  // Restore scroll position after a longer delay to ensure DOM updates are complete
  setTimeout(restoreScrollPosition, 150);
 };

 // Enhanced saveHeader function with scroll persistence
 const handleSaveHeader = async (colIndex: number) => {
  saveScrollPosition();
  await saveHeader(colIndex);
  setTimeout(restoreScrollPosition, 150);
 };

 // Custom blur handler that ensures scroll restoration
 const handleCellBlur = async (rowIndex: number, colIndex: number) => {
  if (isSaving) return; // Prevent multiple saves
  setIsSaving(true);
  saveScrollPosition();
  await saveCell(rowIndex, colIndex);
  // Use multiple attempts to restore scroll position
  setTimeout(() => {
    restoreScrollPosition();
    setIsSaving(false);
  }, 100);
  setTimeout(restoreScrollPosition, 200);
  setTimeout(restoreScrollPosition, 300);
 };

 // Custom header blur handler
 const handleHeaderBlur = async (colIndex: number) => {
  if (isSaving) return; // Prevent multiple saves
  setIsSaving(true);
  saveScrollPosition();
  await saveHeader(colIndex);
  // Use multiple attempts to restore scroll position
  setTimeout(() => {
    restoreScrollPosition();
    setIsSaving(false);
  }, 100);
  setTimeout(restoreScrollPosition, 200);
  setTimeout(restoreScrollPosition, 300);
 };

 // Enhanced row operations with scroll persistence
 const handleRowOperationWithScroll = async (operation: "add" | "delete" | "move", params: number | { sourceIndex: number; targetIndex: number }) => {
  saveScrollPosition();
  await handleRowOperation(operation, params);
  setTimeout(restoreScrollPosition, 100);
 };

 // Enhanced column operations with scroll persistence
 const handleColumnOperationWithScroll = async (operation: "add" | "update" | "delete" | "move", params: { index?: number; newName?: string; sourceIndex?: number; targetIndex?: number }) => {
  saveScrollPosition();
  await handleColumnOperation(operation, params);
  setTimeout(restoreScrollPosition, 100);
 };

 useEffect(() => {
  const handleClick = (e: MouseEvent) => {
   const target = e.target as HTMLElement;
   if (!target.closest(".custom-context-menu")) {
    setContextMenu(null);
   }
   // Close header menu when clicking outside
   if (!target.closest(".header-menu")) {
    setHeaderMenu(null);
   }
   // Close dropdown modal when clicking outside
   if (!target.closest(".dropdown-modal")) {
    setDropdownModal(null);
   }
   
   // Handle clicking outside editing areas to restore scroll
   if (editingCell && !target.closest('input, select')) {
    // If clicking outside input/select while editing, restore scroll
    setTimeout(restoreScrollPosition, 100);
    setTimeout(restoreScrollPosition, 200);
    setTimeout(restoreScrollPosition, 300);
   }
   if (editingHeader !== null && !target.closest('input')) {
    // If clicking outside header input while editing, restore scroll
    setTimeout(restoreScrollPosition, 100);
    setTimeout(restoreScrollPosition, 200);
    setTimeout(restoreScrollPosition, 300);
   }
  };
  const handleEsc = (e: KeyboardEvent) => {
   if (e.key === "Escape") {
    setContextMenu(null);
    setHeaderMenu(null);
    setDropdownModal(null);
   }
  };
  window.addEventListener("click", handleClick);
  window.addEventListener("keydown", handleEsc);
  return () => {
   window.removeEventListener("click", handleClick);
   window.removeEventListener("keydown", handleEsc);
  };
 }, [editingCell, editingHeader]);

 const handleColumnDragEnd = async (event: any) => {
  if (!hasUpdateColumn) return;
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = Number(active.id);
  const newIndex = Number(over.id);

  try {
   saveScrollPosition();
   const newHeaders = arrayMove(columnHeaders, oldIndex, newIndex);
   const newData = data.map((row) => arrayMove(row, oldIndex, newIndex));

   await handleColumnOperation("move", {
    sourceIndex: oldIndex,
    targetIndex: newIndex,
   });
   setColumnHeaders(newHeaders);
   setData(newData);
   setTimeout(restoreScrollPosition, 100);
  } catch (err) {
   console.log(err, "RRRRRR");
  }
 };

 const handleRowDragEnd = async (event: any) => {
  if (!hasUpdateColumn) return;
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = Number(active.id);
  const newIndex = Number(over.id);
  try {
   saveScrollPosition();
   await handleRowOperation("move", {
    sourceIndex: oldIndex,
    targetIndex: newIndex,
   });
   const newData = arrayMove(data, oldIndex, newIndex);
   setData(newData);
   setTimeout(restoreScrollPosition, 100);
  } catch (err) {
   console.log(err, "Error moving row");
  }
 };

 // Restore scroll position when data loads or changes
 useEffect(() => {
  if (data.length > 0 && !isLoading) {
   const scrollPosition = sessionStorage.getItem('spreadsheetScrollPosition');
   if (scrollPosition && tableContainerRef.current) {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
     if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = parseInt(scrollPosition, 10);
      sessionStorage.removeItem('spreadsheetScrollPosition');
     }
    });
   }
  }
 }, [data, isLoading]);

 useEffect(() => {
  const handleScroll = () => {
   const container = tableContainerRef.current;
   if (!container) return;

   // Check if scrolled to the bottom
   if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
    // Log scroll properties
    console.log("Scrolled to bottom!");
    console.log({
     scrollTop: container.scrollTop,
     scrollHeight: container.scrollHeight,
     clientHeight: container.clientHeight,
    });
   }
  };

  const container = tableContainerRef.current;
  if (container) {
   container.addEventListener("scroll", handleScroll);
  }
  return () => {
   if (container) {
    container.removeEventListener("scroll", handleScroll);
   }
  };
 }, []);

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
     {hasAddColumn ||
     hasDeleteColumn ||
     hasUpdateColumn ||
     hasAddRow ||
     hasDeleteRow ||
     hasUpdateRow ? (
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
      {currentUser?.role === "SuperAdmin" && (
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
    <ShareModal
     isOpen={isShareModalOpen}
     onClose={() => setIsShareModalOpen(false)}
     users={users}
     onShare={handleShare}
    />
    <div className="overflow-auto" ref={tableContainerRef}>
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
            onClick={() => {
          
             handleHeaderClick(colIndex);
            }}
            onMenuClick={(e: React.MouseEvent) => {
             const rect = (e.target as HTMLElement).getBoundingClientRect();
             if (!hasUpdateColumn) {
              errorToast("You do not have permission to update columns");
              return;
             }
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
              onFocus={() => saveScrollPosition()}
              onBlur={() => handleHeaderBlur(colIndex)}
              onKeyDown={(e) => {
               if (e.key === "Enter") handleSaveHeader(colIndex);
               if (e.key === "Escape") {
                saveScrollPosition();
                setEditingHeader(null);
                setTimeout(restoreScrollPosition, 100);
               }
              }}
              className="w-full  mr-8 py-0.5 border rounded outline-none"
             />
            ) : (
             <div className="flex items-center justify-center gap-1 mr-4">
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
               {/* {hasUpdateColumn && (
                <button
                 className="absolute top-1  border  right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-2xl"
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
               )} */}

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
                  handleCellClickWithScroll(rowIndex, colIndex);
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
                 hasUpdateRow
                  ? "cursor-pointer hover:bg-gray-100"
                  : "cursor-not-allowed opacity-75"
                }`}
               >
                {isDropdown ? (
                 <select
                  value={tempValue}
                  autoFocus
                  onChange={(e) => setTempValue(e.target.value)}
                  onFocus={() => saveScrollPosition()}
                  onBlur={() => handleCellBlur(rowIndex, colIndex)}
                  onKeyDown={(e) => {
                   if (e.key === "Escape") {
                    saveScrollPosition();
                    setEditingCell(null);
                    setTempValue(data[rowIndex][colIndex]);
                    setTimeout(restoreScrollPosition, 100);
                   }
                  }}
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
                  onFocus={() => saveScrollPosition()}
                  onBlur={() => handleCellBlur(rowIndex, colIndex)}
                  onKeyDown={(e) => {
                   if (e.key === "Enter") handleSaveCell(rowIndex, colIndex);
                   if (e.key === "Escape") {
                    saveScrollPosition();
                    setEditingCell(null);
                    setTempValue(data[rowIndex][colIndex]);
                    setTimeout(restoreScrollPosition, 100);
                   }
                  }}
                  className="w-full border-red-500 mr-10 px-2 py-1 border rounded outline-none"
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
              <button
               className="absolute ml-3 top-1 mb-4 hover:border py-0  rounded w-5  right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-xl"
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
                 handleCellClickWithScroll(rowIndex, colIndex);
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
               className={`min-h-[20px] border mr-4 ${
                hasUpdateRow
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
                  cell ? `px-2 py-1  text-xs font-medium ` : ""
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
    {(hasAddColumn || hasDeleteColumn || hasAddRow || hasDeleteRow) && (
     <ContextMenu
      contextMenu={contextMenu}
      setContextMenu={setContextMenu}
      //@ts-ignore
      handleRowOperation={handleRowOperationWithScroll}
      //@ts-ignore
      handleColumnOperation={handleColumnOperationWithScroll}
      columnHeaders={columnHeaders}
      getColumnLabel={getColumnLabel}
      hasAddColumn={hasAddColumn}
      hasDeleteColumn={hasDeleteColumn}
      hasUpdateColumn={hasUpdateColumn}
      hasAddRow={hasAddRow}
      hasDeleteRow={hasDeleteRow}
      hasUpdateRow={hasUpdateRow}
     />
    )}

    {headerMenu && hasUpdateColumn && (
     <div
      className="fixed z-50 bg-white border rounded shadow-lg header-menu"
      style={{ left: headerMenu.x - 70, top: headerMenu.y }}
      onClick={(e) => e.stopPropagation()}
     >
      {dropdownColumns &&
      Object.keys(dropdownColumns).includes(
       columnHeaders[headerMenu.colIndex]
      ) ? (
       <button
        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
         setHeaderMenu(null);
         handleAttachDropDown(
          columnHeaders[headerMenu.colIndex],
          undefined,
          "remove"
         );
        }}
       >
        Remove Dropdown
       </button>
      ) : (
       <button
        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
         setHeaderMenu(null);
         setDropdownModal({ colIndex: headerMenu.colIndex });
        }}
       >
        Attach Dropdown
       </button>
      )}
     </div>
    )}
    {dropdownModal && (
     <div
      style={{ marginTop: "0px" }}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 dropdown-modal"
     >
      <div className="bg-white rounded-lg p-6 w-80 dropdown-modal">
       <h3 className="text-lg font-semibold mb-4">Select Key for Dropdown</h3>
       <ul>
        {valueSets?.data.map((kv: { id: number; name: string }) => (
         <li key={kv.id}>
          <button
           className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
           onClick={() => {
            handleAttachDropDown(
             columnHeaders[dropdownModal.colIndex],
             Number(kv.id),
             "attach"
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
