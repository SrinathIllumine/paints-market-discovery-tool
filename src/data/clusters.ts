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

export const CLUSTERS: Cluster[] = [
  {
    id: "residential",
    color: "#dc2626",
    name: "Residential Construction",
    nature: "Residential Construction",
    description: "New townships, mid-size apartments and affordable housing pockets driving fresh paint demand.",
    potential: "H",
    potentialReasons: [
      "Area heavily concentrated with mid-sized apartments",
      "Row-sized houses are found in multiple areas",
      "More than 100 societies suggests a large, organized customer base",
      "Several well-developed colonies further strengthen the residential density",
    ],
    prospectCountEstimate: 42,
    demandTags: ["New Construction", "Repainting"],
    placesQuery: "residential apartment projects in Panvel",
    triggers: [
      "Any large townships launching this quarter?",
      "Which builders are actively selling inventory here?",
    ],
    howToConnect: [
      "Meet site engineers during morning hours at active sites",
      "Connect with builder procurement heads via reference",
      "Sponsor a site safety / quality workshop for workers",
    ],
    pitch: {
      intro: "I'm from JK Cement, working with builders across the Panvel belt on premium finishes.",
      context: "We've noticed strong residential activity around your project and similar townships nearby.",
      intent: "Would love a 10-minute walkthrough to see how our products can fit your finishing schedule.",
    },
  },
  {
    id: "industrial",
    color: "#2563eb",
    name: "Industrial Zones / MIDC",
    nature: "Industrial / Manufacturing",
    description: "Taloja MIDC and adjacent industrial pockets — durable coatings and large-format demand.",
    potential: "H",
    potentialReasons: [
      "Taloja MIDC hosts hundreds of active manufacturing units",
      "Industrial buildings require periodic durable repainting cycles",
      "Several large factory sheds with high surface areas",
      "Steady inflow of new plant commissioning each year",
    ],
    prospectCountEstimate: 28,
    demandTags: ["New Construction", "Repair-driven"],
    placesQuery: "Taloja MIDC industrial unit Panvel",
    triggers: [
      "Any new plant commissioning planned?",
      "Which units are due for periodic maintenance painting?",
    ],
    howToConnect: [
      "Schedule a plant walk with the facility / maintenance head",
      "Partner with civil contractors serving multiple units",
      "Offer a product durability demo for industrial surfaces",
    ],
    pitch: {
      intro: "I represent JK Cement Paints, partnering with MIDC units on industrial-grade finishes.",
      context: "Plants here run heavy maintenance cycles and the right coating directly impacts uptime.",
      intent: "Can we set up a quick assessment of your facility's repainting plan for this year?",
    },
  },
  {
    id: "warehousing",
    color: "#d97706",
    name: "Warehousing & Logistics",
    nature: "Warehousing & Logistics",
    description: "JNPT-driven warehousing parks — large surface areas, repeat institutional buyers.",
    potential: "M",
    potentialReasons: [
      "JNPT corridor drives steady warehouse capacity expansion",
      "Large flat surfaces translate into bulk paint volumes",
      "Repeat institutional buyers with predictable maintenance cycles",
      "Several PEB sheds under active construction nearby",
    ],
    prospectCountEstimate: 18,
    demandTags: ["New Construction", "Repair-driven"],
    placesQuery: "warehouse logistics park Panvel JNPT",
    triggers: [
      "Which 3PL operators are expanding capacity?",
      "Any new logistics parks under construction?",
    ],
    howToConnect: [
      "Engage facility managers of operating warehouses",
      "Connect with PEB / civil contractors building new sheds",
      "Offer floor coating + wall finish bundled proposals",
    ],
    pitch: {
      intro: "I'm with JK Cement, working with logistics parks on cost-efficient durable finishes.",
      context: "Warehouses here see heavy wear; the right primer + topcoat extends repaint cycles meaningfully.",
      intent: "Let's review your upcoming maintenance window and see where we can add value.",
    },
  },
  {
    id: "retail-malls",
    color: "#db2777",
    name: "Retail & Malls",
    nature: "Retail & Shopping Centres",
    description: "Shopping centres and high-street retail with frequent refresh cycles.",
    potential: "M",
    potentialReasons: [
      "Multiple anchor malls with regular fit-out activity",
      "High-street retail refreshes interiors every 2-3 years",
      "Footfall-sensitive tenants prefer quick-drying low-VOC products",
      "Common-area repainting is a recurring facility need",
    ],
    prospectCountEstimate: 14,
    demandTags: ["Repainting", "Commercial Interiors"],
    placesQuery: "shopping mall retail centre Panvel",
    triggers: [
      "Any new mall launches or store fit-outs?",
      "Which anchor tenants are refurbishing this season?",
    ],
    howToConnect: [
      "Meet mall facility heads for common area cycles",
      "Connect with retail fit-out contractors",
      "Pitch quick-turnaround low-VOC products for live stores",
    ],
    pitch: {
      intro: "I'm from JK Cement Paints, specialising in retail-friendly low-odour finishes.",
      context: "Retail spaces need refresh without disrupting footfall — our products dry fast and stay vivid.",
      intent: "Would you consider a sample panel for your next refurb cycle?",
    },
  },
  {
    id: "offices",
    color: "#4f46e5",
    name: "Offices / Commercial Interiors",
    nature: "Commercial Office Spaces",
    description: "Office complexes in Kharghar–Panvel corridor — interior repaint and fit-out work.",
    potential: "M",
    potentialReasons: [
      "Growing Kharghar-Panvel office corridor with active fit-outs",
      "AMC-driven repaint cycles every 3 years across most buildings",
      "Designers favour low-VOC and textured premium finishes here",
      "New occupancy pipeline keeps interior demand consistent",
    ],
    prospectCountEstimate: 22,
    demandTags: ["Commercial Interiors", "Repainting"],
    placesQuery: "office complex Panvel Kharghar",
    triggers: [
      "Any new office occupancy upcoming?",
      "Which buildings are due for AMC repainting?",
    ],
    howToConnect: [
      "Meet building facility / admin managers",
      "Connect with interior contractors serving the corridor",
      "Offer texture / accent wall samples to office designers",
    ],
    pitch: {
      intro: "I'm with JK Cement, helping offices upgrade interiors with low-VOC premium finishes.",
      context: "Modern offices want healthier indoor air and a sharper look — both are easy wins here.",
      intent: "Can I drop off a sample panel for your next fit-out review?",
    },
  },
  {
    id: "schools",
    color: "#16a34a",
    name: "Schools & Colleges",
    nature: "Education Institutions",
    description: "Educational institutions with annual vacation-cycle repainting needs.",
    potential: "M",
    potentialReasons: [
      "Predictable vacation-cycle repainting demand each year",
      "Several large campuses with extensive wall surface areas",
      "Trustees prefer durable, child-safe finishes — premium fit",
      "Easier institutional sale via principal / trustee referrals",
    ],
    prospectCountEstimate: 16,
    demandTags: ["Repainting", "Repair-driven"],
    placesQuery: "schools colleges Panvel",
    triggers: [
      "Do you know a teacher, trustee or principal here?",
      "Which campuses are due for vacation maintenance?",
    ],
    howToConnect: [
      "Conduct a free paint audit for the campus",
      "Present a maintenance plan to the principal / trustee",
      "Organise a child-safe paints awareness session",
    ],
    pitch: {
      intro: "I'm from JK Cement, working with schools on safe, durable repaint cycles.",
      context: "Vacation windows are short — choosing the right primer + paint ensures lasting walls.",
      intent: "Could we plan a quick campus walk before your next vacation?",
    },
  },
  {
    id: "hospitals",
    color: "#e11d48",
    name: "Hospitals",
    nature: "Healthcare Facilities",
    description: "Healthcare facilities needing hygienic, antimicrobial finishes.",
    potential: "M",
    potentialReasons: [
      "Several mid-to-large hospitals in the Kharghar-Panvel belt",
      "Strong demand for antimicrobial and washable finishes",
      "Wing-wise phased repainting opens steady recurring orders",
      "Premium positioning aligns with facility brand standards",
    ],
    prospectCountEstimate: 9,
    demandTags: ["Repainting", "Commercial Interiors"],
    placesQuery: "hospitals Panvel Kharghar",
    triggers: [
      "Do you know the facility or admin head?",
      "Any wing-wise repainting being planned?",
    ],
    howToConnect: [
      "Meet facility / infection-control teams",
      "Demo antimicrobial / washable finish performance",
      "Offer phased ward-wise execution to avoid disruption",
    ],
    pitch: {
      intro: "I represent JK Cement Paints, focused on healthcare-grade hygienic finishes.",
      context: "Hospitals need surfaces that stay clean and resist staining over long shifts.",
      intent: "Let's identify one ward where a pilot would clearly demonstrate the difference.",
    },
  },
  {
    id: "bazaar",
    color: "#0891b2",
    name: "Local Bazaar / Informal Markets",
    nature: "Dealer & Painter Network",
    description: "Old Panvel market belt — small shops, dealers and contractor walk-ins.",
    potential: "L",
    potentialReasons: [
      "Dense dealer network in Old Panvel hardware lanes",
      "High painter / mistri walk-in footfall every morning",
      "Volume is fragmented across many small shops",
      "Influencer-led sales model — depth over individual ticket size",
    ],
    prospectCountEstimate: 35,
    demandTags: ["Repainting", "Repair-driven"],
    placesQuery: "hardware paint dealer Panvel market",
    triggers: [
      "Which dealers move the most volume in the belt?",
      "Where do local painters/contractors gather mornings?",
    ],
    howToConnect: [
      "Visit hardware lanes morning hours and meet shop owners",
      "Build relationships with influential painters / mistris",
      "Run a small contractor meet with samples and tea",
    ],
    pitch: {
      intro: "I'm from JK Cement, supporting Panvel's painter and dealer community.",
      context: "Painters here want products that mix easily and dealers want fast-moving SKUs.",
      intent: "Could we plan a small contractor meet at your shop next week?",
    },
  },
];

export const POTENTIAL_LABEL: Record<Potential, string> = {
  H: "High",
  M: "Medium",
  L: "Low",
};

export function getCluster(id: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.id === id);
}
