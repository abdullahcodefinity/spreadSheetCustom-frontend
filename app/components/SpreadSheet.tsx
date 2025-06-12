"use client";

import { useEffect, useState } from "react";

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

export default function Spreadsheet() {
  const [data, setData] = useState<string[][]>(
    Array.from({ length: 10 }, () => Array(8).fill(""))
  );

  const [columnHeaders, setColumnHeaders] = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => getColumnLabel(i))
  );

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [tempHeader, setTempHeader] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

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
    const updated = [...data];
    updated[row][col] = tempValue;
    setData(updated);
    setEditingCell(null);
  };

  const handleHeaderClick = (colIndex: number) => {
    setEditingHeader(colIndex);
    setTempHeader(columnHeaders[colIndex]);
  };

  const saveHeader = (colIndex: number) => {
    const updated = [...columnHeaders];
    updated[colIndex] = tempHeader;
    setColumnHeaders(updated);
    setEditingHeader(null);
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
    link.setAttribute("download", "spreadsheet.csv");
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

  const insertColRight = (index: number) => {
    setData((prev) => prev.map((row) => [...row.slice(0, index + 1), "", ...row.slice(index + 1)]));
    setColumnHeaders((prev) => [...prev.slice(0, index + 1), "", ...prev.slice(index + 1)]);
  };

  const deleteCol = (index: number) => {
    if (data[0].length <= 1) return;
    setData((prev) => prev.map((row) => row.filter((_, i) => i !== index)));
    setColumnHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-4 relative">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Export CSV
        </button>
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
                  {editingHeader === colIndex ? (
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
                  <td key={colIndex} className="border border-gray-300 px-3 py-2 relative group">
                    <button
                      className="absolute top-1 right-1 hidden group-hover:inline-block text-gray-500 hover:text-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          row: rowIndex,
                          col: colIndex,
                          x: e.currentTarget.getBoundingClientRect().left,
                          y: e.currentTarget.getBoundingClientRect().bottom + window.scrollY,
                        });
                      }}
                    >
                      ⋮
                    </button>

                    <div onClick={() => handleCellClick(rowIndex, colIndex)} className="min-h-[20px]">
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