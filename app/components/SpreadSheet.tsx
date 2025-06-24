"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import useDeviceType from "../hooks/useDeviceType";
import useToast from "../hooks/useToast";
import useFetchData from "../hooks/useFetchData";
import usePostData from "../hooks/ usePostData";
import useUpdateData from "../hooks/ useUpdateData";
import { Url } from "@/src/api";
import useDelete from "../hooks/useDelete";
import useAuth from "../hooks/useAuth";

// Status options for dropdown
const STATUS_OPTIONS = ["Approved", "Rejected", "Done"];

const getColumnLabel = (index: number): string => {
  let label = "";
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

// Helper function to check if a column is a status column
const isStatusColumn = (columnName: string): boolean => {
  return columnName.toLowerCase() === "status option";
};

// Helper function to get status color styling
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "approved":
      return "text-green-700 bg-green-50 border-green-200";
    case "rejected":
      return "text-red-700 bg-red-50 border-red-200";
    case "done":
      return "text-blue-700 bg-blue-50 border-blue-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
};

type ContextMenuTarget = {
  row: number;
  col: number;
  x: number;
  y: number;
};

// Type definitions for your backend data
type BackendSheetData = {
  id: number;
  spreadsheetId: number;
  position: number;
  row: string[];  // Changed from data object to row array
  createdAt: string;
  updatedAt: string;
};

type UserSheet = {
  id: number;
  userId: number;
  sheetId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type BackendSpreadsheetData = {
  id: number;
  name: string;
  columns: string[];
  createdAt: string;
  updatedAt: string;
  sheetData: BackendSheetData[];
  userSheets?: UserSheet[];
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Spreadsheet({ }) {
  const { successToast, errorToast } = useToast();
  const { currentUser } = useAuth();
  const [data, setData] = useState<string[][]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState<string>("");

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [tempHeader, setTempHeader] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowIndex, setRowIndex] = useState<number>(0);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const params = useParams();
  const sheetId = params?.id;

  const deviceType = useDeviceType();
  const router = useRouter();

  // Post new row
  const { mutate: postRow, refresh } = usePostData({
    URL: Url.addNewRow,
    mode: 'post',
    link: '',
    formData: false,
    isNavigate: false,
  });

  // Update row/cell
  const { mutate: updateRow } = useUpdateData({
    URL: Url.updateRow(Number(sheetId), rowIndex),
    link: '',
    isUpdate: false,
    formData: false,
  });

  // Delete row
  const { mutate: deleteRowMutate } = useDelete({
    URL: Url.deleteRow(Number(sheetId), rowIndex),
    key: ['sheet'],
    link: '',
  });

  // Update columns
  const { mutate: updateColumnsMutate } = useUpdateData({
    URL: Url.updateColumns(Number(sheetId)),
    link: '',
    isUpdate: false,
    formData: false,
  });

  // Update sheet (for sharing)
  const { mutate: updateSheet } = useUpdateData({
    URL: Url.shareSheet(Number(sheetId)),
    link: '',
    isUpdate: false,
    formData: false,
  });

  // Fetch users for sharing
  const { data: usersData } = useFetchData({
    URL: Url.getAllUsers(null),
    key: ['users'],
    enabled: isShareModalOpen,
  });

  // Fetch spreadsheet data using useFetchData
  const { data: fetchedSheet } = useFetchData({
    URL: Url.getSheet(Number(sheetId)),
    key: ["sheet", sheetId ?? "", refresh],
    enabled: !!sheetId,
  });

  // Sync fetched data to local state
  useEffect(() => {
    if (fetchedSheet) {
      const { headers, rows } = convertBackendDataToSpreadsheet(fetchedSheet);
      setColumnHeaders(headers);
      setData(rows);
      setSpreadsheetName(fetchedSheet.name);
    }
  }, [fetchedSheet]);

  // Function to convert backend data to spreadsheet format
  const convertBackendDataToSpreadsheet = (backendData: BackendSpreadsheetData) => {
    const headers = backendData.columns;

    const rows: string[][] = [];

    // Sort sheetData by position to maintain correct order
    const sortedSheetData = [...backendData.sheetData].sort((a, b) => a.position - b.position);

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
    rows.forEach(row => {
      while (row.length < headers.length) {
        row.push("-");
      }
    });

    return { headers, rows };
  };

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

  // Update the handleCellClick function to handle cell editing
  const handleCellClick = (row: number, col: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to edit this sheet');
      return;
    }
    setEditingCell({ row, col });
    // Set default value for empty status cells
    const currentValue = data[row][col];
    if (isStatusColumn(columnHeaders[col]) && (!currentValue || currentValue === "-")) {
      setTempValue("");
    } else {
      setTempValue(currentValue);
    }
  };

  // Update the saveCell function to use updateRow
  const saveCell = async (row: number, col: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to update this sheet');
      return;
    }

    // Validate status values for status columns
    if (isStatusColumn(columnHeaders[col]) && tempValue && !STATUS_OPTIONS.includes(tempValue)) {
      errorToast('Please select a valid status option: Approved, Rejected, or Done');
      return;
    }

    setRowIndex(row);
    const updated = [...data];
    updated[row][col] = tempValue;
    const payload = { row: updated[row] };
    updateRow(payload, {
      onSuccess: () => {
        setData(updated);
        setEditingCell(null);
      },
      onError: () => {
        setData(data);
      },
    });
  };

  const handleHeaderClick = (colIndex: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to edit column headers');
      return;
    }
    setEditingHeader(colIndex);
    setTempHeader(columnHeaders[colIndex]);
  };

  // Update the saveHeader function to use updateColumnsMutate
  const saveHeader = async (colIndex: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to update column headers');
      return;
    }
    const updated = [...columnHeaders];
    updated[colIndex] = tempHeader;
    setColumnHeaders(updated);
    setEditingHeader(null);
    updateColumnsMutate({ newColumnName: tempHeader, updateAtIndex: colIndex });
  };

  const exportCSV = () => {
    const csvContent = [
      ["", ...columnHeaders],
      ...data.map((row, rowIndex) => [rowIndex + 1, ...row]),
    ]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${spreadsheetName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update the insertRowBelow function to use postRow
  const insertRowBelow = async (index: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to add rows to this sheet');
      return;
    }
    const rowData = columnHeaders.map(() => "");
    const payload = {
      spreadsheetId: Number(sheetId),
      position: index + 1,
      row: rowData,
    };
    postRow(payload, {
      onSuccess: () => { },
    });
  };

  const deleteRow = async (index: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to delete rows from this sheet');
      return;
    }
    setRowIndex(index)
    console.log({ index }), '>>>:::::';
    if (data.length <= 1) return; // Don't delete if only one row remains

    deleteRowMutate(null, {
      onSuccess: () => {
        setData((prev) => prev.filter((_, i) => i !== index));
        successToast('Row deleted successfully');
      },
      onError: () => {
        errorToast('Failed to delete row');
      }
    });
  };

  // Update the insertColRight function to use updateColumnsMutate
  const insertColRight = async (index: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to add columns to this sheet');
      return;
    }
    try {
      const newColumnLabel = getColumnLabel(columnHeaders.length);
      const newColumnHeaders = [...columnHeaders.slice(0, index + 1), newColumnLabel, ...columnHeaders.slice(index + 1)];
      const newData = data.map((row) => [...row.slice(0, index + 1), "", ...row.slice(index + 1)]);

      await updateColumnsMutate({ newColumnName: newColumnLabel, insertAtIndex: index + 1 }, {
        onSuccess: () => {
          setData(newData);
          setColumnHeaders(newColumnHeaders);
          successToast('Column inserted successfully');
        },
        onError: () => {
          errorToast('Failed to insert column');
        }
      });
    } catch (err) {
      console.error('Error inserting column:', err);
      errorToast('Failed to insert column');
    }
  };

  // Update the deleteCol function to use updateColumnsMutate
  const deleteCol = async (index: number) => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to delete columns from this sheet');
      return;
    }

    if (data[0].length <= 1) return;
    const newColumnHeaders = columnHeaders.filter((_, i) => i !== index);
    const newData = data.map((row) => row.filter((_, i) => i !== index));
    setData(newData);
    setColumnHeaders(newColumnHeaders);
    updateColumnsMutate({ deleteAtIndex: index });
  };

  // Update users state from usersData
  useEffect(() => {
    if (usersData && usersData.users) {
      setUsers(usersData.users);
    }
  }, [usersData]);

  // Update the handleShare function to use updateSheet
  const handleShare = async () => {
    if (!canUpdateSheet()) {
      errorToast('You do not have permission to share this sheet');
      return;
    }
    
    if (!selectedUser) {
      errorToast('Please select a user to share with');
      return;
    }
    updateSheet({ name: spreadsheetName, ownerId: selectedUser }, {
      onSuccess: () => {
        successToast('Sheet shared successfully');
        setIsShareModalOpen(false);
        router.push('/sheet');
      },
      onError: (err: unknown) => {
        errorToast('Failed to share sheet');
      },
    });
  };

  // Permission checking functions
  const checkPermission = (user: any, action: string, subject: string): boolean => {
    const hasPermission = user?.permissions?.some(
      (permission: { action: string; subject: string }) => 
        permission.action.toLowerCase() === action.toLowerCase() && 
        permission.subject.toLowerCase() === subject.toLowerCase()
    );
    return hasPermission;
  };

  const isSheetOwner = (sheetData: BackendSpreadsheetData | null): boolean => {
    if (!sheetData || !currentUser) return false;
    
    // Check if current user is the owner through userSheets
    return sheetData.userSheets?.some(userSheet => 
      userSheet.userId === currentUser.id && userSheet.role === 'owner'
    ) || false;
  };

  const canUpdateSheet = (): boolean => {
    if (!currentUser) return false;
    
    // SuperAdmin can always update
    if (currentUser.role === 'SuperAdmin') return true;
    
    // Check if user has update permission
    const hasUpdatePermission = checkPermission(currentUser, 'update', 'sheet');
    
    // Check if user is the owner of this sheet
    const isOwner = isSheetOwner(fetchedSheet);
    
    return hasUpdatePermission || isOwner;
  };

console.log(fetchedSheet,'fetchedSheet')
  return (
    <div className="p-6 space-y-4 py-10 relative">
      {/* Permission Status Indicator */}
      <div className="mb-4">
        {canUpdateSheet() ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Edit Mode - You can modify this spreadsheet</span>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 font-medium">Read-Only Mode - You can view but cannot modify this spreadsheet</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {canUpdateSheet() && (
            <button
              onClick={() => {
                if (!canUpdateSheet()) {
                  errorToast('You do not have permission to share this sheet');
                  return;
                }
                setIsShareModalOpen(true);
              }}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Share
            </button>
          )}
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div style={{ marginTop: '0px' }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
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
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
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
                onClick={handleShare}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-auto">
        <table className="min-w-full border border-gray-300 text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-center">#</th>
              {columnHeaders.map((header, colIndex) => (
                <th
                  key={colIndex}
                  onClick={() => handleHeaderClick(colIndex)}
                  className={`border border-gray-300 px-3 py-2 text-center ${
                    canUpdateSheet() ? 'cursor-pointer hover:bg-gray-200' : 'cursor-not-allowed opacity-75'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  ) : (
                    editingHeader === colIndex ? (
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
                        {header || getColumnLabel(colIndex)}
                        {isStatusColumn(header) && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                              Dropdown
                            </span>
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                        {!canUpdateSheet() && (
                          <span className="text-xs text-gray-500">(Read-only)</span>
                        )}
                      </div>
                    )
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-center font-medium bg-gray-50">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 px-3 py-2 relative group min-w-[100px]">
                    {canUpdateSheet() && (
                      <button
                        className="absolute top-1 right-1 hidden group-hover:inline-block text-gray-900 hover:text-gray-800 text-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({
                            row: rowIndex,
                            col: colIndex,
                            x: deviceType.mobile ? e.currentTarget.getBoundingClientRect().left - 190 : deviceType.tab ? e.currentTarget.getBoundingClientRect().left - 360 : e.currentTarget.getBoundingClientRect().left - 430,
                            y: deviceType.mobile ? e.currentTarget.getBoundingClientRect().bottom + window.scrollY - 150 : e.currentTarget.getBoundingClientRect().bottom + window.scrollY - 165,
                          });
                        }}
                      >
                        ⋮
                      </button>
                    )}

                    <div 
                      onClick={() => handleCellClick(rowIndex, colIndex)} 
                      className={`min-h-[20px] ${
                        canUpdateSheet() ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-75'
                      }`}
                    >
                      {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                        isStatusColumn(columnHeaders[colIndex]) ? (
                          <select
                            value={tempValue}
                            autoFocus
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => saveCell(rowIndex, colIndex)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveCell(rowIndex, colIndex);
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                                setTempValue(data[rowIndex][colIndex]); // Reset to original value
                              }
                            }}
                            className="w-full px-2 py-1 border rounded outline-none bg-white"
                          >
                            <option value="">Select status</option>
                            {STATUS_OPTIONS.map((option) => (
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
                              if (e.key === "Enter") {
                                saveCell(rowIndex, colIndex);
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                                setTempValue(data[rowIndex][colIndex]); // Reset to original value
                              }
                            }}
                            className="w-full px-2 py-1 border rounded outline-none"
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={isStatusColumn(columnHeaders[colIndex]) && cell ? `px-2 py-1 rounded border text-xs font-medium ${getStatusColor(cell)}` : ""}>
                            {cell || "-"}
                          </span>
                          <div className="flex items-center gap-1">
                            {isStatusColumn(columnHeaders[colIndex]) && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                Status
                              </span>
                            )}
                            {!canUpdateSheet() && (
                              <span className="text-xs text-gray-500 ml-2">(Read-only)</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <ul
          className="custom-context-menu absolute z-50 bg-white border border-gray-300 rounded shadow-md text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 180 }}
        >
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              insertRowBelow(contextMenu.row);
              setContextMenu(null);
            }}
          >
            Insert Row Below
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              deleteRow(contextMenu.row);
              setContextMenu(null);
            }}
          >
            Delete Row
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              insertColRight(contextMenu.col);
              setContextMenu(null);
            }}
          >
            Insert Column Right
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              deleteCol(contextMenu.col);
              setContextMenu(null);
            }}
          >
            Delete Column
          </li>
        </ul>
      )}
    </div>
  );
}