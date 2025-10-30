// src/config/geo.ts

import { LatLng } from '@/utils/geo'; // We will create this util file next

export const GEOFENCE_RADIUS_M = 50; // Or 250m if GPS is noisy

export const BRANCH_LOCATIONS: Record<string, { name: string; center: LatLng }> = {
  // Use the exact key that is stored in the student's 'branch' field
  "Bhayandar": {
    name: 'ABS Bhayandar',
    center: { lat: 19.41890950317244, lng: 72.8181867996178 },
  },
  // ...other branches
};

export const DEFAULT_CENTER = {
  name: 'ABS Main',
  center: { lat: 19.41890950317244, lng: 72.8181867996178 },
};