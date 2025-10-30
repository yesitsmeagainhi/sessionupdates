"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfile, loadStudentProfileByEmail } from '@/services/profile';
import { fetchTodayTomorrow } from '@/services/lectures'; // Assuming this path is correct

/* ---------- fixed (light) colour palette ---------- */
const C = {
  surface: '#ffffff',
  text: '#1a1a1a',
  subText: '#3c3c3c',
  link: '#007aff',
  bg: '#f5f5f5',
};

/* ---------- Lecture Card Component ---------- */
const LectureCard = ({ item }: { item: any }) => {
  return (
    <div style={styles.card}>
      <h2 style={styles.subject}>{item.subject}</h2>

      <p style={styles.info}>👨‍🏫 {item.faculty}</p>
      <p style={styles.info}>⏰ {item.start} – {item.end}</p>
      <p style={styles.info}>🏛️ {item.branch}</p>

      <span style={styles.modeTag}>
        {item.mode === 'Lecture'
          ? '📘 Lecture'
          : item.mode === 'Test'
          ? '📝 Test'
          : item.mode}
      </span>

      {item.delivery === 'Online' || item.mode === 'Online' ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          🔗 Join Online
        </a>
      ) : (
        <p style={styles.info}>{item.location}</p>
      )}
    </div>
  );
};

/* ---------- Page Component ---------- */
export default function TomorrowLecturesPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      setError("Please log in to view lectures.");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Load Profile (same as history page)
        let studentProfile = profile;
        if (!studentProfile) {
          studentProfile = await loadStudentProfileByEmail(user.email);
          if (!studentProfile) {
            throw new Error("Student profile not found.");
          }
          setProfile(studentProfile);
        }

        // 2. Fetch Lectures
        const { tomorrow } = await fetchTodayTomorrow(studentProfile);
        setLectures(tomorrow || []);

      } catch (err: any) {
        console.error("Failed to load lectures:", err);
        setError(err.message || "Unable to load lectures");
        alert(err.message || "Unable to load lectures");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]); // Re-run when user logs in

  /* ---------- UI states ---------- */
  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.full}>
          <p style={{ color: C.text, fontSize: '18px' }}>Loading lectures...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div style={styles.full}>
          <p style={{ color: C.text, fontSize: '16px', textAlign: 'center', lineHeight: 1.5 }}>
            {error}
          </p>
        </div>
      );
    }

    if (!lectures.length) {
      return (
        <div style={styles.full}>
          <p style={{ color: C.text, fontSize: '16px', textAlign: 'center', lineHeight: 1.5 }}>
            🚫No Updates
          </p>
        </div>
      );
    }

    /* ---------- main list ---------- */
    return (
      <div style={styles.listContainer}>
        {lectures.map((item) => (
          <LectureCard key={item.id} item={item} />
        ))}
      </div>
    );
  }
  
  return (
     <main style={styles.container}>
        <h1 style={styles.title}>Tomorrow's Lectures</h1>
        {renderContent()}
     </main>
  );
}

/* ---------- Converted Styles ---------- */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '15px',
    backgroundColor: C.bg,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: C.text,
    marginBottom: '15px',
    padding: '0 5px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  full: {
    display: 'flex',
    flex: 1,
    minHeight: '60vh',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: '12px',
    padding: '15px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subject: {
    color: C.text,
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '6px',
    margin: 0,
  },
  info: {
    color: C.subText,
    fontSize: '14px',
    marginTop: '2px',
    margin: 0,
  },
  link: {
    color: C.link,
    textDecoration: 'underline',
    marginTop: '8px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-block',
  },
  modeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f0ff',
    color: '#007aff',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    overflow: 'hidden',
    marginTop: '6px',
  },
};
