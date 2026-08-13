// Stakeholder framework — for each cluster, an ordered list of stakeholder
// types with a leading question ("Do you know…" / "Can you connect…"),
// how to connect, and what to talk about.

export type StakeholderType = {
  id: string;
  name: string;
  question: string;
  howToConnect: string[];
  whatToTalk: string[];
};

const CONTRACTORS: StakeholderType = {
  id: "contractors",
  name: "Contractors",
  question: "Do you know any contractors in the area who can help you connect with this cluster?",
  howToConnect: [
    "Reference-based approach: use existing contacts (electricians, plumbers, society committees, dealers) for introductions.",
    "Site visits: visit ongoing or recently completed projects and meet contractors on-site.",
    "Dealer / retailer network: collect leads from local building material shops, hardware stores, and distributors.",
  ],
  whatToTalk: [
    "Introduction & credibility: briefly introduce yourself, your company, and similar projects.",
    "Understand their needs: current projects, size, challenges, material requirements.",
    "Product / solution pitch: explain how our products benefit them (quality, durability, cost savings).",
    "Differentiation: highlight why we are better than competitors.",
  ],
};

const SITE_SUPERVISORS: StakeholderType = {
  id: "site-supervisors",
  name: "Site Supervisors",
  question: "Do you know any site supervisors who can help you connect with this cluster?",
  howToConnect: [
    "Visit active construction sites during morning hours when supervisors review work.",
    "Ask contractors and engineers for trusted supervisor introductions.",
    "Offer a small on-site product demo to build credibility.",
  ],
  whatToTalk: [
    "Introduction & credibility: position yourself as a trusted partner supporting daily execution.",
    "Understand their needs: surfaces that give trouble, finishes specified, current product preferences.",
    "Product / solution pitch: workability, drying time, coverage and finish quality.",
    "Differentiation: on-site technical support and sample availability.",
  ],
};

const ARCHITECTS: StakeholderType = {
  id: "architects",
  name: "Architects",
  question: "Do you know architects who can connect with residential societies?",
  howToConnect: [
    "Connect through builder / developer referrals and design fraternity contacts.",
    "Attend local architect chapter meets and product showcases.",
    "Offer specification support packs and shade libraries.",
  ],
  whatToTalk: [
    "Introduction & credibility: highlight our portfolio on premium and signature projects.",
    "Understand their needs: upcoming projects, finish aesthetics, sustainability requirements.",
    "Product / solution pitch: premium textures, low-VOC ranges, custom shade matching.",
    "Differentiation: specification support, on-site mock-ups, after-sales colour service.",
  ],
};

const INTERIOR_DESIGNERS: StakeholderType = {
  id: "interior-designers",
  name: "Interior Designers",
  question: "Do you know interior designers handling local fit-outs?",
  howToConnect: [
    "Get referrals from architects, showrooms and high-end retailers.",
    "Visit ongoing fit-outs and meet designers during finishing stages.",
    "Share curated mood-board samples featuring our trending finishes.",
  ],
  whatToTalk: [
    "Introduction & credibility: designer-focused finishes and quick sampling.",
    "Understand their needs: client style preferences, timelines, common pain points.",
    "Product / solution pitch: textures, metallics, washable premium finishes.",
    "Differentiation: faster sampling turnaround and dedicated designer support.",
  ],
};

const DEALERS: StakeholderType = {
  id: "dealers",
  name: "Dealers & Retailers",
  question: "Do you know paint and hardware dealers in the area who move the most volume?",
  howToConnect: [
    "Visit hardware lanes in the morning to meet shop owners.",
    "Identify high-volume dealers via painter / contractor references.",
    "Run small in-shop demos with samples.",
  ],
  whatToTalk: [
    "Introduction & credibility: our distribution support and margin proposition.",
    "Understand their needs: top-selling SKUs, stocking pain-points, painter feedback.",
    "Product / solution pitch: fast-moving SKUs, in-shop collateral, training.",
    "Differentiation: scheme transparency, on-time delivery, painter incentives.",
  ],
};

const SOCIETY_SECRETARIES: StakeholderType = {
  id: "society-secretaries",
  name: "Society Secretaries",
  question: "Do you know secretaries of residential societies who require repainting services?",
  howToConnect: [
    "Approach via committee members or society AGM notices.",
    "Offer a free paint audit and cycle plan for the society.",
    "Share testimonials from nearby societies you've worked with.",
  ],
  whatToTalk: [
    "Introduction & credibility: our society projects portfolio.",
    "Understand their needs: budget cycles, AGM approvals, contractor preferences.",
    "Product / solution pitch: exterior durability, weather resistance, warranty.",
    "Differentiation: structured warranty, applicator network, supervised execution.",
  ],
};

const FACILITY_HEAD: StakeholderType = {
  id: "facility-head",
  name: "Facility / Maintenance Head",
  question: "Do you know any facility or maintenance head responsible for repainting cycles?",
  howToConnect: [
    "Schedule a plant / building walk with the facility head.",
    "Offer a free condition audit of high-wear surfaces.",
    "Engage existing AMC contractors for a warm introduction.",
  ],
  whatToTalk: [
    "Introduction & credibility: our experience with similar facilities.",
    "Understand their needs: maintenance windows, downtime constraints, surface conditions.",
    "Product / solution pitch: durable industrial-grade coatings, lower repaint cycles.",
    "Differentiation: technical service, surface-specific recommendations, warranty.",
  ],
};

const PRINCIPAL: StakeholderType = {
  id: "principal",
  name: "Principal / Trustee",
  question: "Do you know any principal or trustee responsible for campus upkeep?",
  howToConnect: [
    "Request an appointment via the school / college office.",
    "Send a one-page proposal with a free audit offer.",
    "Use existing teacher / parent references for warm intros.",
  ],
  whatToTalk: [
    "Introduction & credibility: our experience with educational institutions.",
    "Understand their needs: vacation windows, budget cycles, approval chain.",
    "Product / solution pitch: durable, washable, child-safe finishes.",
    "Differentiation: structured maintenance plan and warranty.",
  ],
};

const PAINTERS: StakeholderType = {
  id: "painters",
  name: "Painters & Mistris",
  question: "Do you know painters and mistris who specialize in this segment? ",
  howToConnect: [
    "Visit dealer counters early morning when painters collect material.",
    "Run a small painter meet at a friendly dealer's shop.",
    "Enroll them in our painter rewards program.",
  ],
  whatToTalk: [
    "Introduction: respect their craft; share application tips.",
    "Understand their needs: ease of mixing, coverage, customer complaints.",
    "Product / solution pitch: better workability, fewer call-backs.",
    "Differentiation: rewards, training, on-site technical support.",
  ],
};

const OWNER_MANAGER: StakeholderType = {
  id: "owner-manager",
  name: "Owner / Manager",
  question: "Do you know the owner or manager who decides on repainting here?",
  howToConnect: [
    "Walk in during lean hours and ask for the owner / manager.",
    "Use vendor / supplier references for a warm intro.",
    "Offer a free site assessment of current finishes.",
  ],
  whatToTalk: [
    "Introduction & credibility: relevant projects in the same segment.",
    "Understand their needs: brand standards, refresh frequency, budget.",
    "Product / solution pitch: durable, low-odour, premium finishes.",
    "Differentiation: warranty, applicator support, on-time delivery.",
  ],
};

const DEFAULT_SET: StakeholderType[] = [
  OWNER_MANAGER,
  CONTRACTORS,
  PAINTERS,
  DEALERS,
];

export const STAKEHOLDER_FRAMEWORK: Record<string, StakeholderType[]> = {
  "mid-apartments": [SOCIETY_SECRETARIES, CONTRACTORS, SITE_SUPERVISORS, ARCHITECTS, PAINTERS],
  redevelopment: [SOCIETY_SECRETARIES, CONTRACTORS, ARCHITECTS, SITE_SUPERVISORS],
  "gated-community": [CONTRACTORS, ARCHITECTS, INTERIOR_DESIGNERS, SITE_SUPERVISORS],
  schools: [PRINCIPAL, FACILITY_HEAD, CONTRACTORS, PAINTERS],
  colleges: [PRINCIPAL, FACILITY_HEAD, CONTRACTORS, PAINTERS],
  hospitals: [FACILITY_HEAD, CONTRACTORS, ARCHITECTS, DEALERS],
  restaurants: [OWNER_MANAGER, INTERIOR_DESIGNERS, CONTRACTORS, PAINTERS],
  hotels: [FACILITY_HEAD, INTERIOR_DESIGNERS, CONTRACTORS, ARCHITECTS],
  midc: [FACILITY_HEAD, CONTRACTORS, SITE_SUPERVISORS, DEALERS],
  warehousing: [FACILITY_HEAD, CONTRACTORS, SITE_SUPERVISORS, DEALERS],
  "marriage-halls": [OWNER_MANAGER, CONTRACTORS, PAINTERS],
  "paying-guest": [OWNER_MANAGER, PAINTERS, DEALERS],
  religious: [OWNER_MANAGER, CONTRACTORS, PAINTERS],
  "auto-showrooms": [OWNER_MANAGER, FACILITY_HEAD, INTERIOR_DESIGNERS],
  "petrol-pumps": [OWNER_MANAGER, CONTRACTORS, PAINTERS],
  "bus-stand-market": [OWNER_MANAGER, DEALERS, PAINTERS],
  "highway-dhabas": [OWNER_MANAGER, CONTRACTORS, PAINTERS],
  "clinics-nursing": [OWNER_MANAGER, FACILITY_HEAD, CONTRACTORS],
  jewellery: [OWNER_MANAGER, INTERIOR_DESIGNERS, CONTRACTORS],
  "textile-garment": [OWNER_MANAGER, INTERIOR_DESIGNERS, PAINTERS],
};

export function getStakeholderTypes(clusterId: string): StakeholderType[] {
  return STAKEHOLDER_FRAMEWORK[clusterId] ?? DEFAULT_SET;
}
