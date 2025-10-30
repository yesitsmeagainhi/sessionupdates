'use client';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { numberToEmail } from '@/src/utils/numberToEmail';

export async function loginWithNumberPassword(number: string, password: string) {
  const email = numberToEmail(number);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function observeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export function logout() {
  return auth.signOut();
}
