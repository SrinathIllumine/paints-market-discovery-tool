import type { Prospect } from "@/store/appStore";

export type Region = {
  id: string;
  label: string;
  color: string;
  centroid: { lat: number; lng: number };
  prospects: Prospect[];
};

const PALETTE = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

function deriveLabel(prospects: Prospect[], fallback: string): string {
  // pick most-frequent locality token (last meaningful word before pincode)
  const counts = new Map<string, number>();
  for (const p of prospects) {
    const addr = p.locality ?? "";
    // strip pincode + state
    const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
    // pick second-to-last (often suburb/town)
    const token = parts[parts.length - 3] ?? parts[parts.length - 2] ?? parts[0];
    if (!token) continue;
    const clean = token.replace(/\d{4,}/g, "").replace(/Maharashtra|India/gi, "").trim();
    if (!clean || clean.length < 3) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = k;
    }
  }
  return best ?? fallback;
}

// Deterministic k-means on lat/lng.
export function groupIntoRegions(prospects: Prospect[], k = 4): Region[] {
  if (prospects.length === 0) return [];
  const targetK = Math.min(k, Math.max(1, prospects.length));

  // Seed centroids from quantiles of lat+lng combined ordering for determinism.
  const sorted = [...prospects].sort((a, b) => a.lat + a.lng - (b.lat + b.lng));
  const centroids = Array.from({ length: targetK }, (_, i) => {
    const idx = Math.floor(((i + 0.5) / targetK) * sorted.length);
    const p = sorted[Math.min(idx, sorted.length - 1)];
    return { lat: p.lat, lng: p.lng };
  });

  let assignments = new Array<number>(prospects.length).fill(0);
  for (let iter = 0; iter < 30; iter++) {
    // assign
    const next = prospects.map((p) => {
      let bestI = 0;
      let bestD = Infinity;
      for (let i = 0; i < centroids.length; i++) {
        const dx = p.lat - centroids[i].lat;
        const dy = p.lng - centroids[i].lng;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      return bestI;
    });
    const changed = next.some((v, i) => v !== assignments[i]);
    assignments = next;
    if (!changed && iter > 0) break;

    // update
    const sums = centroids.map(() => ({ lat: 0, lng: 0, n: 0 }));
    prospects.forEach((p, i) => {
      const c = sums[assignments[i]];
      c.lat += p.lat;
      c.lng += p.lng;
      c.n += 1;
    });
    for (let i = 0; i < centroids.length; i++) {
      if (sums[i].n > 0) {
        centroids[i] = { lat: sums[i].lat / sums[i].n, lng: sums[i].lng / sums[i].n };
      }
    }
  }

  const groups: Prospect[][] = centroids.map(() => []);
  prospects.forEach((p, i) => groups[assignments[i]].push(p));

  // Drop empty groups
  return groups
    .map((list, i) => ({ list, color: PALETTE[i % PALETTE.length], centroid: centroids[i], idx: i }))
    .filter((g) => g.list.length > 0)
    .map((g, i) => ({
      id: `region-${i}`,
      label: deriveLabel(g.list, `Region ${String.fromCharCode(65 + i)}`),
      color: g.color,
      centroid: g.centroid,
      prospects: g.list,
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
