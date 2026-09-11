# Cluster Revenue-per-Unit & Repaint-Cycle Research (Calibration Fix)

**Purpose:** Replace the prior pass's per-cluster "average revenue per unit" and "repaint cycle" figures, which were miscalibrated because a single urban mid-size example (e.g., a 20,000–40,000 sqft private school) was multiplied against the *entire* national count of that cluster type (e.g., all 1.47M schools including small rural/government ones). That produced a Schools estimate of ₹29,400 Cr/year — ~37% of the entire Indian paints market — which is not plausible.

This pass builds a **blended national average revenue per unit** for each of the 20 clusters by (a) estimating the real size/segment mix of that cluster type across India, (b) costing each segment/tier using standard Indian painting-cost benchmarks, (c) weighting by segment share, and (d) sanity-checking the resulting national annual revenue potential against the total Indian paints market. All figures created independently — no numbers were carried over from any existing app code.

Every number is tagged **[SOURCED]** (backed by a cited web source) or **[ESTIMATED]** (reasoned judgment call, no hard official count exists). Where a figure is [SOURCED] but the source itself is a rough/informal-market estimate, that is noted.

---

## 1. Total Indian Paints Market — the sanity-check ceiling

- Indian paints & coatings market (decorative + industrial, all players): **~₹80,000–93,000 Cr** in FY25/26. IBEF/Ken Research cite ~₹93,094 Cr (2025) growing toward ~₹1,45,782 Cr by 2030; other trade commentary cites the industry "growing to ₹1 lakh crore" in FY26 with decorative ~₹75,000 Cr and industrial ~₹25,000 Cr. [SOURCED — [IBEF blog](https://www.ibef.org/blogs/india-paints-industry-market-structure-and-growth-drivers), [Indian Chemical News](https://www.indianchemicalnews.com/chemical/indian-paint-industry-to-reach-rs-1-lakh-crore-in-next-five-years-16159), [Ken Research](https://www.kenresearch.com/industry-reports/india-paints-and-coating-market)]
- Per the task brief, we use **₹80,000 Cr/year** as the conservative sanity-check ceiling for "total Indian paints market, all players, all segments" — decorative + industrial combined, including residential (individual homes, which are the single largest paint-consuming segment and are *not* one of the 20 clusters below), new construction, government infrastructure, and every other application not captured by these 20 institutional/commercial cluster types.
- **Implication for this exercise:** the 20 clusters here are institutional/commercial/quasi-commercial repaint markets only. Residential retail (individual homes/flats bought by families) typically accounts for the majority (60–70%) of decorative paint volume in India and sits outside this cluster list entirely. So the 20-cluster sum should be a **minority slice** of the ₹80,000 Cr total — a working ceiling of roughly 25–35% (₹20,000–28,000 Cr) is a reasonable upper bound for "all institutional/commercial repaint TAM combined," and any single cluster exceeding ~4–5% of the total (₹3,200–4,000 Cr) on its own should be treated as a red flag requiring the blended average to be revised down.

### Painting cost benchmarks used throughout (repaint jobs, not fresh construction)

Sourced from [Asian Paints cost guide](https://www.asianpaints.com/blogs/painting-cost-per-sq-ft-india.html), [Houseyog](https://www.houseyog.com/blog/wall-painting-cost-per-sq-ft-in-india-interior-exterior/), [NoBroker](https://www.nobroker.in/painting-services/home-painting-ideas/cost-of-painting-a-house-per-square-foot-in-india/), and [industrial epoxy costing guides](https://chandapaints.com/blog/industrial-epoxy-flooring-cost-in-india-2026-complete-price-guide-per-sq-ft/). Repainting (vs. fresh plaster) skips most putty/primer, so repaint blended rates run ₹8–16/sqft economy and ₹18–35/sqft premium; industrial/factory-grade epoxy and anti-corrosive coatings run ₹45–150+/sqft. [SOURCED benchmarks, ESTIMATED blended tiers derived from them]

| Tier | Description | ₹/sqft (blended interior+exterior repaint) |
|---|---|---|
| A – Basic | Whitewash/distemper, govt/rural, minimal spec | ₹7–8 |
| B – Standard | Standard emulsion, typical urban commercial/institutional repaint | ₹16 |
| C – Upgraded | Premium emulsion + exterior weatherproofing, urban upscale | ₹27 |
| D – Premium/brand | Luxury or brand-mandated finish (showrooms, star hotels, jewellery) | ₹40–55 |
| E – Industrial | Structural/floor coatings blended across a plant's total area | ₹20–75 (varies by % of area needing specialized coating) |

**Repaint cycle bands** (reasoning: hygiene-critical spaces repaint most often; brand-image-driven retail/hospitality next; institutional/residential moderate; industrial/low-budget segments least frequent). Cross-checked against general commercial-repainting guidance: hospitals/clinics 2–3 yrs, high-footfall retail/hospitality 3–5 yrs, offices/institutional 3–7 yrs, exteriors generally 5–10 yrs. [SOURCED general pattern — [Avello Group](https://www.avello.com.au/blog/how-often-should-commercial-buildings-be-painted), [Lamphier & Co](https://lamphier.com/blog/how-often-should-commercial-buildings-be-repainted/)]; cycle assigned per Indian cluster context below is [ESTIMATED] using this pattern as a guide.

---

## 2. Per-Cluster Detail

Each section: (1) national count, (2) size/tier distribution, (3) revenue/unit/job per tier, (4) blended national average, (5) repaint cycle, (6) sanity check.

### 2.1 Schools
1. **National count:** 14.72 lakh (1,470,000) schools. [SOURCED — PIB, Economic Survey 2024-25]
2. **Segments:** Govt/rural/low-budget schools dominate. Private unaided schools are ~22.5% of all schools per UDISE+ 2023-24, but only a fraction of those are the "20,000–40,000 sqft urban" type the prior pass over-generalized from. Revised distribution: Govt/rural/small (75%), Mid-size private/aided urban (20%), Large elite private (5%). [ESTIMATED — UDISE private-share figure is sourced, tier split within it is a judgment call]
3. **Revenue/job per tier:** Govt/rural (~2,000 sqft) Tier A ₹7/sqft → ₹14,000; Mid private (~15,000 sqft) Tier B ₹16/sqft → ₹240,000; Large elite (~40,000 sqft) Tier C ₹27/sqft → ₹1,080,000.
4. **Blended avg:** 0.75×14,000 + 0.20×240,000 + 0.05×1,080,000 = **₹1,12,500**
5. **Cycle:** 5 years — govt schools repaint rarely (budget-cycle/scheme-driven), private schools every 3–4 yrs; blended.
6. **Sanity check:** 1,470,000 × 112,500 / 5 = **₹3,308 Cr/yr** (4.1% of ₹80,000 Cr). This is at the top of the acceptable range for a single cluster given sheer unit count, but is ~9x lower than the original ₹29,400 Cr error — driven mainly by dropping the naive "every school is urban-mid-size" assumption to a 75/20/5 realistic split.

**Blended avg revenue per unit (₹): 112,500**
**Repaint cycle (years): 5**

### 2.2 Colleges
1. **National count:** 48,246 colleges. [SOURCED — AISHE 2023-24]
2. **Segments:** Govt/low-budget (40%), Mid-size private (45%), Large university campuses (15%). [ESTIMATED]
3. **Revenue/job:** Govt (20,000 sqft) Tier B ₹16 → ₹320,000; Mid private (40,000 sqft) blended ₹20 → ₹800,000; Large campus (100,000 sqft) Tier C ₹27 → ₹2,700,000.
4. **Blended avg:** 0.4×320,000+0.45×800,000+0.15×2,700,000 = **₹8,93,000**
5. **Cycle:** 5 years.
6. **Sanity check:** 48,246 × 893,000 / 5 = **₹862 Cr/yr** (1.1% of market) — plausible.

**Blended avg revenue per unit (₹): 893,000**
**Repaint cycle (years): 5**

### 2.3 Hospitals
1. **National count:** ~70,000 (37% govt ≈26,000; 63% private ≈43,486). [SOURCED — WHO GHO/industry compilation via [ImpactGuru](https://www.impactguru.com/info/number-of-hospitals-in-india/)]
2. **Segments:** Small govt/PHC-scale (40%), Private mid-size (45%), Large corporate hospital (15%). [ESTIMATED]
3. **Revenue/job:** Small govt (15,000 sqft) Tier B ₹16 → ₹240,000; Private mid (30,000 sqft) Tier C ₹27 → ₹810,000; Large corporate (100,000 sqft) Tier D ₹40 → ₹4,000,000.
4. **Blended avg:** 0.4×240,000+0.45×810,000+0.15×4,000,000 = **₹10,60,500**
5. **Cycle:** 3 years — hygiene/infection-control norms drive frequent repainting. [ESTIMATED per general commercial-repaint guidance for medical facilities]
6. **Sanity check:** 70,000 × 1,060,500 / 3 = **₹2,475 Cr/yr** (3.1%) — plausible.

**Blended avg revenue per unit (₹): 1,060,500**
**Repaint cycle (years): 3**

### 2.4 Clinics & Nursing Homes
1. **National count:** ~500,000. [ESTIMATED — built from: 7,394 registered nursing homes [SOURCED], ~40,000 small <30-bed community hospitals/nursing homes [SOURCED — meddeviceonline.com], plus independent doctor-run clinics inferred from India's ~1.3M registered doctors (assume ~35–40% run an independent clinic premise)]
2. **Segments:** Small solo clinic (70%), Mid nursing home (25%), Larger diagnostic/multi-specialty (5%).
3. **Revenue/job:** Solo clinic (500 sqft) Tier B ₹16 → ₹8,000; Nursing home (5,000 sqft) Tier C ₹27 → ₹135,000; Multi-specialty (15,000 sqft) Tier C ₹27 → ₹405,000.
4. **Blended avg:** 0.7×8,000+0.25×135,000+0.05×405,000 = **₹59,600**
5. **Cycle:** 3 years (hygiene-critical).
6. **Sanity check:** 500,000 × 59,600 / 3 = **₹993 Cr/yr** (1.2%) — plausible.

**Blended avg revenue per unit (₹): 59,600**
**Repaint cycle (years): 3**

### 2.5 Restaurants
1. **National count:** 500,000+. [SOURCED — NRAI India Food Services Report 2024]
2. **Segments:** Small/street-style (55%), Mid casual dining (35%), Premium/fine dining chains (10%). [ESTIMATED]
3. **Revenue/job:** Small (400 sqft) Tier A/B ₹12 → ₹4,800; Mid (1,500 sqft) Tier C ₹27 → ₹40,500; Premium (3,000 sqft) Tier D ₹45 → ₹135,000.
4. **Blended avg:** 0.55×4,800+0.35×40,500+0.10×135,000 = **₹30,315**
5. **Cycle:** 3 years — high footfall, hygiene, brand refresh.
6. **Sanity check:** 500,000 × 30,315 / 3 = **₹505 Cr/yr** (0.6%) — plausible, low relative to count because most restaurants are small.

**Blended avg revenue per unit (₹): 30,315**
**Repaint cycle (years): 3**

### 2.6 Hotels
1. **National count:** ~50,000 (documented ~48,775 classified + unclassified accommodation units). [SOURCED, with caveat that fully informal guesthouses/lodges may push the true number higher — [industry compilation](https://www.ceicdata.com/en/india/number-of-hotels)]
2. **Segments:** Budget/unclassified (65%), Mid-scale (25%), Star/luxury (10%). [ESTIMATED]
3. **Revenue/job:** Budget (3,000 sqft) Tier B ₹16 → ₹48,000; Mid-scale (15,000 sqft) Tier C ₹27 → ₹405,000; Star/luxury (60,000 sqft) Tier D ₹45 → ₹2,700,000.
4. **Blended avg:** 0.65×48,000+0.25×405,000+0.10×2,700,000 = **₹4,02,450**
5. **Cycle:** 3 years — brand image and guest-experience driven, high traffic.
6. **Sanity check:** 50,000 × 402,450 / 3 = **₹671 Cr/yr** (0.8%) — plausible.

**Blended avg revenue per unit (₹): 402,450**
**Repaint cycle (years): 3**

### 2.7 Marriage Halls
1. **National count:** ~40,000. [ESTIMATED — blends 29,109 documented banquet halls (Oct 2025) [SOURCED] with an allowance for informal community halls not in commercial directories]
2. **Segments:** Small community hall (60%), Mid banquet hall (30%), Large premium venue (10%). [ESTIMATED]
3. **Revenue/job:** Small (3,000 sqft) Tier B ₹16 → ₹48,000; Mid (10,000 sqft) Tier C ₹27 → ₹270,000; Large (30,000 sqft) Tier D ₹45 → ₹1,350,000.
4. **Blended avg:** 0.6×48,000+0.3×270,000+0.1×1,350,000 = **₹2,44,800**
5. **Cycle:** 4 years.
6. **Sanity check:** 40,000 × 244,800 / 4 = **₹245 Cr/yr** (0.3%) — plausible.

**Blended avg revenue per unit (₹): 244,800**
**Repaint cycle (years): 4**

### 2.8 Religious (temples/mosques/churches/trusts)
1. **National count:** ~1,000,000. [ESTIMATED — documented Hindu temple counts alone range 648,907 (state survey) to ~750,000–2,000,000 depending on definition [SOURCED range]; adding mosques, churches, gurdwaras and other trust-run structures, and discounting for very small unmaintained roadside shrines, ~1M is a conservative working figure]
2. **Segments:** Small local shrine/temple (75%, minimal/no commercial paint spend), Mid trust-run temple/mosque/church (20%), Major pilgrimage/large trust (5%).
3. **Revenue/job:** Small (500 sqft) Tier A ₹8 → ₹4,000; Mid (5,000 sqft) Tier B ₹16 → ₹80,000; Major (30,000 sqft) Tier C ₹27 → ₹810,000.
4. **Blended avg:** 0.75×4,000+0.2×80,000+0.05×810,000 = **₹59,500**
5. **Cycle:** 5 years — donation/festival-cycle driven rather than fixed maintenance schedule.
6. **Sanity check:** 1,000,000 × 59,500 / 5 = **₹1,190 Cr/yr** (1.5%) — plausible.

**Blended avg revenue per unit (₹): 59,500**
**Repaint cycle (years): 5**

### 2.9 Mid-Apartments (mid-size apartment buildings/societies)
1. **National count:** ~250,000 societies nationally. [ESTIMATED — MCA data shows 200,000+ registered housing cooperative societies [SOURCED]; total including non-cooperative RWA-governed complexes is somewhat higher, so 250,000 is used as a round working figure]
2. **Segments:** Small (10–30 units, 50%), Mid (30–100 units, 40%), Large (100+ units, 10%). [ESTIMATED]
3. **Revenue/job (common areas + facade only, not individual flats):** Small (3,000 sqft) Tier B ₹16 → ₹48,000; Mid (10,000 sqft) ₹20 → ₹200,000; Large (30,000 sqft) Tier C ₹27 → ₹810,000.
4. **Blended avg:** 0.5×48,000+0.4×200,000+0.1×810,000 = **₹1,85,000**
5. **Cycle:** 6 years — society budget/AGM cycles, exterior-driven.
6. **Sanity check:** 250,000 × 185,000 / 6 = **₹771 Cr/yr** (1.0%) — plausible.

**Blended avg revenue per unit (₹): 185,000**
**Repaint cycle (years): 6**

### 2.10 Gated Community (large integrated townships)
1. **National count:** ~6,000. [ESTIMATED — no official registry found for "integrated township" as a distinct category; inferred as a much smaller subset than generic mid-apartments, concentrated in top ~30 cities]
2. **Segments:** Mid township (60%), Large township (30%), Mega township (10%). [ESTIMATED]
3. **Revenue/job:** Mid (50,000 sqft common+facade) Tier C ₹27 → ₹1,350,000; Large (150,000 sqft) ₹27 → ₹4,050,000; Mega (400,000 sqft) Tier D ₹35 → ₹14,000,000.
4. **Blended avg:** 0.6×1,350,000+0.3×4,050,000+0.1×14,000,000 = **₹34,25,000**
5. **Cycle:** 6 years.
6. **Sanity check:** 6,000 × 3,425,000 / 6 = **₹343 Cr/yr** (0.4%) — plausible.

**Blended avg revenue per unit (₹): 3,425,000**
**Repaint cycle (years): 6**

### 2.11 Redevelopment (redevelopment housing projects)
1. **National count:** ~15,000 projects/year. [ESTIMATED — this is a flow (annual new completions), not a stock; Mumbai alone has thousands of societies in the redevelopment pipeline at any time, with Pune/Delhi-NCR/Bengaluru/Chennai adding more; no single national registry exists]
2. **Segments:** Small (60%), Mid (30%), Large (10%). [ESTIMATED]
3. **Revenue/job (full fresh paint job on rebuilt structure):** Small (30,000 sqft) Tier C ₹27 → ₹810,000; Mid (80,000 sqft) ₹27 → ₹2,160,000; Large (200,000 sqft) Tier D ₹27→ scaled ₹5,400,000.
4. **Blended avg:** 0.6×810,000+0.3×2,160,000+0.1×5,400,000 = **₹16,74,000**
5. **"Cycle":** treated as **1 year** — unlike other clusters, "count" here is already an annual flow of newly-completed projects, not a stock to be divided by a multi-year cycle. This is a structurally different cluster and should be modeled as an annual flow, not stock÷cycle, in the app.
6. **Sanity check:** 15,000 × 1,674,000 / 1 = **₹2,511 Cr/yr** (3.1%) — plausible for a flow-based cluster, but flagged as the estimate most sensitive to the annual-completions assumption (see confidence section).

**Blended avg revenue per unit (₹): 1,674,000**
**Repaint cycle (years): 1 (annual flow, not a stock-based cycle — see note above)**

### 2.12 MIDC / Industrial Estates
1. **National count:** ~250,000 units. [ESTIMATED — Maharashtra's MIDC alone has allotted 75,000+ industrial plots across ~289–300 industrial areas [SOURCED]; extrapolating to other states' industrial development corporations (GIDC-Gujarat, similar bodies in TN/AP/Karnataka/UP etc.) at a similar or higher density gives a national estimate in the 200,000–300,000 range]
2. **Segments:** Small unit (75%), Mid unit (20%), Large plant (5%). [ESTIMATED]
3. **Revenue/job:** Small (5,000 sqft) blended ₹16 → ₹80,000; Mid (20,000 sqft) blended ₹25 → ₹500,000; Large plant (100,000 sqft) Tier E ₹75 → ₹7,500,000.
4. **Blended avg:** 0.75×80,000+0.2×500,000+0.05×7,500,000 = **₹5,35,000**
5. **Cycle:** 6 years — maintenance-driven, not cosmetic.
6. **Sanity check:** 250,000 × 535,000 / 6 = **₹2,229 Cr/yr** (2.8%). First-pass tiering (with 10% large-plant weight) produced ₹4,250 Cr (5.3%), which was flagged as too high and revised down to a 75/20/5 split shown here.

**Blended avg revenue per unit (₹): 535,000**
**Repaint cycle (years): 6**

### 2.13 Warehousing
1. **National count:** ~50,000. [ESTIMATED — a business-directory count cites 35,252 warehouses [SOURCED, informal-market source]; Grade A/B organized stock is only 371M sqft across the top 8 cities [SOURCED — JLL/Cargo Talk], implying most of the count is smaller Grade B/C/informal godowns; ~50,000 blends the directory figure with an allowance for agri/state-warehousing-corporation godowns]
2. **Segments:** Small godown (65%), Mid warehouse (25%), Grade A large (10%). [ESTIMATED]
3. **Revenue/job:** Small (10,000 sqft) Tier A/B ₹10 → ₹100,000; Mid (50,000 sqft) Tier B ₹16 → ₹800,000; Grade A (200,000 sqft) blended ₹20 → ₹4,000,000.
4. **Blended avg:** 0.65×100,000+0.25×800,000+0.1×4,000,000 = **₹6,65,000**
5. **Cycle:** 7 years — low cosmetic priority, maintenance/structural-driven.
6. **Sanity check:** 50,000 × 665,000 / 7 = **₹475 Cr/yr** (0.6%) — plausible.

**Blended avg revenue per unit (₹): 665,000**
**Repaint cycle (years): 7**

### 2.14 Paying Guest (PG) Accommodations
1. **National count:** ~385,000 units. [ESTIMATED — derived from ~7.7M total PG beds nationally [SOURCED] ÷ ~20 beds/unit average]
2. **Segments:** Small home-converted PG (70%), Mid purpose-built PG (25%), Premium co-living (5%). [ESTIMATED]
3. **Revenue/job:** Small (1,500 sqft) Tier A/B ₹12 → ₹18,000; Mid (4,000 sqft) Tier B ₹16 → ₹64,000; Premium (8,000 sqft) Tier C ₹27 → ₹216,000.
4. **Blended avg:** 0.7×18,000+0.25×64,000+0.05×216,000 = **₹39,400**
5. **Cycle:** 4 years.
6. **Sanity check:** 385,000 × 39,400 / 4 = **₹379 Cr/yr** (0.5%) — plausible.

**Blended avg revenue per unit (₹): 39,400**
**Repaint cycle (years): 4**

### 2.15 Auto Showrooms
1. **National count:** ~90,000. [ESTIMATED — ~35,000 car dealerships [SOURCED, ~32,900–35,000 range across sources] plus an estimated ~55,000 two-wheeler/commercial-vehicle dealerships nationally, which are far more numerous per FADA's network scale but less precisely counted]
2. **Segments:** Small two-wheeler showroom (55%), Mid car dealership (35%), Premium/luxury showroom (10%). [ESTIMATED]
3. **Revenue/job:** Small (1,500 sqft) Tier B ₹16 → ₹24,000; Mid (6,000 sqft) Tier C ₹27 → ₹162,000; Premium (15,000 sqft) Tier D ₹45 → ₹675,000.
4. **Blended avg:** 0.55×24,000+0.35×162,000+0.1×675,000 = **₹1,37,400**
5. **Cycle:** 3 years — OEM-mandated brand/livery refresh cycles.
6. **Sanity check:** 90,000 × 137,400 / 3 = **₹412 Cr/yr** (0.5%) — plausible.

**Blended avg revenue per unit (₹): 137,400**
**Repaint cycle (years): 3**

### 2.16 Petrol Pumps
1. **National count:** ~103,000. [SOURCED — crossed 1,00,266 pumps as of Nov 2025/2026 reporting]
2. **Segments:** Standard PSU-branded pump (85%), Premium/highway pump with retail store (15%). [ESTIMATED]
3. **Revenue/job:** Standard (2,000 sqft canopy+building) branded livery ₹25/sqft → ₹50,000; Premium (5,000 sqft) ₹27 → ₹135,000.
4. **Blended avg:** 0.85×50,000+0.15×135,000 = **₹62,750**
5. **Cycle:** 3 years — OEMs (IOC/BPCL/HPCL) enforce periodic livery/brand-identity repainting independent of wear.
6. **Sanity check:** 103,000 × 62,750 / 3 = **₹215 Cr/yr** (0.3%) — plausible.

**Blended avg revenue per unit (₹): 62,750**
**Repaint cycle (years): 3**

### 2.17 Bus-Stand-Market (small shops near bus stands/local markets)
1. **National count:** ~150,000 shop units. [ESTIMATED — no official count exists for this micro-retail category; inferred as a subset of India's small local-market shop stock concentrated around transit hubs]
2. **Segments:** Small shop (80%), Mid shop (18%), Anchor shop (2%). [ESTIMATED]
3. **Revenue/job:** Small (150 sqft) Tier A ₹8 → ₹1,200; Mid (400 sqft) Tier B ₹16 → ₹6,400; Anchor (1,000 sqft) Tier B ₹16 → ₹16,000.
4. **Blended avg:** 0.8×1,200+0.18×6,400+0.02×16,000 = **₹2,432**
5. **Cycle:** 4 years.
6. **Sanity check:** 150,000 × 2,432 / 4 = **₹9 Cr/yr** (0.01%) — very small in absolute terms; this is expected given tiny unit size, and is a low-confidence/low-materiality cluster (see Section 4).

**Blended avg revenue per unit (₹): 2,432**
**Repaint cycle (years): 4**

### 2.18 Highway Dhabas
1. **National count:** ~70,000. [ESTIMATED — no official registry; inferred from India's highway network length and typical dhaba spacing/density on busy corridors]
2. **Segments:** Small dhaba (70%), Mid dhaba-restaurant (25%), Large highway resto-motel (5%). [ESTIMATED]
3. **Revenue/job:** Small (800 sqft) Tier A ₹10 → ₹8,000; Mid (2,000 sqft) Tier B ₹16 → ₹32,000; Large (6,000 sqft) Tier C ₹27 → ₹162,000.
4. **Blended avg:** 0.7×8,000+0.25×32,000+0.05×162,000 = **₹21,700**
5. **Cycle:** 3 years — high dust/grime exposure and food-hygiene norms.
6. **Sanity check:** 70,000 × 21,700 / 3 = **₹51 Cr/yr** (0.06%) — small, plausible.

**Blended avg revenue per unit (₹): 21,700**
**Repaint cycle (years): 3**

### 2.19 Jewellery Showrooms
1. **National count:** ~400,000. [ESTIMATED — estimates range widely from ~86,000 GST-registered jewellers [SOURCED] to 350,000–600,000+ including unorganized family jewellers [SOURCED range]; 400,000 is a midpoint working figure]
2. **Segments:** Small local jeweller (75%), Mid showroom (20%), Large/flagship (5%). [ESTIMATED]
3. **Revenue/job:** Small (300 sqft, but disproportionately high finish quality for trust/security image) Tier C ₹27 → ₹8,100; Mid (1,500 sqft) Tier D ₹45 → ₹67,500; Flagship (5,000 sqft) premium ₹55 → ₹275,000.
4. **Blended avg:** 0.75×8,100+0.2×67,500+0.05×275,000 = **₹33,325**
5. **Cycle:** 4 years — brand-image driven.
6. **Sanity check:** 400,000 × 33,325 / 4 = **₹333 Cr/yr** (0.4%) — plausible.

**Blended avg revenue per unit (₹): 33,325**
**Repaint cycle (years): 4**

### 2.20 Textile/Garment Shops
1. **National count:** 318,716 (~320,000) clothing stores. [SOURCED — business directory compilation, April 2026]
2. **Segments:** Small shop (70%), Mid store (25%), Large/branded outlet (5%). [ESTIMATED]
3. **Revenue/job:** Small (300 sqft) Tier B ₹16 → ₹4,800; Mid (1,200 sqft) Tier C ₹27 → ₹32,400; Large (4,000 sqft) Tier D ₹45 → ₹180,000.
4. **Blended avg:** 0.7×4,800+0.25×32,400+0.05×180,000 = **₹20,460**
5. **Cycle:** 4 years.
6. **Sanity check:** 320,000 × 20,460 / 4 = **₹164 Cr/yr** (0.2%) — plausible.

**Blended avg revenue per unit (₹): 20,460**
**Repaint cycle (years): 4**

---

## 3. Closing Table — National Annual Revenue Potential by Cluster

| # | Cluster | National Count | Blended Avg Revenue/Unit (₹) | Cycle (yrs) | National Potential (₹ Cr/yr) | % of ₹80,000 Cr market |
|---|---|---:|---:|---:|---:|---:|
| 1 | Schools | 1,470,000 | 112,500 | 5 | 3,308 | 4.1% |
| 2 | Colleges | 48,246 | 893,000 | 5 | 862 | 1.1% |
| 3 | Hospitals | 70,000 | 1,060,500 | 3 | 2,475 | 3.1% |
| 4 | Clinics-nursing | 500,000 | 59,600 | 3 | 993 | 1.2% |
| 5 | Restaurants | 500,000 | 30,315 | 3 | 505 | 0.6% |
| 6 | Hotels | 50,000 | 402,450 | 3 | 671 | 0.8% |
| 7 | Marriage-halls | 40,000 | 244,800 | 4 | 245 | 0.3% |
| 8 | Religious | 1,000,000 | 59,500 | 5 | 1,190 | 1.5% |
| 9 | Mid-apartments | 250,000 | 185,000 | 6 | 771 | 1.0% |
| 10 | Gated-community | 6,000 | 3,425,000 | 6 | 343 | 0.4% |
| 11 | Redevelopment | 15,000/yr | 1,674,000 | 1 (flow) | 2,511 | 3.1% |
| 12 | Midc | 250,000 | 535,000 | 6 | 2,229 | 2.8% |
| 13 | Warehousing | 50,000 | 665,000 | 7 | 475 | 0.6% |
| 14 | Paying-guest | 385,000 | 39,400 | 4 | 379 | 0.5% |
| 15 | Auto-showrooms | 90,000 | 137,400 | 3 | 412 | 0.5% |
| 16 | Petrol-pumps | 103,000 | 62,750 | 3 | 215 | 0.3% |
| 17 | Bus-stand-market | 150,000 | 2,432 | 4 | 9 | 0.01% |
| 18 | Highway-dhabas | 70,000 | 21,700 | 3 | 51 | 0.06% |
| 19 | Jewellery | 400,000 | 33,325 | 4 | 333 | 0.4% |
| 20 | Textile-garment | 320,000 | 20,460 | 4 | 164 | 0.2% |
| | **TOTAL** | | | | **~18,141** | **~22.7%** |

**Sum-total sanity check:** ~₹18,141 Cr/year across all 20 clusters, or ~22.7% of the ₹80,000 Cr total Indian paints market. This is well within the "not an absurd multiple" guardrail (nowhere near 5–10x the market), and is comfortably below the working ceiling of 25–35% set in Section 1 for "all institutional/commercial repaint TAM combined," leaving room for residential retail (the largest single segment, outside this cluster list) plus new-construction and government-infrastructure paint demand to make up the balance of the ₹80,000 Cr market. Schools, Hospitals, Redevelopment, and MIDC are the largest individual contributors (each 2.8–4.1% of market) — all four were explicitly checked against the ≤4–5%-of-market threshold and are at or near that boundary by design, reflecting their genuinely large national footprints (Schools: 1.47M units; Hospitals: high spend/unit + short 3-yr cycle; Redevelopment: high spend/unit as a fresh full-building job; MIDC: large industrial floor-plates), not a calibration error.

---

## 4. Confidence Flags & Judgment Calls

**Low confidence / no hard national count available — size distribution is a reasoned estimate, not sourced:**
- **Gated-community** (~6,000): no registry for "integrated township" as a distinct category exists; figure is inferred, not counted.
- **Redevelopment** (~15,000/yr): treated as an annual flow rather than a stock, which is a structural modeling choice, not just a number — flag for whoever wires this into the app that it should NOT be divided by a multi-year cycle the way the other 19 clusters are.
- **Bus-stand-market** (~150,000) and **Highway-dhabas** (~70,000): both are informal micro-retail categories with no official census; counts are order-of-magnitude judgment calls based on general market structure, not derived from any cited source.
- **MIDC/industrial estates** (~250,000) and **Warehousing** (~50,000): extrapolated from Maharashtra-specific (MIDC) or directory-based (warehousing) source data to a national estimate; the multiplier used to go from state-level or directory data to national-level is a judgment call.
- **Religious** (~1,000,000): documented temple counts alone range from 650,000 to over 2,000,000 depending on definition and source; the 1,000,000 figure (all faiths, discounting minor unmaintained shrines) is a considered midpoint, not a precise count.
- **Paying-guest** (~385,000 units): derived by dividing a sourced total-beds figure (7.7M) by an assumed average beds/unit (20) — the average-beds assumption is not independently sourced.
- **Auto-showrooms** (~90,000): the car-dealership component is sourced; the two-wheeler/commercial-vehicle dealership component (~55,000) is an estimate with no single cited count.
- **Jewellery** (~400,000): source estimates for this category vary by nearly 7x (86,000 GST-registered vs. 2.5M+ informal claims); 400,000 is a deliberately conservative midpoint.

**Segment/tier splits (govt-vs-private, small-vs-large, etc.) are judgment calls in every cluster**, informed by whichever single hard data point was available (e.g., UDISE's 22.5% private-school share, the 37%/63% govt/private hospital split) but extended into 2–3 tiers by reasoning rather than a sourced breakdown. This is the mechanism most directly responsible for fixing the original bug, so it is worth flagging explicitly: if any of these splits are later found to be off (e.g., if private urban schools are actually a larger share than 20% assumed here), the blended averages and resulting national potentials should be re-run.

**Clusters where the blended average was explicitly revised downward from a naive first pass**, per the task's required sanity-check-and-revise step:
- **Schools** — a naive assumption of primarily private/mid-urban schools reproduces something close to the original ₹29,400 Cr bug; revising to a 75% govt/rural-dominant distribution brought it down to ₹3,308 Cr (~4.1% of market).
- **MIDC** — an initial 60/30/10 small/mid/large split produced ₹4,250 Cr (5.3% of market, above the self-imposed ceiling); revised to 75/20/5 to bring it to ₹2,229 Cr (2.8%).

No other cluster required a downward revision; all others landed under ~3.2% of the total market on the first reasoned pass.
