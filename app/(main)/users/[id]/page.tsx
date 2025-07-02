"use client";

import { useState, useEffect, use } from 'react';
import useGetById from '@/app/hooks/useGetById';
import usePostData from '@/app/hooks/ usePostData';
import useUpdateData from '@/app/hooks/ useUpdateData';
import useToast from '@/app/hooks/useToast';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, SheetPermission, UserFormData } from '@/app/types';


export default function UserManagement({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { successToast, errorToast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'user',
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
      });
    }
  }, [userData, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const updateData = {
          ...formData,
          password: formData.password || undefined
        };
        updateUser(updateData);
      } else {
        createUser(formData);
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'user',
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
              {isEditMode ? 'Edit User' : 'Create User'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? 'Update user details'
                : 'Create a new user'}
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