// src/config/geo.ts

import { LatLng } from '@/utils/geo'; // We will create this util file next

// Updated radius to 10km (10,000 meters) as requested
export const GEOFENCE_RADIUS_M = 10000;

export const BRANCH_LOCATIONS: Record<string, { name: string; center: LatLng }> = {
  // Use the exact key that is stored in the student's 'branch' field
  "Bhayandar": {
    name: 'ABS Bhayandar',
    center: { lat: 19.41890950317244, lng: 72.8181867996178 },
  },
  // Added your new location. Change "Bhiwandi" if your data uses a different key.
  "Bhiwandi": {
    name: 'ABS Bhiwandi',
    center: { lat: 19.280002916468632, lng: 73.05493116068932 },
  },
  // ...other branches can be added here
};

export const DEFAULT_CENTER = {
  name: 'ABS Main',
  center: { lat: 19.41890950317244, lng: 72.8181867996178 },
};
