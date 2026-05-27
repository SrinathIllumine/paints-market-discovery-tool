## Changes

### 1. Geo View shows all prospects (not capped at 15)
- **`src/lib/places.functions.ts`**: Raise `maxResultCount` to 20 (Google Places API max per page) and add pagination using `nextPageToken` to fetch up to ~60 results across pages. Concatenate all pages before returning.
- **Market Potential card** (`src/routes/map/$clusterId.tsx`): Replace the hardcoded `~{cluster.prospectCountEstimate} prospects estimated` with the actual loaded count `cs.prospects.length` so the two numbers always match. Show "Loading…" while `loading` is true.
- Remove the `prospectCountEstimate` text from the subtitle as well, or sync it with the live count.

### 2. Collapsible "All Prospects" list between Geo View and Stakeholder Connects
- In `src/routes/map/$clusterId.tsx`, add a new section using shadcn `Accordion` (single, collapsible, `defaultValue=""` so collapsed by default).
- Section title: "All prospects ({count})".
- Inside: a vertical list of `cs.prospects` showing name, locality/address, and a small "Selected" badge if in `selectedProspectIds`. Tapping a row toggles selection (reuses `toggleProspectSelected`).
- Placed after the Geo View `Section` and before the Stakeholder Connects button.

### 3. Home navigation symbol top-right on every page
- **`src/components/app/StageHeader.tsx`**: Always render a `Home` icon button (lucide `Home`) in the top-right of the header that navigates to `/`. If a `right` prop is passed, render the home button alongside it (home button always present).
- This automatically covers all pages that use `StageHeader`: Map list, Map cluster detail, Connects list, Connects cluster detail, Plan page.
- Verify the home page (`src/routes/index.tsx`) — if it uses StageHeader, suppress the home button there (e.g. via an `isHome` flag) since it would navigate to itself.

## Technical notes
- Google Places `searchText` returns up to 20 per page; `nextPageToken` requires a short delay (~2s) before reuse. Implement a simple loop with max 3 pages to stay within reasonable latency.
- Accordion components already used in `src/routes/plan/index.tsx` — reuse same import pattern.
- No store/schema changes needed.
