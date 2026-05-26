export type Cluster = {
  id: string;
  name: string;
  recommended?: boolean;
  /** Adjacent / non-recommended but contextually relevant for Panvel */
  adjacent?: boolean;
};

export type MetaCluster = {
  id: string;
  name: string;
  short: string;
  recommended?: boolean;
  adjacent?: boolean;
  clusters: Cluster[];
};

export const META_CLUSTERS: MetaCluster[] = [
  {
    id: "res-construction",
    name: "Residential Construction",
    short: "Residential Construction",
    recommended: true,
    clusters: [
      { id: "large-townships", name: "Large Residential Township Projects", recommended: true },
      { id: "mid-apartments", name: "Mid-Size Apartment Buildings", recommended: true },
      { id: "redevelopment", name: "Redevelopment Housing Projects", adjacent: true },
      { id: "affordable", name: "Affordable Housing Clusters", recommended: true },
      { id: "independent", name: "Independent House Construction" },
      { id: "luxury", name: "Luxury Villa / Bungalow Clusters" },
      { id: "rowhouse", name: "Row House / Gated Communities", adjacent: true },
      { id: "farmhouse", name: "Farmhouse / Weekend Home Belts" },
    ],
  },
  {
    id: "industrial",
    name: "Industrial & Logistics",
    short: "Industrial & Logistics",
    recommended: true,
    clusters: [
      { id: "taloja-midc", name: "Taloja MIDC Industrial Zone", recommended: true },
      { id: "warehouses", name: "Warehousing & Logistics Parks", recommended: true },
      { id: "cold-storage", name: "Cold Storage & Distribution", adjacent: true },
    ],
  },
  {
    id: "commercial",
    name: "Commercial",
    short: "Commercial",
    recommended: true,
    clusters: [
      { id: "offices", name: "Office Complexes", recommended: true },
      { id: "retail", name: "Retail & Malls", recommended: true },
      { id: "mixed-use", name: "Mixed-Use Developments", adjacent: true },
    ],
  },
  {
    id: "tourism",
    name: "Tourism & Transit",
    short: "Tourism & Transit",
    recommended: true,
    clusters: [
      { id: "highway", name: "Highway & Expressway Transit Hubs", recommended: true },
      { id: "hotels", name: "Hotels & Resort Belts", adjacent: true },
      { id: "airport", name: "Navi Mumbai Airport Influence Zone", recommended: true },
    ],
  },
  {
    id: "trade-contractor",
    name: "Trade & Contractor",
    short: "Trade & Contractor",
    recommended: true,
    clusters: [
      { id: "hardware-market", name: "Hardware & Building Material Markets", recommended: true },
      { id: "contractor-hub", name: "Contractor Hubs", recommended: true },
      { id: "labour-naka", name: "Labour Naka Pockets" },
    ],
  },
  {
    id: "institutional",
    name: "Institutional Construction",
    short: "Institutional",
    adjacent: true,
    clusters: [
      { id: "schools", name: "Schools & Colleges", adjacent: true },
      { id: "hospitals", name: "Hospitals & Healthcare", adjacent: true },
      { id: "govt", name: "Government Buildings" },
    ],
  },
  {
    id: "res-renovation",
    name: "Renovation & Repair",
    short: "Renovation & Repair",
    adjacent: true,
    clusters: [
      { id: "old-society-renov", name: "Old Society Renovation Pockets", adjacent: true },
      { id: "interior-upgrade", name: "Interior Upgrade Zones" },
      { id: "facade-repair", name: "Facade Repair & Waterproofing" },
    ],
  },
  {
    id: "rural-housing",
    name: "Rural & Semi-Urban Housing",
    short: "Rural / Semi-Urban",
    adjacent: true,
    clusters: [
      { id: "village-pucca", name: "Village Pucca House Conversion", adjacent: true },
      { id: "semi-urban-plots", name: "Semi-Urban Plot Developments" },
    ],
  },
];

export const TRIGGERS_META = [
  "Any new infra projects creating demand?",
  "Any emerging construction pockets?",
];

export const TRIGGERS_CLUSTER = [
  "Any niche builder segments forming clusters?",
  "Any redevelopment pockets emerging?",
];

export const PANVEL_CENTER = { lat: 18.9894, lng: 73.1175 };
