"use client";

import { useEffect, useState } from "react";

import useDeviceType from "@/app/hooks/useDeviceType";
import useToast from "@/app/hooks/useToast";
import { useSheetData } from "../(main)/sheet/hooks/useSheetData";
import { useParams, useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";






export default function Spreadsheet() {


const {currentUser} = useAuth()
  const params = useParams();
  const sheetId = params?.id;
  const deviceType = useDeviceType();
  const router = useRouter();

  // Use the enhanced useSheetData hook that contains all the business logic
  const {
    data,
    columnHeaders,
    editingCell,
    tempValue,
    editingHeader,
    tempHeader,
    spreadsheetName,
    users,
    isLoading,
    canUpdateSheet,
    contextMenu,
    isShareModalOpen,
    selectedUser,

    setEditingHeader,
    setTempHeader,
    setContextMenu,
    setIsShareModalOpen,
    setSelectedUser,
    setEditingCell,
    setTempValue,
    saveCell,
    saveHeader,
    handleHeaderClick,
    handleCellClick,
    handleRowOperation,
    handleColumnOperation,
    handleShare,
    exportToCSV,

    getStatusColor,
    isStatusColumn,
    STATUS_OPTIONS,
    getColumnLabel,

  } = useSheetData(sheetId as string);

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


  console.log(currentUser, "users")


  return (
    <div className="p-6 space-y-4 py-10 relative">
      {/* Permission Status Indicator */}
      <div className="mb-4">
        {canUpdateSheet ? (
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
        <div style={{ marginTop: '0px' }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  router.push('/sheet');
                }}
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
              {columnHeaders?.map((header, colIndex) => (
                <th
                  key={colIndex}
                  onClick={() => handleHeaderClick(colIndex)}
                  className={`border border-gray-300 px-3 py-2 text-center ${canUpdateSheet ? 'cursor-pointer hover:bg-gray-200' : 'cursor-not-allowed opacity-75'
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
                        {header}
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
                    {canUpdateSheet && (
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
                      className={`min-h-[20px] ${canUpdateSheet ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-75'
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
                              if (e.key === "Enter") saveCell(rowIndex, colIndex);
                              if (e.key === "Escape") {
                                setEditingCell(null);
                                setTempValue(data[rowIndex][colIndex]);
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
                              if (e.key === "Enter") saveCell(rowIndex, colIndex);
                              if (e.key === "Escape") {
                                setEditingCell(null);
                                setTempValue(data[rowIndex][colIndex]);
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
              handleRowOperation('add', contextMenu.row);
              setContextMenu(null);
            }}
          >
            Insert Row Below
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleRowOperation('delete', contextMenu.row);
              setContextMenu(null);
            }}
          >
            Delete Row
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleColumnOperation('add', { index: contextMenu.col + 1, newName: getColumnLabel(columnHeaders.length) });
              setContextMenu(null);
            }}
          >
            Insert Column Right
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleColumnOperation('delete', { index: contextMenu.col });
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