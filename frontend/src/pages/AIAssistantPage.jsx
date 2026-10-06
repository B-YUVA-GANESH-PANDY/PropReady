import React, { useState, useEffect } from 'react';
import { AIChat } from '../components/AIChat';
import { Building2, Sparkles, Loader2, FileText } from 'lucide-react';
import apiClient from '../api/client';

export const AIAssistantPage = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await apiClient.get('/properties');
        setProperties(res.data);
        if (res.data.length > 0) {
          setSelectedPropId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0D9488]" />
        <p className="text-xs">Loading AI Property Assistant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-xl font-extrabold text-[#0F172A]">AI Property Assistant</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Ask complex questions regarding title chains, encumbrances, ownership records, or missing paperwork. Every answer is grounded directly in uploaded documents.
          </p>
        </div>

        {/* Property Selector */}
        {properties.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Building2 className="w-4 h-4 text-[#0D9488]" />
            <span className="text-xs font-semibold text-slate-600">Select Property:</span>
            <select
              value={selectedPropId || ''}
              onChange={(e) => setSelectedPropId(Number(e.target.value))}
              className="bg-white border border-slate-200 text-xs font-bold text-[#0F172A] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2563EB]"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.survey_number || `PRP-${p.id}`})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-base">No Property Selected for AI Analysis</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Please create a property record and upload land documents (Sale Deed, EC, Mutation Record) to enable AI assistant analysis.
          </p>
        </div>
      ) : (
        selectedPropId && <AIChat propertyId={selectedPropId} />
      )}
    </div>
  );
};
