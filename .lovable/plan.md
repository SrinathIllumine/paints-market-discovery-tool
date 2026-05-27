## Goals

Address five issues across Map, Cluster Detail, and Plan screens.

## 1. Map page — bubbles instead of list

Replace the vertical `ClusterCard` list in `src/routes/map/index.tsx` with a circular bubble grid (the older "bubble" style). Each bubble shows the cluster name (and a tiny H/M/L pill), sized consistently, in a 2-column grid that scrolls vertically. Tap navigates to `/map/$clusterId`. A small "N contacts" badge appears on bubbles that already have stakeholders.

Recreate a lightweight `src/components/app/BubbleCircle.tsx` (deleted earlier) for this. `ClusterCard.tsx` stays only if reused elsewhere; otherwise remove.

## 2. Cluster detail page — fix crash and restore card

Current `src/routes/map/$clusterId.tsx` mounts `GoogleMap` immediately and auto-calls the Places server function. The likely crash cause is the Places server fn throwing (Maps not loaded yet / network) and the unhandled rejection propagating, plus the map rendering before the script is ready. Fix:

- Wrap the auto Places fetch in defensive try/catch and don't block render on it (it already does, but also guard the case where `cluster.placesQuery` is missing).
- Defer `GoogleMap` mount until the map section actually scrolls into view OR simply render a placeholder if `loadGoogleMaps` rejects.
- Add an `errorComponent` to the route so any thrown error renders a readable fallback inside `AppShell` instead of crashing the app.
- Keep the existing card structure (Nature, Market Potential, JK Share, Demand Classification, Geo View, Stakeholders, CTA) — that matches the previous spec.

## 3. Vertical scroll on every screen

`AppShell`'s `<main>` already has `overflow-y-auto`. Audit and fix screens that break it:
- `src/routes/connects/$clusterId.tsx` uses `sticky top-[124px]` for the tab bar — replace with a normal (non-sticky) tab bar so scrolling works cleanly on all viewports.
- Ensure every route returns its content inside `AppShell` with `pb-24` so the bottom nav doesn't cover content (already the case in shell; just verify per-route padding).
- Index, Map, Cluster Detail, Connects list, Connects detail, Plan — all confirmed to use `AppShell`; just sanity-check no fixed-height container blocks scroll.

## 4. Outreach Plan — collapsible cards, collapsed by default

Refactor `src/routes/plan/index.tsx` to wrap each of the 4 sections (Target clusters, How to connect, Contribution events, Service delivery readiness) in shadcn `Accordion` (type="multiple", `defaultValue={[]}`), so all collapse by default and the user expands what they need. Section header shows title + a small count/summary (e.g. "3 selected", "2 events", "1 gap").

## 5. Remove scores everywhere

- `Plan` ranked list: remove the literal "Score {n}" line; keep `{stkCount} contacts` and the recommended-star on top. Ranking logic stays internal (used only to sort).
- Search the codebase for any other "Score" / numeric-score UI and replace with H/M/L labels via `POTENTIAL_LABEL`. Confirmed sites: `Plan` page only; `POTENTIAL_LABEL` is already used elsewhere.
- No score column appears on Map bubbles either (only the H/M/L pill).

## Files

Edit:
- `src/routes/map/index.tsx` — bubble grid layout
- `src/routes/map/$clusterId.tsx` — defensive Places fetch + route `errorComponent`
- `src/routes/connects/$clusterId.tsx` — remove `sticky`
- `src/routes/plan/index.tsx` — Accordion sections, drop "Score" text

Create:
- `src/components/app/BubbleCircle.tsx`

Delete (only if unused after edits):
- `src/components/app/ClusterCard.tsx`

## Out of scope

No data model changes, no new backend, no auth changes.
