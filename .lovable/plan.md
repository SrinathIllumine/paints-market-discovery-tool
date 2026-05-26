
# Systematic Engagement & Discovery — Mobile App Upgrade

Convert the existing desktop-style Stage 1 flow into a mobile-first, app-shell experience, fix persistence, and add Stage 2 (Shortlist Clusters). Real Google Maps via the Google Maps Platform connector. Curated seed data is replaced by Google Places nearby search.

## Visual & layout system

- Mobile-first single-column app shell (max-w-md mx-auto), works on tablet/desktop as a centered "phone".
- Palette refresh in `src/styles.css`:
  - Background: off-white `oklch(0.99 0.005 90)`
  - Header panel: dark navy `oklch(0.22 0.04 250)` with white text
  - Body text: near-black; muted grays for secondary
  - Accent / critical: red `oklch(0.58 0.21 27)` for FABs, alerts, key actions
  - Remove the warm pastel system; keep typography (Instrument Serif display + Manrope body).
- New primitives in `src/components/app/`:
  - `AppShell.tsx` — sticky dark header + scrollable content + optional bottom action bar
  - `StageHeader.tsx` — blue/navy strip with welcome + breadcrumb + back chevron
  - `FAB.tsx` — red circular floating action button (bottom-right)
  - `TriggerCard.tsx` — minimal prompt card
  - `BubbleTile.tsx` — replaces current bubble (tap-target ≥ 64px, vertical stack)

## Routes (TanStack Start, file-based)

```
src/routes/
  index.tsx                       -> redirects to /stage-1
  stage-1/index.tsx               -> meta-clusters
  stage-1/$metaId.tsx             -> clusters under meta
  stage-1/$metaId.$clusterId.tsx  -> map (create / view cluster map)
  stage-1/saved.tsx               -> saved cluster maps list (entry to "Discover new")
  stage-2/index.tsx               -> meta-clusters filtered to those w/ ≥1 saved map
  stage-2/$metaId.tsx             -> clusters filtered to those w/ saved map
  stage-2/$metaId.$clusterId.tsx  -> Attractiveness scoring form
  stage-2/shortlist.tsx           -> ranked shortlist + toggle
```

Stage 2 routes render a "locked" empty state if no cluster maps exist yet. A bottom tab bar shows Stage 1 / Stage 2 (Stage 2 dimmed when locked).

## State & persistence (fix for the reset bug)

New `src/store/appStore.ts` — a small Zustand store persisted to `localStorage` via `zustand/middleware/persist` (key: `sed.v1`). Shape:

```ts
type Prospect = { id; name; lat; lng; placeId?; locality?; source: 'places' | 'manual' };
type ClusterMap = {
  metaId; metaName;
  clusterId; clusterName;
  prospects: Prospect[];
  selectedProspectIds: string[];   // pre-selected by default
  createdAt; updatedAt;
};
type Score = {
  potential: { size; demand; aov };
  access: { directConnections; referralPotential };
  service: { retailersAvailable; productAvailable };
  total: number;            // 0–100, computed
  shortlisted: boolean;
};
type AppState = {
  customMetaClusters; customClusters;
  clusterMaps: Record<clusterId, ClusterMap>;
  scores: Record<clusterId, Score>;
};
```

All previous in-component `useState` for selections moves into this store, so navigating away and back preserves the map — fixes the reset bug.

## Stage 1 — screen by screen

### S1: Meta-clusters (`/stage-1`)
- Sticky navy header: "Welcome Sunil Kumar / Let's map clusters in Panvel, Mumbai".
- Vertical list of bubble tiles. Smart filter: 5 Panvel-recommended + 3 adjacent (Commercial Real Estate, Institutional Construction, Renovation/Repair) — NOT the full 12.
- Tap → `/stage-1/$metaId`.
- Red FAB "+ Add Meta-Cluster" → bottom sheet. After create, auto-navigate into the new meta and immediately open the "Add Cluster" sheet (cluster → prospect chain).
- 2 small `TriggerCard`s at bottom.

### S2: Clusters (`/stage-1/$metaId`)
- Header shows meta name + back.
- Bubble/card hybrid list: recommended + few relevant.
- Tap cluster → `/stage-1/$metaId/$clusterId` (map).
- Red FAB "+ Add Cluster". After create, prompt: "Add first prospect?" → opens map screen with Add Prospect sheet.

### S3: Create Cluster Map (`/stage-1/$metaId/$clusterId`)
- Real Google Maps JS API loaded via `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, centered on Panvel (18.9894, 73.1175). Pan/zoom, default roadmap; small floating toggle for satellite.
- On first open (no `clusterMaps[clusterId]` in store):
  - Call `places/v1/places:searchNearby` (or `searchText` with cluster-specific query, e.g. "residential apartment projects Panvel") via gateway server function `src/lib/places.functions.ts`. Filter by `includedTypes` mapped from cluster (e.g. residential → real_estate_agency / lodging; industrial → warehouse, etc.).
  - Persist returned prospects to the store; mark all as selected.
- Pins: red for selected, gray outline for deselected. Tap pin → mini info card (name, locality, "Remove" / "Add back").
- Red FAB "+ Add Prospect" → bottom sheet with two modes:
  - Search (Places `AutocompleteSuggestion` browser API) → adds with placeId/lat/lng
  - Drop pin: tap-on-map mode → opens form for name only, lat/lng from tap
- Bottom action bar: "Save Cluster Map" (red). Save writes to store and navigates to saved-map view.
- Re-entering the route reads from store → map persists, no refetch.

### Saved cluster map view
- Read-only map, summary card (cluster name, # prospects, top localities).
- Two CTAs:
  - "Discover a New Cluster" → `/stage-1/$metaId` (same meta's cluster list)
  - "Back to Stages"
- No "Edit Map" button.

## Stage 2 — Shortlist Clusters

Unlocked once `Object.keys(clusterMaps).length >= 1`. When locked, route renders a centered card with red lock icon and "Save at least one Cluster Map to unlock".

### S4 `/stage-2` — Meta-clusters filtered
Derived from `clusterMaps`: only metas with ≥1 saved map.

### S5 `/stage-2/$metaId` — Clusters filtered
Only clusters with a saved map.

### S6 `/stage-2/$metaId/$clusterId` — Attractiveness exercise
Card-based form, all tap-selection except 2 numeric inputs.

1. Potential
   - Size: Small / Medium / Large (segmented)
   - Demand frequency: Low / Moderate / High
   - Avg order value: Low / Medium / High
2. Access
   - Direct connections (stepper numeric input)
   - Referral potential (stepper numeric input)
3. Service Delivery Capacity
   - Retailers/painters available: Yes / No
   - Product availability: Yes / No

Live score badge updates as user taps. Persist to `scores[clusterId]`.

### Scoring engine (`src/lib/scoring.ts`)
- Potential (40): size {S:5,M:10,L:15} + demand {L:5,M:10,H:15} + aov {L:3,M:6,H:10} → normalize to 0–40.
- Access (30): connections capped at 20 → (n/20)*15; referral capped at 10 → (n/10)*15.
- Service (30): retailers 15 + product 15 (each Yes = full, No = 0).
- Total 0–100.

### Final shortlist (`/stage-2/shortlist`)
- List of all scored clusters, sorted desc by total.
- Each row: cluster name (bold), meta-cluster (small caption), score chip (color-graded), shortlist toggle (red when on).
- Bottom bar: count of shortlisted + "Done" (no-op for now; future stages locked card).

## Google Maps Platform integration

- Action: call `standard_connectors--connect` with `google_maps` so `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`, `LOVABLE_API_KEY`, and `GOOGLE_MAPS_API_KEY` are available.
- Browser: `src/lib/googleMaps.ts` — single async loader using `loading=async&callback=initMap&channel=...`. Use `google.maps.Marker` (not AdvancedMarker), no `mapId`.
- Server fn: `src/lib/places.functions.ts` — `searchNearbyForCluster({ lat, lng, clusterKeyword, includedTypes })` proxying `places/v1/places:searchNearby` through the gateway with `X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location`. Called once per cluster, result cached in store.
- Cluster → Places type/keyword map lives in `src/data/clusterPlaces.ts`.

## Files to create / change

Create:
- `src/components/app/{AppShell,StageHeader,FAB,BottomBar,TriggerCard,BubbleTile,Sheet,SegmentedControl,Stepper,ScoreChip}.tsx`
- `src/components/maps/{GoogleMap,MapPin,AddProspectSheet}.tsx`
- `src/lib/googleMaps.ts`, `src/lib/places.functions.ts`, `src/lib/scoring.ts`
- `src/store/appStore.ts`
- `src/data/clusterPlaces.ts` (cluster id → Places query/types)
- `src/routes/stage-1/{index,saved}.tsx`, `src/routes/stage-1/$metaId.tsx`, `src/routes/stage-1/$metaId.$clusterId.tsx`
- `src/routes/stage-2/{index,shortlist}.tsx`, `src/routes/stage-2/$metaId.tsx`, `src/routes/stage-2/$metaId.$clusterId.tsx`

Edit:
- `src/routes/index.tsx` → redirect to `/stage-1`
- `src/routes/__root.tsx` → ensure mobile viewport meta + Manrope/Instrument Serif (already there), add Google Maps callback shim
- `src/styles.css` → new palette tokens
- `src/data/clusters.ts` → keep names, drop x/y, add `panvelRecommended` flag; trim Stage 1 listing logic

Delete (obsolete):
- `src/components/stage1/{Bubble,Header,MetaClusterStep,ClusterStep,ProspectStep,SummaryStep,ThinkingTriggers,MapView,AddItemDialog}.tsx` — replaced by app/ components and new route files

## Dependencies
- `bun add zustand` (persistence store)

## Out of scope
- Auth, multi-user, real backend DB (localStorage only)
- Stages 3–5
- Editing a saved cluster map (per spec: "Remove Edit Map")
- Offline map tiles
