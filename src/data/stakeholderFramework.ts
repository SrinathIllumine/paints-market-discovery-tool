// Stakeholder framework — for each cluster, an ordered list of stakeholder
// types with a leading "do you know…" question, how to connect, and what to
// talk about. Powers the collapsible cards on the connects/$clusterId page.

export type StakeholderType = {
  id: string;
  name: string;
  question: string;
  howToConnect: string[];
  whatToTalk: string[];
};

// Common types reused across most clusters.
const CONTRACTORS: StakeholderType = {
  id: "contractors",
  name: "Contractors",
  question: "Do you know any contractors in the area who deal with residential societies?",
  howToConnect: [
    "Reference-based approach: use existing contacts such as electricians, plumbers, society committee members, or dealers to get introductions.",
    "Site visits: visit ongoing or recently completed projects and meet contractors on-site.",
    "Dealer / retailer network: collect leads from local building material shops, hardware stores, and distributors.",
  ],
  whatToTalk: [
    "Introduction & credibility: briefly introduce yourself, your company, and your experience with similar projects.",
    "Understand their needs: ask about current projects, size, challenges, and material requirements.",
    "Product / solution pitch: explain how JK products benefit them (quality, durability, cost savings, ease of use).",
    "Differentiation: highlight why JK is better than competitors (product quality, pricing, performance, support).",
  ],
};

const SITE_SUPERVISORS: StakeholderType = {
  id: "site-supervisors",
  name: "Site Supervisors",
  question: "Are you connected with the site supervisors who can refer you?",
  howToConnect: [
    "Visit active construction sites during morning hours when supervisors review work.",
    "Ask contractors and engineers for trusted supervisor introductions.",
    "Offer a small on-site product demo to build credibility.",
  ],
  whatToTalk: [
    "Introduction & credibility: position yourself as a JK partner supporting their daily execution.",
    "Understand their needs: which surfaces give trouble, what finishes are specified, current product preferences.",
    "Product / solution pitch: workability, drying time, coverage and finish quality.",
    "Differentiation: on-site technical support and sample availability vs competitors.",
  ],
};

const ARCHITECTS: StakeholderType = {
  id: "architects",
  name: "Architects",
  question: "Do you know architects who can suggest JK products?",
  howToConnect: [
    "Connect through builder / developer referrals and design fraternity contacts.",
    "Attend local architect chapter meets and product showcases.",
    "Offer specification support packs and shade libraries for their projects.",
  ],
  whatToTalk: [
    "Introduction & credibility: highlight JK's portfolio on premium and signature projects.",
    "Understand their needs: upcoming projects, finish aesthetics, sustainability requirements.",
    "Product / solution pitch: premium textures, low-VOC ranges, custom shade matching.",
    "Differentiation: specification support, on-site mock-ups, after-sales colour service.",
  ],
};

const INTERIOR_DESIGNERS: StakeholderType = {
  id: "interior-designers",
  name: "Interior Designers",
  question: "Do you work with interior designers handling local fit-outs?",
  howToConnect: [
    "Get referrals from architects, showrooms and high-end retailers.",
    "Visit ongoing fit-outs and meet designers during finishing stages.",
    "Share curated mood-board samples featuring trending JK finishes.",
  ],
  whatToTalk: [
    "Introduction & credibility: emphasise designer-focused JK finishes and quick sampling.",
    "Understand their needs: client style preferences, timelines, common pain points.",
    "Product / solution pitch: textures, metallics, washable premium finishes.",
    "Differentiation: faster sampling turnaround and dedicated designer support.",
  ],
};

const DEALERS: StakeholderType = {
  id: "dealers",
  name: "Dealers & Retailers",
  question: "Which paint and hardware dealers in the area move the most volume?",
  howToConnect: [
    "Visit hardware lanes in the morning to meet shop owners.",
    "Identify high-volume dealers via painter / contractor references.",
    "Run small in-shop demos with samples and tea.",
  ],
  whatToTalk: [
    "Introduction & credibility: JK's distribution support and margin proposition.",
    "Understand their needs: top-selling SKUs, stocking pain-points, painter feedback.",
    "Product / solution pitch: fast-moving SKUs, in-shop marketing collateral, training.",
    "Differentiation: scheme transparency, on-time delivery, painter incentive programs.",
  ],
};

// Cluster-specific only.
const SOCIETY_SECRETARIES: StakeholderType = {
  id: "society-secretaries",
  name: "Society Secretaries",
  question: "Are you in touch with secretaries of residential societies due for repainting?",
  howToConnect: [
    "Approach via committee members or society AGM notices.",
    "Offer a free paint audit and cycle plan for the society.",
    "Share testimonials from nearby societies you've worked with.",
  ],
  whatToTalk: [
    "Introduction & credibility: JK's society projects portfolio.",
    "Understand their needs: budget cycles, AGM approvals, contractor preferences.",
    "Product / solution pitch: exterior durability, weather resistance, warranty.",
    "Differentiation: structured warranty, applicator network, supervised execution.",
  ],
};

const SECURITY_GUARDS: StakeholderType = {
  id: "security-guards",
  name: "Security Guards",
  question: "Have you built rapport with security guards who control site access?",
  howToConnect: [
    "Greet guards on every site visit and remember names.",
    "Offer small courtesies (tea, festival sweets) to build rapport.",
    "Ask politely about resident committee members and current contractors.",
  ],
  whatToTalk: [
    "Introduction: brief, warm, no hard sell.",
    "Ask about ongoing maintenance and any painting activity.",
    "Request guidance on whom to meet inside the society.",
    "Leave a small JK calendar / token as a memorable touch.",
  ],
};

const TEACHERS: StakeholderType = {
  id: "teachers",
  name: "Teachers",
  question: "Do you know teachers who can introduce you to school management?",
  howToConnect: [
    "Approach via parent / alumni networks.",
    "Offer to sponsor a small classroom paint refresh.",
    "Attend PTA or annual day events.",
  ],
  whatToTalk: [
    "Introduction: respect their primary role; keep the ask brief.",
    "Understand the school's maintenance pain-points.",
    "Position child-safe, low-VOC finishes.",
    "Request an introduction to the principal or trustee.",
  ],
};

const PRINCIPAL: StakeholderType = {
  id: "principal",
  name: "Principal / Trustee",
  question: "Have you met the principal or trustee responsible for campus upkeep?",
  howToConnect: [
    "Request an appointment via the school office.",
    "Send a one-page proposal with a free audit offer.",
    "Use existing teacher / parent references for warm intros.",
  ],
  whatToTalk: [
    "Introduction & credibility: JK's experience with educational institutions.",
    "Understand their needs: vacation windows, budget cycles, approval chain.",
    "Product / solution pitch: durable, washable, child-safe finishes.",
    "Differentiation: structured maintenance plan and warranty.",
  ],
};

const DEPT_ADMIN: StakeholderType = {
  id: "dept-admin",
  name: "Department Admin",
  question: "Are you connected with the administrative officer handling campus contracts?",
  howToConnect: [
    "Schedule a meeting via the school office.",
    "Provide a clear quotation template and execution plan.",
    "Coordinate timelines that fit academic calendar.",
  ],
  whatToTalk: [
    "Introduction & credibility: track record with similar institutions.",
    "Discuss tender / quotation process and required documentation.",
    "Product / solution pitch: bundled supply + applicator support.",
    "Differentiation: transparent pricing, on-time delivery, post-job warranty.",
  ],
};

const FACILITY_HEAD: StakeholderType = {
  id: "facility-head",
  name: "Facility / Maintenance Head",
  question: "Have you met the facility or maintenance head responsible for repainting cycles?",
  howToConnect: [
    "Schedule a plant / building walk with the facility head.",
    "Offer a free condition audit of high-wear surfaces.",
    "Engage existing AMC contractors for a warm introduction.",
  ],
  whatToTalk: [
    "Introduction & credibility: JK's experience with similar facilities.",
    "Understand their needs: maintenance windows, downtime constraints, surface conditions.",
    "Product / solution pitch: durable industrial-grade coatings, lower repaint cycles.",
    "Differentiation: technical service, surface-specific recommendations, warranty.",
  ],
};

const MALL_FACILITY: StakeholderType = {
  id: "mall-facility",
  name: "Mall Facility Head",
  question: "Are you in touch with the mall facility head handling common-area refresh?",
  howToConnect: [
    "Meet via facility management agency contacts.",
    "Offer a sample panel for high-footfall corridors.",
    "Coordinate with tenant fit-out contractors.",
  ],
  whatToTalk: [
    "Introduction & credibility: retail-friendly low-odour finishes.",
    "Understand their needs: refresh cycle, footfall constraints, brand standards.",
    "Product / solution pitch: quick-drying, low-VOC, vivid colours.",
    "Differentiation: on-time delivery, applicator support, warranty.",
  ],
};

const PAINTERS: StakeholderType = {
  id: "painters",
  name: "Painters & Mistris",
  question: "Which painters and mistris dominate the local market?",
  howToConnect: [
    "Visit dealer counters in the early morning when painters collect material.",
    "Run a small painter meet at a friendly dealer's shop.",
    "Enroll them in the JK painter rewards program.",
  ],
  whatToTalk: [
    "Introduction: respect their craft; share product application tips.",
    "Understand their needs: ease of mixing, coverage, customer complaints.",
    "Product / solution pitch: better workability, fewer call-backs.",
    "Differentiation: rewards, training, on-site technical support.",
  ],
};

export const STAKEHOLDER_FRAMEWORK: Record<string, StakeholderType[]> = {
  residential: [
    CONTRACTORS,
    SITE_SUPERVISORS,
    ARCHITECTS,
    INTERIOR_DESIGNERS,
    SOCIETY_SECRETARIES,
    SECURITY_GUARDS,
  ],
  industrial: [FACILITY_HEAD, CONTRACTORS, SITE_SUPERVISORS, DEALERS],
  warehousing: [FACILITY_HEAD, CONTRACTORS, SITE_SUPERVISORS, DEALERS],
  "retail-malls": [MALL_FACILITY, CONTRACTORS, INTERIOR_DESIGNERS, ARCHITECTS],
  offices: [FACILITY_HEAD, INTERIOR_DESIGNERS, ARCHITECTS, CONTRACTORS],
  schools: [TEACHERS, PRINCIPAL, DEPT_ADMIN, CONTRACTORS],
  hospitals: [FACILITY_HEAD, CONTRACTORS, ARCHITECTS, DEPT_ADMIN],
  bazaar: [DEALERS, PAINTERS, CONTRACTORS],
};

export function getStakeholderTypes(clusterId: string): StakeholderType[] {
  return STAKEHOLDER_FRAMEWORK[clusterId] ?? [CONTRACTORS, ARCHITECTS, INTERIOR_DESIGNERS];
}
