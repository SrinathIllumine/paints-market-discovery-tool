export type Potential = "H" | "M" | "L";

export type Cluster = {
  id: string;
  name: string;
  description: string;
  nature: string;
  color: string;
  potential: Potential;
  potentialReasons: string[];
  prospectCountEstimate: number;
  demandTags: string[];
  placesQuery: string;
  triggers: string[];
  howToConnect: string[];
  pitch: {
    intro: string;
    context: string;
    intent: string;
  };
};

export const PANVEL_CENTER = { lat: 18.9894, lng: 73.1175 };

type Seed = {
  id: string;
  name: string;
  nature: string;
  description: string;
  potential: Potential;
  placesQuery: string;
  demandTags: string[];
  prospectCountEstimate: number;
};

const SEEDS: Seed[] = [
  {
    id: "mid-apartments",
    name: "Mid-Size Apartment Buildings / Residential Societies",
    nature: "Residential (10–50 flat projects)",
    description: "Mid-sized apartment buildings and societies with steady repainting cycles.",
    potential: "H",
    placesQuery: "residential apartment societies in Panvel",
    demandTags: ["New Construction", "Repainting"],
    prospectCountEstimate: 45,
  },
  {
    id: "redevelopment",
    name: "Redevelopment Housing Projects",
    nature: "Redevelopment",
    description: "Society redevelopment projects in older Panvel pockets, fresh paint demand on handover.",
    potential: "H",
    placesQuery: "redevelopment housing projects Panvel",
    demandTags: ["New Construction"],
    prospectCountEstimate: 22,
  },
  {
    id: "gated-community",
    name: "Gated Community Projects",
    nature: "Gated townships",
    description: "Premium gated townships in the Kharghar–Panvel belt with high-end specifications.",
    potential: "H",
    placesQuery: "gated community township Panvel Kharghar",
    demandTags: ["New Construction", "Repainting"],
    prospectCountEstimate: 18,
  },
  {
    id: "schools",
    name: "Schools",
    nature: "Education — schools",
    description: "Schools needing vacation-cycle repainting and child-safe finishes.",
    potential: "M",
    placesQuery: "schools Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 30,
  },
  {
    id: "colleges",
    name: "Colleges & Universities",
    nature: "Education — higher",
    description: "Large campuses with annual maintenance and hostel painting cycles.",
    potential: "M",
    placesQuery: "colleges universities Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 14,
  },
  {
    id: "hospitals",
    name: "Hospitals & Healthcare Buildings",
    nature: "Healthcare facilities",
    description: "Hospitals needing hygienic, antimicrobial and washable finishes.",
    potential: "M",
    placesQuery: "hospitals healthcare Panvel",
    demandTags: ["Repainting", "Commercial Interiors"],
    prospectCountEstimate: 16,
  },
  {
    id: "restaurants",
    name: "Restaurant / Café / Hospitality Interiors",
    nature: "F&B interiors",
    description: "Restaurants and cafés with frequent interior refresh and theme repaints.",
    potential: "M",
    placesQuery: "restaurants cafe Panvel",
    demandTags: ["Commercial Interiors", "Repainting"],
    prospectCountEstimate: 40,
  },
  {
    id: "hotels",
    name: "Hotels / Resorts / Lodges",
    nature: "Hospitality",
    description: "Hotels and resorts with periodic refurbishment and brand-standard finishes.",
    potential: "M",
    placesQuery: "hotels resorts lodges Panvel",
    demandTags: ["Repainting", "Commercial Interiors"],
    prospectCountEstimate: 18,
  },
  {
    id: "midc",
    name: "MIDC / Industrial Estate Clusters",
    nature: "Industrial / Manufacturing",
    description: "Taloja MIDC and adjacent industrial pockets — durable coatings and large-format demand.",
    potential: "H",
    placesQuery: "Taloja MIDC industrial unit Panvel",
    demandTags: ["New Construction", "Repair-driven"],
    prospectCountEstimate: 28,
  },
  {
    id: "warehousing",
    name: "Warehouse & Logistics Parks",
    nature: "Warehousing & Logistics",
    description: "JNPT-driven warehousing parks — large surface areas, repeat institutional buyers.",
    potential: "M",
    placesQuery: "warehouse logistics park Panvel JNPT",
    demandTags: ["New Construction", "Repair-driven"],
    prospectCountEstimate: 20,
  },
  {
    id: "marriage-halls",
    name: "Marriage Halls / Convention Centers",
    nature: "Event venues",
    description: "Banquet and convention venues that repaint between seasons.",
    potential: "M",
    placesQuery: "marriage hall convention center Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 15,
  },
  {
    id: "paying-guest",
    name: "Paying Guest Facilities",
    nature: "PG / hostels",
    description: "PG accommodations with high churn and frequent room repainting.",
    potential: "L",
    placesQuery: "paying guest PG hostel Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 25,
  },
  {
    id: "religious",
    name: "Religious Cluster",
    nature: "Religious institutions",
    description: "Temples, mosques, churches and trusts with festival-cycle painting.",
    potential: "M",
    placesQuery: "temple mosque church Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 20,
  },
  {
    id: "auto-showrooms",
    name: "Automobile Showrooms",
    nature: "Auto retail",
    description: "Brand-standard showrooms with refresh cycles tied to OEM guidelines.",
    potential: "M",
    placesQuery: "car bike showroom Panvel",
    demandTags: ["Commercial Interiors", "Repainting"],
    prospectCountEstimate: 14,
  },
  {
    id: "petrol-pumps",
    name: "Petrol Pumps",
    nature: "Fuel retail",
    description: "Fuel stations with brand-livery canopy and forecourt repaint cycles.",
    potential: "L",
    placesQuery: "petrol pump fuel station Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 12,
  },
  {
    id: "bus-stand-market",
    name: "Bus Stand Commercial Markets",
    nature: "Transit commercial",
    description: "Shops and small commercial pockets around the bus stand.",
    potential: "L",
    placesQuery: "bus stand market Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 18,
  },
  {
    id: "highway-dhabas",
    name: "Highway Hotels / Dhabas",
    nature: "Highway hospitality",
    description: "Dhabas and budget hotels along the Mumbai–Pune highway.",
    potential: "L",
    placesQuery: "highway dhaba hotel Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 22,
  },
  {
    id: "clinics-nursing",
    name: "Local Clinic / Nursing Home Clusters",
    nature: "Healthcare — local",
    description: "Local clinics and nursing homes preferring hygienic, washable finishes.",
    potential: "M",
    placesQuery: "clinic nursing home Panvel",
    demandTags: ["Repainting"],
    prospectCountEstimate: 26,
  },
  {
    id: "jewellery",
    name: "Jewellery Market Buildings",
    nature: "Jewellery retail",
    description: "Jewellery showrooms with premium interior finishes and AMC cycles.",
    potential: "M",
    placesQuery: "jewellery showroom market Panvel",
    demandTags: ["Commercial Interiors"],
    prospectCountEstimate: 12,
  },
  {
    id: "textile-garment",
    name: "Textile / Garment Shops",
    nature: "Apparel retail",
    description: "Garment shops and small retail rows refreshed between seasons.",
    potential: "L",
    placesQuery: "textile garment shop Panvel",
    demandTags: ["Repainting", "Commercial Interiors"],
    prospectCountEstimate: 24,
  },
];

const COLOR = "#0f172a"; // unified navy — visuals stay simple

export const CLUSTERS: Cluster[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  nature: s.nature,
  description: s.description,
  color: COLOR,
  potential: s.potential,
  potentialReasons: [
    `${s.nature} segment shows consistent demand in the Panvel belt.`,
    "Repeat purchase cycles support a sustained pipeline.",
    "Decision makers are reachable via reference and walk-in.",
    "Premium finishes are accepted when value is demonstrated.",
  ],
  prospectCountEstimate: s.prospectCountEstimate,
  demandTags: s.demandTags,
  placesQuery: s.placesQuery,
  triggers: [
    "Who are the key decision makers here?",
    "Which projects are due for repainting or fit-out?",
  ],
  howToConnect: [
    "Reach out via existing contacts (contractors, dealers, references).",
    "Visit active sites in morning hours and meet supervisors.",
    "Use dealer / retailer network to collect warm leads.",
  ],
  pitch: {
    intro: "I'm from JK Cement Paints, working with this segment across Panvel.",
    context: `${s.nature} customers value finishes that last and look sharp.`,
    intent: "Can we plan a quick walkthrough to see where our products can add value?",
  },
}));

export const POTENTIAL_LABEL: Record<Potential, string> = {
  H: "High",
  M: "Medium",
  L: "Low",
};

export function getCluster(id: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.id === id);
}
