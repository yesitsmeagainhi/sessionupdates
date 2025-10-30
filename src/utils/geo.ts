// src/utils/geo.ts

export type LatLng = { lat: number; lng: number };

/**
 * Calculates the distance between two lat/lng points in meters
 * using the Haversine formula.
 * @param p1 First point with latitude and longitude.
 * @param p2 Second point with latitude and longitude.
 * @returns The distance between the two points in meters.
 */
export function haversineMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = p1.lat * Math.PI / 180; // φ, λ in radians
  const φ2 = p2.lat * Math.PI / 180;
  const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
  const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}