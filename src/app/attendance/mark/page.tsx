"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link'; // 👈 Added this missing import
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loadStudentProfileByEmail, StudentProfile } from '@/services/profile';
import {
  getTodayStatus,
  punchInOptimistic,
  punchOutOptimistic,
  GeoSnapshot
} from '@/services/attendanceService';
import { uploadPhotoAsString } from '@/services/storageService';
import { haversineMeters } from '@/utils/geo';
import { BRANCH_LOCATIONS, GEOFENCE_RADIUS_M, DEFAULT_CENTER } from '@/config/geo';
import CameraComponent from '@/components/CameraComponent';

const PALETTE = {
  bg: '#f2f5fa',
  surface: '#ffffff',
  textMain: '#1a1a1a',
  textMute: '#686868',
  blue: '#004e92',
  red: '#be123c',
};

// Define a loading/status component
function StatusDisplay({ text, isError = false }) {
  return (
    <div style={{
      display: 'grid',
      placeContent: 'center',
      minHeight: '100vh',
      background: PALETTE.bg,
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{
        background: isError ? '#fff1f2' : PALETTE.surface,
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: `1px solid ${isError ? PALETTE.red : '#e0e0e0'}`,
      }}>
        <h1 style={{ fontSize: '20px', color: isError ? PALETTE.red : PALETTE.textMain }}>
          {text}
        </h1>
        {isError && (
          <Link href="/attendance" style={{ color: PALETTE.blue, marginTop: '20px', display: 'block' }}>
            Go Back
          </Link>
        )}
      </div>
    </div>
  );
}

function MarkAttendance() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [punchType, setPunchType] = useState<'IN' | 'OUT' | null>(null);
  const [statusText, setStatusText] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Store these in state to pass to the handleCapture function
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [location, setLocation] = useState<GeoSnapshot | null>(null);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'in') setPunchType('IN');
    else if (type === 'out') setPunchType('OUT');
    else setError("Invalid attendance type.");
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !punchType || !user) return;

    const runChecks = async () => {
      try {
        // 1. Load Profile
        setStatusText("Loading your profile...");
        const studentProfile = await loadStudentProfileByEmail(user.email);
        if (!studentProfile?.number) {
          setError("Student profile not found.");
          return;
        }
        setProfile(studentProfile);

        // 2. Check Today's Status
        setStatusText("Checking today's attendance status...");
        const status = await getTodayStatus(studentProfile.number);
        if (punchType === 'IN' && status.hasIn) {
          setError("You have already punched in today.");
          return;
        }
        if (punchType === 'OUT' && !status.hasIn) {
          setError("You must punch in before you can punch out.");
          return;
        }
        if (punchType === 'OUT' && status.hasOut) {
          setError("You have already punched out today.");
          return;
        }

        // 3. Get Geolocation
        setStatusText("Getting your location...");
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const { latitude, longitude, accuracy } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };

        // 4. Check Geofence
        setStatusText("Verifying your location...");
        const campus = BRANCH_LOCATIONS[studentProfile.branch || ''] || DEFAULT_CENTER;
        const distM = haversineMeters(userLoc, campus.center);

        if (distM > GEOFENCE_RADIUS_M) {
          setError(`You are ${Math.round(distM)}m away. You must be within ${GEOFENCE_RADIUS_M}m of ${campus.name} to punch.`);
          return;
        }

        // All checks passed!
        setStatusText("All checks complete. Opening camera...");
        setLocation({ ...userLoc, acc: accuracy, distM: Math.round(distM) });
        setShowCamera(true);

      } catch (err: any) {
        if (err.code === 1) setError("Location permission denied. Please enable it in your browser.");
        else setError(err.message || "An unknown error occurred.");
      }
    };

    runChecks();
  }, [user, authLoading, punchType]);

  const handleCapture = async (dataUrl: string) => {
    if (!profile || !profile.number || !punchType) {
      setError("An error occurred. Profile data is missing.");
      setShowCamera(false);
      return;
    }

    setStatusText(`Uploading selfie for Punch ${punchType}...`);
    setShowCamera(false); // Hide camera, show loading text

    try {
      const photoUrl = await uploadPhotoAsString(dataUrl, profile.number);

      if (punchType === 'IN') {
        await punchInOptimistic({
          number: profile.number,
          name: profile.name,
          meta: { branch: profile.branch, course: profile.course },
          loc: location || undefined,
          photoUrl: photoUrl,
        });
      } else {
        await punchOutOptimistic({
          number: profile.number,
          loc: location || undefined,
          photoUrl: photoUrl,
        });
      }
      
      setStatusText(`Successfully Punched ${punchType}!`);
      // Redirect back to the attendance page after a short delay
      setTimeout(() => router.push('/attendance'), 2000);

    } catch (err: any) {
      setError(err.message || "Failed to submit attendance.");
    }
  };

  // --- Render Logic ---

  if (showCamera) {
    return <CameraComponent onCapture={handleCapture} onCancel={() => router.push('/attendance')} />;
  }

  if (error) {
    return <StatusDisplay text={error} isError={true} />;
  }

  return <StatusDisplay text={statusText} />;
}

// Wrap the component in Suspense for useSearchParams
export default function MarkAttendancePage() {
  return (
    <Suspense fallback={<StatusDisplay text="Loading..." />}>
      <MarkAttendance />
    </Suspense>
  );
}
