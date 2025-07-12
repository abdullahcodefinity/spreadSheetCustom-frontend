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
import ImageModal from "./modal/ImageModal";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";


function SortableHeader({ id, colIndex, children, ...props }: any) {
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
  cursor: "default",
  background: isDragging ? "#e0e7ff" : undefined,
  zIndex: isDragging ? 10 : undefined,
  width: "150px",
  minWidth: "60px",
  position: "relative",
 } as React.CSSProperties;

 return (
  <th
   ref={setNodeRef}
   style={{
    ...style,
    position: "sticky",
    top: -1,
    zIndex: 30, // higher than default
    background: style.background || "#f3f4f6", // fallback bg
    width: props.width,
    minWidth: 50,
    maxWidth: props.width,
   }}
   className={`relative group ${
    props.className ? props.className.replace(/w-\S+/g, "") : ""
   }`}
  >
   <div className="" style={{ position: "relative" }}>
    <span
     {...attributes}
     {...listeners}
     className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab select-none  text-lg"
     style={{
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
     }}
     title="Drag to reorder column"
    >
     ⠿
    </span>
    <span className="w-full flex items-center justify-center gap-1">
     {/* Move onClick here for header text only */}
     <div
      onClick={(e) => {
       e.stopPropagation();
       if (props.onClick) {
        props.onClick(e);
       }
      }}
      style={{ display: "inline-block", width: "70%" }}
     >
      {children}
     </div>
    </span>
    {/* Only show menu if not adjusting */}
    <button
     type="button"
     className="hover:border hover:border-gray-400 rounded w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2"
     onClick={(e) => {
      e.stopPropagation();
      props.onMenuClick(e);
     }}
    >
     ⋮
    </button>
    {/* Resizer handle */}
    <span
     data-no-dnd
     onMouseDown={(e) =>
      props.onResizeMouseDown && props.onResizeMouseDown(e, colIndex)
     }
     style={{
      position: "absolute",
      right: -14,

      top: 0,
      height: "100%",
      width: "8px",
      cursor: "col-resize",
      zIndex: 40,
      display: "block",
      background: "transparent",
     }}
     className="resize-handle group-hover:bg-blue-200"
     title="Resize column"
    >
     {/* <svg style={{display:'block',margin:'auto',opacity:0.7}} width="8" height="20" viewBox="0 0 8 20"><rect x="3" y="4" width="2" height="12" rx="1" fill="#888"/></svg> */}
    </span>
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
 // Instead of spreading listeners/attributes on <tr>, pass them as props
 return (
  <tr ref={setNodeRef} style={style} {...props}>
   {typeof children === "function"
    ? children({ attributes, listeners })
    : children}
  </tr>
 );
}

export default function Spreadsheet() {
 const params = useParams();
 const sheetId = params?.id;
 const deviceType = useDeviceType();

 const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
 const preventSingleClickRef = useRef(false);
 const tableContainerRef = useRef<HTMLDivElement>(null);
 const { errorToast } = useToast();

 const { currentUser } = useAuth();

 // Use the enhanced useSheetData hook that contains all the business logic
 const {
  data,
  columnHeaders,
  dropdownColumns,
  columnTypes,
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
  imageModal,
  handleImageUpload,
  handleAttachDropDown,
  setImageModal,
  setEditingHeader,
  setTempHeader,
  setContextMenu,
  setIsShareModalOpen,
  setEditingCell,
  setTempValue,
  setColumnHeaders,
  setData,
  handleAttachFile,
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

 const [headerMenu, setHeaderMenu] = useState<{
  colIndex: number;
  x: number;
  y: number;
 } | null>(null);
 const [dropdownModal, setDropdownModal] = useState<{
  colIndex: number;
 } | null>(null);

 // 1. Track column widths in state
 const DEFAULT_WIDTH = 150;
 const [columnWidths, setColumnWidths] = useState<number[]>([]);
 const resizingColRef = useRef<number | null>(null);
 const startXRef = useRef<number>(0);
 const startWidthRef = useRef<number>(0);
 const [isResizing, setIsResizing] = useState(false);

 // Initialize column widths when headers change
 useEffect(() => {
  if (!sheetId || columnHeaders.length === 0) return;
  // Try to load from localStorage
  const key = `spreadsheet-widths-${sheetId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
   try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length === columnHeaders.length) {
     setColumnWidths(parsed);
     return;
    }
   } catch {}
  }
  // Fallback: default logic
  setColumnWidths((prev) => {
   if (prev.length !== columnHeaders.length) {
    return columnHeaders.map((_, i) => prev[i] || DEFAULT_WIDTH);
   }
   return prev;
  });
 }, [sheetId, columnHeaders.length]);

 // Persist columnWidths to localStorage when they change
 useEffect(() => {
  if (!sheetId || columnWidths.length === 0) return;
  const key = `spreadsheet-widths-${sheetId}`;
  localStorage.setItem(key, JSON.stringify(columnWidths));
 }, [sheetId, columnWidths]);

 // 2. Handle mouse events for resizing
 useEffect(() => {
  function onMouseMove(e: MouseEvent) {
   if (resizingColRef.current !== null) {
    const col = resizingColRef.current;
    const delta = e.clientX - startXRef.current;
    setColumnWidths((widths) => {
     const newWidths = [...widths];
     newWidths[col] = Math.max(60, startWidthRef.current + delta); // min width 60px
     console.log(`Resizing column ${col}: new width =`, newWidths[col]);
     return newWidths;
    });
   }
  }
  function onMouseUp() {
   if (resizingColRef.current !== null) {
    console.log(`Finished resizing column ${resizingColRef.current}`);
   }
   resizingColRef.current = null;
   setIsResizing(false);
  }
  if (isResizing) {
   window.addEventListener("mousemove", onMouseMove);
   window.addEventListener("mouseup", onMouseUp);
  }
  return () => {
   window.removeEventListener("mousemove", onMouseMove);
   window.removeEventListener("mouseup", onMouseUp);
  };
 }, [isResizing]);

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
   // Close image modal when clicking outside
   if (!target.closest(".image-modal")) {
    setImageModal(null);
   }
   // Remove scroll restoration on click outside editing areas
  };
  const handleEsc = (e: KeyboardEvent) => {
   if (e.key === "Escape") {
    setContextMenu(null);
    setHeaderMenu(null);
    setDropdownModal(null);
    setImageModal(null);
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
   const newHeaders = arrayMove(columnHeaders, oldIndex, newIndex);
   const newData = data.map((row) => arrayMove(row, oldIndex, newIndex));
   const newWidths = arrayMove(columnWidths, oldIndex, newIndex); // <-- add this

   await handleColumnOperation("move", {
    sourceIndex: oldIndex,
    targetIndex: newIndex,
   });
   setColumnHeaders(newHeaders);
   setData(newData);
   setColumnWidths(newWidths); // <-- add this
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

 // 3. Pass width and resize handler to SortableHeader
 function handleResizeMouseDown(e: React.MouseEvent, colIndex: number) {
  e.preventDefault();
  e.stopPropagation();
  resizingColRef.current = colIndex;
  startXRef.current = e.clientX;
  startWidthRef.current = columnWidths[colIndex];
  console.log(
   `Start resizing column ${colIndex} (start width: ${columnWidths[colIndex]})`
  );
  setIsResizing(true);
 }

   // Wrap handleColumnOperation to also update columnWidths
  const handleColumnOperationWithWidths = async (
   operation: "add" | "update" | "delete" | "move",
   params: {
    index?: number;
    newName?: string;
    sourceIndex?: number;
    targetIndex?: number;
   }
  ) => {
   if (operation === "add" && typeof params.index === "number") {
    // Insert default width at the new column index
    setColumnWidths((prev) => {
     const newWidths = [...prev];
     newWidths.splice(params.index!, 0, DEFAULT_WIDTH);
     return newWidths;
    });
   } else if (operation === "delete" && typeof params.index === "number") {
    // Remove the width at the deleted column index
    setColumnWidths((prev) => {
     const newWidths = [...prev];
     newWidths.splice(params.index!, 1);
     return newWidths;
    });
   }
   // Call the original operation
   await handleColumnOperation(operation, params);
  };


 return (
  <>
   <div className="pl-5 mt-5 relative">
    <div className="mb-1 flex justify-between ">
     <h1 className="text-3xl font-bold text-gray-800 capitalize inline-block pb-2 border-b-2 border-blue-500">
      {spreadsheetName}
     </h1>
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

    <ShareModal
     isOpen={isShareModalOpen}
     onClose={() => setIsShareModalOpen(false)}
     users={users}
     onShare={handleShare}
    />
    <div
     className="overflow-auto  rounded-md "
     ref={tableContainerRef}
     style={{ height: "calc(100vh - 190px)" }}
    >
     <table
      className="border rounded-lg border-gray-300 text-sm text-left table-fixed"
      style={{ minWidth: "max-content" }}
     >
      <DndContext
       sensors={useSensors(
        useSensor(PointerSensor, {
         activationConstraint: { distance: 5 },
         eventOptions: {
          onPointerDown: (event: PointerEvent) => {
           if (
            (event.target as HTMLElement)?.getAttribute("data-no-dnd") !== null
           ) {
            event.preventDefault();
            event.stopPropagation();
           }
          },
         },
        })
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
          <th
           className="border border-gray-300 px-3 py-2 text-center bg-gray-100"
           style={{
            width: 40,
            minWidth: 40,
            position: "sticky",
            left: 0,
            top: 0,
            zIndex: 50,
            background: "#f3f4f6",
            boxShadow: "2px 0 2px -2px #ccc",
           }}
          >
           #
          </th>
          {columnHeaders.map((header, colIndex) => (
           <SortableHeader
            key={colIndex}
            id={colIndex.toString()}
            colIndex={colIndex}
            width={columnWidths[colIndex] || DEFAULT_WIDTH}
            onResizeMouseDown={handleResizeMouseDown}
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
              onBlur={() => saveHeader(colIndex)}
              onKeyDown={(e) => {
               if (e.key === "Enter") saveHeader(colIndex);
               if (e.key === "Escape") {
                setEditingHeader(null);
               }
              }}
              className="w-full border-green-500 py-0.5 border rounded outline-none"
             />
            ) : (
             <div
              className=" items-center justify-center gap-1 ml-2 mr-4 overflow-hidden text-ellipsis whitespace-nowrap block w-full"
              style={{ width: "100%", maxWidth: "100%" }}
             >
              {header}
              {columnTypes[header] === 'select' && <span className="ml-1 text-xs text-blue-500">(Dropdown)</span>}
              {columnTypes[header] === 'file' && <span className="ml-1 text-xs text-green-500">(File)</span>}
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
           {({ attributes, listeners }: any) => (
            <>
             <td
              className="border border-gray-300 px-3 py-2 text-center font-medium bg-gray-50 group"
              style={{
               position: "sticky",
               left: 0,
               zIndex: 20,
               background: "#f3f4f6",
               width: 40,
               minWidth: 40,
              }}
             >
              <span
               style={{ cursor: "grab" }}
               {...attributes}
               {...listeners}
               className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
               ⠿
              </span>{" "}
              {rowIndex + 1}
             </td>
             {row.map((cell, colIndex) => {
              const colName = columnHeaders[colIndex];
              const isEditing =
               editingCell &&
               editingCell.row === rowIndex &&
               editingCell.col === colIndex;
              const isDropdown = dropdownColumns[colName];
              const isFile = columnTypes[colName] === 'file';
              const cellWidth = columnWidths[colIndex] || DEFAULT_WIDTH;

              if (isEditing) {
               return (
                <td
                 key={colIndex}
                 className="border border-gray-300 px-3 py-2 relative group"
                 style={{ width: cellWidth, minWidth: 60, maxWidth: cellWidth }}
                >
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
                    onChange={(e) => {
                     setTempValue(e.target.value);
                     saveCell(rowIndex, colIndex, e.target.value); // Pass new value
                    }}
                    onBlur={(e) => saveCell(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => {
                     if (e.key === "Escape") {
                      setEditingCell(null);
                      const cellValue = data[rowIndex][colIndex];
                      const stringValue = typeof cellValue === 'string' ? cellValue : 
                                         (typeof cellValue === 'object' && cellValue ? 
                                          (cellValue.fileUrl || cellValue.type || JSON.stringify(cellValue)) : '');
                      setTempValue(stringValue || "");
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
                    onBlur={() => saveCell(rowIndex, colIndex, tempValue)}
                    onKeyDown={(e) => {
                     if (e.key === "Enter")
                      saveCell(rowIndex, colIndex, tempValue);
                     if (e.key === "Escape") {
                      setEditingCell(null);
                      const cellValue = data[rowIndex][colIndex];
                      const stringValue = typeof cellValue === 'string' ? cellValue : 
                                         (typeof cellValue === 'object' && cellValue ? 
                                          (cellValue.fileUrl || cellValue.type || JSON.stringify(cellValue)) : '');
                      setTempValue(stringValue || "");
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
                className="border border-gray-300 px-3 py-2 relative group"
                style={{ width: cellWidth, minWidth: 60, maxWidth: cellWidth }}
               >
                <button
                 className="absolute ml-3  mb-4 hover:border py-0  rounded w-5  right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-xl"
                 onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({
                   row: rowIndex,
                   col: colIndex,
                   x: deviceType.mobile
                    ? e.currentTarget.getBoundingClientRect().left - 190
                    : deviceType.tab
                    ? e.currentTarget.getBoundingClientRect().left - 360
                    : e.currentTarget.getBoundingClientRect().left - 330,
                   y: deviceType.mobile
                    ? e.currentTarget.getBoundingClientRect().bottom +
                      window.scrollY -
                      350
                    : e.currentTarget.getBoundingClientRect().bottom +
                      window.scrollY -
                      125,
                  });
                 }}
                >
                 ⋮
                </button>

                <div
                 onClick={(e) => {
                  if (clickTimerRef.current) {
                   clearTimeout(clickTimerRef.current);
                   clickTimerRef.current = null;
                  }
                  if (preventSingleClickRef.current) {
                   preventSingleClickRef.current = false;
                   return;
                  }
                  
                  // For file-type columns, open ImageModal instead of editing
                  console.log("Cell click - isFile:", isFile, "colName:", colName, "columnTypes:", columnTypes);
                  if (isFile) {
                   if (!hasUpdateRow) {
                    errorToast("You do not have permission to update files");
                    return;
                   }
                   setImageModal({ rowIndex, colIndex });
                   console.log("Setting imageModal for file cell:", { rowIndex, colIndex });
                   // Prevent the click event from bubbling up to avoid immediate closure
                   e.stopPropagation();
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
                 className={`min-h-[20px] border mr-4 ${
                  hasUpdateRow
                   ? "cursor-pointer hover:bg-gray-100"
                   : "cursor-not-allowed opacity-75"
                 }`}
                >
                 {isFile ? (
                  // Handle file type columns - check for both string URLs and object URLs
                  (() => {
                   let fileUrl = '';
                   let fileName = 'File';
                   
                   if (typeof cell === 'string' && cell) {
                    fileUrl = cell;
                   } else if (typeof cell === 'object' && cell && cell.fileUrl) {
                    fileUrl = cell.fileUrl;
                    fileName = cell.type || 'File';
                   }
                   
                   return fileUrl ? (
                    <a 
                     href={fileUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-green-600 underline block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                     {fileName}
                    </a>
                   ) : (
                    <span className="text-gray-400 block w-full">No file</span>
                   );
                  })()
                 ) : (() => {
                   // Handle regular cells - check for both string and object values
                   let displayValue = '';
                   let isUrl = false;
                   
                   if (typeof cell === 'string') {
                    displayValue = cell;
                    isUrl = /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(cell.trim());
                   } else if (typeof cell === 'object' && cell && cell.fileUrl) {
                    displayValue = cell.fileUrl;
                    isUrl = true;
                   } else if (typeof cell === 'object' && cell) {
                    // For other object types, try to extract a meaningful value
                    displayValue = cell.type || cell.name || JSON.stringify(cell);
                   }
                   
                   if (isUrl) {
                    return (
                     <span
                      className="text-blue-600 underline cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap block w-full"
                      style={{ maxWidth: "100%" }}
                      title="Double-click to open link"
                     >
                      {displayValue}
                     </span>
                    );
                   } else {
                    return (
                     <span
                      className={
                       (displayValue ? `px-2 py-1  text-xs font-medium ` : "") +
                       "overflow-hidden text-ellipsis whitespace-nowrap block w-full"
                      }
                      style={{ maxWidth: "100%" }}
                     >
                      {displayValue || "-"}
                     </span>
                    );
                   }
                  })()}
                </div>
               </td>
              );
             })}
            </>
           )}
          </SortableRow>
         ))}
        </tbody>
       </SortableContext>
      </DndContext>
     </table>
     {/* Place overlays/modals here if needed */}
    </div>
    {(hasAddColumn || hasDeleteColumn || hasAddRow || hasDeleteRow) && (
     <ContextMenu
      contextMenu={contextMenu}
      setContextMenu={setContextMenu}
      //@ts-ignore
      handleRowOperation={handleRowOperation}
      //@ts-ignore
      handleColumnOperation={handleColumnOperationWithWidths}
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
      {(() => {
        const colName = columnHeaders[headerMenu.colIndex];
        const colType = columnTypes[colName];
        
        if (colType === 'file') {
          return (
            <button
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              onClick={() => {
                setHeaderMenu(null);
                handleAttachFile(colName, "remove");
              }}
            >
              Remove File Type
            </button>
          );
        } else if (dropdownColumns[colName]) {
          return (
            <button
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              onClick={() => {
                setHeaderMenu(null);
                handleAttachDropDown(
                  colName,
                  undefined,
                  "remove"
                );
              }}
            >
              Remove Dropdown
            </button>
          );
        } else {
          return (
            <>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setHeaderMenu(null);
                  setDropdownModal({ colIndex: headerMenu.colIndex });
                }}
              >
                Attach Dropdown
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setHeaderMenu(null);
                  handleAttachFile(colName, "attach");
                }}
              >
                Attach File Type
              </button>
            </>
          );
        }
      })()}
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
    <ImageModal
     isOpen={imageModal !== null}
     onClose={() => setImageModal(null)}
     onUpload={handleImageUpload}
    />
   </div>
  </>
 );
}
