"use client";

import { useEffect, useState } from "react";
import useDeviceType from "../hooks/useDeviceType";
import axios from "axios";
import { useParams } from "next/navigation";

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
  data: { [key: string]: string };
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

interface SpreadsheetProps {
  backendData?: BackendSpreadsheetData;
}




export default function Spreadsheet({ backendData }: SpreadsheetProps) {

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


  const params = useParams();
  const sheetId = params?.id; // This will get the ID from the URL if it exists
  



  const deviceType = useDeviceType();


  const fetchSpreadsheetData = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8000/api/sheets/${id}`);
      console.log(response.data,'LLL')
      const { headers, rows } = convertBackendDataToSpreadsheet(response.data);
      setColumnHeaders(headers);
      setData(rows);
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

    // Convert sheetData to rows
    backendData.sheetData.forEach((item) => {
      const row: string[] = [];
      headers.forEach((header) => {
        // Get value from data object, or empty string if not found
        row.push(item.data[header] || "");
      });
      rows.push(row);
    });

    // If no data, create empty rows
    if (rows.length === 0) {
      rows.push(Array(headers.length).fill(""));
    }

    return { headers, rows };
  };

  // Initialize data from backend or default
  // useEffect(() => {
  //   if (backendData) {
  //     const { headers, rows } = convertBackendDataToSpreadsheet(backendData);
  //     setColumnHeaders(headers);
  //     setData(rows);
  //     setSpreadsheetName(backendData.name);
  //   } else {
  //     // Default initialization
  //     setData(Array.from({ length: 10 }, () => Array(8).fill("")));
  //     setColumnHeaders(Array.from({ length: 8 }, (_, i) => getColumnLabel(i)));
  //     setSpreadsheetName("Untitled Spreadsheet");
  //   }
  // }, [backendData]);

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

  const handleCellClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setTempValue(data[row][col]);
  };

  const saveCell = (row: number, col: number) => {
    console.log({ row, col, tempValue }, 'LLL');
    const updated = [...data];
    updated[row][col] = tempValue;

    setData(updated);
    setEditingCell(null);

    // Here you can add logic to sync with backend
    // syncWithBackend(updated, row, col);
  };

  const handleHeaderClick = (colIndex: number) => {
    setEditingHeader(colIndex);
    setTempHeader(columnHeaders[colIndex]);
  };

  const saveHeader = async (colIndex: number) => {
    const updated = [...columnHeaders];
    updated[colIndex] = tempHeader;
    
    try {
 
      setColumnHeaders(updated);
      setEditingHeader(null);
      
  
      await updateColumns(updated);
    } catch (err) {
     
      console.error('Error saving header:', err);
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



  const insertRowBelow = (index: number) => {
    const newRow = Array(data[0].length).fill("");
    setData((prev) => [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)]);
  };

  const deleteRow = (index: number) => {
    if (data.length <= 1) return;
    setData((prev) => prev.filter((_, i) => i !== index));
  };

  const insertColRight = async (index: number) => {
    // Get the next column label based on the current number of columns
    const newColumnLabel = getColumnLabel(columnHeaders.length);
    
    const newColumnHeaders = [...columnHeaders.slice(0, index + 1), newColumnLabel, ...columnHeaders.slice(index + 1)];
    const newData = data.map((row) => [...row.slice(0, index + 1), "", ...row.slice(index + 1)]);
    
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
      console.error('Error inserting column:', err);
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

  

  // Function to convert current spreadsheet data back to backend format
  const convertToBackendFormat = (): BackendSpreadsheetData => {
    const sheetData: BackendSheetData[] = data.map((row, index) => {
      const dataObj: { [key: string]: string } = {};
      columnHeaders.forEach((header, colIndex) => {
        dataObj[header] = row[colIndex] || "";
      });

      return {
        id: index + 1,
        spreadsheetId: backendData?.id || 1,
        position: index,
        data: dataObj,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return {
      id: backendData?.id || 1,
      name: spreadsheetName,
      columns: columnHeaders,
      createdAt: backendData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetData: sheetData,
    };
  };



 const updateColumns = async (newColumns: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await axios.put(`http://localhost:8000/api/sheets/${sheetId}/columns`, {
        columns: newColumns
      });
    } catch (err) {
      setError('Failed to update columns');
      console.error('Error updating columns:', err);
      // Revert the changes if the API call fails
      setColumnHeaders(columnHeaders);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 relative">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-xl font-semibold text-gray-800">{spreadsheetName}</h2> */}
        <div className="flex flex-wrap gap-2">
          {/* <button
            onClick={saveToBackend}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Save to Backend
          </button> */}
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

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
                            if (e.key === "Enter") saveCell(rowIndex, colIndex);
                            if (e.key === "Escape") setEditingCell(null);
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