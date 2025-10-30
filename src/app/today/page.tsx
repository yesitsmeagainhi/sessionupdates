// src/app/today/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
// 👇 1. Import the function to load the student's profile
import { loadStudentProfileByEmail, StudentProfile } from '@/services/profile'; 
import { fetchTodayTomorrow, Session as Lecture } from '@/services/lectures'; 

const PALETTE = {
  surface: '#ffffff',
  text: '#1a1a1a',
  subText: '#3c3c3c',
  link: '#007aff',
  bg: '#f5f5f5',
};

export default function TodayLecturesPage() {
  // 👇 2. Get the Firebase user and the authentication loading state
  const { user, loading: authLoading } = useAuth();
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👇 3. This useEffect now fetches both the profile and the lectures
  useEffect(() => {
    // Don't do anything if the user is not logged in yet
    if (authLoading) {
      return; 
    }
    
    if (!user) {
      setLoading(false); // If no user, stop loading and show the empty/error state
      return;
    }

    const loadData = async () => {
      try {
        // First, get the student's detailed profile
        const profile = await loadStudentProfileByEmail(user.email);

        if (!profile) {
          setError("Could not find a student profile for your account.");
          return;
        }

        // Then, use the profile to get the lectures
        const { today } = await fetchTodayTomorrow(profile);
        setLectures(today || []);

      } catch (e) {
        setError('Failed to load lectures. Please try again.');
        console.error(e);
      } finally {
        setLoading(false); // Stop loading once everything is done
      }
    };

    loadData();
  }, [user, authLoading]); // Re-run this effect when the user or auth state changes

  // Show a loading indicator while Firebase checks for a logged-in user
  if (authLoading || loading) {
    return (
      <div style={{ display: 'grid', placeContent: 'center', minHeight: '80vh', background: PALETTE.bg }}>
        <p>Loading lectures...</p>
      </div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <div style={{ display: 'grid', placeContent: 'center', minHeight: '80vh', background: PALETTE.bg, padding: '20px' }}>
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  // Empty State UI
  if (lectures.length === 0) {
    return (
      <div style={{ display: 'grid', placeContent: 'center', minHeight: '80vh', background: PALETTE.bg, padding: '20px' }}>
        <p style={{ color: PALETTE.text, fontSize: 16, textAlign: 'center', lineHeight: 1.5 }}>
          🚫 No Updates
        </p>
      </div>
    );
  }

  // Main list of lectures
  return (
    <main style={{ background: PALETTE.bg, padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: PALETTE.text, marginBottom: '16px' }}>
        Today's Lectures
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lectures.map((item) => (
          <div key={item.id} style={{
            background: PALETTE.surface,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: PALETTE.text }}>
              {item.subject}
            </h2>
            <p style={{ color: PALETTE.subText, fontSize: '14px', margin: '4px 0' }}>👨‍🏫 {item.faculty}</p>
            <p style={{ color: PALETTE.subText, fontSize: '14px', margin: '4px 0' }}>⏰ {item.start} – {item.end}</p>
            
            {item.link ? (
              <Link href={item.link} target="_blank" rel="noopener noreferrer" style={{
                color: PALETTE.link, textDecoration: 'underline', marginTop: '10px', display: 'inline-block'
              }}>
                🔗 Join Online
              </Link>
            ) : (
              <p style={{ color: PALETTE.subText, fontSize: '14px', margin: '4px 0' }}>📍 {item.location}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}