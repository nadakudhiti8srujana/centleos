import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl shadow-glow-super",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        {trend && (
          <p
            className={cn(
              "mt-2 text-xs font-medium",
              trend.positive ? "text-emerald-400" : "text-slate-400"
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
      <div className="rounded-lg bg-brand-500/10 p-3 text-brand-400">{icon}</div>
    </Card>
  );
}
