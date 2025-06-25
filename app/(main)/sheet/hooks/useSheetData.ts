import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useToast from '@/app/hooks/useToast';
import useAuth from '@/app/hooks/useAuth';

import useDelete from '@/app/hooks/useDelete';
import usePostData from '@/app/hooks/ usePostData';
import { Url } from '@/src/api';
import useUpdateData from '@/app/hooks/ useUpdateData';
import useFetchData from '@/app/hooks/useFetchData';

interface BackendSpreadsheetData {
  columns: string[];
  sheetData: {
    position: number;
    row: string[];
  }[];
}

type ContextMenuTarget = {
  row: number;
  col: number;
  x: number;
  y: number;
};


export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

export const useSheetData = (sheetId: string | undefined) => {
  const { successToast, errorToast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();

  // State
  const [data, setData] = useState<string[][]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canUpdateColumnHeader, setCanUpdateColumnHeader] = useState(false)
  const [canAddColumn, setCanAddColumn] = useState(false)

  const [canUpdateSheet, setCanUpdateSheet] = useState(false);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [tempHeader, setTempHeader] = useState("");

  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // API Mutations
  const { mutate: postRow } = usePostData({
    URL: Url.addNewRow,
    mode: 'post',
    link: '',
    formData: false,
    isNavigate: false,
  });

  const { mutate: updateRow } = useUpdateData({
    URL: Url.updateRow(Number(sheetId), rowIndex),
    link: '',
    formData: false,
  });

  const { mutate: moveRowMutate } = useUpdateData({
    URL: Url.moveRow(Number(sheetId)),
    link: '',
    formData: false,
  });

  const { mutate: deleteRowMutate } = useDelete({
    URL: Url.deleteRow(Number(sheetId), rowIndex),
    key: ['sheet'],
    link: '',
  });

  const { mutate: updateColumnsMutate } = useUpdateData({
    URL: Url.updateColumns(Number(sheetId)),
    link: '',
    isUpdate: false,
    formData: false,
  });

  const { mutate: moveColumnsMutate } = useUpdateData({
    URL: Url.moveColumns(Number(sheetId)),
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


  // Convert backend data to spreadsheet format
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

  // Fetch initial sheet data
  const { data: sheetData, isLoading: isSheetLoading } = useFetchData({
    URL: Url.getSheet(Number(sheetId)),
    key: ['sheet'],
    enabled: !!sheetId
  });


  // Fetch initial users 
  const { data: usersData, isLoading: isUsersLoading } = useFetchData({
    URL: Url.getAllUsers(),
    key: ['users'],
    enabled: !!sheetId
  });

  useEffect(() => {
    if (sheetData) {
      const { headers, rows } = convertBackendDataToSpreadsheet(sheetData);
      setData(rows);
      setColumnHeaders(headers);
      setSpreadsheetName(sheetData.name);
      setCanUpdateSheet(checkPermissions(sheetData).hasUpdatePermission);
      setCanUpdateColumnHeader(checkPermissions(sheetData).hasUpdateColumnPermission);
      setCanAddColumn(checkPermissions(sheetData).hasAddColumnPermission)

    }
  }, [sheetData]);

  useEffect(() => {
    setIsLoading(isSheetLoading || isUsersLoading);
  }, [isSheetLoading, isUsersLoading]);




  // Permission Handlers
  const checkPermissions = (sheetData: any): { isOwner: boolean; hasUpdatePermission: boolean; hasUpdateColumnPermission: boolean; hasAddColumnPermission: boolean } => {
    if (!currentUser) return {
      isOwner: false,
      hasUpdatePermission: false,
      hasUpdateColumnPermission: false,
      hasAddColumnPermission: false
    };

    if (currentUser.role === 'SuperAdmin') return {
      isOwner: true,
      hasUpdatePermission: true,
      hasUpdateColumnPermission: true,
      hasAddColumnPermission: true
    };

    const isOwner = sheetData.userSheets?.some(
      (userSheet: any) => userSheet.userId === currentUser.id && userSheet.role === 'owner'
    );

    const hasUpdatePermission = currentUser.permissions?.some(
      (permission: any) => permission.action.toLowerCase() === 'update' && permission.subject.toLowerCase() === 'sheet'
    );

    const hasUpdateColumnPermission = currentUser.permissions?.some(
      (permission: any) => permission.action.toLowerCase() === 'updatecolumnheader' && permission.subject.toLowerCase() === 'sheet'
    );

    const hasAddColumnPermission = currentUser.permissions?.some(
      (permission: any) => permission.action.toLowerCase() === 'addcolumn' && permission.subject.toLowerCase() === 'sheet'
    );

    return { isOwner, hasUpdatePermission, hasUpdateColumnPermission, hasAddColumnPermission };
  };



  // Row Operations
  const handleRowOperation = async (operation: 'add' | 'delete' | 'move', params: number | { sourceIndex: number, targetIndex: number }) => {
    if (!canUpdateSheet) {
      errorToast('You do not have permission to modify this sheet');
      return;
    }
    setIsLoading(true);
    try {
      if (operation === 'add') {
        const index = params as number;
        const rowData = columnHeaders.map(() => "");
        const payload = {
          spreadsheetId: Number(sheetId),
          position: index + 1,
          row: rowData
        };
        postRow(payload, {
          onSuccess: () => {
            const newData = [...data];
            newData.splice(index + 1, 0, rowData);
            setData(newData);
            successToast('Row added successfully');
          }
        });
      } else if (operation === 'delete') {
        const index = params as number;
        if (data.length <= 1) return;
        setRowIndex(index);
        deleteRowMutate(null, {
          onSuccess: () => {
            setData((prev) => prev.filter((_, i) => i !== index));
            successToast('Row deleted successfully');
          },
          onError: () => {
            errorToast('Failed to delete row');
          }
        });
      } else if (operation === 'move') {
        const { sourceIndex, targetIndex } = params as { sourceIndex: number, targetIndex: number };
        const payload = {
          spreadsheetId: Number(sheetId),
          sourceIndex,
          targetIndex
        };
        moveRowMutate(payload, {
          onSuccess: () => {
            const newData = [...data];
            const [movedItem] = newData.splice(sourceIndex, 1);
            newData.splice(targetIndex, 0, movedItem);
            setData(newData);
            successToast('Row moved successfully');
          },
          onError: () => {
            errorToast('Failed to move row');
          }
        });
      }
    } catch (err) {
      errorToast(`Failed to ${operation} row`);
    } finally {
      setIsLoading(false);
    }
  };

  // Column Operations
  const handleColumnOperation = async (operation: 'add' | 'update' | 'delete' | 'move', params: {
    index?: number,
    newName?: string,
    sourceIndex?: number,
    targetIndex?: number
  }) => {

    console.log({ canAddColumn, canUpdateColumnHeader, canUpdateSheet }, 'kaka')
    if (!canUpdateSheet) {
      errorToast('You do not have permission to modify columns');
      return;
    }
  
    if (!canAddColumn && operation === 'add') {
      errorToast('You do not have permission to add columns');
      return;
    }

    try {
      if (operation === 'add') {
        const newColumnLabel = params.newName || '';
        const newColumnHeaders = [...columnHeaders.slice(0, params.index), newColumnLabel, ...columnHeaders.slice(params.index)];
        const newData = data.map((row) => [...row.slice(0, params.index), "", ...row.slice(params.index)]);

        updateColumnsMutate({
          newColumnName: newColumnLabel,
          insertAtIndex: params.index
        }, {
          onSuccess: () => {
            setData(newData);
            setColumnHeaders(newColumnHeaders);
            successToast('Column inserted successfully');
          },
          onError: () => {
            errorToast('Failed to insert column');
          }
        });
      } else if (operation === 'delete') {
        if (data[0].length <= 1) return;

        const newColumnHeaders = columnHeaders.filter((_, i) => i !== params.index);
        const newData = data.map((row) => row.filter((_, i) => i !== params.index));

        updateColumnsMutate({
          deleteAtIndex: params.index
        }, {
          onSuccess: () => {
            setData(newData);
            setColumnHeaders(newColumnHeaders);
            successToast('Column deleted successfully');
          },
          onError: () => {
            errorToast('Failed to delete column');
          }
        });
      } else if (operation === 'move') {
        moveColumnsMutate({
          sourceIndex: params.sourceIndex,
          targetIndex: params.targetIndex
        }, {
          onSuccess: () => {
            successToast('Column moved successfully');
          },
          onError: () => {
            errorToast('Failed to move column');
          }
        });
      } else {
        updateColumnsMutate({
          newColumnName: params.newName,
          updateAtIndex: params.index
        }, {
          onSuccess: () => {
            const newHeaders = [...columnHeaders];
            if (params.index !== undefined && params.newName) {
              newHeaders[params.index] = params.newName;
              setColumnHeaders(newHeaders);
            }
            successToast(`Column ${operation}d successfully`);
          },
          onError: () => {
            errorToast(`Failed to ${operation} column`);
          }
        });
      }
    } catch (err) {
      errorToast(`Failed to ${operation} column`);
      console.log(err, 'EERRROR')
    }
  };

  // Cell Operations
  const handleCellEdit = async (row: number, col: number, value: string) => {
    if (!canUpdateSheet) {
      errorToast('You do not have permission to edit cells');
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
          successToast('Cell updated successfully');
        },
        onError: () => {
          setData(data);
          errorToast('Failed to update cell');
        }
      });
    } catch (err) {
      errorToast('Failed to update cell');
    } finally {
      setIsLoading(false);
    }
  };

  // Header Operations
  const handleHeaderEdit = async (index: number, newName: string) => {
    if (!canUpdateSheet) {
      errorToast('You do not have permission to edit headers');
      return;
    }
    if (!canUpdateColumnHeader) {
      errorToast('You do not have permission to update column headers');
      return;
    }


    setIsLoading(true);
    try {
      await handleColumnOperation('update', { index, newName });
      const newHeaders = [...columnHeaders];
      newHeaders[index] = newName;
      setColumnHeaders(newHeaders);
      successToast('Header updated successfully');
    } catch (err) {
      errorToast('Failed to update header');
    } finally {
      setIsLoading(false);
    }
  };

  // Share Operations
  const handleShare = async (userId: number | null) => {
    if (!canUpdateSheet) {
      errorToast('You do not have permission to share this sheet');
      return;
    }

    if (!userId) {
      errorToast('Please select a user to share with');
      return;
    }

    setIsLoading(true);
    try {
      const payload = { name: spreadsheetName, ownerId: userId };
      updateSheet(payload, {
        onSuccess: () => {
          successToast('Sheet shared successfully');
          setIsShareModalOpen(false);
          router.push('/sheet');
        },
        onError: () => {
          errorToast('Failed to share sheet');
        }
      });
    } catch (err) {
      errorToast('Failed to share sheet');
    } finally {
      setIsLoading(false);
    }
  };

  // Export Operations
  const exportToCSV = () => {
    const csvContent = [
      columnHeaders.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${spreadsheetName || 'sheet'}.csv`;
    link.click();
  };

  // Status Column Helpers
  const isStatusColumn = (header: string): boolean => {
    return header.toLowerCase().includes('status');
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
    if (!canUpdateSheet) {
      errorToast('You do not have permission to edit this sheet');
      return;
    }
    setEditingCell({ row, col });
    setTempValue(data[row][col] || "");
  };

  const saveCell = async (row: number, col: number) => {
    try {
      await handleCellEdit(row, col, tempValue);
      setEditingCell(null);
    } catch (err) {
      errorToast('Failed to update cell');
    }
  };


  const handleHeaderClick = (colIndex: number) => {
    if (!canUpdateSheet) {
      errorToast('You do not have permission to edit column headers');
      return;
    }
    if (!canUpdateColumnHeader) {
      errorToast('You do not have permission to update column headers');
      return;
    }
    setEditingHeader(colIndex);
    setTempHeader(columnHeaders[colIndex]);
  };


  const saveHeader = async (colIndex: number) => {
    try {
      await handleHeaderEdit(colIndex, tempHeader);
      setEditingHeader(null);
    } catch (err) {
      errorToast('Failed to update header');
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
    canUpdateSheet,
    editingCell,
    tempValue,
    editingHeader,
    tempHeader,
    setEditingHeader,
    setTempHeader,
    setEditingCell,
    setTempValue,
    contextMenu,
    isShareModalOpen,
    selectedUser,
    setContextMenu,
    setIsShareModalOpen,
    setSelectedUser,
    setColumnHeaders,
    setData,

    // Operations
    handleCellEdit,
    handleHeaderEdit,
    handleRowOperation,
    handleColumnOperation,
    handleShare,
    exportToCSV,
    handleCellClick,
    saveCell,
    handleHeaderClick,
    saveHeader,


    // Helpers
    isStatusColumn,
    getStatusColor,
    getColumnLabel,
    STATUS_OPTIONS
  };
};