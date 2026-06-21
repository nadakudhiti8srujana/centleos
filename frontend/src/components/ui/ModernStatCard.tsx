import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';

export interface ModernStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isCurrency?: boolean;
  trend?: { value: string; positive: boolean };
  subtitle?: string;
  delay?: number;
  module?: 'crm' | 'erp' | 'analytics' | 'referrals' | 'core' | 'superadmin';
  className?: string;
}

export function ModernStatCard({ 
  title, 
  value, 
  icon, 
  isCurrency, 
  trend, 
  subtitle,
  delay = 0,
  module = 'core',
  className
}: ModernStatCardProps) {
  let glowClass = "bg-brand-500/10 group-hover:bg-brand-500/20";
  let iconBgClass = "bg-brand-500/10 border-brand-500/20 text-brand-400";
  
  if (module === 'crm') {
    glowClass = "bg-module-crm/10 group-hover:bg-module-crm/20";
    iconBgClass = "bg-module-crm/10 border-module-crm/20 text-module-crm shadow-glow-crm";
  } else if (module === 'erp') {
    glowClass = "bg-module-erp/10 group-hover:bg-module-erp/20";
    iconBgClass = "bg-module-erp/10 border-module-erp/20 text-module-erp shadow-glow-erp";
  } else if (module === 'analytics') {
    glowClass = "bg-module-analytics/10 group-hover:bg-module-analytics/20";
    iconBgClass = "bg-module-analytics/10 border-module-analytics/20 text-module-analytics shadow-glow-analytics";
  } else if (module === 'referrals') {
    glowClass = "bg-module-referrals/10 group-hover:bg-module-referrals/20";
    iconBgClass = "bg-module-referrals/10 border-module-referrals/20 text-module-referrals shadow-glow-referrals";
  } else if (module === 'superadmin') {
    glowClass = "bg-rose-500/10 group-hover:bg-rose-500/20";
    iconBgClass = "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-glow-super";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("glass-panel p-6 relative overflow-hidden group", className)}
    >
      {/* Background glow effect */}
      <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-all duration-500", glowClass)} />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-white flex items-center">
            {isCurrency && <span className="mr-1 text-slate-500 font-medium">$</span>}
            {typeof value === 'number' ? (
              <CountUp end={value} separator="," decimals={isCurrency && value % 1 !== 0 ? 2 : 0} duration={2.5} />
            ) : (
              <span>{value}</span>
            )}
          </h3>
          
          {trend && (
            <p className="mt-2 text-sm flex items-center">
              <span className={cn(
                "font-medium mr-2",
                trend.positive ? "text-emerald-400" : "text-rose-400"
              )}>
                {trend.positive ? "+" : "-"}{trend.value}
              </span>
            </p>
          )}
          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl border group-hover:scale-110 transition-transform duration-300", iconBgClass)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
