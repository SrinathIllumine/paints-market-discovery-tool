import type { EventType } from "@/store/appStore";

export const EVENT_TOPICS: Record<string, Partial<Record<EventType, string[]>>> = {
  residential: {
    Workshop: [
      "Site engineer workshop on premium finishing techniques",
      "Hands-on demo of texture and accent wall application",
    ],
    Audit: [
      "Free paint audit for completed-but-unsold inventory",
      "Quality audit of ongoing tower's external paint job",
    ],
    Awareness: [
      "Create an awareness session on water-proofing methods before the monsoon season commences",
      "Educate housing societies with new designs & wallpapers",
      "Healthy-home awareness drive on low-VOC paints for families",
    ],
    "Contractor Meet": [
      "Contractor meet for upcoming township finishing schedules",
      "Painter loyalty meet with new product launches",
    ],
  },
  industrial: {
    Workshop: ["Industrial coating durability workshop for facility teams"],
    Audit: ["Plant-wide maintenance painting audit", "Shed roofing & wall coating audit"],
    Awareness: ["Awareness on protective coatings for chemical exposure areas"],
    "Contractor Meet": ["MIDC civil contractor meet"],
  },
  warehousing: {
    Workshop: ["Floor coating + wall finish bundled workshop"],
    Audit: ["Warehouse repaint-cycle audit"],
    Awareness: ["Awareness on durable coatings reducing repaint frequency"],
    "Contractor Meet": ["PEB contractor meet"],
  },
  "retail-malls": {
    Workshop: ["Quick-turnaround low-VOC application workshop for fit-out crews"],
    Audit: ["Common-area refresh audit for facility heads"],
    Awareness: ["Awareness on low-odour paints for live retail environments"],
    "Contractor Meet": ["Retail fit-out contractor meet"],
  },
  offices: {
    Workshop: ["Texture & accent wall workshop for interior designers"],
    Audit: ["AMC repainting audit for office buildings"],
    Awareness: ["Low-VOC indoor air-quality awareness for facility admins"],
    "Contractor Meet": ["Interior contractor meet"],
  },
  schools: {
    Workshop: ["Maintenance planning workshop for school admins"],
    Audit: ["Free paint audit for vacation-cycle planning"],
    Awareness: [
      "Child-safe paints awareness session for trustees",
      "Repainting demand spike awareness for Khopoli area schools",
    ],
    "Contractor Meet": ["Painter meet for vacation-cycle execution"],
  },
  hospitals: {
    Workshop: ["Antimicrobial finish application workshop"],
    Audit: ["Ward-wise repainting condition audit"],
    Awareness: ["Awareness on washable hygienic finishes"],
    "Contractor Meet": ["Healthcare-focused contractor meet"],
  },
  bazaar: {
    Workshop: ["Mixing & application workshop for local painters"],
    Audit: ["Dealer stock-rotation audit"],
    Awareness: ["New SKU awareness session for dealers"],
    "Contractor Meet": ["Painter / mistri meet with samples and tea"],
  },
};

export function getTopics(clusterId: string, type: EventType): string[] {
  return EVENT_TOPICS[clusterId]?.[type] ?? [];
}
