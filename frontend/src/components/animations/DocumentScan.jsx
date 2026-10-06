import React from 'react';
import { FileText, Sparkles, CheckCircle2, ScanLine } from 'lucide-react';

export const DocumentScan = ({ stage = "SCANNING", fileName = "Deed_Document.pdf" }) => {
  const stages = [
    { key: "DOCUMENT", label: "Document" },
    { key: "SCANNING", label: "Scanning" },
    { key: "OCR", label: "OCR" },
    { key: "EXTRACTION", label: "Extraction" },
    { key: "VERIFIED", label: "Verified" }
  ];

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-2xl p-6 relative overflow-hidden shadow-2xl font-sans">
      {/* Header Pipeline Stage Indicator */}
      <div className="flex items-center justify-between mb-4 border-b border-[#262626] pb-3 text-xs">
        <span className="font-bold text-[#FFFFFF] flex items-center space-x-2">
          <ScanLine className="w-4 h-4 text-[#0D9488]" />
          <span>PropReady Document Scan</span>
        </span>
        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
          {stages.map((s, idx) => (
            <React.Fragment key={s.key}>
              <span className={`px-2 py-0.5 rounded ${
                s.key === stage ? 'bg-[#0D9488] text-white font-bold animate-pulse' : 'bg-[#1D1D1D] text-[#71717A]'
              }`}>
                {s.label}
              </span>
              {idx < stages.length - 1 && <span className="text-[#333333]">•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Animated Document Scanner Surface */}
      <div className="relative bg-[#080808] border border-[#262626] rounded-xl p-5 min-h-[160px] flex flex-col justify-between overflow-hidden">
        {/* Vertical Laser Beam Animation */}
        <div className="absolute inset-x-0 top-0 h-1 laser-beam animate-scanline z-10 pointer-events-none"></div>

        {/* Document Text Mock Lines */}
        <div className="space-y-2 opacity-80">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <span className="font-mono text-xs font-bold text-[#FFFFFF]">{fileName}</span>
          </div>
          <div className="h-2 bg-[#1F1F1F] rounded w-3/4 animate-pulse"></div>
          <div className="h-2 bg-[#1F1F1F] rounded w-1/2"></div>
          <div className="h-2 bg-[#1F1F1F] rounded w-5/6"></div>
          <div className="h-2 bg-[#1F1F1F] rounded w-2/3"></div>
        </div>

        {/* Dynamic Extraction Status Footer */}
        <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#5EEAD4] font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Processing page-aware OCR & entity models...</span>
          </div>
          <span className="text-[10px] bg-[#1D1D1D] text-[#A1A1AA] px-2.5 py-1 rounded font-mono">
            PropReady Engine
          </span>
        </div>
      </div>
    </div>
  );
};
