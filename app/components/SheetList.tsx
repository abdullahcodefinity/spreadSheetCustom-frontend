"use client"

import Link from "next/link";
import { useState, useEffect } from "react";

import useToast from '@/app/hooks/useToast';

import useFetchData from "../hooks/useFetchData";
import { Url, Network } from "@/src/api";
import useDebounce from "../utils/utility";
import usePostData from "../hooks/ usePostData";
import useDelete from "../hooks/useDelete";
import { DeleteModal } from "./modal/DeleteModal";


interface SheetData {
  id: number;
  spreadsheetId: number;
  position: number;
  row: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserSheet {
  id: number;
  userId: number;
  sheetId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface Sheet {
  id: number;
  name: string;
  columns: string[];
  createdAt: string;
  updatedAt: string;
  sheetData: SheetData[];
  userSheets: UserSheet[];
}

export default function SheetList() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [deletedId, setDeletedId] = useState<number | null>(null);
  const [isShow, setIsShow] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const { successToast, errorToast } = useToast();

  const debounceSearch = useDebounce(searchQuery, 1000);

  const { mutate: deleteSheet, refreshDelete } = useDelete({
    URL: '/sheets',
    key: ["sheets"],
    link: "sheet",
  });

  const { data: sheetsData, isLoading: isLoadingData, status } = useFetchData({
    URL: Url.getAllSheets(searchQuery),
    key: ['sheets', debounceSearch, !isAddingNew, refreshDelete],
    page: 1,
    enabled: true
  });



  // Create sheet using usePostData hook
  const { mutate } = usePostData({
    URL: Url.createSheet,
    mode: 'post',
    link: 'sheet',
    formData: false
  });

  const handleEdit = (sheet: Sheet) => {
    setEditingId(sheet.id);
    setEditName(sheet.name);
  };

  const handleDelete = () => {
    if (deletedId) {
      deleteSheet(deletedId);
    }
  };

  const handleSave = async (id: number) => {
    try {
      setError(null);
      await Network.put(`/sheets/${id}`, {
        name: editName
      });
      setEditingId(null);
    } catch (err) {
      setError('Failed to update sheet name');
      console.error('Error updating sheet:', err);
      setEditName(sheets.find(sheet => sheet.id === id)?.name || '');
    }
  };

  const handleAddNewSheet = async () => {
    if (newSheetName.trim()) {
      const sheetData = {
        name: newSheetName.trim(),
        columns: ["A"],
        sheetData: [
          {
            position: 0,
            row: ["N/A"]
          }
        ]
      }
      mutate(sheetData, {
        onSuccess: () => {
          setNewSheetName("");
          setIsAddingNew(false);
        }
      });
    }
  };

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
          <p className="text-yellow-700">You do not have permission to view the sheet list.</p>
        </div>
      </div>
    );
  }

  console.log(sheetsData, ":::>")


  return (
    <>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Sheets</h1>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Sheet
          </button>
        )}
      </div>
      {!sheetsData || sheetsData.length === 0 && !isAddingNew ?
        <>
          <div className="p-4 py-10 text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-gray-700">{'No sheets found in the list'}</p>
            </div>
          </div>
        </>
        :
        <>
          <div className="p-4 py-10">
            <DeleteModal
              agreeFunction={handleDelete}
              title="Delete User?"
              description="Are you sure you want to delete User?"
              isShow={isShow}
              setIsShow={setIsShow}
            />
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
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewSheetName("");
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}


            <ul className="space-y-2">
              {sheetsData?.map((sheet: Sheet) => (
                <li key={sheet.id} className="group flex items-center bg-gray-100 hover:bg-gray-200 rounded">
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
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        className="flex-1 block p-4"
                        href={`/sheet/${sheet.id}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{sheet.name}</span>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>{sheet?.columns?.length} columns • {sheet?.sheetData?.length} rows</span>
                            {sheet?.columns?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {sheet.columns.map((column, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {column}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="hidden group-hover:flex gap-2 pr-4">
                        <button
                          onClick={() => handleEdit(sheet)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setIsShow(true);
                            setDeletedId(Number(sheet.id));
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>}
    </>
  );
}