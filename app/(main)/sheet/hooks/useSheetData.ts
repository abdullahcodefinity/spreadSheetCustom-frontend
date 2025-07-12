import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import useToast from "@/app/hooks/useToast";
import useAuth from "@/app/hooks/useAuth";

import useDelete from "@/app/hooks/useDelete";
import usePostData from "@/app/hooks/ usePostData";
import { Url } from "@/src/api";
import useUpdateData from "@/app/hooks/ useUpdateData";
import useFetchData from "@/app/hooks/useFetchData";

import { BackendSpreadsheetData, ContextMenuTarget, CellValue } from "@/app/types";

// Add this type for dropdown columns
type ColumnDropdownMap = {
 [columnName: string]: string[]; // columnName -> dropdown options
};

export const useSheetData = (sheetId: string | undefined) => {
 const { successToast, errorToast } = useToast();
 const { currentUser } = useAuth();
 const router = useRouter();

 // State
 const [data, setData] = useState<CellValue[][]>([]);
 const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
 const [spreadsheetName, setSpreadsheetName] = useState<string>("");
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [rowIndex, setRowIndex] = useState<number>(0);
 const [editingCell, setEditingCell] = useState<{
  row: number;
  col: number;
 } | null>(null);
 const [tempValue, setTempValue] = useState<string>("");
 const [editingHeader, setEditingHeader] = useState<number | null>(null);
 const [tempHeader, setTempHeader] = useState("");

 const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
 const [isShareModalOpen, setIsShareModalOpen] = useState(false);
 const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [imageModal, setImageModal] = useState<{
  rowIndex: number;
  colIndex: number;
 } | null>(null);


 const [dropdownColumns, setDropdownColumns] = useState<ColumnDropdownMap>({});
 const [columnTypes, setColumnTypes] = useState<{
  [columnName: string]: string;
 }>({});

 const [pendingScrollRestore, setPendingScrollRestore] = useState(false);
 const lastScrollTop = useRef(0);

 // Add missing refs and state
 const tableContainerRef = useRef<HTMLDivElement | null>(null);

 // API Mutations
 const { mutate: postRow } = usePostData({
  URL: Url.addNewRow,
  mode: "post",
  link: "",
  formData: false,
  isNavigate: false,
 });
 const { mutate: FileMutate ,refresh} = usePostData({
  URL: Url.uploadFile(Number(sheetId)),
  mode: "post",
  link: "",
  formData: true,
  isNavigate: false,
 });

 const { mutate: updateRow, refetchData } = useUpdateData({
  URL: Url.updateRow(Number(sheetId), rowIndex),
  link: "",
  formData: false,
  autoRefetch: false,
  skipNavigation: true,
 });

 const {
  data: valueSets = [],
  isLoading: isLoadingData,
  status,
 } = useFetchData({
  URL: Url.getAllValueSets(),
  key: ["valueSets"],
  enabled: true,
 });

 const { mutate: moveRowMutate } = useUpdateData({
  URL: Url.moveRow(Number(sheetId)),
  link: "",
  formData: false,
 });

 const { mutate: deleteRowMutate } = useDelete({
  URL: Url.deleteRow(Number(sheetId), rowIndex),
  key: ["sheet"],
  link: "",
 });

 const { mutate: updateColumnsMutate } = useUpdateData({
  URL: Url.updateColumns(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 const { mutate: moveColumnsMutate } = useUpdateData({
  URL: Url.moveColumns(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 const { mutate: attachDropDown, refreshUpdate: DropUpdate } = useUpdateData({
  URL: Url.attachValueDropdown(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 const { mutate: attachFile, refreshUpdate: FileUpdate } = useUpdateData({
  URL: Url.attachFileType(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 const { mutate: removeDropDown, refreshUpdate: DropRemoveUpdate } =
  useUpdateData({
   URL: Url.removeValueDropdown(Number(sheetId)),
   link: "",
   isUpdate: false,
   formData: false,
  });

 // Update sheet (for sharing)
 const { mutate: updateSheet } = useUpdateData({
  URL: Url.shareSheet(Number(sheetId)),
  link: "",
  isUpdate: false,
  formData: false,
 });

 // Convert backend data to spreadsheet format
 const convertBackendDataToSpreadsheet = (
  backendData: BackendSpreadsheetData & { columnDropdowns?: any[] }
 ) => {
  const headers = backendData.columns;
  const rows: CellValue[][] = [];

  // Sort sheetData by position to maintain correct order
  const sortedSheetData = [...backendData.sheetData].sort(
   (a, b) => a.position - b.position
  );

  // Convert sheetData to rows
  sortedSheetData.forEach((item) => {
   // Ensure each row has the same length as headers
   const row = [...item.row];
   while (row.length < headers.length) {
    row.push("");
   }
   rows.push(row);
  });

  // If no data, create empty rows with "-"
  if (rows.length === 0) {
   rows.push(Array(headers.length).fill("-"));
  }

  // Ensure all rows have the same length as headers
  rows.forEach((row) => {
   while (row.length < headers.length) {
    row.push("-");
   }
  });

  // Extract dropdown columns and column types from columnsMeta
  const dropdownMap: ColumnDropdownMap = {};
  const columnTypes: { [columnName: string]: string } = {};

  // Handle columnDropdowns (legacy format)
  if (backendData.columnDropdowns) {
   backendData.columnDropdowns.forEach((dropdown) => {
    if (dropdown.columnName && dropdown.valueSet?.values) {
     dropdownMap[dropdown.columnName] = dropdown.valueSet.values;
    }
   });
  }

  // Handle columnsMeta (new format)
  if (backendData.columnsMeta) {
   Object.entries(backendData.columnsMeta).forEach(([columnName, meta]) => {
    if (meta.fileType === "file" || meta.type === "file") {
     columnTypes[columnName] = "file";
    } else if (meta.type === "select" || meta.fileType === "select") {
     columnTypes[columnName] = "select";
     // If this column has dropdown values, add them to dropdownMap
     if (dropdownMap[columnName]) {
      // Already handled by columnDropdowns
     }
    }
   });
  }

  return { headers, rows, dropdownMap, columnTypes };
 };

 // Fetch initial sheet data
 const { data: sheetData, isLoading: isSheetLoading, } = useFetchData({
  URL: Url.getSheet(Number(sheetId)),
  key: ["sheet", DropUpdate, DropRemoveUpdate, FileUpdate,refresh],
  enabled: !!sheetId,
 });

 // Fetch initial users
 const { data: usersData, isLoading: isUsersLoading } = useFetchData({
  URL: Url.getAllUsers(),
  key: ["users"],
  enabled: !!sheetId,
 });

 useEffect(() => {
  if (sheetData) {
   const {
    headers,
    rows,
    dropdownMap,
    columnTypes: types,
   } = convertBackendDataToSpreadsheet(sheetData);
   setData(rows);
   setColumnHeaders(headers);
   setSpreadsheetName(sheetData.name);
   setDropdownColumns(dropdownMap);
   setColumnTypes(types);
  }
 }, [sheetData]);

 useEffect(() => {
  setIsLoading(isSheetLoading || isUsersLoading);
 }, [isSheetLoading, isUsersLoading]);

 // Permission Handlers
 const checkPermissions = (
  sheetData: any
 ): {
  isOwner: boolean;
  hasAddColumn: boolean;
  hasDeleteColumn: boolean;
  hasUpdateColumn: boolean;
  hasAddRow: boolean;
  hasDeleteRow: boolean;
  hasUpdateRow: boolean;
 } => {
  if (!currentUser)
   return {
    isOwner: false,
    hasAddColumn: false,
    hasDeleteColumn: false,
    hasUpdateColumn: false,
    hasAddRow: false,
    hasDeleteRow: false,
    hasUpdateRow: false,
   };

  if (currentUser.role === "SuperAdmin")
   return {
    isOwner: true,
    hasAddColumn: true,
    hasDeleteColumn: true,
    hasUpdateColumn: true,
    hasAddRow: true,
    hasDeleteRow: true,
    hasUpdateRow: true,
   };

  // Find the userSheet for the current user
  const userSheet = sheetData?.userSheets?.find(
   (us: any) => us.user?.id === currentUser.id || us.userId === currentUser.id
  );

  const isOwner = userSheet?.role?.toLowerCase() === "owner";
  const permissionTypes = userSheet?.permissions?.map((p: any) => p.type) || [];

  const hasAddColumn = permissionTypes.includes("addColumn");
  const hasDeleteColumn = permissionTypes.includes("deleteColumn");
  const hasUpdateColumn = permissionTypes.includes("updateColumn");
  const hasAddRow = permissionTypes.includes("addRow");
  const hasDeleteRow = permissionTypes.includes("deleteRow");
  const hasUpdateRow = permissionTypes.includes("updateRow");

  return {
   isOwner,
   hasAddColumn,
   hasDeleteColumn,
   hasUpdateColumn,
   hasAddRow,
   hasDeleteRow,
   hasUpdateRow,
  };
 };

 // Row Operations
 const handleRowOperation = async (
  operation: "add" | "delete" | "move",
  params: number | { sourceIndex: number; targetIndex: number }
 ) => {
  const perms = checkPermissions(sheetData);

  if (operation === "add" && !perms.hasAddRow) {
   errorToast("You do not have permission to add rows");
   return;
  }

  if (operation === "delete" && !perms.hasDeleteRow) {
   errorToast("You do not have permission to delete rows");
   return;
  }

  if (operation === "move" && !perms.hasUpdateRow) {
   errorToast("You do not have permission to update rows");
   return;
  }

  setIsLoading(true);
  try {
   if (operation === "add") {
    const index = params as number;
    const rowData = columnHeaders.map(() => "");
    const payload = {
     spreadsheetId: Number(sheetId),
     position: index + 1,
     row: rowData,
    };
    postRow(payload, {
     onSuccess: () => {
      const newData = [...data];
      newData.splice(index + 1, 0, rowData);
      setData(newData);
      successToast("Row added successfully");
     },
    });
   } else if (operation === "delete") {
    const index = params as number;
    if (data.length <= 1) return;
    setRowIndex(index);
    deleteRowMutate(null, {
     onSuccess: () => {
      setData((prev) => prev.filter((_, i) => i !== index));
      successToast("Row deleted successfully");
     },
     onError: () => {
      errorToast("Failed to delete row");
     },
    });
   } else if (operation === "move") {
    const { sourceIndex, targetIndex } = params as {
     sourceIndex: number;
     targetIndex: number;
    };
    const payload = {
     spreadsheetId: Number(sheetId),
     sourceIndex,
     targetIndex,
    };
    moveRowMutate(payload, {
     onSuccess: () => {
      const newData = [...data];
      const [movedItem] = newData.splice(sourceIndex, 1);
      newData.splice(targetIndex, 0, movedItem);
      setData(newData);
      successToast("Row moved successfully");
     },
     onError: () => {
      errorToast("Failed to move row");
     },
    });
   }
  } catch (err) {
   errorToast(`Failed to ${operation} row`);
  } finally {
   setIsLoading(false);
  }
 };

 // Column Operations
 const handleColumnOperation = async (
  operation: "add" | "update" | "delete" | "move",
  params: {
   index?: number;
   newName?: string;
   sourceIndex?: number;
   targetIndex?: number;
  }
 ) => {
  // Always get the latest permissions for the current sheet
  const perms = checkPermissions(sheetData);

  // SuperAdmin can do anything
  if (currentUser?.role !== "SuperAdmin") {
   if (operation === "add" && !perms.hasAddColumn) {
    errorToast("You do not have permission to add columns");
    return;
   }

   if (
    operation === "update" ||
    (operation === "move" && !perms.hasUpdateColumn)
   ) {
    errorToast("You do not have permission to update columns");
    return;
   }

   if (operation === "delete" && !perms.hasDeleteColumn) {
    errorToast("You do not have permission to delete columns");
    return;
   }
  }

  try {
   if (operation === "add") {
    const newColumnLabel = params.newName || "";
    const newColumnHeaders = [
     ...columnHeaders.slice(0, params.index),
     newColumnLabel,
     ...columnHeaders.slice(params.index),
    ];
    const newData = data.map((row) => [
     ...row.slice(0, params.index),
     "",
     ...row.slice(params.index),
    ]);

    updateColumnsMutate(
     {
      newColumnName: newColumnLabel,
      insertAtIndex: params.index,
     },
     {
      onSuccess: () => {
       setData(newData);
       setColumnHeaders(newColumnHeaders);
       successToast("Column inserted successfully");
      },
      onError: () => {
       errorToast("Failed to insert column");
      },
     }
    );
   } else if (operation === "delete") {
    if (data[0].length <= 1) return;

    const newColumnHeaders = columnHeaders.filter((_, i) => i !== params.index);
    const newData = data.map((row) => row.filter((_, i) => i !== params.index));

    updateColumnsMutate(
     {
      deleteAtIndex: params.index,
     },
     {
      onSuccess: () => {
       setData(newData);
       setColumnHeaders(newColumnHeaders);
       successToast("Column deleted successfully");
      },
      onError: () => {
       errorToast("Failed to delete column");
      },
     }
    );
   } else if (operation === "move") {
    moveColumnsMutate(
     {
      sourceIndex: params.sourceIndex,
      targetIndex: params.targetIndex,
     },
     {
      onSuccess: () => {
       successToast("Column moved successfully");
      },
      onError: () => {
       errorToast("Failed to move column");
      },
     }
    );
   } else if (operation === "update") {
    // Update column header name
    updateColumnsMutate(
     {
      newColumnName: params.newName,
      updateAtIndex: params.index,
     },
     {
      onSuccess: () => {
       const newHeaders = [...columnHeaders];
       if (params.index !== undefined && params.newName) {
        newHeaders[params.index] = params.newName;
        setColumnHeaders(newHeaders);
       }
       successToast("Column header updated successfully");
      },
      onError: () => {
       errorToast("Failed to update column header");
      },
     }
    );
   }
  } catch (err) {
   errorToast(`Failed to ${operation} column`);
   console.log(err, "EERRROR");
  }
 };

 // Cell Operations
 const handleCellEdit = async (row: number, col: number, value: string) => {
  if (!checkPermissions(sheetData).hasUpdateRow) {
   errorToast("You do not have permission to edit cells");
   return;
  }
  setRowIndex(row);
  setIsLoading(true);
  try {
   const updated = [...data];
   updated[row][col] = value;
   const payload = { row: updated[row] };

   updateRow(payload, {
    onSuccess: () => {
     setData(updated);
     successToast("Cell updated successfully");
    },
    onError: () => {
     setData(data);
     errorToast("Failed to update cell");
    },
   });
  } catch (err) {
   errorToast("Failed to update cell");
  } finally {
   setIsLoading(false);
  }
 };

 // Header Operations
 const handleHeaderEdit = async (index: number, newName: string) => {
  if (!checkPermissions(sheetData).hasUpdateColumn) {
   errorToast("You do not have permission to edit headers");
   return;
  }
  setIsLoading(true);
  try {
   // Call handleColumnOperation without await since it uses mutation callbacks
   handleColumnOperation("update", { index, newName });
  } catch (err) {
   errorToast("Failed to update header");
  } finally {
   setIsLoading(false);
  }
 };

 // Share Operations
 const handleShare = async (payload: {
  users: { userId: number; role: string }[];
  permissions: string[];
 }) => {
  setIsLoading(true);
  try {
   updateSheet(payload, {
    onSuccess: () => {
     successToast("Sheet shared successfully");
     setIsShareModalOpen(false);
     router.push("/sheet");
    },
    onError: () => {
     errorToast("Failed to share sheet");
    },
   });
  } catch (err) {
   errorToast("Failed to share sheet");
  } finally {
   setIsLoading(false);
  }
 };

 // Export Operations
 const exportToCSV = () => {
  const csvContent = [
   columnHeaders.join(","),
   ...data.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${spreadsheetName || "sheet"}.csv`;
  link.click();
 };

 const getColumnLabel = (index: number): string => {
  let label = "";
  while (index >= 0) {
   label = String.fromCharCode((index % 26) + 65) + label;
   index = Math.floor(index / 26) - 1;
  }
  return label;
 };

 const handleCellClick = (row: number, col: number) => {
  if (!checkPermissions(sheetData).hasUpdateRow) {
   errorToast("You do not have permission to edit this sheet");
   return;
  }
  setEditingCell({ row, col });
  const cellValue = data[row][col];
  // Convert CellValue to string for editing
  const stringValue = typeof cellValue === 'string' ? cellValue : 
                     (typeof cellValue === 'object' && cellValue ? 
                      (cellValue.fileUrl || cellValue.type || JSON.stringify(cellValue)) : '');
  setTempValue(stringValue || "");
 };

 // Change saveCell to accept value and check if it changed
 const saveCell = async (row: number, col: number, value: string) => {
  // Get the original value from the data
  const originalValue = data[row][col] || "";

  // Convert original value to string for comparison
  const originalString = typeof originalValue === 'string' ? originalValue : 
                        (typeof originalValue === 'object' && originalValue ? 
                         (originalValue.fileUrl || originalValue.type || JSON.stringify(originalValue)) : '');

  // Only proceed if the value has actually changed
  if (originalString === value) {
   // No change, just close the editing state
   setEditingCell(null);
   return;
  }

  try {
   await handleCellEdit(row, col, value);
   setEditingCell(null);
  } catch (err) {
   errorToast("Failed to update cell");
  }
 };

 const handleHeaderClick = (colIndex: number) => {
  if (!checkPermissions(sheetData).hasUpdateColumn) {
   errorToast("You do not have permission to edit column headers");
   return;
  }
  setEditingHeader(colIndex);
  setTempHeader(columnHeaders[colIndex]);
 };

 const saveHeader = async (colIndex: number) => {
  // Get the original header value
  const originalHeader = columnHeaders[colIndex];

  // Only proceed if the header has actually changed
  if (originalHeader === tempHeader) {
   // No change, just close the editing state
   setEditingHeader(null);
   return;
  }

  try {
   await handleHeaderEdit(colIndex, tempHeader);
   setEditingHeader(null);
  } catch (err) {
   errorToast("Failed to update header");
  }
 };

 const handleAttachDropDown = (
  columnName: string,
  ValueID?: number,
  operation?: "attach" | "remove"
 ) => {
  if (operation === "attach") {
   attachDropDown(
    { valueSetId: ValueID, columnName },
    {
     onSuccess: () => {
      // Update local columnTypes state
      setColumnTypes((prev) => ({
       ...prev,
       [columnName]: "select",
      }));
      successToast("Dropdown attached successfully");
     },
     onError: () => {
      errorToast("Failed to attach dropdown");
     },
    }
   );
  } else if (operation === "remove") {
   removeDropDown(
    { columnName },
    {
     onSuccess: () => {
      // Remove from local columnTypes state
      setColumnTypes((prev) => {
       const newTypes = { ...prev };
       delete newTypes[columnName];
       return newTypes;
      });
      successToast("Dropdown removed successfully");
     },
     onError: () => {
      errorToast("Failed to remove dropdown");
     },
    }
   );
  }
 };

 const handleCellClickWithScroll = (row: number, col: number) => {
  if (tableContainerRef.current) {
   lastScrollTop.current = tableContainerRef.current.scrollTop;
  }
  handleCellClick(row, col);
  setPendingScrollRestore(true);
 };

 const handleAttachFile = (
  columnName: string,
  operation?: "attach" | "remove"
 ) => {
  if (operation === "attach") {
   attachFile(
    { columnName, fileType: "file", action: operation },
    {
     onSuccess: () => {
      // Update local columnTypes state
      setColumnTypes((prev) => ({
       ...prev,
       [columnName]: "file",
      }));
      successToast("File type attached successfully");
     },
     onError: () => {
      errorToast("Failed to attach file type");
     },
    }
   );
  } else if (operation === "remove") {
   attachFile(
    { columnName, action: operation },
    {
     onSuccess: () => {
      // Remove from local columnTypes state
      setColumnTypes((prev) => {
       const newTypes = { ...prev };
       delete newTypes[columnName];
       return newTypes;
      });
      successToast("File type removed successfully");
     },
     onError: () => {
      errorToast("Failed to remove file type");
     },
    }
   );
  }
 };

 const handleImageUpload = async (file: File, type: string) => {
  if (!imageModal) return;
  
  try {
   const formData = new FormData();
   formData.append('columnIndex', imageModal.colIndex.toString());
   formData.append('file', file);
   formData.append('fileType', type);
   formData.append('position', imageModal.rowIndex.toString());

   FileMutate(formData, {
    onSuccess: () => {
     successToast('File uploaded successfully');
     setImageModal(null);
    },
    onError: () => {
     errorToast('Failed to upload file');
    }
   });
  } catch (error) {
   console.error('Error uploading file:', error);
   errorToast('Failed to upload file');
  }
 };




 
 return {
  // State
  data,
  columnHeaders,
  spreadsheetName,
  users: usersData?.users || [],
  isLoading,
  error,
  editingCell,
  tempValue,
  editingHeader,
  tempHeader,
  valueSets,
  dropdownColumns,
  columnTypes,
  contextMenu,
  isShareModalOpen,
  selectedUser,
  imageModal,
  setImageModal,
  setEditingHeader,
  setTempHeader,
  setEditingCell,
  setTempValue,
  setContextMenu,
  setIsShareModalOpen,
  setSelectedUser,
  setColumnHeaders,
  setData,
  refetchData,
  handleAttachFile,
  handleImageUpload,
  // Permission flags (granular)
  hasAddColumn: checkPermissions(sheetData).hasAddColumn,
  hasDeleteColumn: checkPermissions(sheetData).hasDeleteColumn,
  hasUpdateColumn: checkPermissions(sheetData).hasUpdateColumn,
  hasAddRow: checkPermissions(sheetData).hasAddRow,
  hasDeleteRow: checkPermissions(sheetData).hasDeleteRow,
  hasUpdateRow: checkPermissions(sheetData).hasUpdateRow,

  // Operations
  handleCellEdit,
  handleHeaderEdit,
  handleRowOperation,
  handleColumnOperation,
  handleShare,
  exportToCSV,
  handleCellClickWithScroll,
  saveCell,
  handleHeaderClick,
  saveHeader,
  handleAttachDropDown,
  // Helpers
  getColumnLabel,
 };
};
