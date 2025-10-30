'use client';
import React from 'react';
import { logout } from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await logout(); router.replace('/login'); }}
      style={{ background: '#eee', borderRadius: 8, height: 36, padding: '0 12px' }}
    >
      Logout
    </button>
  );
}
