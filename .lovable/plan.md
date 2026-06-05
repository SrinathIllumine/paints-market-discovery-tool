
# Demand Discovery Tool — UI/UX & Flow Enhancements

Three workstreams: (1) Cluster Card refinements, (2) Engagement plan redesign, (3) New Sales Enablers funnel. Plus nav cleanup.

---

## 1. Cluster Card / Market Map (`src/routes/map/$clusterId.tsx`, `src/lib/clusterScoring.ts`, `src/routes/market-potential.tsx`)

**Competitive Strength**
- In `getCompetitiveInsights` / `COMPETITIVE_INSIGHTS`: keep only the first 2 insights per cluster (drop the JK product-fit bullet).
- Render competitor names (Asian Paints, Berger, Dulux, Birla Opus, JK) bold via a small `<HighlightBrands>` text wrapper that wraps known brand tokens in `<strong className="text-navy">`.

**Cluster Access — remove all questions**
- Delete the question UI block (lines ~370-416) and the `accessAnswers` / `accessRank` / contractor-dialog state.
- Replace with 2 backend-driven insight bullets sourced from `getClusterIntel`:
  - "There are **{contractorCount}** contractors dominating this cluster."
  - "There are **{retailerCount}** retailers operating within this cluster." (add `retailerCount` to `ClusterIntel`, derived from prospects/cluster heuristic.)
- Score for Access sub-section now comes purely from intel (new `accessHML` field in `ClusterIntel`, defaulted from `contractorCount` + cluster heuristics). No user input.

**Dynamic H/M/L**
- `scoreToHML` already maps numeric scores → labels — keep it.
- Refactor `computeClusterScores` so each sub-score (revenue, competitive, access, ease) is derived solely from backend intel + revenue profile (no assessment overrides driving the badge). This guarantees the same H/M/L on `/market-potential` and `/map/$clusterId`.
- Remove the "Save / cluster potential estimated" toast flow; visiting the cluster automatically registers the assessment (so the cluster appears on My Cluster Map without manual save). Keep `setAssessment` call inside the `markVisited` effect with a derived assessment object.

**Flatter visual hierarchy**
- Replace the nested `Accordion > AccordionItem > SubSection` (3 levels) with a single flat list of 4 cards on the cluster page:
  1. Revenue Potential (badge)
  2. Competitive Strength (badge)
  3. Access (badge)
  4. Ease of Sale (badge)
- Each card is a single rounded panel — no parent "Cluster Revenue Potential / Cluster Access" wrappers, no accordions. Section heading "Cluster Snapshot" sits above the 4 cards.
- Keep section header style consistent with `market-potential.tsx`.

---

## 2. Cluster Engagement Plan (`src/routes/plan/index.tsx`, `src/store/appStore.ts`, `src/lib/strategyContent.ts`, `src/lib/monthlyPlanReport.ts`)

**Focus cluster — outside the roadmap, single select**
- Move `FocusStep` out of the roadmap accordion to a card at the top of the page titled "Which cluster would you like to focus on this month?".
- Sort: clusters whose computed `access` AND `revenue` H/M/L are both H first, then the rest by aggregate.
- Change `monthlyFocusIds` semantics to single-select (replace toggle with a set-one action `setMonthlyFocus(id)`). Keep the array shape for back-compat but enforce length 1 in UI.
- Roadmap below only renders once a focus cluster is chosen.

**Roadmap — 3 new stages**
Replace current `STEPS` with:
1. **Select Value Proposition** — 2-3 cluster-specific propositions from a new `getValuePropositions(clusterId)` in `strategyContent.ts`. Single-select radio.
2. **Design Connect Strategy** — checkbox list of strategies, max 3. When checked, inline lightweight commitment inputs appear directly under the strategy row (Brand Awareness: # activities, target reach. Contractor: # meetings, # champions. Touchpoint: # visits, key influencers). No modal/dialog. Numbers only, 1-2 inputs each.
3. **Build Commitment / Action Plan** — for each selected strategy show 3 crisp recommended actions (checkboxes); only user-checked actions land in the report.

**Store changes**
- Add: `valuePropositionByCluster: Record<string, string>`, `selectedStrategiesByCluster: Record<string, ConnectStrategy[]>` (≤3), `commitmentsByCluster: Record<string, Record<ConnectStrategy, Record<string, string|number>>>`, `selectedActionsByCluster: Record<string, Record<ConnectStrategy, string[]>>`.
- Keep old `connectStrategyByCluster` / `strategyAnswersByCluster` for migration but stop reading in UI.

**Report**
- Rewrite `generateMonthlyEngagementPlanPdf` payload + body to print only: focus cluster, value proposition, each selected strategy with its commitments, and checked action items. No menus of unchosen options.

---

## 3. Sales Enablers module (`src/routes/sales-enablement.tsx` + new sub-routes)

**Enable navigation**
- `BottomNav.tsx`: set `sales-enablement` `disabled: false`.
- `index.tsx` home cards: set Sales Enablers `disabled: false`.

**Stage data model** (new in store)
```
type SalesStage = "prospects" | "contacted" | "decision" | "closure" | "ongoing";
prospectStages: Record<clusterId, Record<prospectId, SalesStage>>
prospectActivity: Record<prospectId, { contactsAccessed?:bool; meetingsDone?:number; productDiscussion?:bool; valuePropShared?:bool; outcomes?: string[] }>
```
Actions: `setProspectStage`, `recordProspectActivity`, `markProspectComplete`, `markProspectNotInterested`. Default stage = `prospects`. Distribution seeded deterministically on first load.

**Routes**
- `src/routes/sales-enablement.tsx` — landing. Header: "Customer Management Funnel · Click a cluster to update a prospect's stage". Lists shortlisted clusters (from `assessments`) as cards.
- `src/routes/sales-enablement.$clusterId.tsx` — funnel page titled "Cluster Management Funnel – {cluster}". SVG/CSS funnel with 5 decreasing-width blocks showing live counts per stage. Tapping a stage opens a Dialog listing the prospects currently in that stage (Name, Address, Region). Each row links to the prospect page.
- `src/routes/sales-enablement.$clusterId.$prospectId.tsx` — prospect detail. Top: horizontal 5-step stage timeline highlighting current. Two cards:
  - **Where are you?** — checklist of completed activities (click-in details inline).
  - **What to do next?** — stage-specific recommended next-best-actions from a new `getNextActions(stage, clusterId)` table.
  - Bottom action bar: textarea-backed "Record Key Discussion Outcomes", "Mark as Completed" (advances to next stage), "Customer Not Interested" (removes from funnel).

**Visual**: lightweight, no nested cards beyond the two main cards.

---

## 4. Navigation cleanup

- `src/components/app/BottomNav.tsx`: remove the `handhold` item entirely; grid becomes `grid-cols-3`.
- `src/routes/index.tsx`: remove the "Ongoing Customer Relationship" card.
- Leave `src/routes/handhold.tsx` in place but unlinked (delete-safe; will remove if no other refs).

---

## Technical notes

- All scoring stays deterministic frontend lookups; "backend intelligence" = the existing `INTEL` / `getClusterIntel` table extended with `retailerCount` and `accessHML`.
- All new color usage stays in semantic tokens (`text-navy`, `text-critical`, etc.).
- TanStack Router file naming: `sales-enablement.$clusterId.tsx`, `sales-enablement.$clusterId.$prospectId.tsx` under `src/routes/`.
- Store key bumped (`sed.v6` → `sed.v7`) to avoid stale persisted shape conflicts.

---

## Open questions

1. Funnel counts — should the initial distribution (20/17/12/8/3) be hardcoded per cluster for demo, or derived from each cluster's actual prospect count?
2. For value propositions — do you want me to author cluster-specific copy for all 20 clusters, or use a generic 3-option fallback for clusters without bespoke content?
3. Should the old `handhold` route file be deleted, or kept reachable by direct URL only?
