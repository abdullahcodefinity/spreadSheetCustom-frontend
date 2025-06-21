"use client";

import { useState, useEffect, use } from 'react';
import useGetById from '@/app/hooks/useGetById';
import usePostData from '@/app/hooks/ usePostData';
import useUpdateData from '@/app/hooks/ useUpdateData';
import useToast from '@/app/hooks/useToast';
import { useRouter, useSearchParams } from 'next/navigation';

interface SheetPermission {
  action: 'create' | 'read' | 'update' | 'delete';
  subject: 'Sheet';
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: string;
  permissions: SheetPermission[];
}

interface ApiError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export default function UserManagement({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { successToast, errorToast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'user',
    permissions: []
  });
  const router = useRouter();

  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'create';
  const isEditMode = mode === 'edit';

  // Use useGetById hook for fetching user data
  const { data: userData, isLoading: isFetching } = useGetById({
    URL: `/auth/users/${resolvedParams.id}`,
    key: ['user', resolvedParams.id],
    enabled: isEditMode
  });

  // Use usePostData hook for creating users
  const { mutate: createUser, isLoading: isCreating } = usePostData({
    URL: '/auth/create-user',
    mode: 'post',
    link: '/users',
    isNavigate: true
  });

  // Use useUpdateData hook for updating users
  const { mutate: updateUser } = useUpdateData({
    URL: `/auth/users/${resolvedParams.id}`,
    link: '/users',
    isUpdate: false
  });

  // Update form data when user data is fetched
  useEffect(() => {
    if (userData && isEditMode) {
      const user = userData.user;
      setFormData({
        email: user.email,
        name: user.name,
        password: '', // Don't show existing password
        role: user.role,
        permissions: user.permissions.map((permission: any) => ({
          action: permission?.permission?.action,
          subject: permission?.permission?.subject
        }))
      });
    }
  }, [userData, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    
    if (formData.permissions.length === 0) {
      errorToast('Please select at least one permission');
      return;
    }

    try {
      if (isEditMode) {
        // Only send password if it's not empty
        const updateData = {
          ...formData,
          password: formData.password || undefined
        };
        updateUser(updateData);
      } else {
        createUser(formData);
        // Reset form only in create mode
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'user',
          permissions: []
        });
      }
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiError;

        if (apiError.errors) {
          const errorMessages = Object.entries(apiError.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          errorToast(errorMessages);
        } else if (apiError.message) {
          errorToast(apiError.message);
        } else {
          errorToast(`Failed to ${isEditMode ? 'update' : 'create'} user`);
        }
      } else {
        errorToast(`Failed to ${isEditMode ? 'update' : 'create'} user`);
      }
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user:`, error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => {
        const action = name as SheetPermission['action'];
        const newPermissions = checked
          ? [...prev.permissions, { action, subject: 'Sheet' as const }]
          : prev.permissions.filter(p => p.action !== action);

        return {
          ...prev,
          permissions: newPermissions
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const isPermissionChecked = (action: SheetPermission['action']) => {
    return formData?.permissions?.some(p => p.action === action);
  };

  const isLoading = isCreating;

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Sheet User' : 'Create Sheet User'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? 'Update user details and permissions'
                : 'Create a new user with specific permissions for sheet management'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditMode}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password (min 6 characters)"}
              />
              {isEditMode && (
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank to keep the current password
                </p>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sheet Permissions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="create"
                    name="create"
                    checked={isPermissionChecked('create')}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="create" className="ml-2 block text-sm text-gray-900">
                    Create Sheets
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="read"
                    name="read"
                    checked={isPermissionChecked('read')}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="read" className="ml-2 block text-sm text-gray-900">
                    View Sheets
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="update"
                    name="update"
                    checked={isPermissionChecked('update')}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="update" className="ml-2 block text-sm text-gray-900">
                    Update Sheets
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="delete"
                    name="delete"
                    checked={isPermissionChecked('delete')}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="delete" className="ml-2 block text-sm text-gray-900">
                    Delete Sheets
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/users')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  isEditMode ? 'Update User' : 'Create User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 