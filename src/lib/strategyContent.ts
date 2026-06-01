// Engagement-plan connect strategies and dynamic action-plan generation.
// Replaces the legacy roadmapContent.ts model-based variants.

import { prospectSingular, prospectPlural } from "@/data/clusters";
import { getTopics } from "@/data/eventTopics";

export type ConnectStrategy = "BRAND" | "CONTRACTOR" | "OUTREACH" | "D2C";

export const CONNECT_STRATEGY_LABEL: Record<ConnectStrategy, string> = {
  BRAND: "Brand-driven",
  CONTRACTOR: "Contractor-driven",
  OUTREACH: "Outreach-driven",
  D2C: "D2C-driven",
};

export const CONNECT_STRATEGY_OPTIONS: { key: ConnectStrategy; label: string; description: string }[] = [
  {
    key: "BRAND",
    label: "Brand-driven",
    description: "Build awareness through local campaigns, hoardings and visibility plays.",
  },
  {
    key: "CONTRACTOR",
    label: "Contractor-driven",
    description: "Activate the contractor network already operating in this cluster.",
  },
  {
    key: "OUTREACH",
    label: "Outreach-driven",
    description: "Use community touchpoints and contribution events to build trust.",
  },
  {
    key: "D2C",
    label: "D2C-driven",
    description: "Reach end customers directly through retailer, walk-in and digital channels.",
  },
];

export type ContractorContact = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
};

export type StrategyAnswers = {
  // BRAND
  runLocalCampaigns?: "Y" | "N";
  campaignIdea?: string;
  // CONTRACTOR
  knowsContractors?: "Y" | "N";
  contractors?: ContractorContact[];
  // OUTREACH
  hasCommunityTouchpoint?: "Y" | "N";
  consideredContributionEvents?: "Y" | "N";
  selectedEventTopics?: string[];
  // D2C
  wantsDirectReach?: "Y" | "N";
  d2cChannels?: string[]; // e.g. "Retailer", "WhatsApp", "Walk-in", "Site visit"
};

export const D2C_CHANNELS = ["Retailer counter", "WhatsApp blasts", "Walk-in / site visits", "Local digital ads"];

/* ───────────── action plan generator ───────────── */

export type ActionStep = string;

/**
 * Generates a dynamic action plan for a cluster given the chosen strategy
 * and the user's answers. Each step is a concrete, verb-led instruction.
 */
export function generateActionPlan(
  clusterId: string,
  strategy: ConnectStrategy,
  answers: StrategyAnswers,
): ActionStep[] {
  const singular = prospectSingular(clusterId).toLowerCase();
  const plural = prospectPlural(clusterId).toLowerCase();
  const steps: ActionStep[] = [];

  if (strategy === "BRAND") {
    if (answers.runLocalCampaigns === "Y") {
      steps.push(
        `Brief the local creative team on a campaign for ${plural} in this area.`,
        answers.campaignIdea
          ? `Build the campaign around the idea: "${answers.campaignIdea}".`
          : `Finalise a campaign theme that speaks to ${singular} decision makers.`,
        "Identify high-footfall hoarding sites and retailer counters for visibility.",
        "Run a 4-week burst with WhatsApp + on-ground material in the cluster.",
        "Track inbound leads and attribute back to the campaign.",
      );
    } else {
      steps.push(
        "Audit existing brand visibility (hoardings, retailer signage) in the cluster.",
        `Plan a low-cost visibility refresh aimed at ${plural}.`,
        "Track recall through quick walk-in conversations with retailers.",
      );
    }
  }

  if (strategy === "CONTRACTOR") {
    if (answers.knowsContractors === "Y" && (answers.contractors ?? []).length > 0) {
      const names = (answers.contractors ?? []).map((c) => c.name).filter(Boolean);
      steps.push(
        `Re-engage the contractors you already know${names.length ? ` (${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""})` : ""}.`,
        `Brief them on the JK proposition specifically for ${plural}.`,
        "Co-design pamphlets they can distribute to their site supervisors.",
        `Schedule joint visits to 3 priority ${plural} this month.`,
        "Track which contractor brings in the warmest leads.",
      );
    } else {
      steps.push(
        `Map active contractors serving ${plural} in this cluster.`,
        "Pull a starter list from retailer references and field observation.",
        "Set up an introductory contractor meet with a clear margin / loyalty pitch.",
        `Co-design pamphlets for ${plural} and distribute through the contractors.`,
        "Track incoming contacts and assist contractors with conversions.",
      );
    }
  }

  if (strategy === "OUTREACH") {
    if (answers.hasCommunityTouchpoint === "Y") {
      steps.push(
        `Leverage your existing community touchpoint to host an introduction with ${plural}.`,
      );
    } else {
      steps.push(
        `Identify one community touchpoint (RWA, association, school admin, dealer council) that can warm-introduce JK to ${plural}.`,
      );
    }
    if (answers.consideredContributionEvents === "Y") {
      const topics = (answers.selectedEventTopics ?? []).slice(0, 3);
      const fallback = getTopics(clusterId, "Awareness").slice(0, 2);
      const chosen = topics.length > 0 ? topics : fallback;
      if (chosen.length > 0) {
        steps.push(
          `Plan a contribution event around: ${chosen.map((t) => `"${t}"`).join("; ")}.`,
        );
      } else {
        steps.push(
          `Plan a region-by-region contribution event tailored to ${plural}.`,
        );
      }
      steps.push(
        "Invite key decision makers and capture warm leads on the day.",
        "Follow up within 7 days with a tailored proposal.",
      );
    } else {
      steps.push(
        "Pick one contribution event format you can pilot in the next 30 days.",
        `Run it region by region across the ${plural} in this cluster.`,
      );
    }
    steps.push("Track which touchpoints / events produce the warmest leads.");
  }

  if (strategy === "D2C") {
    if (answers.wantsDirectReach === "Y") {
      const channels = answers.d2cChannels ?? [];
      if (channels.length > 0) {
        steps.push(
          `Activate these direct channels: ${channels.join(", ")}.`,
        );
      } else {
        steps.push(
          "Shortlist 2 direct channels to test (e.g. retailer counter activation + WhatsApp).",
        );
      }
      steps.push(
        `Equip retailers serving ${plural} with collateral and demo material.`,
        "Run a 2-week walk-in / WhatsApp pilot and measure conversion.",
        "Capture customer feedback and refine the pitch.",
      );
    } else {
      steps.push(
        `Map the direct purchase journey of a typical ${singular} customer.`,
        "Identify the easiest channel to pilot first.",
      );
    }
  }

  return steps;
}
