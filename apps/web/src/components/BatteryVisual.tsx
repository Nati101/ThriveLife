import {
  BATTERY_STATE_LABELS,
  type BatteryState,
} from "@thrivelife/shared";
import {
  Briefcase,
  Compass,
  HeartPulse,
  Landmark,
  Sunrise,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";

const ICONS: Record<string, LucideIcon> = {
  sunrise: Sunrise,
  "heart-pulse": HeartPulse,
  compass: Compass,
  wave: Waves,
  users: Users,
  landmark: Landmark,
  briefcase: Briefcase,
};

export function BatteryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Compass;
  return <Icon className={cn("h-5 w-5 text-primary", className)} aria-hidden />;
}

const STATE_CLASS: Record<BatteryState, string> = {
  well_charged: "border-emerald-200 bg-emerald-50 text-emerald-800",
  steady: "border-primary/20 bg-primary/10 text-primary",
  strained_but_functioning: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-100 text-slate-700",
};

const MARKER_CLASS: Record<string, string> = {
  full: "border-emerald-200 bg-emerald-50 text-emerald-800",
  steady: "border-primary/20 bg-primary/10 text-primary",
  low: "border-slate-200 bg-slate-100 text-slate-700",
};

export function BatteryStateBadge({
  state,
}: {
  state: BatteryState | null | undefined;
}) {
  if (!state) {
    return <Badge>No reading yet</Badge>;
  }
  return (
    <Badge className={STATE_CLASS[state]}>{BATTERY_STATE_LABELS[state]}</Badge>
  );
}

export function ScanMarkerBadge({
  value,
}: {
  value: "low" | "steady" | "full" | null | undefined;
}) {
  if (!value) return <Badge>No scan today</Badge>;
  return (
    <Badge className={MARKER_CLASS[value]}>
      {value === "full" ? "Full" : value === "steady" ? "Steady" : "Low"}
    </Badge>
  );
}

