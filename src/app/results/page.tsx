"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfile, loadStudentProfileByEmail } from '@/services/profile';
import { db } from '@/lib/firebase'; // Web Firebase config
import { doc, getDoc } from 'firebase/firestore'; // Web v9 SDK

// Defines the shape of the marks object
type Marks = Record<string, number | string | null | undefined>;

// Defines the structure of the entire result document from Firestore.
type ResultDoc = {
  marks?: Marks;
  ExamType?: string;
  Marks?: number; // Note: Capital 'M' to match your database field
};

/* Color Palette */
const PALETTE = {
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  text: '#121212',
  sub: '#5F6B7A',
  line: '#E7ECF3',
  brand: '#004e92',
};

// Helper function to format subject names
const formatSubjectName = (key: string) => {
  if (!key) return '';
  return key.replace(/([A-Z])/g, ' $1').trim();
};

export default function ResultPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [marks, setMarks] = useState<Marks | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [examType, setExamType] = useState<string | null>(null);
  const [totalMarks, setTotalMarks] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      setError('Please log in to view results.');
      return;
    }

    setLoading(true);
    setError(null);
    setMarks(null);
    setExamType(null);
    setTotalMarks(null);

    try {
      // Step 1: Load profile if not already loaded
      let studentNum = profile?.number;
      if (!studentNum) {
        const studentProfile = await loadStudentProfileByEmail(user.email);
        if (!studentProfile?.number) {
          throw new Error("Student profile not found.");
        }
        setProfile(studentProfile);
        studentNum = studentProfile.number;
      }

      const phone = String(studentNum).trim();
      if (!phone) {
        throw new Error('No mobile number found for this account.');
      }

      // Step 2: Fetch results
      const snap = await getDoc(doc(db, 'results', phone));

      if (!snap.exists()) {
        setError('Result is not updated. Contact your branch.');
      } else {
        const data = snap.data() as ResultDoc | undefined;
        setMarks(data?.marks ?? {});
        setExamType(data?.ExamType ?? null);
        setTotalMarks(data?.Marks ?? null);
      }
    } catch (e: any) {
      console.warn('Result fetch error:', e);
      setError(e.message || 'Failed to load result. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get an array of subject names from the `marks` object keys
  const subjectKeys = marks ? Object.keys(marks) : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.tableCard}>
          <div style={styles.stateContainer}>
            {/* Simple loading text for web */}
            <p style={styles.stateText}>Fetching your result…</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.tableCard}>
          <div style={styles.stateContainer}>
            <p style={styles.errorTitle}>No Result</p>
            <p style={styles.errorText}>{error}</p>
            <button onClick={loadData} style={styles.retryButton}>
              <span style={styles.retryButtonText}>Retry</span>
            </button>
          </div>
        </div>
      );
    }

    if (marks && subjectKeys.length > 0) {
      return (
        <div style={styles.tableCard}>
          {/* Header Row */}
          <div style={{ ...styles.tRow, ...styles.tHeader }}>
            <div style={{ ...styles.tCellSubject, ...styles.tHeadCell }}>
              <span style={styles.tHeadText}>{examType || 'Results'}</span>
            </div>
            <div style={{ ...styles.tCellMarks, ...styles.tHeadCell }}>
              <span style={styles.tHeadText}>
                {totalMarks ? `Marks (/${totalMarks})` : 'Marks'}
              </span>
            </div>
          </div>

          {/* Dynamic Subject Rows */}
          {subjectKeys.map((subjectKey, i) => {
            const markValue = marks?.[subjectKey];
            const isMarkAvailable =
              markValue !== null &&
              markValue !== undefined &&
              String(markValue).trim() !== '' &&
              !isNaN(Number(markValue));

            return (
              <div
                key={subjectKey}
                style={{
                  ...styles.tRow,
                  ...(i === subjectKeys.length - 1 ? {} : styles.tBodyDivider),
                }}
              >
                <div style={styles.tCellSubject}>
                  <span style={styles.tCellText}>{formatSubjectName(subjectKey)}</span>
                </div>
                <div style={styles.tCellMarks}>
                  <span
                    style={{
                      ...styles.tCellText,
                      ...(isMarkAvailable ? styles.tCellBold : styles.tCellNotUpdated),
                    }}
                  >
                    {isMarkAvailable ? Number(markValue) : 'Not updated'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback for "marks" being an empty object
    return (
       <div style={styles.tableCard}>
          <div style={styles.stateContainer}>
            <p style={styles.errorTitle}>No Result</p>
            <p style={styles.errorText}>No marks found in your record.</p>
          </div>
        </div>
    );
  };

  return (
    <main style={styles.root}>
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>Results</h1>
        {renderContent()}
      </div>
    </main>
  );
}

/* Converted Styles */
const styles: { [key: string]: React.CSSProperties } = {
  root: { flex: 1, backgroundColor: PALETTE.bg, minHeight: '100vh' },
  container: { 
    padding: '16px', 
    maxWidth: '800px',
    margin: '0 auto',
  },
  mainTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: PALETTE.text,
    marginBottom: '15px',
    padding: '0 5px',
  },
  tableCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  stateContainer: {
    padding: '20px',
    alignItems: 'center',
    textAlign: 'center',
  },
  stateText: {
    marginTop: '8px',
    color: PALETTE.sub,
    fontSize: '16px',
  },
  errorTitle: {
    color: PALETTE.text,
    fontWeight: '800',
    fontSize: '16px',
    margin: 0,
  },
  errorText: {
    marginTop: '6px',
    color: PALETTE.sub,
    textAlign: 'center',
    margin: 0,
  },
  retryButton: {
    marginTop: '12px',
    padding: '8px 14px',
    borderRadius: '10px',
    backgroundColor: '#EEF4FF',
    color: PALETTE.brand,
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
  },
  retryButtonText: {
    color: PALETTE.brand,
    fontWeight: '800',
  },
  tHeader: { backgroundColor: '#F7FAFF' },
  tRow: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
  tHeadCell: { borderBottom: `1px solid ${PALETTE.line}` },
  tCellSubject: { flex: 1.4, padding: '12px' },
  tCellMarks: { flex: 1, padding: '12px', textAlign: 'right' },
  tBodyDivider: { borderBottom: `1px solid #EEF2F7` },
  tHeadText: {
    color: PALETTE.text,
    fontWeight: '800',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tCellText: { color: PALETTE.text, fontSize: '14px' },
  tCellBold: { fontWeight: '800' },
  tCellNotUpdated: {
    fontSize: '12px',
    fontStyle: 'italic',
    color: PALETTE.sub,
    fontWeight: '500',
  },
};
