'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SheetList from "./components/SheetList";

export default function Home() {
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // User is already logged in, redirect to sheets
      router.push('/sheet');
    }
  }, [router]);

  return (
    <>
      <SheetList />
    </>
  );
}
