import type { EventType } from "@/store/appStore";

export const EVENT_TOPICS: Record<string, Partial<Record<EventType, string[]>>> = {
  "mid-apartments": {
    Workshop: [
      "Site engineer workshop on premium finishing techniques",
      "Hands-on demo of texture and accent wall application",
    ],
    Audit: [
      "Free paint audit for completed-but-unsold inventory",
      "Quality audit of ongoing tower's external paint job",
    ],
    Awareness: [
      "Conduct an awareness session on waterproofing solutions before monsoon commences",
      "Conduct an awareness session for societies with new designs & wallpapers",
      "Healthy-home awareness drive on low-VOC paints for families",
    ],
    "Contractor Meet": [
      "Contractor meet for upcoming tower finishing schedules",
      "Painter loyalty meet with new product launches",
    ],
  },
  redevelopment: {
    Workshop: [
      "Finishing-quality workshop for redevelopment site engineers",
      "Demo on premium exteriors for handover-ready towers",
    ],
    Audit: ["Pre-handover paint audit for redeveloped towers"],
    Awareness: [
      "Awareness session for displaced societies on new finishes available at handover",
      "Awareness on waterproofing for newly redeveloped buildings before monsoon",
    ],
    "Contractor Meet": ["Contractor meet for redevelopment finishing schedules"],
  },
  "gated-community": {
    Workshop: ["Premium finishes workshop for township site teams"],
    Audit: ["Common-area repaint audit for gated townships"],
    Awareness: [
      "Awareness session for RWAs on premium exteriors & waterproofing",
      "Designer wallpaper & texture awareness for premium homeowners",
    ],
    "Contractor Meet": ["Township painter & contractor loyalty meet"],
  },
  schools: {
    Workshop: ["Maintenance planning workshop for school admins"],
    Audit: ["Free paint audit for vacation-cycle planning"],
    Awareness: [
      "Awareness session on child-safe, low-VOC paints for trustees",
      "Awareness on washable anti-bacterial finishes for classrooms",
    ],
    "Contractor Meet": ["Painter meet for vacation-cycle execution"],
  },
  colleges: {
    Workshop: ["Hostel repainting & durable-finish workshop"],
    Audit: ["Campus-wide annual maintenance paint audit"],
    Awareness: ["Awareness on long-life exteriors for large campus buildings"],
    "Contractor Meet": ["AMC contractor meet for college campuses"],
  },
  hospitals: {
    Workshop: ["Antimicrobial finish application workshop"],
    Audit: ["Ward-wise repainting condition audit"],
    Awareness: [
      "Awareness session on washable hygienic finishes for hospitals",
      "Awareness on anti-bacterial paints for critical care areas",
    ],
    "Contractor Meet": ["Healthcare-focused contractor meet"],
  },
  restaurants: {
    Workshop: ["Quick-turnaround low-odour paint workshop for F&B fit-out crews"],
    Audit: ["Interior refresh audit for restaurant chains"],
    Awareness: ["Awareness session on themed wallpapers & textures for restaurants"],
    "Contractor Meet": ["F&B interior contractor meet"],
  },
  hotels: {
    Workshop: ["Premium interior finishes workshop for hotel teams"],
    Audit: ["Refurbishment paint audit for hotel rooms & lobbies"],
    Awareness: ["Awareness session on luxury finishes & wallpapers for hospitality"],
    "Contractor Meet": ["Hospitality interior contractor meet"],
  },
  midc: {
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
  "marriage-halls": {
    Workshop: ["Quick-turnaround repaint workshop for banquet venues"],
    Audit: ["Pre-season repaint audit for marriage halls"],
    Awareness: ["Awareness session on themed wallpapers & accent walls for venues"],
    "Contractor Meet": ["Banquet-focused contractor meet"],
  },
  "paying-guest": {
    Workshop: ["Quick room-repaint workshop for PG operators"],
    Audit: ["Room turnover paint audit for PG facilities"],
    Awareness: ["Awareness on washable, stain-resistant paints for high-churn rooms"],
    "Contractor Meet": ["Painter meet for PG operators"],
  },
  religious: {
    Workshop: ["Festival-ready repaint workshop for trust committees"],
    Audit: ["Pre-festival paint condition audit"],
    Awareness: ["Awareness session on long-life exteriors for religious buildings"],
    "Contractor Meet": ["Painter meet for temple & trust committees"],
  },
  "auto-showrooms": {
    Workshop: ["Brand-livery finishing workshop for showroom crews"],
    Audit: ["OEM-standard refresh audit for showrooms"],
    Awareness: ["Awareness on premium interior finishes for auto retail"],
    "Contractor Meet": ["Showroom fit-out contractor meet"],
  },
  "petrol-pumps": {
    Workshop: ["Canopy & forecourt repaint workshop"],
    Audit: ["Brand-livery condition audit for fuel stations"],
    Awareness: ["Awareness on weather-resistant coatings for canopies"],
    "Contractor Meet": ["Fuel-station painter meet"],
  },
  "bus-stand-market": {
    Workshop: ["Shopfront repaint workshop for local market shops"],
    Audit: ["Shop-row paint condition audit"],
    Awareness: ["Awareness session for shop owners on durable shopfront finishes"],
    "Contractor Meet": ["Local painter meet near bus stand market"],
  },
  "highway-dhabas": {
    Workshop: ["Quick repaint workshop for dhaba & highway hotel owners"],
    Audit: ["Highway-facing facade paint audit"],
    Awareness: ["Awareness on dust- & weather-resistant exteriors for highway properties"],
    "Contractor Meet": ["Highway painter meet"],
  },
  "clinics-nursing": {
    Workshop: ["Washable hygienic finish workshop for clinics"],
    Audit: ["Repaint audit for nursing home wards"],
    Awareness: ["Awareness on anti-bacterial paints for local clinics"],
    "Contractor Meet": ["Healthcare painter meet"],
  },
  jewellery: {
    Workshop: ["Premium interior finishes workshop for jewellery showrooms"],
    Audit: ["AMC paint audit for jewellery retail interiors"],
    Awareness: ["Awareness session on luxury textures & wallpapers for jewellery retail"],
    "Contractor Meet": ["Jewellery interior contractor meet"],
  },
  "textile-garment": {
    Workshop: ["Quick-turnaround interior repaint workshop for garment shops"],
    Audit: ["Seasonal refresh audit for textile retail"],
    Awareness: ["Awareness on themed wallpapers & accent walls for apparel retail"],
    "Contractor Meet": ["Retail painter meet for garment market"],
  },
};

export function getTopics(clusterId: string, type: EventType): string[] {
  return EVENT_TOPICS[clusterId]?.[type] ?? [];
}
