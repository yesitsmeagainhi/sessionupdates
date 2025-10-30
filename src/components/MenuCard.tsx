"use client";

import Link from 'next/link'; // 👈 1. Import the Link component
import React from 'react';

// Define the component's props
type MenuCardProps = {
  href: string;
  icon: string;
  title: string;
};

const PALETTE = { textMain: "#1a1a1a", surface: "#fff" };

export default function MenuCard({ href, icon, title }: MenuCardProps) {
  return (
    // 2. Wrap the entire card in the <Link> component
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: PALETTE.surface,
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {/* Use a div for emojis to avoid Image component errors */}
        <div style={{ fontSize: '28px' }}>{icon}</div>
        
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: PALETTE.textMain,
          textAlign: 'center',
        }}>
          {title}
        </div>
      </div>
    </Link>
  );
}