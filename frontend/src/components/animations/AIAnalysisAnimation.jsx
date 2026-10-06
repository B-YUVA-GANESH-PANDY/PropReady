import React, { useState, useEffect } from 'react';
import { Database, FileText, Sparkles, Cpu, CheckCircle2 } from 'lucide-react';

export const AIAnalysisAnimation = () => {
  const [stageIdx, setStageIdx] = useState(0);

  const stages = [
    { label: "Retrieving evidence from FAISS vector store...", icon: Database, color: "text-[#2563EB]" },
    { label: "Analyzing uploaded property deeds & EC pages...", icon: FileText, color: "text-[#0D9488]" },
    { label: "Cross-checking records & survey numbers...", icon: Sparkles, color: "text-[#5EEAD4]" },
    { label: "Synthesizing answer with page-level citations...", icon: Cpu, color: "text-[#22C55E]" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % stages.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [stages.length]);

  const CurrentIcon = stages[stageIdx].icon;

  return (
    <div className="bg-[#0D0D0D] border border-[#262626] rounded-xl p-3.5 flex items-center space-x-3 text-xs shadow-md font-sans">
      <CurrentIcon className={`w-4 h-4 ${stages[stageIdx].color} animate-spin`} />
      <div className="flex-1">
        <p className="font-semibold text-[#FFFFFF]">{stages[stageIdx].label}</p>
        <div className="w-full bg-[#1F1F1F] h-1 rounded-full mt-1.5 overflow-hidden">
          <div
            className="bg-[#2563EB] h-full transition-all duration-300 ease-out"
            style={{ width: `${((stageIdx + 1) / stages.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
