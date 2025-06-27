'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '../context';
import keys from '../common/keys';
import { AuthGuardProps } from '../types';


export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { token, currentUser } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    // Check localStorage directly for immediate token availability
    const storedToken = localStorage.getItem(keys.jwttoken);
    const userRole = currentUser?.role;
  
    if (requireAuth && !storedToken) {
      // User needs to be authenticated but isn't
      router.push(redirectTo);
    } else if (!requireAuth && storedToken) {
      // User is authenticated but shouldn't be on this page (e.g., login page)
      router.push('/sheet');
    }


    // Restrict access to users page for non-super admins
    if (pathname === '/users'  && userRole !== 'SuperAdmin') {
      router.push('/sheet');
    }
    // Restrict access to users page for non-super admins
    if (pathname === '/key-value' && userRole !== 'SuperAdmin') {
      router.push('/sheet');
    }




  }, [requireAuth, redirectTo, router, pathname]);


  return <>{children}</>;
}