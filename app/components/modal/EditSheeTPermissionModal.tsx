import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet } from "lucide-react";

// Define permission labels for sheet access
const PERMISSION_LABELS: { [key: string]: string } = {
 addColumn: "Add Column",
 deleteColumn: "Delete Column", 
 updateColumn: "Update Column and Row Ordering ",
 addRow: "Add Row",
 deleteRow: "Delete Row",
 updateRow: "Update Data",
};

// Define types for sheet data
interface Sheet {
 sheetId: number;
 sheetName: string;
 permissions: string[];
}

// Define props for the modal component
interface EditSheetPermissionModalProps {
 isOpen: boolean;
 onClose: () => void;
 onUpdate: (payload: { sheetId: number; permissions: string[] }) => void;
 userData: {
  sheets: Sheet[];
 };
 handleRemoveAccess: (sheetId: number) => void;
}

const EditSheetPermissionModal: React.FC<EditSheetPermissionModalProps> = ({
 isOpen,
 onClose,
 onUpdate,
 userData,
 handleRemoveAccess
}) => {
 // State for tracking selected sheet and its permissions
 const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
 const [permissions, setPermissions] = useState<string[]>([]);

 console.log(selectedSheet,'SELECTEDSHEET')

 // Reset state when modal closes
 useEffect(() => {
  if (!isOpen) {
   setSelectedSheet(null);
   setPermissions([]);
  }
 }, [isOpen]);

 // Update permissions when sheet selection changes
 useEffect(() => {
  if (selectedSheet && userData?.sheets) {
   const sheet = userData.sheets.find((s) => s.sheetId === selectedSheet);
   if (sheet) {
    setPermissions(sheet.permissions);
   }
  }
 }, [selectedSheet, userData?.sheets]);

 if (!isOpen) return null;

 // Handle sheet selection from dropdown
 const handleSheetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const sheetId = parseInt(e.target.value);
  setSelectedSheet(sheetId);
 };

 // Toggle individual permissions
 const handlePermissionToggle = (perm: string) => {
  setPermissions((prev) =>
   prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
  );
 };

 // Save updated permissions
 const handleUpdate = () => {
  if (selectedSheet) {
   onUpdate({
    sheetId: selectedSheet,
    permissions
   });
   onClose();
  }
 };

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
   <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
     <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
       <FileSpreadsheet className="w-5 h-5 text-white" />
      </div>
      <div>
       <h2 className="text-xl font-semibold text-gray-900">
        Edit Sheet Permissions
       </h2>
       <p className="text-sm text-gray-600">Manage sheet access permissions</p>
      </div>
     </div>
     <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
     {/* Sheet Selection Dropdown */}
     <div className="mb-6">
      <label
       htmlFor="sheet"
       className="block text-sm font-medium text-gray-700 mb-2"
      >
       Select Sheet
      </label>
      <select
       id="sheet"
       value={selectedSheet || ""}
       onChange={handleSheetSelect}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
       <option value="">Select a sheet</option>
       {userData?.sheets?.map((sheet) => (
        <option key={sheet.sheetId} value={sheet.sheetId}>
         {sheet.sheetName}
        </option>
       ))}
      </select>
     </div>

     {/* Permission Checkboxes */}
     {selectedSheet && (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
       <h3 className="font-medium text-gray-900">Permissions</h3>
       <div className="grid grid-cols-2 gap-4">
        {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
         <div key={perm} className="flex items-center">
          <input
           type="checkbox"
           checked={permissions.includes(perm)}
           onChange={() => handlePermissionToggle(perm)}
           className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <span className="ml-3">{label}</span>
         </div>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Footer with Action Buttons */}
    <div className="p-6 border-t border-gray-200 bg-gray-50">
     <div className="flex items-center justify-end space-x-3">
      <button
       onClick={onClose}
       className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
       Cancel
      </button>
      {selectedSheet && (
       <button
        onClick={() => handleRemoveAccess(selectedSheet)}
        className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200"
       >
        Remove Access
       </button>
      )}
      <button
       onClick={handleUpdate}
       disabled={!selectedSheet}
       className="px-6 py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
       Update Permissions
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default EditSheetPermissionModal;
