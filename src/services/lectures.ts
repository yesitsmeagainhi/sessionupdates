// src/services/lectures.ts

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit, // 👈 Import 'limit' for pagination
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Correct import path for web project

// It's better to get the student profile, not the full Firebase user object
// This ensures you only work with the data you need.
export interface StudentProfile {
  branch?: string;
  course?: string;
  batch?: string;
  year?: string;
}

// Interfaces remain largely the same
export interface Session {
  id: string;
  subject: string;
  faculty: string;
  start: string;
  end: string;
  mode: string;
  link?: string;
  location?: string;
  date?: string;
}

export interface BannerRow {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  order?: number; // Use number for sorting
  isActive: boolean; // Use boolean for flags
}

export interface Announcement {
  id:string;
  title: string;
  message: string;
  date: string; // Keep as ISO string e.g., "2025-10-29"
  // ... other fields
}

/**
 * Helper to convert a Firestore document to a clean Session object.
 */
const toSession = (doc: any): Session => {
  const d = doc.data();
  return {
    id: doc.id,
    subject: d.subject ?? '',
    faculty: d.faculty ?? '',
    start: d.start ?? '',
    end: d.end ?? '',
    mode: d.mode ?? '',
    link: d.link ?? '',
    location: d.location ?? '',
    date: d.date ?? '',
  };
};


/* ────────────────────────────────────────────────────────────
   Optimized API Functions
   ──────────────────────────────────────────────────────────── */

/**
 * ✅ OPTIMIZED: Fetches lectures for today and tomorrow.
 * Reads only the documents for the specific student and dates.
 * From 1000s of reads down to < 10 reads.
 */
export const fetchTodayTomorrow = async (
  student: StudentProfile,
): Promise<{ today: Session[]; tomorrow: Session[] }> => {
  if (!student.branch || !student.course || !student.batch || !student.year) {
    console.warn("Missing student details to fetch lectures.");
    return { today: [], tomorrow: [] };
  }

  const isoToday = new Date().toISOString().slice(0, 10);
  const isoTomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  // This query now filters on the server, which is highly efficient.
  const q = query(
    collection(db, 'lectures'),
    where('branch', '==', student.branch),
    where('course', '==', student.course),
    where('batch', '==', student.batch),
    where('year', '==', student.year),
    where('date', 'in', [isoToday, isoTomorrow]) // Gets docs for today OR tomorrow
  );

  const snap = await getDocs(q);
  const lectures = snap.docs.map(toSession);

  // The final filtering is on a very small dataset.
  return {
    today: lectures.filter(r => r.date === isoToday),
    tomorrow: lectures.filter(r => r.date === isoTomorrow),
  };
};

/**
 * ✅ OPTIMIZED: Fetches active banners.
 * Reads only active banners. Logic is simplified.
 */
export const fetchBanners = async (): Promise<BannerRow[]> => {
  const q = query(
    collection(db, 'banners'), 
    where('isActive', '==', true), // Use a boolean in Firestore for 'isActive'
    orderBy('order', 'asc') // Sort by an 'order' number field
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerRow));
};

/**
 * ✅ OPTIMIZED: Fetches recent announcements with a limit.
 * Reads only the most recent 25 announcements, not the whole collection.
 */
export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const q = query(
    collection(db, 'announcements'), 
    orderBy('date', 'desc'),
    limit(25) // 👈 Prevents reading thousands of old announcements
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as Announcement[];
};

/**
 * ✅ This function was already efficient. No changes needed.
 * Reads only the documents for a specific branch and date range.
 */
export const fetchBranchMonth = async (
  branchName: string,
): Promise<Session[]> => {
  if (!branchName) return [];

  const start = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const q = query(
    collection(db, 'lectures'),
    where('branch', '==', branchName.trim()),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date'),
    orderBy('start'),
  );

  const snap = await getDocs(q);
  return snap.docs.map(toSession);
};