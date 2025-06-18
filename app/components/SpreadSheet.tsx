"use client";

import { useEffect, useState } from "react";
import useDeviceType from "../hooks/useDeviceType";
import { useParams, useRouter } from "next/navigation";
import api from '@/app/utils/api';
import useToast from '@/app/hooks/useToast';

const getColumnLabel = (index: number): string => {
  let label = "";
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
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
type BackendSpreadsheetData = {
  id: number;
  name: string;
  columns: string[];
  createdAt: string;
  updatedAt: string;
  sheetData: BackendSheetData[];
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Spreadsheet({ }) {
  const { successToast, errorToast } = useToast();
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

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const params = useParams();
  const sheetId = params?.id;

  const deviceType = useDeviceType();
  const router = useRouter();

  const fetchSpreadsheetData = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/sheets/${id}`);

      // If the sheet is empty (no columns), add default column and row
      if (!response.data.columns || response.data.columns.length === 0) {
        const updatedData = {
          ...response.data,
          columns: ["A"],
          sheetData: [
            {
              position: 0,
              data: { "A": "" }
            }
          ]
        };

        // Update the backend with default values
        await api.put(`/sheets/${id}/columns`, {
          columns: updatedData.columns
        });

        const { headers, rows } = convertBackendDataToSpreadsheet(updatedData);
        setColumnHeaders(headers);
        setData(rows);
      } else {
        const { headers, rows } = convertBackendDataToSpreadsheet(response.data);
        setColumnHeaders(headers);
        setData(rows);
      }

      setSpreadsheetName(response.data.name);
    } catch (err) {
      setError('Failed to fetch spreadsheet data');
      console.error('Error fetching spreadsheet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sheetId) {
      fetchSpreadsheetData(Number(sheetId));
    }
  }, [sheetId]);

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
    setEditingCell({ row, col });
    setTempValue(data[row][col]);
  };



  const saveCell = async (row: number, col: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const updated = [...data];
      updated[row][col] = tempValue;

      // Create the payload for updating the row
      const payload = {
        row: updated[row]
      };

      // Make API call to update the row using spreadsheetId and position
      await api.put(`/sheet-data/${sheetId}/position/${row}`, payload);

      // Update local state
      setData(updated);
      setEditingCell(null);

      // Refresh the data to ensure sync with backend
      await fetchSpreadsheetData(Number(sheetId));

    } catch (err) {
      setError('Failed to update cell');
      console.error('Error updating cell:', err);
      // Revert the changes if the API call fails
      setData(data);
    } finally {
      setIsLoading(false);
    }
  };


  const handleHeaderClick = (colIndex: number) => {
    setEditingHeader(colIndex);
    setTempHeader(columnHeaders[colIndex]);
  };

  const saveHeader = async (colIndex: number) => {
    const updated = [...columnHeaders];
    updated[colIndex] = tempHeader;

    try {
      // Update local state optimistically
      setColumnHeaders(updated);
      setEditingHeader(null);

      // Make API call to update columns
      await api.put(`/sheets/${sheetId}/columns`, {
        columns: updated
      });
    } catch (err) {
      // If API call fails, revert the changes
      setColumnHeaders(columnHeaders);
      setError('Failed to update column name');
      console.error('Error updating column:', err);
    }
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
  // Update the insertRowBelow function to use the same pattern
  const insertRowBelow = async (index: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create empty row data based on current columns
      const rowData = columnHeaders.map(() => "");

      // Create the payload for the new row
      const payload = {
        spreadsheetId: Number(sheetId),
        position: index + 1,
        row: rowData
      };

      // Make API call to create new row
      await api.post('/sheet-data', payload);

      // Update local state with the new row
      const newRow = Array(data[0].length).fill("");
      setData((prev) => [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)]);

      // Refresh the data to get the updated row
      await fetchSpreadsheetData(Number(sheetId));

    } catch (err) {
      setError('Failed to create new row');
      console.error('Error creating row:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const deleteRow = async (index: number) => {
    if (data.length <= 1) return; // Don't delete if only one row remains

    try {
      setIsLoading(true);
      setError(null);

      // Make API call to delete the row using sheetId and position
      await api.delete(`/sheet-data/${sheetId}/position/${index}`);

      // Update local state after successful deletion
      setData((prev) => prev.filter((_, i) => i !== index));

      // Refresh the data to ensure sync with backend
      await fetchSpreadsheetData(Number(sheetId));

    } catch (err) {
      setError('Failed to delete row');
      console.error('Error deleting row:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const insertColRight = async (index: number) => {
    // Get the next column label based on the current number of columns
    const newColumnLabel = getColumnLabel(columnHeaders.length);

    const newColumnHeaders = [...columnHeaders.slice(0, index + 1), newColumnLabel, ...columnHeaders.slice(index + 1)];
    const newData = data.map((row) => [...row.slice(0, index + 1), "", ...row.slice(index + 1)]);

    try {
      setIsLoading(true);
      setError(null);
      
      // First make the API call and wait for response
      const response = await api.put(`/sheets/${sheetId}/columns`, {
        columns: newColumnHeaders
      });

      // Only update frontend state if backend update was successful
      if (response.data) {
        setData(newData);
        setColumnHeaders(newColumnHeaders);
        successToast('Column inserted successfully');
      }
    } catch (err) {
      setError('Failed to insert column');
      errorToast(err.response.data.message);
      console.error('Error inserting column:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const deleteCol = async (index: number) => {
    if (data[0].length <= 1) return;

    const newColumnHeaders = columnHeaders.filter((_, i) => i !== index);
    const newData = data.map((row) => row.filter((_, i) => i !== index));

    try {
      // Update the state optimistically
      setData(newData);
      setColumnHeaders(newColumnHeaders);

      // Make the API call
      await updateColumns(newColumnHeaders);
    } catch (err) {
      // If the API call fails, revert the changes
      setData(data);
      setColumnHeaders(columnHeaders);
      console.error('Error deleting column:', err);
    }
  };


  const updateColumns = async (newColumns: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(`/sheets/${sheetId}/columns`, {
        columns: newColumns
      });

      if (response.data?.error) {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to update columns';
      setError(errorMessage);
      console.log("heloo jee")
      errorToast(errorMessage);
      console.error('Error updating columns:', err);
      // Revert the changes if the API call fails
      setColumnHeaders(columnHeaders);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.users);
    } catch (error: any) {
      if (error.response?.data?.message) {
        errorToast(error.response.data.message);
      } else {
        errorToast('Failed to fetch users');
      }
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUser) {
      errorToast('Please select a user to share with');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put(`/sheets/${sheetId}`, {
        name: spreadsheetName,
        ownerId: selectedUser
      });

      if (response.data) {
        successToast('Sheet shared successfully');
        setIsShareModalOpen(false);
        // Redirect to user list after successful share
        router.push('/sheet'); // Adjust this path according to your user list route
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to share sheet';
      errorToast(errorMessage);
      console.error('Error sharing sheet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 relative">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-xl font-semibold text-gray-800">{spreadsheetName}</h2> */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              fetchUsers();
            }}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Share
          </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  className="border border-gray-300 px-3 py-2 text-center cursor-pointer"
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
                      header || getColumnLabel(colIndex)
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



                    <div onClick={() => handleCellClick(rowIndex, colIndex)} className="min-h-[20px] ">
                      {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
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
                      ) : (
                        cell || "-"
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