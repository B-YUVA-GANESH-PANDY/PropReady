import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

export const RiskBadge = ({ level = "LOW", size = "md" }) => {
  const configs = {
    LOW: {
      label: "LOW RISK",
      bg: "bg-emerald-50 text-[#059669] border-emerald-200",
      icon: ShieldCheck,
      dot: "bg-[#059669]"
    },
    MEDIUM: {
      label: "MEDIUM RISK",
      bg: "bg-amber-50 text-[#D97706] border-amber-200",
      icon: AlertTriangle,
      dot: "bg-[#D97706]"
    },
    HIGH: {
      label: "HIGH RISK",
      bg: "bg-rose-50 text-[#DC2626] border-rose-200",
      icon: AlertCircle,
      dot: "bg-[#DC2626]"
    },
    CRITICAL: {
      label: "CRITICAL RISK",
      bg: "bg-rose-100 text-[#DC2626] border-rose-300 font-extrabold animate-pulse",
      icon: ShieldAlert,
      dot: "bg-[#DC2626]"
    },
    NOT_ANALYZED: {
      label: "NOT ANALYZED",
      bg: "bg-slate-100 text-slate-500 border-slate-200",
      icon: AlertTriangle,
      dot: "bg-slate-400"
    }
  };

  const cfg = configs[level] || configs.NOT_ANALYZED;
  const Icon = cfg.icon;

  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full border font-bold tracking-tight ${cfg.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
};
