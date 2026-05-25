
# Stage 1: Identify Market Clusters — Build Plan

A guided 3-step flow for Demand Generator Sunil Kumar (Panvel, Mumbai) to build a Cluster Map. Frontend-only for now (no backend persistence); selections live in component state and a final "Cluster Map" summary is rendered on confirmation.

## Routes

- `/` → redirects/lands on the Stage 1 flow (single-page guided flow, since other stages aren't built yet)
- `src/routes/index.tsx` hosts the flow with an internal step state (1 → 2 → 3 → summary)

A persistent top header shows the welcome message and a stage progress indicator ("Stage 1 of 5 — Identify Market Clusters"), with stages 2–5 visibly locked.

## Screens

### Header (always visible)
- "Welcome Sunil Kumar! Let's map the clusters in your area — Panvel, Mumbai"
- Stage progress bar: 5 pills, only Stage 1 active, others locked with a lock icon
- Breadcrumb inside Stage 1: Meta-cluster › Cluster › Prospects

### Screen 1 — Meta-cluster selection
- 12 meta-clusters rendered as evenly spaced circular bubbles (responsive grid; paginated/scrollable on small screens)
- Panvel-relevant ones (Residential Construction, Industrial & Logistics, Trade & Contractor, Tourism & Transit, Rural Housing) get: larger size + soft glow ring + "Recommended" tag
- Click → selects and advances to Screen 2
- "+ Add Missing Meta-Cluster" button opens a dialog (free text + suggestion dropdown)
- Subtle "Thinking triggers" panel at the bottom (3 prompts as muted text with a lightbulb icon)

### Screen 2 — Cluster drill-down
- Title shows selected meta-cluster
- Smaller bubbles for child clusters (data from the spec; e.g., Residential Construction shows 8 child clusters)
- Panvel-relevant ones highlighted
- Multi-select (chip-style selection state on bubble)
- "+ Add Missing Cluster" button (dialog)
- "Back" to Screen 1, "Next" enabled once ≥1 cluster picked
- Thinking-trigger prompts shown subtly

### Screen 3 — Prospect map
- Map area: lightweight stylized SVG map placeholder of Panvel with road outlines and pin markers (no Google Maps API call in this iteration — keeps it dependency-free and matches "Google-Maps-like UI" visually). Pins are mock prospects derived from the selected cluster.
- Side panel lists prospects with checkboxes (name + locality). Selecting a pin or row toggles both.
- Click pin → minimal popover (name, locality, "Select" button)
- "+ Add Prospect" opens dialog (name, locality, optional notes)
- "Confirm & Create Cluster Map" CTA — disabled until ≥1 prospect selected

### Summary view
- Shows the saved Cluster Map: meta-cluster › clusters › prospects as a clean card layout
- Note that Stages 2–5 (Shortlist, Connect, Trust Surplus, Insidership) are locked pending future specs
- "Edit map" returns to Screen 1 preserving selections

## Progression logic
Encapsulated in the flow component:
- `canAdvanceFrom1` = metaCluster !== null
- `canAdvanceFrom2` = selectedClusters.length ≥ 1
- `canConfirm` = selectedProspects.length ≥ 1
- Next-stage pills remain locked regardless

## Data model (in-memory)

```ts
type MetaCluster = { id; name; recommended: boolean; clusters: Cluster[] }
type Cluster = { id; name; recommended: boolean; prospects: Prospect[] }
type Prospect = { id; name; locality; x: number; y: number } // x/y for SVG map
```

Seed data file `src/data/clusters.ts` containing all 12 meta-clusters, their child clusters from the spec, and ~6–10 mock Panvel prospects per cluster (e.g., for Residential Construction: "Adhiraj Capital City", "Paradise Sai World City", "Kalpataru Riverside", etc.).

## Design direction

- Background: warm off-white with subtle radial gradient
- Bubbles: soft pastel fills, rounded-full, drop-shadow on hover, ring + glow for "Recommended"
- Typography: a distinctive display font for the welcome line (e.g., Instrument Serif) + clean sans (Inter/Manrope) for body — set via design tokens in `src/styles.css`
- Generous whitespace, smooth scale/fade transitions between screens (CSS transitions, no extra animation lib)
- Tablet/mobile responsive: grid collapses to 2-col bubbles; map + list stack vertically

## Technical details

- Stack: existing TanStack Start template, Tailwind v4, shadcn/ui (Dialog, Button, Checkbox, Badge, Progress)
- All state in a single client component (`Stage1Flow`) inside `src/routes/index.tsx`; step components extracted to `src/components/stage1/` (`Header`, `MetaClusterStep`, `ClusterStep`, `ProspectStep`, `SummaryStep`, `ThinkingTriggers`, `AddItemDialog`, `MapPlaceholder`)
- Map: hand-drawn SVG of Panvel-shaped region with road strokes; pin = absolutely-positioned button driven by `prospect.x/y` percentages
- No backend / Lovable Cloud yet — selections live only in component state
- Semantic color tokens added to `src/styles.css` (bubble surfaces, recommended ring, map background)

## Out of scope (this iteration)
- Real Google Maps integration
- Persistence (Lovable Cloud)
- Stages 2–5
- Auth / multi-user
