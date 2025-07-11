export interface KeyValue {
    id: string;
    name: string;
    values: string[];
}

// Type for cell values that can be strings or objects
export type CellValue = string | {
  type?: string;
  fileUrl?: string;
  name?: string;
  [key: string]: any;
};

export interface BackendSpreadsheetData {
  columns: string[];
  columnsMeta?: {
    [columnName: string]: {
      fileType?: string;
      type?: string;
    };
  };
  sheetData: {
    position: number;
    row: CellValue[];
  }[];
}


export interface SheetData {
  id: number;
  spreadsheetId: number;
  position: number;
  row: CellValue[];
  createdAt: string;
  updatedAt: string;
}


 export type ContextMenuTarget = {
  row: number;
  col: number;
  x: number;
  y: number;
};


export interface UserSheet {
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
export interface Sheet {
  id: number;
  name: string;
  columns: string[];
  columnsMeta?: {
    [columnName: string]: {
      fileType?: string;
      type?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  sheetData: SheetData[];
  userSheets: UserSheet[];
  columnDropdowns?: any[];
}

export interface KeyValueCardProps {
  keyValue: KeyValue;
  onEdit: (keyValue: KeyValue) => void;
  onDelete: (id: number) => void;
}


export interface SheetPermission {
  action: 'create' | 'read' | 'update' | 'delete' | 'addColumn' | 'updateColumnHeader';
  subject: 'Sheet';
}

export interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface ApiError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}



export interface Permission {
  id: number;
  userId: number;
  permissionId: number;
  permission: {
   id: number;
   action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "addColumn"
    | "updateColumnHeader";
   subject: "Sheet";
  };
 }
 
export interface User {
  id: number;
  name: string;
  email: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
 }
 
export interface DeleteModalState {
  isShow: boolean;
  userId: number | null;
  userName: string;
 }

 export interface AuthGuardProps {
   children: React.ReactNode;
   requireAuth?: boolean; 
   redirectTo?: string;
 }

 export interface CellOptionsProps {
  position: { top: number; left: number } | null;
  onClose: () => void;
}

export interface ContextMenuProps {
  contextMenu: {
    x: number;
    y: number;
    row: number;
    col: number;
  } | null;
  setContextMenu: (value: null) => void;
  handleRowOperation: (operation: "add" | "delete" | "move", params: number | { sourceIndex: number; targetIndex: number }) => void;
  handleColumnOperation: (operation: "add" | "update" | "delete" | "move", params: { index?: number; newName?: string; sourceIndex?: number; targetIndex?: number }) => void;
  columnHeaders: string[];
  getColumnLabel: (index: number) => string;
  hasAddColumn: boolean;
  hasDeleteColumn: boolean;
  hasUpdateColumn: boolean;
  hasAddRow: boolean;
  hasDeleteRow: boolean;
  hasUpdateRow: boolean;
}

export interface HeaderProps {
  title?: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}


export interface UserTableProps {
  filteredUsers: User[];
  handleEdit: (userId: number) => void;
  handleDelete: (userId: number, userName: string) => void;
  isDeleting: boolean;
  setSheetModal: (value: { state: boolean; selectedUser: User | null }) => void;
  formatDate: (date: string) => string;

}

export interface SheetModalState {
  state: boolean;
  selectedUser: User | null;
 }
 
export interface DeleteModalProps {
  isShow: boolean;
  setIsShow: (show: boolean) => void;
  title: string;
  description: string;
  agreeFunction: () => void;
}

export interface PostResponse {
  data: {
    message?: string;
    error?: string;
  };
  status: 0 | 1;
}

export interface PostDataParams {
  URL: string;
  mode: 'post' | 'put' | 'patch';
  link: string;
  formData?: boolean;
  isNavigate?: boolean;
}


export interface KeyValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyValue?: KeyValue | null;
  onSave: (keyValue: Omit<KeyValue, 'id' | 'createdAt' | 'lastModified'>) => void;
}

export interface AuthContextType {
  token?: string;
  setToken: (token: string) => void;
  currentUser?: any;
  setCurrentUser: (user: any) => void;
}

export interface LoaderContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}


export interface UpdateDataParams {
  URL: string;
  link: string;
  isUpdate?: boolean;
  formData?: boolean;
}

export interface UpdateResponse {
  data: {
    message?: string;
    error?: string;
    user?: any;
  };
  status: 0 | 1;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}



export interface DeleteParams {
  URL: string; // base URL like "/sheets"
  key: (string | object | boolean)[];
  link?: string;
}

export interface DeleteResponse {
  data: {
    message?: string;
    error?: string;
  };
  status: 0 | 1;
}

export interface DeviceType {
  mobile?: boolean;
  tab?: boolean;
  monitor?: boolean;
}


export interface FetchDataParams {
  URL: string;
  key: (string | object | boolean)[];
  page?: number;
  enabled?: boolean;
}

export interface FetchResponse {
  data: any;
  isLoading: boolean;
  status?: number | null;
  refetch: () => void;
}

export interface GetByIdParams {
  URL: string;
  key: string[];
  enabled?: boolean;
}

export interface GetByIdResponse {
  data: any;
  isLoading: boolean;
}

export interface ToastHook {
  successToast: (message: string) => void;
  errorToast: (message: string) => void;
  warningToast: (message: string) => void;
}

export interface Headers {
  Authorization: string;
  Accept: string;
  "Content-Type"?: string;
  responseType?: string;
}

export interface Config {
  headers: Headers;
}



// Type definitions for your backend data
export type BackendSheetData = {
  id: number;
  spreadsheetId: number;
  position: number;
  row: CellValue[];  // Changed from data object to row array
  createdAt: string;
  updatedAt: string;
};