"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { numberToEmail } from "@/utils/numberToEmail";

export default function LoginPage() {
  const router = useRouter();
  const [number, setNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) router.replace("/dashboard"); });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!number.trim() || !password) { setErr("Enter phone number and password."); return; }
    setBusy(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, numberToEmail(number), password);
      router.replace("/dashboard");
    } catch (e: any) {
      const msg =
        e?.code === "auth/user-not-found" ? "Account not found." :
        e?.code === "auth/wrong-password" ? "Incorrect password." :
        e?.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
        e?.message || "Login failed";
      setErr(msg);
    } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
      <form onSubmit={handleSubmit}
            style={{ width: 360, maxWidth: "92%", display: "grid", gap: 12, background: "#fff",
                     padding: 24, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Student Login</h1>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Phone Number</span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric"
                 placeholder="9579596311"
                 style={{ border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px", height: 44 }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
                 placeholder="••••••••"
                 style={{ border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px", height: 44 }} />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Keep me signed in</span>
        </label>

        {err && <div style={{ color: "#b00020" }}>{err}</div>}

        <button type="submit" disabled={busy}
                style={{ background: "#0a84ff", color: "#fff", border: 0, borderRadius: 10,
                         height: 46, fontWeight: 700, cursor: "pointer" }}>
          {busy ? "Signing in…" : "Login"}
        </button>
      </form>
    </main>
  );
}
