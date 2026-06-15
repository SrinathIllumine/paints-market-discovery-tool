import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronDown, FileDown, Info, Plus, Star, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  getCustomerGroups,
  getValuePropsForGroup,
  getCampIdeas,
  type ContactEntry,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen;
});
