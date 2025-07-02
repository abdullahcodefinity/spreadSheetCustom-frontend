import React, { useState, useEffect } from 'react';
import { X, Users, Search } from 'lucide-react';
const PERMISSION_LABELS: { [key: string]: string } = {
  addColumn: "Add Column",
  deleteColumn: "Delete Column", 
  updateColumn: "Update Column",
  addRow: "Add Row",
  deleteRow: "Delete Row",
  updateRow: "Update Row"
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (payload: {
    users: { userId: number; role: string }[];
    permissions: string[];
  }) => void;
  users: { id: number; name: string }[];
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  users
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedUsers([]);
      setPermissions([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      const exists = prev.includes(userId);
      if (exists) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handlePermissionToggle = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const handleShare = () => {
    if (selectedUsers.length > 0) {
      onShare({
        users: selectedUsers.map(userId => ({ userId, role: "EDITOR" })),
        permissions
      });
      onClose();
    }
  };

  return (
    <div style={{marginTop:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Sheet</h2>
              <p className="text-sm text-gray-600">Share and manage permissions</p>
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
          {/* Search Users */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="mb-6 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredUsers.map(user => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserSelect(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleUserSelect(user.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="ml-3">{user.name}</span>
                </div>
              );
            })}
          </div>

          {/* Permissions */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Permissions</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(PERMISSION_LABELS).map(perm => (
                <div key={perm} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm)}
                    onChange={() => handlePermissionToggle(perm)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-3">{PERMISSION_LABELS[perm]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={selectedUsers.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
