import {
  doc,
  setDoc,
  updateDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  increment,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs, // ✅ needed for fetchBanners
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Types ---
export type GeoSnapshot = {
  lat: number;
  lng: number;
  acc?: number;
  distM?: number;
};

export interface DayStatus {
  hasIn: boolean;
  hasOut: boolean;
  dateKey: string;
  durationMin?: number;
  inAt?: Timestamp;
  outAt?: Timestamp;
}

// Interface for Banners
export interface BannerRow {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  order?: number;
  isActive: boolean | string; // support "TRUE" or true
}

// --- Date Key Helper ---
export function todayKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === 'year')?.value ?? '0000';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const d = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

const studentDocRef = (number: string) => doc(db, 'studentattendance', String(number).trim());

// Helper to read day status from a doc
function readDay(data: any, dk: string): DayStatus {
  // flattened
  const flatIn = data?.[`days.${dk}.hasIn`] || data?.[`days.${dk}.inAt`];
  const flatOut = data?.[`days.${dk}.hasOut`] || data?.[`days.${dk}.outAt`];

  // nested fallback
  const nested = data?.days?.[dk] || {};
  const nestedIn = nested?.inAt;
  const nestedOut = nested?.outAt;

  // ✅ fix DK -> dk
  const inAt = nested?.inAt || data?.[`days.${dk}.inAt`];
  const outAt = nested?.outAt || data?.[`days.${dk}.outAt`];
  const durationMin = nested?.durationMin || data?.[`days.${dk}.durationMin`];

  return {
    dateKey: dk,
    hasIn: !!(flatIn || nested?.hasIn || nestedIn),
    hasOut: !!(flatOut || nested?.hasOut || nestedOut),
    durationMin,
    inAt,
    outAt,
  };
}

// --- Real-time Subscription ---
export function subscribeTodayStatus(
  number: string,
  callback: (status: DayStatus) => void
) {
  const id = String(number).trim();
  const dk = todayKey();
  const ref = studentDocRef(id);

  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const status = readDay(data, dk);
      callback(status);
    },
    (error) => {
      console.error('Attendance subscription error:', error);
      callback({ dateKey: dk, hasIn: false, hasOut: false });
    }
  );
}

// --- One-time Server Read ---
export async function getTodayStatus(number: string): Promise<DayStatus> {
  const id = String(number).trim();
  const dk = todayKey();
  const ref = studentDocRef(id);
  const snap = await getDocFromServer(ref);
  const data: any = snap.exists() ? snap.data() : {};
  return readDay(data, dk);
}

// --- Punch In Logic ---
export async function punchInOptimistic(opts: {
  number: string;
  name?: string;
  meta?: Record<string, any>;
  loc?: GeoSnapshot;
  photoUrl: string;
}) {
  const { number, name, meta, loc, photoUrl } = opts;
  const id = String(number).trim();
  const ref = studentDocRef(id);
  const dk = todayKey();

  const snap = await getDocFromServer(ref);
  const data: any = snap.exists() ? snap.data() : {};
  const cur = readDay(data, dk);

  if (cur.hasIn && !cur.hasOut) {
    throw new Error('You have already punched in for today.');
  }

  const isFirstInToday = !cur.hasIn;

  const write: Record<string, any> = {
    [`days.${dk}.hasIn`]: true,
    [`days.${dk}.hasOut`]: !!cur.hasOut,
    [`days.${dk}.inAt`]: serverTimestamp(),
    [`days.${dk}.inAtMs`]: Date.now(),
    [`days.${dk}.inPhoto`]: photoUrl,
    ...(loc && { [`days.${dk}.inLoc`]: loc }),
    ...(name && { name }),
    ...(meta && { meta: { ...(data?.meta || {}), ...meta } }),
    logs: arrayUnion({ dateKey: dk, type: 'IN', at: Timestamp.now(), ...(loc && { loc }) }),
    'summary.lastAction': 'IN',
    'summary.lastActionAt': serverTimestamp(),
    ...(isFirstInToday && { 'summary.totalDays': increment(1) }),
  };

  await setDoc(ref, write, { merge: true });
  return { ok: true, dateKey: dk };
}

// --- Punch Out Logic ---
export async function punchOutOptimistic(opts: {
  number: string;
  loc?: GeoSnapshot;
  photoUrl: string;
}) {
  const { number, loc, photoUrl } = opts;
  const id = String(number).trim();
  const ref = studentDocRef(id);
  const dk = todayKey();

  const snap = await getDocFromServer(ref);
  if (!snap.exists()) {
    throw new Error('No attendance record found. Please Punch In first.');
  }

  const data: any = snap.data();
  const cur = readDay(data, dk);

  if (!cur.hasIn) throw new Error('Please Punch In before punching out.');
  if (cur.hasOut) throw new Error('You have already punched out for today.');

  const now = Date.now();
  const inMs = data?.[`days.${dk}.inAtMs`] ?? cur.inAt?.toMillis() ?? now;
  const durationMin = Math.max(0, Math.round((now - inMs) / 60000));

  const write: Record<string, any> = {
    [`days.${dk}.hasOut`]: true,
    [`days.${dk}.outAt`]: serverTimestamp(),
    [`days.${dk}.outAtMs`]: now,
    [`days.${dk}.durationMin`]: durationMin,
    [`days.${dk}.outPhoto`]: photoUrl,
    ...(loc && { [`days.${dk}.outLoc`]: loc }),
    logs: arrayUnion({ dateKey: dk, type: 'OUT', at: Timestamp.now(), ...(loc && { loc }) }),
    'summary.lastAction': 'OUT',
    'summary.lastActionAt': serverTimestamp(),
  };

  await setDoc(ref, write, { merge: true });
  return { ok: true, dateKey: dk, durationMin };
}

// =======================================================
// ============== BANNERS (FIXED) ========================
// =======================================================
export const fetchBanners = async (): Promise<BannerRow[]> => {
  try {
    // Accept both "TRUE" (string) and true (boolean)
    const q = query(
      collection(db, 'banners'),
      where('isActive', 'in', ['TRUE', true])
      // If you later store booleans only, switch to: where('isActive','==',true)
    );

    const snap = await getDocs(q);

    const rows = snap.docs.map((d) => {
      const data = d.data() as any;

      // Strip any accidental <url> wrappers and clean whitespace
      const imageUrl = String(data.imageUrl ?? '')
        .replace(/<url.*?>|<\/url>/g, '')
        .trim();
      const link = String(data.link ?? '')
        .replace(/<url.*?>|<\/url>/g, '')
        .trim();

      return {
        id: d.id,
        title: data.title ?? '',
        imageUrl,
        link,
        order: typeof data.order === 'number' ? data.order : Number(data.order ?? 999),
        isActive: data.isActive,
      } as BannerRow;
    });

    rows.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return rows;
  } catch (err) {
    console.error('fetchBanners() failed:', err);
    return [];
  }
};

// =======================================================
// ======== EXISTING: fetchAttendance ====================
// =======================================================
export const fetchAttendance = async (studentNumber: string) => {
  if (!studentNumber) return null;

  try {
    const docRef = studentDocRef(studentNumber);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No attendance document found for:', studentNumber);
      return null;
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return null;
  }
};
