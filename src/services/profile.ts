"use client";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, limit, query, where
} from "firebase/firestore";
import { emailToNumber } from "@/utils/numberToEmail";

export type StudentProfile = {
  name?: string;
  number?: string;
  branch?: string;
  course?: string;
  batch?: string;
  year?: string;
  // ...other fields you store (avoid password on client!)
};

// A unique key for sessionStorage
const keyFor = (digits: string) => `student_profile_${digits}`;

export async function loadStudentProfileByEmail(email: string | null | undefined) {
  const digits = emailToNumber(email);
  if (!digits) return null;

  // 1. Check the browser's session cache first
  const cached = typeof window !== "undefined" ? sessionStorage.getItem(keyFor(digits)) : null;
  if (cached) {
    return JSON.parse(cached) as StudentProfile;
  }

  // 2. If not cached, fetch from Firestore
  const q = query(
    collection(db, "students"),
    where("number", "==", digits),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const data = snap.docs[0].data() as StudentProfile;

  // 3. Store the result in the session cache for next time
  if (typeof window !== "undefined") {
    sessionStorage.setItem(keyFor(digits), JSON.stringify(data));
  }
  return data;
}