'use client';
import React from 'react';
import { observeAuth } from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const unsub = observeAuth(user => {
      if (!user) router.replace('/login');
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return <div style={{ padding: 24 }}>Checking session…</div>;
  return <>{children}</>;
}
