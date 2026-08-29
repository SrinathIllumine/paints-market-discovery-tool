# Systemic View images

Each sub-system's screenshots live under `public/systemic/<slug>/`, referenced by
`src/lib/systemTiles.tsx` via the `image` field on each `contains`/`outcomes` item.

Naming convention: `contains-N.png` / `outcomes-N.png`, numbered in the same
order as the bullet list for that section in `systemTiles.tsx`.

Sub-system slugs: `dg-app`, `asm-dashboard`, `leadership-dashboard`,
`knowledge-base`, `nudges-campaigns`, `continuous-evolution`.

## dg-app

| File | Item |
| --- | --- |
| `contains-1.png` | Market Potential Mapping |
| `contains-2.png` | Cluster Engagement Plan |
| `contains-3.png` | Customer Sales Enablement |
| `contains-4.png` | Cluster potential report |
| `contains-5.png` | Cluster engagement report |
| `outcomes-1.png` | Access level of the DG in a cluster |
| `outcomes-2.png` | Overall market potential in a cluster |
| `outcomes-3.png` | Action plans for cluster engagements |

A missing or broken image falls back to the sub-system's icon automatically —
files can be dropped in at any time without touching the code.
