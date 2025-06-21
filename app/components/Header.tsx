'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import useToast from '@/app/hooks/useToast';
import useAuth from '../hooks/useAuth';
import keys from '../common/keys';


interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'SpreadSheet App' }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { successToast } = useToast();
  const router = useRouter();

  const { currentUser } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem(keys.jwttoken);
    localStorage.removeItem(keys.user);
    successToast('Logged out successfully');
    router.push('/login');
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between w-full flex-wrap gap-2 sm:flex-nowrap">
        {/* Logo / Title */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center w-full space-x-3 md:w-auto">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200"
              type="button"
            >
              <svg className="-ml-1 mr-1.5 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path clipRule="evenodd" fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
              {currentUser?.name}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 z-10 bg-white divide-y divide-gray-100 rounded shadow w-44">
                <ul className="py-1 text-sm text-gray-700" aria-labelledby="actionsDropdownButton">
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}