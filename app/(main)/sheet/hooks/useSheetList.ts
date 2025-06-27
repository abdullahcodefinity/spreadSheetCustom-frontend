
import { useState } from "react";
import {  Url } from "@/src/api";
import useToast from "@/app/hooks/useToast";
import useFetchData from "@/app/hooks/useFetchData";

import useDelete from "@/app/hooks/useDelete";
import useDebounce from "@/app/utils/utility";
import useAuth from "@/app/hooks/useAuth";
import usePostData from "@/app/hooks/ usePostData";
import useUpdateData from "@/app/hooks/ useUpdateData";
import { Sheet } from "@/app/types";



export const useSheetList = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [deletedId, setDeletedId] = useState<number | null>(null);
  const [isShow, setIsShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser, checkPermission } = useAuth();
  const { successToast, errorToast } = useToast();

  const debounceSearch = useDebounce(searchQuery, 1000);

  const { mutate: deleteSheet, refreshDelete } = useDelete({
    URL: Url.deleteSheet(Number(deletedId)),
    key: ["sheets"],
    link: "sheet",
  });


  const { mutate: updateSheet ,refreshUpdate} = useUpdateData({
    URL: Url.getSheet(editingId || 0),
    link: '',
    isUpdate: false,
    formData: false,
  });

  const { data: sheetsData, isLoading: isLoadingData, status } = useFetchData({
    URL: Url.getAllSheets(searchQuery),
    key: ['sheets', debounceSearch, !isAddingNew, refreshDelete, refreshUpdate],
    page: 1,
    enabled: true
  });

  const { mutate: createSheet } = usePostData({
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
      deleteSheet(null);
      setIsShow(false);
    }
  };


  const handleSave = (id: number) => {
    setError(null);
    updateSheet(
      { name: editName },
      {
        onSuccess: () => {
          successToast("Sheet name updated successfully");
          setEditingId(null);
        },
        onError: () => {
          setError('Failed to update sheet name');
          errorToast('Failed to update sheet name');
          setEditName(sheetsData?.find((sheet: Sheet) => sheet.id === id)?.name || '');
        }
      }
    );
  };

  const handleAddNewSheet = () => {
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
      };
      
      createSheet(sheetData, {
        onSuccess: () => {
          setNewSheetName("");
          setIsAddingNew(false);
          successToast("Sheet created successfully");
        },
        onError: () => {
          errorToast("Failed to create sheet");
        }
      });
    }
  };

  const permissions = {
    hasCreatePermission: checkPermission(currentUser, 'create', 'sheet'),
    hasUpdatePermission: checkPermission(currentUser, 'update', 'sheet'),
    hasDeletePermission: checkPermission(currentUser, 'delete', 'sheet')
  };

  return {
    sheets: sheetsData,
    isLoadingData,
    status,
    searchQuery,
    setSearchQuery,
    editingId,
    editName,
    setEditName,
    setEditingId,
    isAddingNew,
    setIsAddingNew,
    newSheetName,
    setNewSheetName,
    deletedId,
    setDeletedId,
    isShow,
    setIsShow,
    error,
    handleEdit,
    handleDelete,
    handleSave,
    handleAddNewSheet,
    permissions
  };
};
