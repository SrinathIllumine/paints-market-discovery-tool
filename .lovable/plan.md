
# Plan

A large multi-part restructure. I'll keep all logic frontend-only (scoring runs in `src/lib/clusterScoring.ts` as deterministic helpers — "backend intelligence" simulated client-side).

## 1. Navigation & shell

- **Delete** `src/routes/connects/index.tsx` and `src/routes/connects/$clusterId.tsx` (Connects page removed).
- **Sales Enablement**: rename route from `/insights` → `/sales-enablement`. Empty the page body (just header + "Coming soon" notice). Disable bottom-nav entry (greyed, tooltip "Coming soon"), same pattern as Connects today.
- **Handhold Customers** (new): add `/handhold` route → disabled "Coming soon" page. Add disabled bottom-nav entry.
- `BottomNav` slots become: Cluster Potential · Cluster Engagement · Sales Enablement (disabled) · Handhold (disabled). Drop the disabled "Connects" entry.

## 2. Home page (`src/routes/index.tsx`)

- Update Sales Enablement card: new description, disabled (no nav, greyed visual, "Coming soon" pill), but `to="/sales-enablement"` for when enabled.
- Add new disabled card "Handhold Customers" — "Handhold the customers post-sales."
- Remove the "Start with Market Map" CTA button.
- First card label remains the same but its `to` still goes to `/map`.

## 3. Cluster Potential (renamed from Market Map)

- **Renames**: `StageHeader` eyebrow/title, `BottomNav` label, `<title>` meta. The route stays `/map` (keeps state/URLs stable); label everywhere becomes "Cluster Potential". "View my Market Map" CTA → "View my Cluster Map".
- **Cluster card (`/map/$clusterId`)**:
  - Remove "Market Potential" section.
  - Remove "Key points to consider before shortlisting".
  - Remove the shortlist/remove button at bottom.
  - In Geo View + List view: remove per-prospect select/deselect. Default = all prospects included. Strip `selectedProspectIds` UI affordances.
  - Bump Places search limits: server fn already returns up to ~60; raise `pageSize` / loop pages until all are returned (max 3 pages = ~60 hard cap from Places API; document this in code comments). Drop any client-side truncation.
  - **Replace shortlist button** with a "Save cluster potential" action that records the 4-section scores into store and adds the cluster to `targetClusterIds` automatically.
- **New 4 sub-sections below List View**, in this order:
  - **a. Cluster Revenue Potential** — auto-calculated. Per cluster, define `avgRevenuePerProspect` based on cluster type (schools ~₹8L, factories ~₹40L, houses/PG ~₹1.5L, gated/redevelopment ~₹15L, etc.) inside a new `CLUSTER_REVENUE_PROFILE` map in `src/lib/clusterScoring.ts`. Show: avg revenue/prospect with sq.ft band, total prospects, total revenue potential, market-potential rank.
  - **b. Cluster Access** — two parts:
    - Access Capability: 2–3 yes/no questions, generated per cluster from a `getAccessQuestions(clusterId)` helper (school touchpoints differ from MIDC touchpoints).
    - Ranking radio: A / B / C with the descriptions listed.
  - **c. Competitive Strength** — 3–4 yes/no questions generated per cluster (grammar-checked, cluster-specific wording). Score 1-10 based on % "yes".
  - **d. Ease of Sale** — auto. Each cluster maps to an avg cycle time (e.g. PG: 1-2 weeks, schools: 2 months, MIDC/warehousing: 6 months, gated: 4 months). Display cycle + one-liner explanation.
- **Aggregate "Cluster Potential" score**: 4 sub-scores (each /10), equal 25% weight → /10. Persist per cluster in store as `clusterAssessments`.

## 4. View my Cluster Map (`/market-potential`)

Two new sections (replace existing content):
- **Cluster Snapshot**: 2×2 matrix (SVG). X-axis = Access (avg of access score + ease-of-sale score). Y-axis = Potential (avg of revenue score + competitive strength). Plot dot per scored cluster, labeled.
- **Cluster Potential**: list cards (descending overall score) showing 4 sub-scores + overall. If <2 scored clusters → alert "Map the potential for more clusters to rank them for comparison".
- Backed by the new `clusterAssessments` slice. Only clusters with a completed assessment appear.

## 5. Cluster Engagement Plan (`/plan`)

- Step 1 "Focus": same UI, but sort options by aggregate cluster potential desc (fallback potential H/M/L when no score).
- Step 2 "Design your connect strategy": replace `CONNECT_MODEL_OPTIONS` with 4 strategies — Brand-driven, Contractor-driven, Outreach-driven, D2C-driven. Per-strategy follow-up forms:
  - Brand-driven: yes/no "Do you want to run local campaigns?" + (if yes) free-text campaign idea.
  - Contractor-driven: yes/no "Do you already know contractors?" + repeatable contractor list (name/phone/area).
  - Outreach-driven: yes/no "Do you have a touchpoint in the community?", yes/no "Considered contribution events?" + cluster-relevant event suggestions from `src/data/eventTopics.ts`.
  - D2C-driven: yes/no "Do you want to directly reach end customers?" + channel checkboxes (WhatsApp, walk-in, retailer, etc.).
- Step 3 "Value proposition" → **removed**. Roadmap becomes 3 steps: focus → connect strategy → action plan.
- Step 4 "Action plan": dynamically generated from the connect strategy + per-strategy answers. Replace `getRoadmapVariants` with `generateActionPlan(clusterId, strategy, answers)`.
- Generated PDF (`src/lib/monthlyPlanReport.ts`): mirror the new structure — verb-actionable headings ("Focus on these clusters", "Design the connect strategy", "Execute the action plan"), include per-cluster strategy + answers + action steps, add whitespace between sections.

## 6. Store changes (`src/store/appStore.ts`)

- Add `clusterAssessments: Record<clusterId, ClusterAssessment>` where assessment holds: access capability answers, access rank (A/B/C), competitive answers, plus computed scores + total.
- Add `connectStrategyByCluster: Record<clusterId, ConnectStrategy>` (Brand/Contractor/Outreach/D2C) replacing `connectModelByCluster` (keep old key for backwards persistence but unused).
- Add `strategyAnswersByCluster` for free-text/contractor lists/event flags.
- Remove `selectedProspectIds` usage from UI (keep type for store compatibility; default-select all).
- Bump persist `name` to `sed.v6` so old broken state doesn't poison the new shape.

## 7. New helpers (`src/lib/clusterScoring.ts`)

- `CLUSTER_REVENUE_PROFILE[clusterId]` → avg sq.ft band, avg revenue per prospect.
- `CLUSTER_CYCLE[clusterId]` → cycle time + one-liner.
- `getAccessQuestions(clusterId)`, `getCompetitiveQuestions(clusterId)` → cluster-tailored yes/no sets.
- `scoreRevenue(totalRevenue) → 1–10` (using the bands you specified).
- `scoreAccess(rank) → 1–10` (A=10, B=7, C=3).
- `scoreCompetitive(yesCount, total) → 1–10`.
- `scoreEaseOfSale(clusterId) → 1–10` (faster cycle = higher).
- `aggregate(scores)` → mean (each 25%).

## Out-of-scope clarifications

- "Backend intelligence" is implemented as deterministic frontend tables/helpers (no real backend) — same approach as the existing roadmap content. I won't introduce a server.
- Places API hard caps at ~60 per text query (3 pages × 20). I'll fetch all pages but can't exceed Google's cap.
- "Disabled temporarily" for Sales Enablement / Handhold = card and nav item are visibly disabled, non-clickable, with "Coming soon" affordance. Easy to re-enable by flipping a `disabled` flag.

## Verification

After implementing I'll: build-check, open the preview, walk through `/map` → cluster card (new sub-sections fill in) → `/market-potential` (matrix + ranking) → `/plan` (new strategies → action plan → PDF). Capture screenshots if anything looks off.
