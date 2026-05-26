# Restructure: Systematic Engagement & Discovery Tool v2

Major pivot from the 2-stage meta-cluster/scoring flow to a **3-stage guided intelligence tool**: Market Map → Stakeholder Connects → Outreach Plan. Cluster hierarchy is flattened; scoring is replaced by qualitative cluster intelligence; stakeholders become first-class data shared across all stages.

---

## 1. Intro / Entry Screen

New landing card at app entry (`/`) before stages:
- Title: "Systematic Engagement & Discovery Tool"
- 3 value-prop tiles with icons (Map, Network, Insights):
  - Create a cluster map for your market
  - Build a structured outreach plan
  - Harvest local market intelligence
- Primary CTA: "Start" → `/map`

## 2. Navigation

Replace 2-tab bottom nav with **3-stage tracker**:
- Map (`/map`)
- Connects (`/connects`)
- Plan (`/plan`)

Top progress indicator (1/2/3) inside `StageHeader`. Stage 2/3 unlock once at least one cluster has been visited (lightweight, not gated by scoring).

## 3. Stage 1 — Market Map (single layer)

**Remove** meta-cluster drill-down entirely. Replace `/stage-1`, `/stage-1/$metaId`, `/stage-1/$metaId/$clusterId` with:

- `/map` — vertical card list of Panvel-relevant clusters (Residential Construction, Industrial/MIDC, Warehousing & Logistics, Retail & Malls, Offices/Commercial Interiors, Schools & Colleges, Hospitals, Local Bazaar). Each card: name + 1-line description.
- `/map/$clusterId` — Cluster Detail page with sections:
  - **Nature & Description** (static seed data)
  - **Market Potential**: H/M/L badge + prospect count (seed)
  - **JK Share**: user-input H/M/L segmented control (persisted)
  - **Demand Classification**: system tags (New Construction / Repainting / Repair / Commercial Interiors)
  - **Geo View**: existing `GoogleMap` component, satellite/roadmap toggle, prospect pins (reuse Places nearby search per cluster)
  - **Stakeholder Connects**: link/button showing count → opens sheet listing stakeholders for this cluster (from Stage 2 data) with Name / Prospect / Phone

## 4. Stage 2 — Stakeholder Connects

- `/connects` — cluster picker (same card list, shows stakeholder count per cluster)
- `/connects/$clusterId` — three tabs/sections:
  - **Whom to Connect** — list + "Add Stakeholder" sheet (Name, Prospect, Phone). Cluster-specific trigger prompts above the list.
  - **How to Connect** — seed playbook bullets per cluster type
  - **What to Talk** — pitch template with 3 blocks (Introduction, Context, Intent), partially personalized from cluster data

## 5. Stage 3 — Outreach Plan

- `/plan` — single scrollable screen:
  - **Target Clusters this Period**: multi-select chips of clusters; auto-recommended order by composite of market potential + stakeholder count + JK share
  - **How to Connect**: summarized strategies for selected clusters (reused from Stage 2)
  - **Contribution Events**: add event cards (type: Workshop / Audit / Awareness / Contractor Meet, attached to cluster, optional date)
  - **Service Delivery Readiness**: 4-question checklist per selected cluster (Yes/No/Partial), gaps highlighted in red

## 6. Data Model (Zustand, persisted)

Extend `src/store/appStore.ts`:

```ts
clusters: Record<clusterId, {
  jkShare: 'H'|'M'|'L'|null,
  prospects: Prospect[],          // from places + manual
  visited: boolean,
}>
stakeholders: Record<clusterId, Stakeholder[]>  // {id,name,prospect,phone}
plan: {
  targetClusterIds: string[],
  events: Event[],                // {id,clusterId,type,date?,note?}
  readiness: Record<clusterId, {
    retailers: 'Y'|'N'|'P'|null,
    stock: 'Y'|'N'|'P'|null,
    painters: 'Y'|'N'|'P'|null,
    trained: 'Y'|'N'|'P'|null,
  }>
}
```

Keep existing `clusterMaps` migration path (read old prospects into new shape on first load).

## 7. Cluster Taxonomy

Replace `src/data/clusters.ts` `META_CLUSTERS` with a flat `CLUSTERS` array. Each entry:

```ts
{ id, name, description, potential: 'H'|'M'|'L', prospectCountEstimate,
  demandTags: string[], placesQueries: string[],
  triggers: string[], howToConnect: string[], pitch: {intro, context, intent} }
```

Seed all 8 Panvel clusters listed in the spec.

## 8. Files

**New**
- `src/routes/index.tsx` (replace redirect with intro screen)
- `src/routes/map/index.tsx`, `src/routes/map/$clusterId.tsx`
- `src/routes/connects/index.tsx`, `src/routes/connects/$clusterId.tsx`
- `src/routes/plan/index.tsx`
- `src/components/app/ClusterCard.tsx` (vertical list card)
- `src/components/app/ValuePropCard.tsx`
- `src/components/connects/StakeholderSheet.tsx`
- `src/components/plan/EventCard.tsx`, `ReadinessChecklist.tsx`

**Modified**
- `src/store/appStore.ts` — new schema + migration
- `src/data/clusters.ts` — flat taxonomy with all intelligence fields
- `src/data/clusterPlaces.ts` — keyed by flat clusterId
- `src/components/app/BottomNav.tsx` — 3 tabs
- `src/components/app/StageHeader.tsx` — 3-step progress

**Deleted**
- `src/routes/stage-1/**`, `src/routes/stage-2/**`
- `src/lib/scoring.ts`, `src/components/app/ScoreChip.tsx`, `Segmented.tsx` (if unused after), `Stepper.tsx`
- `src/components/app/BubbleCircle.tsx`, `BubbleTile.tsx`

## 9. Out of Scope

- No backend writes (all client-persisted via localStorage)
- No auth / multi-user
- No export/share of plan (can be a follow-up)

Confirm and I'll switch to build mode.
