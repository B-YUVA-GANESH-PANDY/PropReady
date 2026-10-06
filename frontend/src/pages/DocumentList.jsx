import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, Search, ArrowRight, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';
import apiClient from '../api/client';
import { DocumentStatus } from '../components/DocumentStatus';

export const DocumentList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await apiClient.get('/properties');
        setProperties(res.data);
      } catch (err) {
        console.error("Error loading document list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0D9488] text-xs font-extrabold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-[#0D9488]" />
            <span>DOCUMENT REPOSITORY</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">Property Documents</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xl">
            Access and monitor all uploaded title deeds, encumbrance certificates, survey maps, and revenue extracts across your verified properties.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          <span>OCR & RAG Encrypted Vault</span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#0D9488]" />
          <p className="text-xs font-medium">Loading property documents & OCR records...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-[#2563EB]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Upload a property document to begin analysis.</h3>
            <p className="text-xs text-slate-500 mt-1">Your property document intelligence workspace starts here.</p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-md shadow-blue-500/20"
          >
            <span>Add Property & Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.id} className="prop-card bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#2563EB] transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-extrabold text-[#0D9488] bg-[#CCFBF1] border border-[#0D9488]/30 px-2.5 py-0.5 rounded-full">
                      {prop.property_id_code || `PRP-${prop.id}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{prop.state}, {prop.district}</span>
                  </div>
                  <h3 className="font-extrabold text-[#0F172A] text-base mt-1">{prop.title}</h3>
                </div>
                <Link
                  to={`/properties/${prop.id}?tab=documents`}
                  className="text-xs font-extrabold text-[#2563EB] hover:text-blue-700 flex items-center space-x-1.5 self-start sm:self-center"
                >
                  <span>Open Documents Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Uploaded Deeds: <b className="text-[#0F172A] font-extrabold">{prop.document_count || 0} Documents</b></span>
                <span className="text-[11px] text-slate-400 font-mono">ID: #{prop.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
