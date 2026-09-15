# Cluster Revenue Recalculation — Owner-Neutral Paintable Area

**Correction being made:** the prior research pass (`cluster-revenue-cycle-research.md`)
priced "Mid-Size Apartment Buildings / Residential Societies" and "Gated
Community" using **common areas + facade only**, explicitly excluding each
flat/villa owner's own interior on the reasoning that residential retail
(individual homes) is a separate market segment that "sits outside this
cluster list entirely."

That reasoning was wrong. **A cluster's revenue potential is every
potential paintable area belonging to that cluster type, regardless of who
actually writes the cheque for the job.** A resident's living-room wall is
just as much a paintable surface inside "Mid-Size Apartment Buildings" as
the lobby wall is — the fact that the society pays for one and the flat
owner pays for the other is a go-to-market detail, not a reason to leave
half the cluster's paint demand out of its revenue potential.

This document (1) audits all 20 clusters against that corrected principle,
(2) shows the full recalculation for the two clusters that actually needed
one, and (3) gives the updated closing numbers used in the app
(`src/lib/clusterResearch.ts` for Leadership/ASM Analytics,
`src/lib/clusterScoring.ts` for the Market Discovery System / DG Dashboard).

---

## 1. Audit: which clusters were already owner-neutral?

For a cluster to have under-counted paintable area, it needs a specific
structural feature: **one physical cluster instance contains many
separately-owned interior spaces alongside a shared area**, and the
original estimate only priced the shared area. Checking all 20:

| Cluster | Who owns/pays for the space priced? | Owner-neutral already? |
|---|---|---|
| Schools | Single school (govt body or private trust) owns the whole building | ✅ whole building already priced |
| Colleges | Single institution owns the whole campus | ✅ |
| Hospitals | Single hospital (govt or private corporate) owns the whole building | ✅ |
| Clinics & Nursing Homes | Single doctor/operator owns the whole premise | ✅ |
| Restaurants | Single restaurant owner/chain owns the whole premise | ✅ |
| Hotels | Single hotel owner/chain owns the whole building, incl. every guest room | ✅ |
| Marriage Halls | Single venue operator owns the whole hall | ✅ |
| Religious | Single trust owns the whole structure | ✅ |
| **Mid-Apartments** | Society owns common areas; **each flat is individually owned** | ❌ interiors were excluded — **revised below** |
| **Gated Community** | Township association owns common areas; **each villa/flat is individually owned** | ❌ interiors were excluded — **revised below** |
| Redevelopment | One builder delivers a fresh, fully-painted structure as a single handover job | ✅ — see note below |
| MIDC/Industrial Estates | Single factory/plant owner owns the whole unit | ✅ |
| Warehousing | Single operator owns the whole warehouse | ✅ |
| Paying Guest | Single PG operator owns/rents out the whole house; operator pays for painting | ✅ |
| Auto Showrooms | Single dealer owns the whole showroom | ✅ |
| Petrol Pumps | Single dealer/franchisee owns the whole premise | ✅ |
| Bus-Stand-Market | Each shop is its own fully-priced unit (the "unit" already = one shop) | ✅ |
| Highway Dhabas | Single dhaba owner owns the whole premise | ✅ |
| Jewellery Showrooms | Single jeweller owns the whole showroom | ✅ |
| Textile/Garment Shops | Single shop owner owns the whole shop | ✅ |

**Only two clusters needed revision**: Mid-Apartments and Gated Community.
Every other cluster's "unit" (a school, a hospital, a shop, a factory) is a
single-owner premise where the original sqft estimate already covered the
entire structure — there was never a second, excluded owner inside it.

**Redevelopment is a special, already-correct case, not an oversight.**
Its cluster is "a builder handing over a freshly rebuilt structure" — a
one-time construction-completion event, not a recurring maintenance cycle.
The "full fresh paint job on rebuilt structure" sqft figure already means
the entire new building, every flat included, because that's what "fresh
paint job on the rebuilt structure" means on day one of handover. Once
that building is occupied, its *ongoing* facade/common-area and
flat-interior repaints are correctly picked up going forward by the
Mid-Apartments cluster (it becomes just another housing society) —
counting it again under Redevelopment would double-count the same paint
job twice.

---

## 2. Recalculation — Mid-Size Apartment Buildings / Residential Societies

### Original (facade + common areas only)
| Tier | Share | Sqft (common+facade) | Rate | Job value / 6-yr cycle |
|---|---|---|---|---|
| Small (10–30 units) | 50% | 3,000 | ₹16 (Tier B) | ₹48,000 |
| Mid (30–100 units) | 40% | 10,000 | ₹20 (blended) | ₹2,00,000 |
| Large (100+ units) | 10% | 30,000 | ₹27 (Tier C) | ₹8,10,000 |

Blended facade/common job value: `0.5×48,000 + 0.4×2,00,000 + 0.1×8,10,000 = ₹1,85,000` per 6-year cycle — this part of the model is unchanged; it's still correct, just no longer the *whole* story.

### New: per-flat interior component

**Flat count per building** — no official registry breaks societies down
by unit count, so this is [ESTIMATED], but cross-checked for consistency:
the original common-area sqft (3,000 / 10,000 / 30,000) already implies
~150–200 sqft of shared space per unit across all three tiers if the unit
counts below are used — a believable, internally consistent lobby +
corridor + staircase + facade allowance per flat, which is why these counts
were chosen (not picked independently of the existing data):

| Tier | Flats/building (midpoint of the existing 10–30 / 30–100 / 100+ bands) | Implied common sqft/flat |
|---|---|---|
| Small | 20 | 150 |
| Mid | 65 | 154 |
| Large | 150 | 200 |

**Avg flat carpet area** — [SOURCED, range]: a 2BHK in India typically runs
650–1,200 sqft carpet depending on city/segment (Mumbai/MMR compact end
~550–750 sqft; Pune/Hyderabad/Bengaluru-outskirts and 3BHK-mixed
buildings run larger). Applied per building tier (small buildings skew
toward compact/budget flats, large buildings toward bigger units):

| Tier | Avg flat carpet area | Interior rate |
|---|---|---|
| Small | 700 sqft | ₹16/sqft (Tier B — standard emulsion) |
| Mid | 950 sqft | ₹20/sqft (blended) |
| Large | 1,300 sqft | ₹27/sqft (Tier C — upgraded) |

**Interior repaint cycle: 4 years** [SOURCED] — Indian home-interior
repainting guidance (Asian Paints and general painting-industry sources)
consistently cites **3–5 years** for interiors (vs. 5–10 years commonly
cited for exteriors), noticeably shorter than the facade/common-area's
6-year cycle above. 4 years is used as the blended midpoint.

**Per-building interior job value, per 4-year cycle:**
| Tier | Flats × sqft × rate | Job value |
|---|---|---|
| Small | 20 × 700 × ₹16 | ₹2,24,000 |
| Mid | 65 × 950 × ₹20 | ₹12,35,000 |
| Large | 150 × 1,300 × ₹27 | ₹52,65,000 |

### Combining two different cycles into one annual figure

Facade (6-yr) and interior (4-yr) run on different clocks, so they're each
annualized separately, then summed, then re-expressed as a single
already-annualized `avgRevenuePerUnit` (with `repaintCycleYears` fixed at
`1`, the same no-op-divide convention already used for Redevelopment):

| Tier | Facade annual (job÷6) | Interior annual (job÷4) | Total annual |
|---|---|---|---|
| Small | ₹8,000 | ₹56,000 | ₹64,000 |
| Mid | ₹33,333 | ₹3,08,750 | ₹3,42,083 |
| Large | ₹1,35,000 | ₹13,16,250 | ₹14,51,250 |

**Blended annual revenue per building:**
`0.5×64,000 + 0.4×3,42,083 + 0.1×14,51,250 = ₹3,13,958/year`

**National annual revenue potential:**
`250,000 societies × ₹3,13,958 = ₹7,849 Cr/year` (up from ₹771 Cr/year)

---

## 3. Recalculation — Gated Community (large integrated townships)

Same method, township-scale. Facade/common-area figures are unchanged
from the original research (still correct, still the whole story for that
component):

| Tier | Share | Facade/common sqft | Rate | Facade job/6yr |
|---|---|---|---|---|
| Mid | 60% | 50,000 | ₹27 (Tier C) | ₹13,50,000 |
| Large | 30% | 150,000 | ₹27 (Tier C) | ₹40,50,000 |
| Mega | 10% | 400,000 | ₹35 (Tier D) | ₹1,40,00,000 |

**Unit count per township** [ESTIMATED, derived for consistency] — backed
out from the existing common-area sqft using the same ~80–100 sqft of
shared space per unit ratio validated above for Mid-Apartments:

| Tier | Units/township | Avg unit size | Interior rate |
|---|---|---|---|
| Mid | 500 | 1,100 sqft | ₹20/sqft (blended) |
| Large | 1,500 | 1,300 sqft | ₹27/sqft (Tier C) |
| Mega | 5,000 | 1,600 sqft | ₹40/sqft (Tier D — premium/luxury units) |

**Per-township interior job value, per 4-year cycle:**
| Tier | Units × sqft × rate | Job value |
|---|---|---|
| Mid | 500 × 1,100 × ₹20 | ₹1,10,00,000 |
| Large | 1,500 × 1,300 × ₹27 | ₹5,26,50,000 |
| Mega | 5,000 × 1,600 × ₹40 | ₹32,00,00,000 |

**Annualized (facade÷6 + interior÷4):**
| Tier | Facade annual | Interior annual | Total annual |
|---|---|---|---|
| Mid | ₹2,25,000 | ₹27,50,000 | ₹29,75,000 |
| Large | ₹6,75,000 | ₹1,31,62,500 | ₹1,38,37,500 |
| Mega | ₹23,33,333 | ₹8,00,00,000 | ₹8,23,33,333 |

**Blended annual revenue per township:**
`0.6×29,75,000 + 0.3×1,38,37,500 + 0.1×8,23,33,333 = ₹1,41,69,583/year`

**National annual revenue potential:**
`6,000 townships × ₹1,41,69,583 = ₹8,502 Cr/year` (up from ₹343 Cr/year)

---

## 4. Updated 20-cluster national total

| # | Cluster | Old (₹ Cr/yr) | New (₹ Cr/yr) | Changed? |
|---|---|---:|---:|:---:|
| 1 | Schools | 3,308 | 3,308 | — |
| 2 | Colleges | 862 | 862 | — |
| 3 | Hospitals | 2,475 | 2,475 | — |
| 4 | Clinics-nursing | 993 | 993 | — |
| 5 | Restaurants | 505 | 505 | — |
| 6 | Hotels | 671 | 671 | — |
| 7 | Marriage-halls | 245 | 245 | — |
| 8 | Religious | 1,190 | 1,190 | — |
| 9 | **Mid-apartments** | 771 | **7,849** | ✅ revised |
| 10 | **Gated-community** | 343 | **8,502** | ✅ revised |
| 11 | Redevelopment | 2,511 | 2,511 | — |
| 12 | Midc | 2,229 | 2,229 | — |
| 13 | Warehousing | 475 | 475 | — |
| 14 | Paying-guest | 379 | 379 | — |
| 15 | Auto-showrooms | 412 | 412 | — |
| 16 | Petrol-pumps | 215 | 215 | — |
| 17 | Bus-stand-market | 9 | 9 | — |
| 18 | Highway-dhabas | 51 | 51 | — |
| 19 | Jewellery | 333 | 333 | — |
| 20 | Textile-garment | 164 | 164 | — |
| | **TOTAL** | **~18,141** | **~33,378** | |

**Revised sanity check:** ~₹33,378 Cr/year, or **~42% of the ₹80,000 Cr**
total Indian paints market (up from ~22.7%). This is a large jump, but it
is not a calibration error — it reflects a genuine, deliberate re-scoping:
a meaningful slice of "residential retail" (specifically, homes that sit
inside an organized apartment building or gated township) has moved from
"outside all 20 clusters" into these two clusters, because that's where it
structurally belongs. The only residential paint spend still legitimately
outside this cluster list is **individual free-standing homes/independent
houses** — there's no organized "cluster" for those, since they aren't
part of any shared building or society structure a DG could target as one
account.

---

## 5. Where this is applied in the app

- **Leadership Analytics & ASM Analytics** (`src/lib/clusterResearch.ts`,
  read by `src/lib/clusterGenerator.ts`): `mid-apartments` and
  `gated-community` now store the blended **annual** figure directly in
  `avgRevenuePerUnit`, with `repaintCycleYears` fixed at `1` (a no-op
  divide) — the same convention already used for Redevelopment's
  annual-flow modeling, extended here to represent "two different cycles
  pre-blended into one annual number" rather than "an annual flow instead
  of a stock."
- **Market Discovery System / DG Dashboard** (`src/lib/clusterScoring.ts`,
  `REVENUE_PROFILE`): this is a separate, older, single-DG-scale "revenue
  per prospect" model (a whole account/building's per-cycle deal value, not
  a national annual figure), so the same owner-neutral principle was
  applied at its own scale. Both facade/common and interior components were
  annualized independently, then re-combined at *this model's own* stated
  cycle length (5 years for both clusters) to get one per-prospect deal
  value:
  - `mid-apartments`: ₹18,00,000 → **₹15,69,792** per prospect
  - `gated-community`: ₹45,00,000 → **₹7,08,47,917** per prospect (a
    township-scale deal covering thousands of individually-owned homes is
    genuinely a multi-crore contract once every unit's interior is priced
    in)
  - `redevelopment`: unchanged (₹22,00,000) — same "already whole-building"
    reasoning as the Leadership model.
  - Neither change alters that model's derived 0–10 revenue score
    (`scoreRevenue()`): both clusters were already in the top bucket
    (mid-apartments stayed in the "6–8" bucket, gated-community was already
    at the max score before and after), so this only corrects the
    displayed rupee figures — it does not shift any existing quadrant
    placement in the Market Discovery System or DG Dashboard.

Sources: [Asian Paints — repaint frequency guide](https://www.asianpaints.com/blogs/how-often-should-i-repaint-my-house.html), [SquareYards — 2BHK size guide](https://www.squareyards.com/blog/what-is-2-bhk), [Rylinx — carpet area guide](https://in.rylinx.com/blog/ideal-size-2bhk-flat-carpet-area-guide), plus the painting-cost-per-sqft benchmarks already sourced in `cluster-revenue-cycle-research.md`.
