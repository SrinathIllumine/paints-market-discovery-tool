# Cluster Revenue Potential — Full Calculation Explainer (All 20 Clusters)

This is the single, consolidated reference for how the "Revenue Potential"
figure is calculated for every one of the 20 market clusters used across
Leadership Analytics, ASM Analytics, and the Market Discovery
System/DG Dashboard. It supersedes needing to cross-reference the two
earlier research passes (`cluster-revenue-cycle-research.md`, the original
calibration; and `cluster-revenue-owner-neutral-recalc.md`, the correction
for two clusters) — everything from both is folded in here, cluster by
cluster.

## The method, in one page

Every cluster's revenue potential is built the same way:

1. **National count** — how many of that cluster type exist in India.
   Sourced from official data (UDISE, AISHE, PIB, WHO/industry
   compilations, etc.) where a registry exists; reasoned when it doesn't.
2. **Segment split** — most cluster types aren't uniform, so each is split
   into 2–3 tiers (small/mid/large, or govt/private, etc.) by estimated
   share of the national count.
3. **Revenue per job, per tier** — each tier's typical sqft is priced using
   real Indian painting-cost benchmarks:

   | Tier | ₹/sqft | Use |
   |---|---|---|
   | A – Basic | ₹7–8 | whitewash/distemper, govt/rural, minimal spec |
   | B – Standard | ₹16 | typical urban commercial/institutional repaint |
   | C – Upgraded | ₹27 | premium emulsion + exterior weatherproofing |
   | D – Premium/brand | ₹40–55 | showrooms, star hotels, jewellery |
   | E – Industrial | ₹20–75 | structural/floor coatings |

   [SOURCED benchmarks — Asian Paints, Houseyog, NoBroker, industrial
   epoxy-costing guides; blended tiers are ESTIMATED from them]
4. **Blended average revenue per unit** — the weighted sum across tiers:
   `avgRevenuePerUnit = Σ(tier share × tier revenue-per-job)`.
5. **Repaint cycle** — how often that job repeats, in years (general
   guidance: hospitals/clinics 2–3 yrs, high-footfall retail/hospitality
   3–5 yrs, institutional 3–7 yrs, exteriors 5–10 yrs — [SOURCED general
   pattern], applied per cluster as an [ESTIMATED] judgment call).
6. **Annual revenue potential** = `national count × avgRevenuePerUnit ÷ repaintCycleYears`,
   sanity-checked against the ~₹80,000–1,00,000 Cr total Indian paints
   market so no single cluster is implausibly large.

**The one correction made to this method** (covered in full in
`cluster-revenue-owner-neutral-recalc.md`, summarized per-cluster below):
a cluster's paintable area is priced **regardless of who pays for the
job**. For 18 of the 20 clusters, the "unit" is a single-owner premise
(one school, one hospital, one shop), so this was already true from the
start. Only **Mid-Size Apartment Buildings** and **Gated Community** are
built from many separately-owned interior units plus a shared area — those
two originally priced the shared area only, and are recalculated below to
include every individually-owned interior too.

Tags: **[SOURCED]** = backed by a cited source. **[ESTIMATED]** = a
reasoned judgment call where no hard registry/survey exists.

---

## 1. Schools
1. **National count:** 14.72 lakh (1,470,000) schools. [SOURCED — PIB, Economic Survey 2024-25]
2. **Segments:** Govt/rural/small (75%), Mid-size private/aided urban (20%), Large elite private (5%). [ESTIMATED — the 22.5% private-school share is UDISE-sourced; the tier split within it is a judgment call]
3. **Revenue/job per tier:** Govt/rural (~2,000 sqft) Tier A ₹7/sqft → ₹14,000; Mid private (~15,000 sqft) Tier B ₹16/sqft → ₹2,40,000; Large elite (~40,000 sqft) Tier C ₹27/sqft → ₹10,80,000.
4. **Blended avg:** `0.75×14,000 + 0.20×2,40,000 + 0.05×10,80,000 = ₹1,12,500`
5. **Cycle:** 5 years — govt schools repaint on budget/scheme cycles, private schools every 3–4 yrs; blended.
6. **Owner-neutral check:** ✅ already whole-building — a school has one owner (govt body or private trust), no separately-owned interior units inside it.
7. **National revenue potential:** `1,470,000 × 1,12,500 ÷ 5 = ₹3,308 Cr/yr` (4.1% of market — at the top of the acceptable range given sheer unit count, but not a calibration error).

---

## 2. Colleges & Universities
1. **National count:** 48,246 colleges. [SOURCED — AISHE 2023-24]
2. **Segments:** Govt/low-budget (40%), Mid-size private (45%), Large university campuses (15%). [ESTIMATED]
3. **Revenue/job:** Govt (20,000 sqft) Tier B ₹16 → ₹3,20,000; Mid private (40,000 sqft) blended ₹20 → ₹8,00,000; Large campus (100,000 sqft) Tier C ₹27 → ₹27,00,000.
4. **Blended avg:** `0.4×3,20,000 + 0.45×8,00,000 + 0.15×27,00,000 = ₹8,93,000`
5. **Cycle:** 5 years.
6. **Owner-neutral check:** ✅ single institution owns the whole campus.
7. **National revenue potential:** `48,246 × 8,93,000 ÷ 5 = ₹862 Cr/yr` (1.1% of market — plausible).

---

## 3. Hospitals & Healthcare Buildings
1. **National count:** ~70,000 (37% govt ≈26,000; 63% private ≈43,486). [SOURCED — WHO GHO/industry compilation]
2. **Segments:** Small govt/PHC-scale (40%), Private mid-size (45%), Large corporate hospital (15%). [ESTIMATED]
3. **Revenue/job:** Small govt (15,000 sqft) Tier B ₹16 → ₹2,40,000; Private mid (30,000 sqft) Tier C ₹27 → ₹8,10,000; Large corporate (100,000 sqft) Tier D ₹40 → ₹40,00,000.
4. **Blended avg:** `0.4×2,40,000 + 0.45×8,10,000 + 0.15×40,00,000 = ₹10,60,500`
5. **Cycle:** 3 years — hygiene/infection-control norms drive frequent repainting. [ESTIMATED per general commercial-repaint guidance for medical facilities]
6. **Owner-neutral check:** ✅ single hospital entity owns the whole building, patient rooms included.
7. **National revenue potential:** `70,000 × 10,60,500 ÷ 3 = ₹2,475 Cr/yr` (3.1% — plausible).

---

## 4. Local Clinic / Nursing Home Clusters
1. **National count:** ~500,000. [ESTIMATED — built from 7,394 registered nursing homes [SOURCED], ~40,000 small <30-bed community hospitals [SOURCED], plus independent clinics inferred from India's ~1.3M registered doctors]
2. **Segments:** Small solo clinic (70%), Mid nursing home (25%), Larger diagnostic/multi-specialty (5%).
3. **Revenue/job:** Solo clinic (500 sqft) Tier B ₹16 → ₹8,000; Nursing home (5,000 sqft) Tier C ₹27 → ₹1,35,000; Multi-specialty (15,000 sqft) Tier C ₹27 → ₹4,05,000.
4. **Blended avg:** `0.7×8,000 + 0.25×1,35,000 + 0.05×4,05,000 = ₹59,600`
5. **Cycle:** 3 years (hygiene-critical).
6. **Owner-neutral check:** ✅ single doctor/operator owns the whole premise.
7. **National revenue potential:** `500,000 × 59,600 ÷ 3 = ₹993 Cr/yr` (1.2% — plausible).

---

## 5. Restaurant / Café / Hospitality Interiors
1. **National count:** 500,000+. [SOURCED — NRAI India Food Services Report 2024]
2. **Segments:** Small/street-style (55%), Mid casual dining (35%), Premium/fine dining chains (10%). [ESTIMATED]
3. **Revenue/job:** Small (400 sqft) Tier A/B ₹12 → ₹4,800; Mid (1,500 sqft) Tier C ₹27 → ₹40,500; Premium (3,000 sqft) Tier D ₹45 → ₹1,35,000.
4. **Blended avg:** `0.55×4,800 + 0.35×40,500 + 0.10×1,35,000 = ₹30,315`
5. **Cycle:** 3 years — high footfall, hygiene, brand refresh.
6. **Owner-neutral check:** ✅ single restaurant owner/chain owns the whole premise.
7. **National revenue potential:** `500,000 × 30,315 ÷ 3 = ₹505 Cr/yr` (0.6% — plausible, low relative to count since most restaurants are small).

---

## 6. Hotels / Resorts / Lodges
1. **National count:** ~50,000 (~48,775 classified + unclassified accommodation units). [SOURCED, with caveat informal guesthouses may push this higher]
2. **Segments:** Budget/unclassified (65%), Mid-scale (25%), Star/luxury (10%). [ESTIMATED]
3. **Revenue/job:** Budget (3,000 sqft) Tier B ₹16 → ₹48,000; Mid-scale (15,000 sqft) Tier C ₹27 → ₹4,05,000; Star/luxury (60,000 sqft) Tier D ₹45 → ₹27,00,000.
4. **Blended avg:** `0.65×48,000 + 0.25×4,05,000 + 0.10×27,00,000 = ₹4,02,450`
5. **Cycle:** 3 years — brand image and guest-experience driven, high traffic.
6. **Owner-neutral check:** ✅ single hotel owner/chain owns the whole building, every guest room included.
7. **National revenue potential:** `50,000 × 4,02,450 ÷ 3 = ₹671 Cr/yr` (0.8% — plausible).

---

## 7. Marriage Halls / Convention Centers
1. **National count:** ~40,000. [ESTIMATED — blends 29,109 documented banquet halls (Oct 2025) [SOURCED] with informal community halls not in commercial directories]
2. **Segments:** Small community hall (60%), Mid banquet hall (30%), Large premium venue (10%). [ESTIMATED]
3. **Revenue/job:** Small (3,000 sqft) Tier B ₹16 → ₹48,000; Mid (10,000 sqft) Tier C ₹27 → ₹2,70,000; Large (30,000 sqft) Tier D ₹45 → ₹13,50,000.
4. **Blended avg:** `0.6×48,000 + 0.3×2,70,000 + 0.1×13,50,000 = ₹2,44,800`
5. **Cycle:** 4 years.
6. **Owner-neutral check:** ✅ single venue operator owns the whole hall.
7. **National revenue potential:** `40,000 × 2,44,800 ÷ 4 = ₹245 Cr/yr` (0.3% — plausible).

---

## 8. Religious Cluster
1. **National count:** ~1,000,000. [ESTIMATED — documented Hindu temple counts alone range 6.5–20 lakh depending on definition; adding mosques/churches/gurdwaras and discounting tiny unmaintained shrines, 1M is a conservative working figure]
2. **Segments:** Small local shrine/temple (75%, minimal commercial paint spend), Mid trust-run temple/mosque/church (20%), Major pilgrimage/large trust (5%).
3. **Revenue/job:** Small (500 sqft) Tier A ₹8 → ₹4,000; Mid (5,000 sqft) Tier B ₹16 → ₹80,000; Major (30,000 sqft) Tier C ₹27 → ₹8,10,000.
4. **Blended avg:** `0.75×4,000 + 0.2×80,000 + 0.05×8,10,000 = ₹59,500`
5. **Cycle:** 5 years — donation/festival-cycle driven rather than a fixed maintenance schedule.
6. **Owner-neutral check:** ✅ single trust owns the whole structure.
7. **National revenue potential:** `1,000,000 × 59,500 ÷ 5 = ₹1,190 Cr/yr` (1.5% — plausible).

---

## 9. Mid-Size Apartment Buildings / Residential Societies — REVISED
*This is one of the two clusters corrected for owner-neutral pricing — see full derivation in `cluster-revenue-owner-neutral-recalc.md` §2. Summary below.*

**Why it changed:** the original pass priced only the society's shared
common areas + building facade, explicitly excluding each flat owner's own
interior on the reasoning that individual homes are a separate market
segment. That's wrong — a flat's interior is paintable area that belongs
to this cluster, whoever pays for the job.

**Facade/common areas (unchanged, still correct on its own terms):**
| Tier | Share | Sqft | Rate | Job/6-yr cycle |
|---|---|---|---|---|
| Small (10–30 units) | 50% | 3,000 | ₹16 | ₹48,000 |
| Mid (30–100 units) | 40% | 10,000 | ₹20 | ₹2,00,000 |
| Large (100+ units) | 10% | 30,000 | ₹27 | ₹8,10,000 |

**Added: every flat's own interior**, sized by [SOURCED] Indian 2BHK
carpet-area ranges (650–1,200 sqft depending on city/segment) and
[SOURCED] home-interior repaint frequency (3–5 years — shorter than the
facade's 6-year cycle):
| Tier | Flats/building (est., consistent with the existing unit bands) | Avg flat size | Rate | Job/4-yr cycle |
|---|---|---|---|---|
| Small | 20 | 700 sqft | ₹16 | ₹2,24,000 |
| Mid | 65 | 950 sqft | ₹20 | ₹12,35,000 |
| Large | 150 | 1,300 sqft | ₹27 | ₹52,65,000 |

**Blending two different cycles into one annual figure per building:**
| Tier | Facade annual (÷6) | Interior annual (÷4) | Total annual |
|---|---|---|---|
| Small | ₹8,000 | ₹56,000 | ₹64,000 |
| Mid | ₹33,333 | ₹3,08,750 | ₹3,42,083 |
| Large | ₹1,35,000 | ₹13,16,250 | ₹14,51,250 |

**Blended annual revenue per building:** `0.5×64,000 + 0.4×3,42,083 + 0.1×14,51,250 = ₹3,13,958/yr`

**National count:** ~250,000 societies. [ESTIMATED — MCA shows 200,000+ registered housing cooperatives [SOURCED]; total incl. non-cooperative RWAs is somewhat higher]

**National revenue potential:** `250,000 × 3,13,958 = ₹7,849 Cr/yr` (up from ₹771 Cr/yr — ~9.8% of market).

*In code: `avgRevenuePerUnit = 313,958`, `repaintCycleYears = 1` (this figure is already annual, so the divide is a no-op — same convention as Redevelopment below).*

---

## 10. Gated Community Projects — REVISED
*The second cluster corrected for owner-neutral pricing — see full derivation in `cluster-revenue-owner-neutral-recalc.md` §3. Summary below.*

**Facade/common areas (unchanged):**
| Tier | Share | Sqft | Rate | Job/6-yr cycle |
|---|---|---|---|---|
| Mid | 60% | 50,000 | ₹27 | ₹13,50,000 |
| Large | 30% | 150,000 | ₹27 | ₹40,50,000 |
| Mega | 10% | 400,000 | ₹35 | ₹1,40,00,000 |

**Added: every villa/flat's own interior**, unit counts backed out from
the existing common-area sqft at ~80–100 sqft shared space per unit
(consistent with the ratio validated in the Mid-Apartments recalc):
| Tier | Units/township (est.) | Avg unit size | Rate | Job/4-yr cycle |
|---|---|---|---|---|
| Mid | 500 | 1,100 sqft | ₹20 | ₹1,10,00,000 |
| Large | 1,500 | 1,300 sqft | ₹27 | ₹5,26,50,000 |
| Mega | 5,000 | 1,600 sqft | ₹40 | ₹32,00,00,000 |

**Annualized (facade÷6 + interior÷4):**
| Tier | Facade annual | Interior annual | Total annual |
|---|---|---|---|
| Mid | ₹2,25,000 | ₹27,50,000 | ₹29,75,000 |
| Large | ₹6,75,000 | ₹1,31,62,500 | ₹1,38,37,500 |
| Mega | ₹23,33,333 | ₹8,00,00,000 | ₹8,23,33,333 |

**Blended annual revenue per township:** `0.6×29,75,000 + 0.3×1,38,37,500 + 0.1×8,23,33,333 = ₹1,41,69,583/yr`

**National count:** ~6,000 townships. [ESTIMATED — no registry exists for "integrated township" as a distinct category]

**National revenue potential:** `6,000 × 1,41,69,583 = ₹8,502 Cr/yr` (up from ₹343 Cr/yr — ~10.6% of market).

*In code: `avgRevenuePerUnit = 14,169,583`, `repaintCycleYears = 1`.*

---

## 11. Redevelopment Housing Projects
1. **National count:** ~15,000 projects/year — a **flow**, not a stock. [ESTIMATED — Mumbai alone has thousands of societies in the redevelopment pipeline, plus Pune/Delhi-NCR/Bengaluru/Chennai; no single national registry exists]
2. **Segments:** Small (60%), Mid (30%), Large (10%). [ESTIMATED]
3. **Revenue/job (full fresh paint job on the rebuilt structure):** Small (30,000 sqft) Tier C ₹27 → ₹8,10,000; Mid (80,000 sqft) ₹27 → ₹21,60,000; Large (200,000 sqft) Tier D-adjacent ₹27 → ₹54,00,000.
4. **Blended avg:** `0.6×8,10,000 + 0.3×21,60,000 + 0.1×54,00,000 = ₹16,74,000`
5. **"Cycle":** fixed at **1 year** — the "count" here is already an annual flow of newly-completed projects, not a stock to divide by a multi-year cycle.
6. **Owner-neutral check:** ✅ already whole-structure by nature, and deliberately *not* revised further under the new principle — this cluster models the **one-time** fresh-paint event at construction handover (which necessarily covers the entire rebuilt structure, every flat included, since that's what "fresh paint on the rebuilt structure" means on day one). Its *ongoing* future repaints (facade + individual flat interiors) are correctly picked up afterward by the Mid-Apartments cluster once the building is occupied and registered as a society — modeling them here too would double-count the same paint job twice.
7. **National revenue potential:** `15,000 × 16,74,000 ÷ 1 = ₹2,511 Cr/yr` (3.1% — plausible for a flow-based cluster, most sensitive of all 20 to the annual-completions assumption).

---

## 12. MIDC / Industrial Estate Clusters
1. **National count:** ~250,000 units. [ESTIMATED — Maharashtra's MIDC alone has allotted 75,000+ plots across ~289–300 industrial areas [SOURCED]; extrapolated nationally via GIDC-Gujarat and similar state bodies]
2. **Segments:** Small unit (75%), Mid unit (20%), Large plant (5%). [ESTIMATED — revised down from an initial 60/30/10 split that produced an implausible ₹4,250 Cr/5.3%]
3. **Revenue/job:** Small (5,000 sqft) blended ₹16 → ₹80,000; Mid (20,000 sqft) blended ₹25 → ₹5,00,000; Large plant (100,000 sqft) Tier E ₹75 → ₹75,00,000.
4. **Blended avg:** `0.75×80,000 + 0.2×5,00,000 + 0.05×75,00,000 = ₹5,35,000`
5. **Cycle:** 6 years — maintenance-driven, not cosmetic.
6. **Owner-neutral check:** ✅ single factory/plant owner owns the whole unit.
7. **National revenue potential:** `250,000 × 5,35,000 ÷ 6 = ₹2,229 Cr/yr` (2.8% — plausible).

---

## 13. Warehouse & Logistics Parks
1. **National count:** ~50,000. [ESTIMATED — a directory count cites 35,252 warehouses [SOURCED, informal-market source]; Grade A/B organized stock is only 371M sqft across the top 8 cities [SOURCED — JLL/Cargo Talk], implying most of the count is smaller Grade B/C/informal godowns]
2. **Segments:** Small godown (65%), Mid warehouse (25%), Grade A large (10%). [ESTIMATED]
3. **Revenue/job:** Small (10,000 sqft) Tier A/B ₹10 → ₹1,00,000; Mid (50,000 sqft) Tier B ₹16 → ₹8,00,000; Grade A (200,000 sqft) blended ₹20 → ₹40,00,000.
4. **Blended avg:** `0.65×1,00,000 + 0.25×8,00,000 + 0.1×40,00,000 = ₹6,65,000`
5. **Cycle:** 7 years — low cosmetic priority, maintenance/structural-driven.
6. **Owner-neutral check:** ✅ single operator owns the whole warehouse.
7. **National revenue potential:** `50,000 × 6,65,000 ÷ 7 = ₹475 Cr/yr` (0.6% — plausible).

---

## 14. Paying Guest Facilities
1. **National count:** ~385,000 units. [ESTIMATED — derived from ~7.7M total PG beds nationally [SOURCED] ÷ ~20 beds/unit average]
2. **Segments:** Small home-converted PG (70%), Mid purpose-built PG (25%), Premium co-living (5%). [ESTIMATED]
3. **Revenue/job:** Small (1,500 sqft) Tier A/B ₹12 → ₹18,000; Mid (4,000 sqft) Tier B ₹16 → ₹64,000; Premium (8,000 sqft) Tier C ₹27 → ₹2,16,000.
4. **Blended avg:** `0.7×18,000 + 0.25×64,000 + 0.05×2,16,000 = ₹39,400`
5. **Cycle:** 4 years.
6. **Owner-neutral check:** ✅ the PG *operator* owns/rents out the whole house and pays for its painting — unlike Mid-Apartments, there's no separate individually-owned interior sitting inside this unit; the whole converted house is already one owner's paintable area.
7. **National revenue potential:** `385,000 × 39,400 ÷ 4 = ₹379 Cr/yr` (0.5% — plausible).

---

## 15. Automobile Showrooms
1. **National count:** ~90,000. [ESTIMATED — ~35,000 car dealerships [SOURCED] plus an estimated ~55,000 two/three-wheeler dealerships, less precisely counted]
2. **Segments:** Small two-wheeler showroom (55%), Mid car dealership (35%), Premium/luxury showroom (10%). [ESTIMATED]
3. **Revenue/job:** Small (1,500 sqft) Tier B ₹16 → ₹24,000; Mid (6,000 sqft) Tier C ₹27 → ₹1,62,000; Premium (15,000 sqft) Tier D ₹45 → ₹6,75,000.
4. **Blended avg:** `0.55×24,000 + 0.35×1,62,000 + 0.1×6,75,000 = ₹1,37,400`
5. **Cycle:** 3 years — OEM-mandated brand/livery refresh cycles.
6. **Owner-neutral check:** ✅ single dealer owns the whole showroom.
7. **National revenue potential:** `90,000 × 1,37,400 ÷ 3 = ₹412 Cr/yr` (0.5% — plausible).

---

## 16. Petrol Pumps
1. **National count:** ~103,000. [SOURCED — crossed 1,00,266 pumps as of late-2025 reporting]
2. **Segments:** Standard PSU-branded pump (85%), Premium/highway pump with retail store (15%). [ESTIMATED]
3. **Revenue/job:** Standard (2,000 sqft canopy+building) branded livery ₹25/sqft → ₹50,000; Premium (5,000 sqft) ₹27 → ₹1,35,000.
4. **Blended avg:** `0.85×50,000 + 0.15×1,35,000 = ₹62,750`
5. **Cycle:** 3 years — OEMs (IOC/BPCL/HPCL) enforce periodic livery/brand-identity repainting independent of wear.
6. **Owner-neutral check:** ✅ single dealer/franchisee owns the whole premise.
7. **National revenue potential:** `103,000 × 62,750 ÷ 3 = ₹215 Cr/yr` (0.3% — plausible).

---

## 17. Bus Stand Commercial Markets
1. **National count:** ~150,000 shop units. [ESTIMATED — no official count exists for this micro-retail category]
2. **Segments:** Small shop (80%), Mid shop (18%), Anchor shop (2%). [ESTIMATED]
3. **Revenue/job:** Small (150 sqft) Tier A ₹8 → ₹1,200; Mid (400 sqft) Tier B ₹16 → ₹6,400; Anchor (1,000 sqft) Tier B ₹16 → ₹16,000.
4. **Blended avg:** `0.8×1,200 + 0.18×6,400 + 0.02×16,000 = ₹2,432`
5. **Cycle:** 4 years.
6. **Owner-neutral check:** ✅ each shop is its own fully-priced unit — the "unit" already *is* one shop, not a shared structure containing many owners.
7. **National revenue potential:** `150,000 × 2,432 ÷ 4 = ₹9 Cr/yr` (0.01% — tiny given shop size, low-confidence/low-materiality cluster).

---

## 18. Highway Hotels / Dhabas
1. **National count:** ~70,000. [ESTIMATED — no official registry; inferred from highway network length and typical dhaba spacing/density]
2. **Segments:** Small dhaba (70%), Mid dhaba-restaurant (25%), Large highway resto-motel (5%). [ESTIMATED]
3. **Revenue/job:** Small (800 sqft) Tier A ₹10 → ₹8,000; Mid (2,000 sqft) Tier B ₹16 → ₹32,000; Large (6,000 sqft) Tier C ₹27 → ₹1,62,000.
4. **Blended avg:** `0.7×8,000 + 0.25×32,000 + 0.05×1,62,000 = ₹21,700`
5. **Cycle:** 3 years — high dust/grime exposure and food-hygiene norms.
6. **Owner-neutral check:** ✅ single dhaba owner owns the whole premise.
7. **National revenue potential:** `70,000 × 21,700 ÷ 3 = ₹51 Cr/yr` (0.06% — small, plausible).

---

## 19. Jewellery Market Buildings
1. **National count:** ~400,000. [ESTIMATED — estimates range from ~86,000 GST-registered jewellers [SOURCED] to 350,000–600,000+ including unorganized family jewellers; 400,000 is a deliberately conservative midpoint]
2. **Segments:** Small local jeweller (75%), Mid showroom (20%), Large/flagship (5%). [ESTIMATED]
3. **Revenue/job:** Small (300 sqft, but disproportionately high finish quality for trust/security image) Tier C ₹27 → ₹8,100; Mid (1,500 sqft) Tier D ₹45 → ₹67,500; Flagship (5,000 sqft) premium ₹55 → ₹2,75,000.
4. **Blended avg:** `0.75×8,100 + 0.2×67,500 + 0.05×2,75,000 = ₹33,325`
5. **Cycle:** 4 years — brand-image driven.
6. **Owner-neutral check:** ✅ single jeweller owns the whole showroom.
7. **National revenue potential:** `400,000 × 33,325 ÷ 4 = ₹333 Cr/yr` (0.4% — plausible).

---

## 20. Textile / Garment Shops
1. **National count:** 318,716 (~320,000) clothing stores. [SOURCED — business directory compilation, April 2026]
2. **Segments:** Small shop (70%), Mid store (25%), Large/branded outlet (5%). [ESTIMATED]
3. **Revenue/job:** Small (300 sqft) Tier B ₹16 → ₹4,800; Mid (1,200 sqft) Tier C ₹27 → ₹32,400; Large (4,000 sqft) Tier D ₹45 → ₹1,80,000.
4. **Blended avg:** `0.7×4,800 + 0.25×32,400 + 0.05×1,80,000 = ₹20,460`
5. **Cycle:** 4 years.
6. **Owner-neutral check:** ✅ single shop owner owns the whole shop.
7. **National revenue potential:** `320,000 × 20,460 ÷ 4 = ₹164 Cr/yr` (0.2% — plausible).

---

## Closing table — all 20 clusters

| # | Cluster | Avg Revenue/Unit (₹) | Cycle (yrs) | National Potential (₹ Cr/yr) | % of ₹80,000 Cr market |
|---|---|---:|---:|---:|---:|
| 1 | Schools | 1,12,500 | 5 | 3,308 | 4.1% |
| 2 | Colleges & Universities | 8,93,000 | 5 | 862 | 1.1% |
| 3 | Hospitals & Healthcare Buildings | 10,60,500 | 3 | 2,475 | 3.1% |
| 4 | Local Clinic / Nursing Home Clusters | 59,600 | 3 | 993 | 1.2% |
| 5 | Restaurant / Café / Hospitality Interiors | 30,315 | 3 | 505 | 0.6% |
| 6 | Hotels / Resorts / Lodges | 4,02,450 | 3 | 671 | 0.8% |
| 7 | Marriage Halls / Convention Centers | 2,44,800 | 4 | 245 | 0.3% |
| 8 | Religious Cluster | 59,500 | 5 | 1,190 | 1.5% |
| 9 | **Mid-Size Apartment Buildings** | **3,13,958** | **1 (pre-annualized)** | **7,849** | **9.8%** |
| 10 | **Gated Community Projects** | **1,41,69,583** | **1 (pre-annualized)** | **8,502** | **10.6%** |
| 11 | Redevelopment Housing Projects | 16,74,000 | 1 (flow) | 2,511 | 3.1% |
| 12 | MIDC / Industrial Estate Clusters | 5,35,000 | 6 | 2,229 | 2.8% |
| 13 | Warehouse & Logistics Parks | 6,65,000 | 7 | 475 | 0.6% |
| 14 | Paying Guest Facilities | 39,400 | 4 | 379 | 0.5% |
| 15 | Automobile Showrooms | 1,37,400 | 3 | 412 | 0.5% |
| 16 | Petrol Pumps | 62,750 | 3 | 215 | 0.3% |
| 17 | Bus Stand Commercial Markets | 2,432 | 4 | 9 | 0.01% |
| 18 | Highway Hotels / Dhabas | 21,700 | 3 | 51 | 0.06% |
| 19 | Jewellery Market Buildings | 33,325 | 4 | 333 | 0.4% |
| 20 | Textile / Garment Shops | 20,460 | 4 | 164 | 0.2% |
| | **TOTAL** | | | **~33,378** | **~42%** |

**Why ~42% and not less:** see `cluster-revenue-owner-neutral-recalc.md`'s
reconciliation — the remaining ~58% of the ₹80,000–1,00,000 Cr total
market is industrial/OEM coatings (~23% of the total, a different market
entirely — auto OEM, marine, railways — not one of these 20 clusters),
decorative new-construction demand (~20–30% of decorative, vs. these 20
clusters modeling *repainting of existing stock*), and standalone
individual homes' repainting (still correctly excluded — no organized
account exists for a free-standing house the way one exists for a school,
a hospital, or a registered housing society).

**Where these numbers live in code:**
- Leadership Analytics & ASM Analytics: `src/lib/clusterResearch.ts` (read by `src/lib/clusterGenerator.ts`)
- Market Discovery System / DG Dashboard: `src/lib/clusterScoring.ts` (its own, separately-scaled per-prospect figures — see `cluster-revenue-owner-neutral-recalc.md` §5 for how those were derived from the same method)
