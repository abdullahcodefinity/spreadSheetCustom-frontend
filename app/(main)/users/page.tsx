"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import useToast from '@/app/hooks/useToast';
import useFetchData from '@/app/hooks/useFetchData';
import useDelete from '@/app/hooks/useDelete';
import dayjs from 'dayjs';
import { DeleteModal } from '@/app/components/modal/DeleteModal';


interface SheetPermission {
  action: 'create' | 'read' | 'update' | 'delete';
  subject: 'Sheet';
}

interface Permission {
  id: number;
  userId: number;
  permissionId: number;
  permission: {
    id: number;
    action: 'create' | 'read' | 'update' | 'delete';
    subject: 'Sheet';
  }
}

interface User {
  id: number;
  name: string;
  email: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export default function UserList() {
  const router = useRouter();
  const { successToast, errorToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [deleteModal, setDeleteModal] = useState({
    isShow: false,
    userId: null as number | null,
    userName: ''
  });

  
    // Delete user using useDelete hook
    const { mutate: deleteUser, isPending: isDeleting ,refreshDelete} = useDelete({
      URL: '/auth/users',
      key: ['users']
    });
  // Fetch users using useFetchData hook
  const { data: usersData, isLoading } = useFetchData({
    URL: '/auth/users',
    key: ['users', refreshDelete],
    enabled: true
  });


  const users = usersData?.users || [];

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter((user: User) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleEdit = (userId: number) => {
    router.push(`/users/${userId}?mode=edit`);
  };

  const handleDelete = (userId: number, userName: string) => {
    setDeleteModal({
      isShow: true,
      userId,
      userName
    });
  };

  const confirmDelete = () => {
    if (deleteModal.userId) {
      deleteUser(deleteModal.userId);
    }
  };

  const getPermissionLabel = (permission: SheetPermission) => {
    const actionMap: Record<string, string> = {
      create: 'Create',
      read: 'View',
      update: 'Update',
      delete: 'Delete'
    };
    return actionMap[permission.action] || permission.action;
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }





  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DeleteModal
        isShow={deleteModal.isShow}
        setIsShow={(show) => setDeleteModal(prev => ({ ...prev, isShow: show }))}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteModal.userName}"? This action cannot be undone.`}
        agreeFunction={confirmDelete}
      />
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <button
              onClick={() => router.push('/users/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New User
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionLabel(permission.permission)?.toLowerCase()}`}
                          >
                            {getPermissionLabel(permission.permission)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(user.updatedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none"
                          title="Edit user"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isDeleting}
                          className={`text-red-600 hover:text-red-900 focus:outline-none ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          title="Delete user"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 