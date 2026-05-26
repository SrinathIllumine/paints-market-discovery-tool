import type { Score } from "@/store/appStore";

const SIZE = { S: 5, M: 10, L: 15 } as const;
const DEMAND = { L: 5, M: 10, H: 15 } as const;
const AOV = { L: 3, M: 6, H: 10 } as const;

export function computeScore(s: Score): {
  potential: number;
  access: number;
  service: number;
  total: number;
} {
  const sizeV = s.potential.size ? SIZE[s.potential.size] : 0;
  const demandV = s.potential.demand ? DEMAND[s.potential.demand] : 0;
  const aovV = s.potential.aov ? AOV[s.potential.aov] : 0;
  // Raw 0-40. Max = 15+15+10 = 40.
  const potential = sizeV + demandV + aovV;

  const conn = Math.min(s.access.directConnections, 20);
  const ref = Math.min(s.access.referralPotential, 10);
  const access = Math.round((conn / 20) * 15 + (ref / 10) * 15);

  const service =
    (s.service.retailersAvailable ? 15 : 0) + (s.service.productAvailable ? 15 : 0);

  const total = potential + access + service;
  return { potential, access, service, total };
}

export function scoreBand(total: number): { label: string; tone: "high" | "mid" | "low" } {
  if (total >= 70) return { label: "High", tone: "high" };
  if (total >= 40) return { label: "Medium", tone: "mid" };
  return { label: "Low", tone: "low" };
}
