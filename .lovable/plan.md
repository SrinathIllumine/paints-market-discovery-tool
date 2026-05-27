# Implementation Plan

## 1. Clickable home cards + new Insights page
- `src/routes/index.tsx`: wrap each of the 3 prop cards in `<Link>`:
  - "Create a cluster map" → `/map`
  - "Build a structured outreach plan" → `/plan`
  - "Track local market intelligence" → `/insights`
- Create `src/routes/insights.tsx` (new route) — Stage-styled page with three sections:
  - **Market Insights from Marketing Executives** — preset card with the MMRDA redevelopment insight.
  - **Market Insights from Retailers** — preset cards (Khopoli schools repainting, waterproofing pre-monsoon).
  - **Your insights** — text area + "Add insight" button; insights stored in `useAppStore` (new `insights: { id, text, createdAt }[]` slice, persisted).
- `src/components/app/BottomNav.tsx`: add a 4th tab `Insights` (e.g. `Lightbulb` icon) → grid becomes `grid-cols-4`.

## 2. Market Map page — remove H/M/L tags
- `src/components/app/BubbleCircle.tsx`: remove the H/M/L pill badge and the `ring`-by-potential coloring (use a single neutral ring style). Keep the cluster name + contacts badge.
- `src/routes/map/index.tsx`: unchanged structurally.

## 3. Cluster page header carries the nature
- `src/data/clusters.ts`: add a short `nature` string per cluster (e.g. Residential Construction → "Residential Construction" / "Mid-size apartments & affordable housing"). Use existing `description` as the source; add a new concise `nature` field where the existing text is too long.
- `src/routes/map/$clusterId.tsx`:
  - Pass `subtitle={cluster.nature}` to `StageHeader` (replacing the current "High potential · N prospects" line — move prospect count into the Market Potential card only).
  - **Delete** the `Nature & Description` Section entirely.

## 4. Market Potential reasoning bullets
- `src/data/clusters.ts`: add `potentialReasons: string[]` (3–4 items) per cluster. Seed Residential Construction with the 4 example points; write equivalent concrete points for each other cluster.
- `src/routes/map/$clusterId.tsx` Market Potential section: render the H/M/L pill + `cs.prospects.length` count, plus a bulleted list of `cluster.potentialReasons`.

## 5. Remove JK Share & Demand Classification cards
- `src/routes/map/$clusterId.tsx`: delete the `Your JK Share here` and `Demand Classification` Sections.
- Keep `setJkShare` in the store (used by plan ranking) but it simply won't be set from this page — ranking falls back to potential + stakeholder count.

## 6. Show ALL prospects + regional segmentation
- `src/lib/places.functions.ts`: remove the 3-page cap. Loop until no `nextPageToken` (safety cap ~10 pages). Also accept a larger `radiusMeters` (default 20–25km to cover Panvel + Khopoli neighborhood) — keep default but allow override.
- Add a small **clustering helper** `src/lib/regions.ts`: takes prospects + `k` (3–5), runs a deterministic k-means (seeded by lat/lng quantiles) on `(lat,lng)`, returns `{ regionId, label, color, centroid, prospects[] }[]`. Region labels derived from nearest locality token from `formattedAddress` (fallback `Region A/B/C…`). Color palette: 5 distinct semantic colors added to `src/styles.css`.
- `src/components/maps/GoogleMap.tsx`:
  - Accept new prop `regions: Region[]` and `panvelBoundary: LatLng[]` (optional).
  - Color each marker by its region.
  - Draw dotted polygon/convex-hull per region using `google.maps.Polygon` with `strokeOpacity:0` + `icons` dashed pattern (standard Google Maps dotted-line trick).
  - Draw an overall dotted Panvel boundary polygon (hardcoded ~8-point polygon around Panvel taluka in `src/data/panvelBoundary.ts`).
- `src/routes/map/$clusterId.tsx`:
  - Compute `regions = useMemo(() => groupIntoRegions(cs.prospects, 4), [cs.prospects])`.
  - Pass `regions` and the Panvel boundary to `<GoogleMap>`.
  - Replace the single "All prospects" Accordion with **one Accordion per region** (collapsed by default), each showing region color dot, name, count and the list of prospects (reusing the existing row UI).

## 7. Event topics by cluster × type
- `src/data/eventTopics.ts` (new): `Record<clusterId, Record<EventType, string[]>>` seeded with realistic topics. Example for `residential / Awareness`: the two strings in the request. Provide 2–4 topics per cluster/type combo.
- `src/routes/plan/index.tsx` Add-event dialog:
  - After Type buttons, render a "Topic" list (radio buttons / clickable chips) sourced from `eventTopics[clusterId][type]`. Allow "Other" → free text falls back to existing `note` field.
  - Persist topic on the event: extend `PlanEvent` with `topic?: string` in `src/store/appStore.ts`; show it in the event row.

## 8. Service Delivery Readiness cleanup
- `src/store/appStore.ts`: remove `trained` from `Readiness` type, `emptyReadiness`, and the setter shape (or keep type but stop rendering it — simpler: keep field, drop UI).
- `src/routes/plan/index.tsx`:
  - Delete the 4th `ReadinessRow` ("trained").
  - Update `gapsCount` to only consider `retailers | stock | painters`.
  - Remove the `gaps` / `All set` label in the AccordionTrigger — keep only the section title.

## 9. "Generate report for outreach plan" PDF
- Add `jspdf` (well-supported in browser; no native deps): `bun add jspdf`.
- `src/lib/planReport.ts` (new): function `generatePlanReportPdf(state)` that pulls from `useAppStore` and renders:
  - Title + generation date.
  - **Target clusters** with potential + contact count.
  - **How to connect** bullets per target.
  - **Contribution events** table (Cluster · Type · Topic · Date · Note).
  - **Service delivery readiness** matrix (3 questions × clusters).
  - Saves as `JK-Outreach-Plan-YYYY-MM-DD.pdf`.
- `src/routes/plan/index.tsx`: add a primary `Button` at the bottom of the page ("Generate report for outreach plan") that calls the helper.

## Technical notes
- Region clustering: lightweight k-means in pure TS (~50 lines), deterministic seeding via sorted quantiles so the same input always yields the same regions.
- Dotted polygon trick on Google Maps: zero `strokeOpacity` + `icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity:1, scale:3 }, offset: '0', repeat:'15px' }]`.
- The Khopoli schools insight is informational only — no schema changes needed for Insights other than the new persisted store slice.
- All new colors (region palette) go into `src/styles.css` as semantic tokens.
- No backend / migration changes.
