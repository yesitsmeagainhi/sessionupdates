"use client";

import Link from 'next/link';
import React, { useState } from 'react';

const PALETTE = {
  bg: '#f2f5fa',
  surface: '#ffffff',
  textMain: '#1a1a1a',
  textMute: '#686868',
  blue: '#004e92',
  green: '#16a34a',
};

const MenuLinkCard = ({ href, icon, title, subtitle }) => (
  <Link href={href} style={{ textDecoration: 'none' }}>
    <div style={{
      background: PALETTE.surface,
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      cursor: 'pointer',
      border: '1px solid #e0e0e0',
    }}>
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: PALETTE.textMain, margin: 0 }}>
        {title}
      </h2>
      <p style={{ fontSize: '15px', color: PALETTE.textMute, margin: 0 }}>
        {subtitle}
      </p>
    </div>
  </Link>
);

export default function AttendancePage() {
  const [showPunchOptions, setShowPunchOptions] = useState(false);

  return (
    <main style={{ minHeight: '100vh', background: PALETTE.bg, padding: '20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: PALETTE.textMain, marginBottom: '24px' }}>
        Attendance Portal
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Mark Attendance Card */}
        <div style={{
          background: PALETTE.surface,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}>
          <div 
            onClick={() => setShowPunchOptions(!showPunchOptions)}
            style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ fontSize: '32px' }}>✋</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: PALETTE.textMain, margin: 0 }}>
              Mark Attendance
            </h2>
            <p style={{ fontSize: '15px', color: PALETTE.textMute, margin: 0 }}>
              Punch in or out for today with a selfie.
            </p>
          </div>
          
          {showPunchOptions && (
            <div style={{ display: 'flex' }}>
              <Link href="/attendance/mark?type=in" style={{ textDecoration: 'none', flex: 1 }}>
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: PALETTE.blue,
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  Punch In
                </div>
              </Link>
              <Link href="/attendance/mark?type=out" style={{ textDecoration: 'none', flex: 1 }}>
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: PALETTE.green,
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderTop: '1px solid #e0e0e0',
                  borderLeft: '1px solid #e0e0e0'
                }}>
                  Punch Out
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* View History Card (Links to the new page) */}
        <MenuLinkCard
          href="/attendance/history"
          icon="📜"
          title="View History"
          subtitle="Check your past attendance records."
        />
      </div>
    </main>
  );
}