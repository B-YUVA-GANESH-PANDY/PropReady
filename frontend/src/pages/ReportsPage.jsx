import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Loader2, ArrowRight, FileText, AlertTriangle, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { downloadAuthenticatedReport } from '../utils/reportDownloader';
import { DevErrorModal } from '../components/DevErrorModal';

export const ReportsPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPropId, setDownloadingPropId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [devErrorInfo, setDevErrorInfo] = useState(null);

  const handleDownloadReport = async (propertyId, propertyTitle) => {
    setDevErrorInfo(null);
    await downloadAuthenticatedReport({
      propertyId,
      propertyTitle,
      onStart: () => setDownloadingPropId(propertyId),
      onSuccess: (msg) => {
        setDownloadingPropId(null);
        setToastMessage({ type: 'success', text: msg });
        setTimeout(() => setToastMessage(null), 5000);
      },
      onError: (msg, devInfo) => {
        setDownloadingPropId(null);
        setToastMessage({ type: 'error', text: msg });
        setDevErrorInfo(devInfo);
        setTimeout(() => setToastMessage(null), 5000);
      }
    });
  };

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await apiClient.get('/properties');
        setProperties(res.data);
      } catch (err) {
        console.error("Failed to load reports page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#2563EB] text-xs font-extrabold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4 text-[#2563EB]" />
            <span>INTELLIGENCE REPORTS</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">Property Intelligence Reports</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xl">
            Generate and download official PDF Property Intelligence Reports containing OCR extraction evidence, ownership timeline verifications, and risk finding matrix.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <span>Legal & Title Audit Grade</span>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold text-white flex items-center justify-between transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-mono text-xs">✕</button>
        </div>
      )}

      {/* Development Debug Panel */}
      <DevErrorModal errorInfo={devErrorInfo} onClose={() => setDevErrorInfo(null)} />

      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#2563EB]" />
          <p className="text-xs font-medium">Loading report repository...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-[#2563EB]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Complete document analysis to generate your first report.</h3>
            <p className="text-xs text-slate-500 mt-1">Upload title deeds and encumbrance certificates to trigger AI risk auditing.</p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-md shadow-blue-500/20"
          >
            <span>Create Property Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {properties.map((prop) => (
            <div key={prop.id} className="prop-card bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#2563EB] transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-[#0D9488] bg-[#CCFBF1] border border-[#0D9488]/30 px-2.5 py-0.5 rounded-full">
                      {prop.property_id_code || `PRP-${prop.id}`}
                    </span>
                    <h3 className="font-extrabold text-[#0F172A] text-base mt-1">{prop.title}</h3>
                  </div>
                  <FileCheck className="w-5 h-5 text-[#0D9488] flex-shrink-0" />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-extrabold">Overall Confidence</p>
                    <p className="text-sm font-black text-[#059669] mt-0.5">
                      {prop.overall_confidence ? prop.overall_confidence.toFixed(1) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-extrabold">Risk Assessment</p>
                    <p className={`text-xs font-bold mt-0.5 uppercase ${
                      prop.overall_risk_level === 'HIGH' ? 'text-rose-600' :
                      prop.overall_risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {prop.overall_risk_level || 'LOW'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-semibold">{prop.document_count || 0} Deeds Audited</span>
                <button
                  onClick={() => handleDownloadReport(prop.id, prop.title)}
                  disabled={downloadingPropId === prop.id}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-md shadow-blue-500/20"
                >
                  {downloadingPropId === prop.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating report...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
