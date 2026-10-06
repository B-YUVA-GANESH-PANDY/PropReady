import React from 'react';
import { AlertTriangle, X, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export const DevErrorModal = ({ errorInfo, onClose }) => {
  const [expanded, setExpanded] = React.useState(true);

  if (!errorInfo || !import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-full bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-rose-500/40 p-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Dev Debug: PDF Generation Failed</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 text-[11px] leading-relaxed">
          <p><span className="text-slate-400 font-bold">HTTP Status:</span> <span className="text-rose-400 font-bold">{errorInfo.status || '500 Internal Error'}</span></p>
          <p><span className="text-slate-400 font-bold">API Endpoint:</span> <span className="text-sky-300">{errorInfo.url || 'N/A'}</span></p>
          <p><span className="text-slate-400 font-bold">Pipeline Stage:</span> <span className="text-amber-300">{errorInfo.stage || 'PDF Generation'}</span></p>
          
          <div className="pt-2">
            <p className="text-slate-400 font-bold mb-1 flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              <span>Backend Exception Detail:</span>
            </p>
            <pre className="bg-slate-900 text-rose-300 p-2.5 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-40 font-mono text-[10px]">
              {errorInfo.detail || "No detailed backend message received."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
