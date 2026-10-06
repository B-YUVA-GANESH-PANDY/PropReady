import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';

export const OCRVisualization = ({ extractedFields = null }) => {
  const [activeStep, setActiveStep] = useState(0);

  const defaultFields = extractedFields || [
    { label: "Owner Name", value: "Ananya Sharma", confidence: "95%" },
    { label: "Survey Number", value: "142/3B", confidence: "98%" },
    { label: "Execution Date", value: "14th Aug 2019", confidence: "92%" },
    { label: "Registration No", value: "7821/2019", confidence: "96%" },
    { label: "Property Address", value: "Hoodi Village, Bengaluru", confidence: "90%" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % (defaultFields.length + 1));
    }, 1200);
    return () => clearInterval(timer);
  }, [defaultFields.length]);

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
        <h4 className="text-xs font-bold text-[#FFFFFF] flex items-center space-x-2">
          <Eye className="w-4 h-4 text-[#0D9488]" />
          <span>PaddleOCR Real-Time Text Line Bounding</span>
        </h4>
        <span className="text-[10px] font-mono bg-[#0D9488]/20 text-[#5EEAD4] border border-[#0D9488]/30 px-2 py-0.5 rounded-full">
          Illuminated Bounding Boxes
        </span>
      </div>

      <div className="space-y-2">
        {defaultFields.map((field, idx) => {
          const isIlluminated = idx <= activeStep;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between text-xs ${
                isIlluminated
                  ? 'bg-[#0D0D0D] border-[#0D9488]/60 glow-border-teal'
                  : 'bg-[#080808] border-[#262626] opacity-40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-[10px] text-[#A1A1AA] w-24">{field.label}:</span>
                <span className="font-bold text-[#FFFFFF]">{field.value}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-[#5EEAD4]">{field.confidence}</span>
                {isIlluminated && <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
