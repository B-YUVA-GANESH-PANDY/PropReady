import React from 'react';
import { Database, FileText, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

export const RAGVisualization = ({ activeStep = 3, sourcesCount = 2 }) => {
  return (
    <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
        <h4 className="text-xs font-bold text-[#FFFFFF] flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#2563EB]" />
          <span>FAISS Vector Retrieval & Context Guard</span>
        </h4>
        <span className="text-[10px] font-mono bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30 px-2 py-0.5 rounded-full">
          Filtered User Context
        </span>
      </div>

      {/* Connected Nodes Graph */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
        {/* Node 1: Documents */}
        <div className={`p-3 rounded-xl border transition-all ${
          activeStep >= 1 ? 'bg-[#0D0D0D] border-[#2563EB] text-white glow-border-blue' : 'bg-[#080808] border-[#262626] text-[#71717A]'
        }`}>
          <FileText className="w-4 h-4 mx-auto mb-1 text-[#2563EB]" />
          <span className="font-bold text-[11px] block">Document Nodes</span>
          <span className="text-[9px] text-[#A1A1AA]">Deeds & EC</span>
        </div>

        {/* Node 2: Text Chunks */}
        <div className={`p-3 rounded-xl border transition-all ${
          activeStep >= 2 ? 'bg-[#0D0D0D] border-[#0D9488] text-white glow-border-teal' : 'bg-[#080808] border-[#262626] text-[#71717A]'
        }`}>
          <Database className="w-4 h-4 mx-auto mb-1 text-[#0D9488]" />
          <span className="font-bold text-[11px] block">Text Chunks</span>
          <span className="text-[9px] text-[#A1A1AA]">384-dim Embeddings</span>
        </div>

        {/* Node 3: Evidence Nodes */}
        <div className={`p-3 rounded-xl border transition-all ${
          activeStep >= 3 ? 'bg-[#0D0D0D] border-[#5EEAD4] text-white glow-border-teal' : 'bg-[#080808] border-[#262626] text-[#71717A]'
        }`}>
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#5EEAD4]" />
          <span className="font-bold text-[11px] block">Evidence Nodes</span>
          <span className="text-[9px] text-[#5EEAD4]">{sourcesCount} Sources Found</span>
        </div>

        {/* Node 4: AI Answer */}
        <div className={`p-3 rounded-xl border transition-all ${
          activeStep >= 4 ? 'bg-[#0D0D0D] border-[#2563EB] text-white glow-border-blue' : 'bg-[#080808] border-[#262626] text-[#71717A]'
        }`}>
          <Cpu className="w-4 h-4 mx-auto mb-1 text-[#2563EB]" />
          <span className="font-bold text-[11px] block">AI Answer</span>
          <span className="text-[9px] text-[#A1A1AA]">With Citations</span>
        </div>
      </div>

      <div className="text-[11px] text-[#A1A1AA] bg-[#080808] p-2.5 rounded-xl border border-[#262626] flex items-center justify-between font-mono">
        <span>✓ Evidence retrieved & isolated by User ID & Property ID</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#0D9488]" />
      </div>
    </div>
  );
};
