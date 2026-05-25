export type Prospect = {
  id: string;
  name: string;
  locality: string;
  x: number; // % position on map
  y: number;
};

export type Cluster = {
  id: string;
  name: string;
  recommended?: boolean;
  prospects: Prospect[];
};

export type MetaCluster = {
  id: string;
  name: string;
  short: string;
  recommended?: boolean;
  clusters: Cluster[];
};

const p = (id: string, name: string, locality: string, x: number, y: number): Prospect => ({
  id,
  name,
  locality,
  x,
  y,
});

export const META_CLUSTERS: MetaCluster[] = [
  {
    id: "res-construction",
    name: "Residential Construction Clusters",
    short: "Residential\nConstruction",
    recommended: true,
    clusters: [
      {
        id: "large-townships",
        name: "Large Residential Township Projects",
        recommended: true,
        prospects: [
          p("p1", "Adhiraj Capital City", "Kharghar", 32, 40),
          p("p2", "Paradise Sai World City", "New Panvel", 55, 55),
          p("p3", "Hiranandani Fortune City", "Panvel", 48, 30),
          p("p4", "Wadhwa Wise City", "Old Panvel", 68, 62),
          p("p5", "Bhagwati Greens", "Kamothe", 24, 70),
        ],
      },
      {
        id: "mid-apartments",
        name: "Mid-Size Apartment Buildings",
        recommended: true,
        prospects: [
          p("p10", "Sai Sapphire Residency", "New Panvel East", 40, 45),
          p("p11", "Akshar Elementa", "Kharghar Sector 10", 30, 55),
          p("p12", "Tharwani Heritage", "Kamothe", 60, 35),
          p("p13", "Neelsidhi Splendour", "Khanda Colony", 70, 50),
        ],
      },
      {
        id: "redevelopment",
        name: "Redevelopment Housing Projects",
        prospects: [
          p("p20", "CIDCO Redev — Sector 5", "Old Panvel", 50, 60),
          p("p21", "MHADA Pocket Redev", "Kalamboli", 35, 75),
          p("p22", "Panvel Municipal Redev", "Panvel East", 65, 40),
        ],
      },
      {
        id: "affordable",
        name: "Affordable Housing Clusters",
        recommended: true,
        prospects: [
          p("p30", "PMAY Cluster — Taloja", "Taloja", 75, 30),
          p("p31", "CIDCO Mass Housing", "Kharghar Sector 36", 25, 35),
          p("p32", "Sai Pradnya Affordable", "New Panvel", 52, 52),
        ],
      },
      {
        id: "independent",
        name: "Independent House Construction Areas",
        prospects: [
          p("p40", "Adai Village Plots", "Adai", 80, 70),
          p("p41", "Owe Gaon Plots", "Owe", 20, 55),
        ],
      },
      {
        id: "luxury",
        name: "Luxury Villa / Bungalow Clusters",
        prospects: [
          p("p50", "Lodha Belmondo Villas", "Palaspe", 70, 25),
          p("p51", "Marathon Nexzone Villas", "Panvel", 45, 38),
        ],
      },
      {
        id: "rowhouse",
        name: "Row House / Gated Community Projects",
        prospects: [
          p("p60", "Tharwani Rosella", "Kamothe", 28, 65),
          p("p61", "Arihant Anaika Row", "Taloja Phase 2", 75, 45),
        ],
      },
      {
        id: "farmhouse",
        name: "Farmhouse / Weekend Home Belts",
        prospects: [
          p("p70", "Karnala Weekend Homes", "Karnala", 85, 80),
          p("p71", "Matheran Foothill Plots", "Chowk", 15, 80),
        ],
      },
    ],
  },
  {
    id: "res-renovation",
    name: "Residential Renovation Clusters",
    short: "Residential\nRenovation",
    clusters: [
      { id: "old-society-renov", name: "Old Society Renovation Pockets", prospects: [
        p("r1", "Panvel Old Town Societies", "Old Panvel", 50, 50),
      ] },
      { id: "interior-upgrade", name: "Interior Upgrade Demand Zones", prospects: [
        p("r2", "Kharghar Mid-Income Flats", "Kharghar", 32, 45),
      ] },
      { id: "facade-repair", name: "Facade Repair & Waterproofing Belts", prospects: [
        p("r3", "Coastal Society Belt", "Uran Road", 75, 65),
      ] },
    ],
  },
  {
    id: "institutional",
    name: "Institutional Clusters",
    short: "Institutional",
    clusters: [
      { id: "schools", name: "Schools & Colleges", prospects: [
        p("i1", "Pillai College Campus", "New Panvel", 55, 50),
        p("i2", "DAV School Expansion", "Kharghar", 30, 40),
      ] },
      { id: "hospitals", name: "Hospitals & Healthcare", prospects: [
        p("i3", "MGM Hospital Block", "Kamothe", 25, 65),
      ] },
      { id: "govt", name: "Government Buildings", prospects: [
        p("i4", "Panvel Municipal HQ", "Panvel", 50, 45),
      ] },
    ],
  },
  {
    id: "commercial",
    name: "Commercial Clusters",
    short: "Commercial",
    clusters: [
      { id: "offices", name: "Office Complexes", prospects: [
        p("c1", "Orion Business Park", "Kharghar", 30, 50),
      ] },
      { id: "retail", name: "Retail & Malls", prospects: [
        p("c2", "Glomax Mall Expansion", "Kalamboli", 38, 72),
        p("c3", "Little World Mall Block", "Kharghar", 28, 48),
      ] },
      { id: "mixed-use", name: "Mixed-Use Developments", prospects: [
        p("c4", "Hiranandani Mixed Block", "Panvel", 48, 35),
      ] },
    ],
  },
  {
    id: "industrial",
    name: "Industrial & Logistics Clusters",
    short: "Industrial &\nLogistics",
    recommended: true,
    clusters: [
      { id: "taloja-midc", name: "Taloja MIDC Industrial Zone", recommended: true, prospects: [
        p("ind1", "Taloja MIDC Phase 1 Plot", "Taloja", 78, 35),
        p("ind2", "Taloja MIDC Phase 2 Plot", "Taloja", 82, 42),
      ] },
      { id: "warehouses", name: "Warehousing & Logistics Parks", recommended: true, prospects: [
        p("ind3", "JNPT Logistics Park", "Uran Road", 80, 70),
        p("ind4", "Bhiwandi-Panvel Warehouse Belt", "Panvel Outskirts", 70, 25),
      ] },
      { id: "cold-storage", name: "Cold Storage & Distribution", prospects: [
        p("ind5", "APMC Cold Chain Hub", "Kalamboli", 40, 75),
      ] },
    ],
  },
  {
    id: "trade-contractor",
    name: "Trade & Contractor Ecosystem Clusters",
    short: "Trade &\nContractor",
    recommended: true,
    clusters: [
      { id: "hardware-market", name: "Hardware & Building Material Markets", recommended: true, prospects: [
        p("t1", "Panvel Hardware Bazaar", "Panvel", 52, 48),
        p("t2", "Kalamboli Steel Market", "Kalamboli", 38, 70),
      ] },
      { id: "contractor-hub", name: "Contractor Hubs", recommended: true, prospects: [
        p("t3", "Civil Contractors Association — Panvel", "Old Panvel", 50, 55),
      ] },
      { id: "labour-naka", name: "Labour Naka Pockets", prospects: [
        p("t4", "Khanda Colony Naka", "Khanda Colony", 65, 52),
      ] },
    ],
  },
  {
    id: "social-infra",
    name: "Social & Community Infrastructure Clusters",
    short: "Social &\nCommunity",
    clusters: [
      { id: "community-halls", name: "Community Halls & Cultural Centers", prospects: [
        p("s1", "Agri Samaj Hall", "Panvel", 50, 50),
      ] },
      { id: "sports", name: "Sports Complexes", prospects: [
        p("s2", "Kharghar Central Park Sports", "Kharghar", 30, 45),
      ] },
    ],
  },
  {
    id: "religious",
    name: "Religious & Pilgrimage Clusters",
    short: "Religious &\nPilgrimage",
    clusters: [
      { id: "temples", name: "Temple Renovation Belts", prospects: [
        p("rel1", "Ballaleshwar Temple Trust", "Pali Road", 88, 60),
      ] },
      { id: "ashrams", name: "Ashrams & Spiritual Campuses", prospects: [
        p("rel2", "ISKCON Panvel Campus", "Panvel", 55, 42),
      ] },
    ],
  },
  {
    id: "rural-housing",
    name: "Rural Housing & Semi-Urban Expansion",
    short: "Rural Housing\n& Semi-Urban",
    recommended: true,
    clusters: [
      { id: "village-pucca", name: "Village Pucca House Conversion", recommended: true, prospects: [
        p("rh1", "Adai Village Cluster", "Adai", 82, 72),
        p("rh2", "Wavanje Village Cluster", "Wavanje", 18, 68),
      ] },
      { id: "semi-urban-plots", name: "Semi-Urban Plot Developments", prospects: [
        p("rh3", "Karjat-Panvel Plot Belt", "Chowk", 12, 75),
      ] },
    ],
  },
  {
    id: "agri-rural",
    name: "Agricultural & Rural Commercial Clusters",
    short: "Agri & Rural\nCommercial",
    clusters: [
      { id: "farm-storage", name: "Farm Storage & Drying Yards", prospects: [
        p("ar1", "Khalapur Storage Yards", "Khalapur", 10, 65),
      ] },
      { id: "apmc", name: "APMC Market Infrastructure", prospects: [
        p("ar2", "Panvel APMC Yard", "Panvel", 48, 58),
      ] },
    ],
  },
  {
    id: "tourism",
    name: "Tourism & Transit Clusters",
    short: "Tourism &\nTransit",
    recommended: true,
    clusters: [
      { id: "highway", name: "Highway & Expressway Transit Hubs", recommended: true, prospects: [
        p("tt1", "Mumbai-Pune Expressway Service Hub", "Shedung", 90, 50),
        p("tt2", "NH-48 Panvel Junction", "Panvel", 60, 30),
      ] },
      { id: "hotels", name: "Hotels & Resort Belts", prospects: [
        p("tt3", "Karnala Resort Belt", "Karnala", 88, 78),
      ] },
      { id: "airport", name: "Navi Mumbai Airport Influence Zone", recommended: true, prospects: [
        p("tt4", "NMIA Periphery Sites", "Ulwe", 70, 60),
      ] },
    ],
  },
  {
    id: "informal",
    name: "Informal & Local Economy Clusters",
    short: "Informal &\nLocal Economy",
    clusters: [
      { id: "street-shops", name: "Street Market & Shop Renovation", prospects: [
        p("inf1", "Panvel Station Market", "Panvel Station", 50, 48),
      ] },
      { id: "small-workshops", name: "Small Workshops & Garages", prospects: [
        p("inf2", "Kalamboli Auto Workshops", "Kalamboli", 42, 72),
      ] },
    ],
  },
];

export const TRIGGERS_META = [
  "Are there any upcoming developments not captured here?",
  "Are there clusters emerging due to infrastructure growth?",
  "Have you considered seasonal or temporary demand pockets?",
];

export const TRIGGERS_CLUSTER = [
  "Are there niche segments in your market not visible here?",
  "Are there builder segments or income groups forming new clusters?",
  "Are there redevelopment or infrastructure-led pockets emerging?",
];
