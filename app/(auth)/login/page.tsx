'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useToast from '@/app/hooks/useToast';
import useAuth from '@/app/hooks/useAuth';
import usePostData from '@/app/hooks/ usePostData';
import { Url } from '@/src/api';
import AuthGuard from '@/app/components/AuthGaurd';

export default function LoginPage() {
  const router = useRouter();
  const { successToast, errorToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { authenticateUser } = useAuth();
  const [error, setError] = useState('');

  // Move usePostData to the top level of the component
  const { mutateAsync } = usePostData({
    URL: Url.LoginUser,
    mode: 'post',
    link: '/sheet',
    formData: false
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await mutateAsync(formData);
      const apiResponse = response.data as any;
      if (apiResponse?.token && apiResponse?.user) {
        authenticateUser(apiResponse.user, apiResponse.token);
        successToast('Login successful! Redirecting...');
        router.push('/sheet');
      } else {
        console.error('Invalid response structure:', apiResponse);
        throw new Error('Invalid response format - missing token or user data');
      }
    } catch (err: any) {
      const errorMessage = err.response.data?.message || 'Invalid credentials';
      errorToast(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}