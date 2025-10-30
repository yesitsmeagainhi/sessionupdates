"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Import the correct service functions for your web app
import { fetchAttendance, getTodayStatus } from '@/services/attendanceService';
import { useAuth } from '@/contexts/AuthContext';
// Added profile service import
import { loadStudentProfileByEmail, StudentProfile } from '@/services/profile';
import dayjs from 'dayjs';

// ======== DEBUG ========
const DEBUG = true;
const dbg = (tag: string, obj?: any) => 
  DEBUG && console.log(`[CHECK][${new Date().toISOString()}] ${tag}`, obj ?? '');
// =======================

// Type definitions (from your RN file)
type TLike = { toDate?: () => Date } | undefined;
type DayEntry = {
  // server timestamps
  inAt?: TLike;
  outAt?: TLike;
  // shadow millis
  inAtMs?: number;
  outAtMs?: number;
  durationMin?: number;
  hasIn?: boolean;
  hasOut?: boolean;
  inPhoto?: string;
  outPhoto?: string;
};

// ---------- Utils (from your RN file) ----------
const formatTimeFromEither = (millis?: number, ts?: TLike) => {
  if (typeof millis === 'number') return dayjs(millis).format('HH:mm');
  if (ts?.toDate) return dayjs(ts.toDate()).format('HH:mm');
  return '—';
};

/**
 * Normalize a Firestore doc that might use either:
 * A) nested days: { days: { "YYYY-MM-DD": {...} } }
 * B) flattened keys: { "days.YYYY-MM-DD.hasIn": true, ... }
 *
 * Returns a proper map: { [dateKey]: DayEntry }
 */
function normalizeDays(doc: any): Record<string, DayEntry> {
  const out: Record<string, DayEntry> = {};

  if (!doc) return out;

  // Case A: nested already — clone safely
  if (doc.days && typeof doc.days === 'object') {
    Object.keys(doc.days).forEach((dk) => {
      const d = doc.days[dk] || {};
      out[dk] = {
        hasIn: !!(d.hasIn || d.inAt),
        hasOut: !!(d.hasOut || d.outAt),
        inAt: d.inAt,
        outAt: d.outAt,
        inAtMs: d.inAtMs,
        outAtMs: d.outAtMs,
        durationMin: d.durationMin,
        inPhoto: d.inPhoto,
        outPhoto: d.outPhoto,
      };
    });
  }

  // Case B: flattened keys — rebuild into the map
  // This matches your web service file
  Object.keys(doc).forEach((k) => {
    // match: days.<date>.<field>
    if (!k.startsWith('days.')) return;
    // e.g. "days.2025-10-28.hasIn"
    const parts = k.split('.');
    // must be at least 3 parts
    if (parts.length < 3) return;
    const dk = parts[1]; // 2025-10-28
    const field = parts.slice(2).join('.'); // supports nested like inLoc.whatever (future-proof)

    if (!out[dk]) out[dk] = {};

    const val = doc[k];

    // Map well-known fields; keep it simple
    switch (field) {
      case 'hasIn':
        out[dk].hasIn = !!val;
        break;
      case 'hasOut':
        out[dk].hasOut = !!val;
        break;
      case 'inAt':
        out[dk].inAt = val;
        break;
      case 'outAt':
        out[dk].outAt = val;
        break;
      case 'inAtMs':
        out[dk].inAtMs = typeof val === 'number' ? val : undefined;
        break;
      case 'outAtMs':
        out[dk].outAtMs = typeof val === 'number' ? val : undefined;
        break;
      case 'durationMin':
        out[dk].durationMin = typeof val === 'number' ? val : undefined;
        break;
      case 'inPhoto':
        out[dk].inPhoto = val;
        break;
      case 'outPhoto':
        out[dk].outPhoto = val;
        break;
      default:
        // ignore unknowns or nested loc fields (not displayed here)
        break;
    }
  });

  // Fill implied flags if timestamps exist
  Object.keys(out).forEach((dk) => {
    const d = out[dk];
    d.hasIn = !!(d.hasIn || d.inAt);
    d.hasOut = !!(d.hasOut || d.outAt);
  });

  return out;
}

// ---------- Web Components ----------
const AttendanceRow = ({ item }: { item: any }) => {
    const getPillStyle = (status: string) => {
        if (status === 'Done') return styles.pillDone;
        if (status === 'IN only') return styles.pillIn;
        return styles.pillNone;
    };

    return (
        <div style={styles.row}>
            <div style={{ flex: 1 }}>
                <p style={styles.rowDate}>{dayjs(item.dateKey).format('dddd, DD MMMM')}</p>
                <p style={styles.rowLine}>
                    IN {item.inText} &nbsp; → &nbsp; OUT {item.outText}
                    {typeof item.durationMin === 'number' ? ` &nbsp; • &nbsp; ${item.durationMin} min` : ''}
                </p>
            </div>
            <div style={{ ...styles.statusPill, ...getPillStyle(item.status) }}>
                <span style={styles.pillText}>{item.status}</span>
            </div>
        </div>
    );
};


// ---------- Page Component ----------
export default function AttendanceHistoryPage() {
  // Use `user` from auth, just like in mark/page.tsx
  const { user, loading: authLoading } = useAuth();
  // Add state to hold the loaded student profile
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [att, setAtt] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Renamed `load` to `loadAttendance` and it now takes the student number
  const loadAttendance = useCallback(async (studentNumber: string) => {
    dbg('loadAttendance:start', { number: studentNumber });
    try {
        const [a, t] = await Promise.all([
            fetchAttendance(studentNumber),
            getTodayStatus(studentNumber),
        ]);
        dbg('load:fetched', { hasDoc: !!a, today: t });
        setAtt(a);
        setToday(t);
    } catch (error) {
        console.error("Failed to load attendance data:", error);
        alert("Failed to load attendance data. Please check your connection and try again.");
    } finally {
        setLoading(false); // All loading is done
    }
  }, []); // This function has no dependencies

  // This new useEffect loads the student profile first
  useEffect(() => {
    if (authLoading) {
      setLoading(true); // Show loading spinner while auth is loading
      return;
    }
    if (!user) {
      setLoading(false); // Not loading, not logged in
      alert("Please log in to view history.");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const studentProfile = await loadStudentProfileByEmail(user.email);
        if (!studentProfile?.number) {
          alert("Student profile not found.");
          setLoading(false);
        } else {
          setProfile(studentProfile);
          // Once profile is loaded, THEN load attendance
          await loadAttendance(studentProfile.number);
        }
      } catch (err) {
        console.error(err);
        alert("Error loading profile.");
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, loadAttendance]); // Re-run if user logs in

  // Build a normalized days map first
  const daysMap = useMemo(() => {
    const dm = normalizeDays(att);
    dbg('normalizedDays', { keys: Object.keys(dm).length ? Object.keys(dm) : '—' });
    return dm;
  }, [att]);

  // Group into sections by month for UI
  const { sections, months } = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    Object.keys(daysMap).forEach((dateKey) => {
      const d = daysMap[dateKey];
      const monthKey = dayjs(dateKey).format('MMMM YYYY');
      if (!grouped[monthKey]) grouped[monthKey] = [];

      const inText = formatTimeFromEither(d.inAtMs, d.inAt);
      const outText = formatTimeFromEither(d.outAtMs, d.outAt);
      const status = d.hasIn
        ? (d.hasOut ? 'Done' : 'IN only')
        : '—';

      grouped[monthKey].push({
        dateKey,
        inText,
        outText,
        durationMin: d.durationMin,
        status,
      });
    });

    const monthKeys = Object.keys(grouped).sort(
      (a, b) => dayjs(b, 'MMMM YYYY').valueOf() - dayjs(a, 'MMMM YYYY').valueOf()
    );

    const sectionData = monthKeys.map((month) => ({
      title: month,
      data: grouped[month].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    }));

    // default select latest month
    if (monthKeys.length > 0 && !selectedMonth) {
      setSelectedMonth(monthKeys[0]);
    }

    return { sections: sectionData, months: monthKeys };
  }, [daysMap, selectedMonth]);


  if (loading) {
    return (
      <div style={styles.center}><p>Loading attendance...</p></div>
    );
  }

  const currentSection = sections.find(s => s.title === selectedMonth);

  return (
    <div style={styles.wrap}>
        {/* Centering wrapper */}
        <div style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
            {/* Today's Summary Card */}
            <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>Today's Status</h2>
                <p style={styles.summaryLine}>
                    ({today?.dateKey || '...'}):{' '}
                    {today?.hasIn ? (today?.hasOut ? 'Completed' : 'Punched In') : 'Not Punched In'}
                </p>
            </div>

            {/* Month Selector */}
            <div style={styles.monthSelector}>
                {months.map((month) => (
                    <button
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        // Apply active styles conditionally
                        style={selectedMonth === month ? {...styles.monthPill, ...styles.monthPillActive} : styles.monthPill}
                    >
                        <span style={selectedMonth === month ? {...styles.monthPillText, ...styles.monthPillTextActive} : styles.monthPillText}>
                            {month.split(' ')[0]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Attendance History */}
            <div>
                {currentSection ? (
                    <>
                        <h3 style={styles.sectionHeader}>{currentSection.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentSection.data.map(item => <AttendanceRow key={item.dateKey} item={item} />)}
                        </div>
                    </>
                ) : (
                    <div style={styles.emptyContainer}>
                        <p style={styles.emptyText}>No attendance records found for this month.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

// Converted React Native StyleSheet to a CSS-in-JS object
const styles: { [key: string]: React.CSSProperties } = {
  wrap: { flex: 1, backgroundColor: '#f0f4f8', minHeight: '100vh' },
  center: { display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    margin: '0 0 20px 0', // Replaced margin: 20
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  summaryTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1a252f', marginBottom: '4px', margin: 0 },
  summaryLine: { fontSize: '14px', color: '#5a6a78', margin: 0 },
  monthSelector: { 
    display: 'flex', 
    flexDirection: 'row', 
    overflowX: 'auto', 
    paddingBottom: '15px', 
    marginBottom: '10px' 
  },
  monthPill: {
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    marginRight: '10px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  monthPillActive: { backgroundColor: '#004e92', borderColor: '#004e92' },
  monthPillText: { fontWeight: '600', color: '#004e92', fontSize: '14px' },
  monthPillTextActive: { color: '#ffffff' },
  sectionHeader: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a252f',
    marginBottom: '15px',
    padding: '0 5px',
  },
  row: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '4px solid #e2e8f0', // Kept borderLeft from RN style
  },
  rowDate: { fontWeight: '600', color: '#1a252f', marginBottom: '4px', margin: 0 },
  rowLine: { color: '#5a6a78', fontSize: '13px', margin: 0 },
  statusPill: { padding: '5px 10px', borderRadius: '15px' },
  pillText: { fontWeight: '600', fontSize: '12px' },
  // Updated pill colors to set text color explicitly
  pillDone: { backgroundColor: '#d1fae5', color: '#065f46' }, 
  pillIn: { backgroundColor: '#dbeafe', color: '#1e40af' },
  pillNone: { backgroundColor: '#f3f4f6', color: '#4b5563' },
  emptyContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '50px' },
  emptyText: { fontSize: '16px', color: '#64748b' },
};

