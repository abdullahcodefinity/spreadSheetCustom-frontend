'use client';

import AuthGuard from '@/app/components/AuthGaurd';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false} redirectTo="/sheet">
      {children}
    </AuthGuard>
  );
}