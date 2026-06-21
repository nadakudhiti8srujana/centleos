import { cn } from "@/lib/utils";
import type { LeadStage, LeadSource, DealStatus } from "@/types";
import { STAGE_COLORS, STAGE_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  return <Badge className={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Badge>;
}

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <Badge className="bg-slate-100 text-slate-600 dark:text-slate-400">{SOURCE_LABELS[source]}</Badge>
  );
}

export function StatusBadge({ status }: { status: DealStatus }) {
  const colors = {
    open: "bg-blue-100 text-blue-700",
    won: "bg-emerald-100 text-emerald-700",
    lost: "bg-red-100 text-red-700",
  };
  return <Badge className={colors[status]}>{STATUS_LABELS[status]}</Badge>;
}
