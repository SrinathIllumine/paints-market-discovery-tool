# Paints Market Discovery Tool

App Name: Systematic Engagement & Discovery Tool
User Persona: Demand Generator (Retail Sales & Distribution – JK Cement)
Stage: 1 of 5 - Identify Market Clusters

🎯 Core Intent of This Screen

Design a clean, intuitive dashboard that helps a Demand Generator (DG) identify and map relevant market clusters in their geography (Panvel, Mumbai). The output of this stage is a Cluster Map.

👋 HEADER SECTION

Display a personalized welcome message:

"Welcome Sunil Kumar! Let's map the clusters in your area - Panvel, Mumbai"

Keep it prominent, friendly, and motivating.

🌐 SCREEN 1: META-CLUSTER SELECTION

Layout:

Use a clean white/light background

Display meta-clusters as evenly spaced circular bubbles

Each bubble should be clickable

Avoid clutter - limit simultaneous on-screen items (use pagination/expand if needed)

Meta-clusters to show (from backend intelligence + default list):

Residential Construction Clusters

Residential Renovation Clusters

Institutional Clusters

Commercial Clusters

Industrial & Logistics Clusters

Trade & Contractor Ecosystem Clusters

Social & Community Infrastructure Clusters

Religious & Pilgrimage Clusters

Rural Housing & Semi-Urban Expansion

Agricultural & Rural Commercial Clusters

Tourism & Transit Clusters

Informal & Local Economy Clusters

(These are sourced from the provided cluster framework.)

💡 Smart Backend Behavior:

Pre-highlight or prioritize meta-clusters relevant to Panvel (e.g., Residential Construction, Industrial, Logistics, Highway, Tourism - based on location intelligence)

Use subtle visual cues:

Slightly larger bubbles

Glow or highlight border

“Recommended” tag

➕ User Input Options:

Button: “+ Add Missing Meta-Cluster”

Input: free text or dropdown suggestions

🧠 Thinking Triggers (show as subtle prompts):

“Are there any upcoming developments not captured here?”

“Are there clusters emerging due to infrastructure growth?”

“Have you considered seasonal or temporary demand pockets?”

📊 SCREEN 2: CLUSTER SELECTION (DRILL-DOWN)

On clicking a meta-cluster:

Layout:

Show related clusters as smaller bubbles

Maintain the same visual style for consistency

Example (If “Residential Construction Clusters” is clicked):

Show:

Large Residential Township Projects

Mid-Size Apartment Buildings

Redevelopment Housing Projects

Affordable Housing Clusters

Independent House Construction Areas

Luxury Villa / Bungalow Clusters

Row House / Gated Community Projects

Farmhouse / Weekend Home Belts

(All clusters are derived from the provided document.)

Smart Behavior:

Show only clusters relevant to Panvel geography

Allow scroll or expand options if needed

➕ User Options:

Button: “+ Add Missing Cluster”

🧠 Trigger Prompts:

“Are there niche segments in your market not visible here?”

“Are there builder segments or income groups forming new clusters?”

“Are there redevelopment or infrastructure-led pockets emerging?”

🗺️ SCREEN 3: PROSPECT MAP VIEW

On clicking a cluster:

Layout:

Display a map view (Google Maps-like UI)

Minimalistic and zoom-friendly

Show:

Pins for potential prospects/projects in Panvel

Each pin shows:

Project / Site name

Area/locality

Basic road layout

Smart Data Layer:

Auto-fetch prospects using:

Map data

Real estate listings

Construction trends

Urban expansion indicators

User Interaction:

Allow:

✅ Select prospects (checkbox/pin selection)

➕ Add missing prospect manually

Minimal popup on click — avoid dense info

🧩 FINAL ACTION: CREATE CLUSTER MAP

After selection:

Button: “Confirm & Create Cluster Map”

Output:

Saved cluster

Tagged prospects

Ready for next stage

🔒 PROGRESSION LOGIC

Lock navigation to next stage until: 
✅ At least one meta-cluster selected
✅ At least one cluster selected
✅ At least one prospect mapped
✅ Instructions for other stages like Shortlist Clusters, Connect, Create Trust Surplus, Insidership will be provided later.



🎨 DESIGN PRINCIPLES

Clean, minimalist UI (no clutter)

High whitespace usage

Clear visual hierarchy

Smooth transitions between stages

Use soft colors + subtle shadows for bubbles

Mobile-friendly and tablet-friendly layout

💼 BUSINESS OUTCOME ALIGNMENT

Ensure UI subtly reinforces:

Micro-market intelligence creation

Customer-need-based segmentation (not product-led)

Field usability for DGs

Strategic visibility for ASMs

🧠 EXPERIENCE FEEL

Guided but not restrictive

Encourages thinking like a market mapper, not a salesperson

Feels like building an “intelligence asset”, not filling forms

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/237bf877-bd29-4c95-8a8a-ecd41ed00e4e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
