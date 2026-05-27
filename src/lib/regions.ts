import type { Prospect } from "@/store/appStore";

export type Region = {
  id: string;
  label: string;
  color: string;
  centroid: { lat: number; lng: number };
  prospects: Prospect[];
};

// Fixed Panvel sub-areas — each prospect is assigned to the nearest center.
// This guarantees unique, recognisable region names instead of repeated tokens.
type SubArea = { id: string; label: string; color: string; lat: number; lng: number };

const PANVEL_SUB_AREAS: SubArea[] = [
  { id: "old-panvel", label: "Old Panvel", color: "#dc2626", lat: 18.9894, lng: 73.1175 },
  { id: "new-panvel", label: "New Panvel", color: "#2563eb", lat: 19.0050, lng: 73.1180 },
  { id: "kharghar", label: "Kharghar", color: "#16a34a", lat: 19.0470, lng: 73.0690 },
  { id: "kamothe", label: "Kamothe", color: "#d97706", lat: 19.0220, lng: 73.0850 },
  { id: "kalamboli", label: "Kalamboli", color: "#7c3aed", lat: 19.0330, lng: 73.0990 },
  { id: "taloja", label: "Taloja MIDC", color: "#0891b2", lat: 19.0780, lng: 73.1050 },
];

export function groupIntoRegions(prospects: Prospect[]): Region[] {
  if (prospects.length === 0) return [];

  const buckets = new Map<string, Prospect[]>();
  for (const p of prospects) {
    let bestId = PANVEL_SUB_AREAS[0].id;
    let bestD = Infinity;
    for (const a of PANVEL_SUB_AREAS) {
      const dx = p.lat - a.lat;
      const dy = p.lng - a.lng;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        bestId = a.id;
      }
    }
    if (!buckets.has(bestId)) buckets.set(bestId, []);
    buckets.get(bestId)!.push(p);
  }

  return PANVEL_SUB_AREAS.filter((a) => buckets.has(a.id)).map((a) => ({
    id: a.id,
    label: a.label,
    color: a.color,
    centroid: { lat: a.lat, lng: a.lng },
    prospects: buckets.get(a.id)!,
  }));
}

// Convex hull (Andrew's monotone chain) for polygon outline.
export function convexHull(points: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (points.length < 3) return points;
  const pts = [...points].sort((a, b) => (a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng));
  const cross = (
    o: { lat: number; lng: number },
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower: typeof pts = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: typeof pts = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
