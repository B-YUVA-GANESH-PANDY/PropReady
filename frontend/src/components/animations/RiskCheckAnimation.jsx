import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export const RiskCheckAnimation = () => {
  const [completedSteps, setCompletedSteps] = useState(0);

  const checks = [
    { title: "Ownership Consistency Check", status: "success", label: "Verified across transfer deeds" },
    { title: "Document Completeness Verification", status: "success", label: "Title deeds & EC reviewed" },
    { title: "Registration Number & Office Check", status: "success", label: "Sub-Registrar records matched" },
    { title: "Historical Title Timeline Continuity", status: "success", label: "No intermediate gaps found" },
    { title: "Encumbrance & Mortgage Status", status: "warning", label: "Unreleased bank charge detected" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCompletedSteps((prev) => (prev < checks.length ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(timer);
  }, [checks.length]);

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
        <h4 className="text-xs font-bold text-[#FFFFFF] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <span>Cross-Document Deterministic Risk Scanner</span>
        </h4>
        <span className="text-[10px] font-mono text-[#A1A1AA]">
          {completedSteps} / {checks.length} Checks Run
        </span>
      </div>

      <div className="space-y-2">
        {checks.map((chk, idx) => {
          const isDone = idx < completedSteps;
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all duration-300 ${
                isDone
                  ? chk.status === 'warning'
                    ? 'bg-[#151515] border-[#F59E0B]/40 text-[#F59E0B]'
                    : 'bg-[#0D0D0D] border-[#262626] text-[#FFFFFF]'
                  : 'bg-[#080808] border-[#1F1F1F] opacity-30 text-[#71717A]'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isDone ? (
                  chk.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                  )
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#71717A] flex-shrink-0"></div>
                )}
                <span className="font-medium">{chk.title}</span>
              </div>
              <span className="text-[10px] font-mono text-[#A1A1AA]">{isDone ? chk.label : 'Pending'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
