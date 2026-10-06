import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const DocumentStatus = ({ status = "UPLOADED" }) => {
  const configs = {
    UPLOADED: { label: "Uploaded", bg: "bg-slate-100 text-slate-600 border-slate-200", icon: FileText },
    VALIDATING: { label: "Validating...", bg: "bg-blue-50 text-[#2563EB] border-blue-200", icon: Loader2, spin: true },
    PROCESSING: { label: "Processing...", bg: "bg-blue-50 text-[#2563EB] border-blue-200", icon: Loader2, spin: true },
    OCR_PROCESSING: { label: "Running OCR...", bg: "bg-[#CCFBF1] text-[#0D9488] border-[#0D9488]/30", icon: Loader2, spin: true },
    OCR_COMPLETED: { label: "OCR Complete", bg: "bg-[#CCFBF1] text-[#0D9488] border-[#0D9488]/40", icon: CheckCircle2 },
    CLASSIFYING: { label: "Classifying...", bg: "bg-blue-50 text-[#2563EB] border-blue-200", icon: Loader2, spin: true },
    EXTRACTING: { label: "Extracting Data...", bg: "bg-blue-50 text-[#2563EB] border-blue-200", icon: Loader2, spin: true },
    INDEXING: { label: "Indexing Vectors...", bg: "bg-blue-50 text-[#2563EB] border-blue-200", icon: Loader2, spin: true },
    VERIFYING: { label: "Verifying Chain...", bg: "bg-amber-50 text-[#D97706] border-amber-200", icon: Loader2, spin: true },
    COMPLETED: { label: "Analysis Completed", bg: "bg-emerald-50 text-[#059669] border-emerald-200 font-bold", icon: CheckCircle2 },
    FAILED: { label: "Processing Failed", bg: "bg-rose-50 text-[#DC2626] border-rose-200 font-bold", icon: AlertCircle }
  };

  const cfg = configs[status] || configs.PROCESSING;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${cfg.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
      <span>{cfg.label}</span>
    </span>
  );
};
