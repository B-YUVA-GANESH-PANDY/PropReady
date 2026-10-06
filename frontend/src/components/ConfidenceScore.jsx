import React from 'react';
import { Award, CheckCircle2, AlertOctagon } from 'lucide-react';

export const ConfidenceScore = ({ score = 0, details = null }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return { text: "text-[#059669]", bg: "bg-[#059669]" };
    if (s >= 50) return { text: "text-[#D97706]", bg: "bg-[#D97706]" };
    return { text: "text-[#DC2626]", bg: "bg-[#DC2626]" };
  };

  const style = getScoreColor(score);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#0D9488]" />
          <h4 className="font-extrabold text-[#0F172A] text-sm">Ownership Confidence Score</h4>
        </div>
        <span className={`text-2xl font-black ${style.text}`}>{score.toFixed(1)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${style.bg} transition-all duration-700 ease-out`} 
          style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
        ></div>
      </div>

      {/* Breakdown Factors */}
      {details && (
        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
          {details.supporting_factors && details.supporting_factors.length > 0 && (
            <div>
              <p className="font-extrabold text-slate-700 mb-1.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Supporting Evidence:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                {details.supporting_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {details.reducing_factors && details.reducing_factors.length > 0 && (
            <div className="pt-1">
              <p className="font-extrabold text-amber-700 mb-1.5 flex items-center space-x-1">
                <AlertOctagon className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Uncertainty Deductions:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1">
                {details.reducing_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
