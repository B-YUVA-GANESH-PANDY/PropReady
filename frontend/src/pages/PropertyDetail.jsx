import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  Building2, FileText, ShieldAlert, Award, Bot, Upload, 
  History, AlertCircle, ArrowLeft, Download, RefreshCw, CheckCircle2, MapPin, Eye, Loader2, Check
} from 'lucide-react';
import { downloadAuthenticatedReport } from '../utils/reportDownloader';
import { DevErrorModal } from '../components/DevErrorModal';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { ConfidenceScore } from '../components/ConfidenceScore';
import { OwnershipTimeline } from '../components/OwnershipTimeline';
import { AIChat } from '../components/AIChat';
import { DocumentStatus } from '../components/DocumentStatus';
import { DocumentScan } from '../components/animations/DocumentScan';
import { RiskCheckAnimation } from '../components/animations/RiskCheckAnimation';
import { PropertyImage } from '../components/PropertyImage';
import { PROPERTY_IMAGES } from '../utils/propertyImages';

export const PropertyDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [property, setProperty] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [ownershipEvents, setOwnershipEvents] = useState([]);
  const [risks, setRisks] = useState([]);
  const [confidenceData, setConfidenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Upload & Report State
  const [uploading, setUploading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [devErrorInfo, setDevErrorInfo] = useState(null);

  const loadAllData = async () => {
    try {
      const [pRes, dRes, oRes, rRes, cRes] = await Promise.all([
        apiClient.get(`/properties/${id}`),
        apiClient.get(`/properties/${id}/documents`),
        apiClient.get(`/properties/${id}/ownership`),
        apiClient.get(`/properties/${id}/risks`),
        apiClient.get(`/properties/${id}/confidence`)
      ]);

      setProperty(pRes.data);
      setDocuments(dRes.data);
      setOwnershipEvents(oRes.data);
      setRisks(rRes.data);
      setConfidenceData(cRes.data);
    } catch (err) {
      console.error("Failed to load property data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/properties/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadAllData();
      alert("Document uploaded! OCR & AI verification pipeline started.");
    } catch (err) {
      alert(err.response?.data?.detail || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!property) return;
    setDevErrorInfo(null);
    await downloadAuthenticatedReport({
      propertyId: property.id,
      propertyTitle: property.title,
      onStart: () => setGeneratingReport(true),
      onSuccess: (msg) => {
        setGeneratingReport(false);
        setToastMessage({ type: 'success', text: msg });
        setTimeout(() => setToastMessage(null), 5000);
      },
      onError: (msg, devInfo) => {
        setGeneratingReport(false);
        setToastMessage({ type: 'error', text: msg });
        setDevErrorInfo(devInfo);
        setTimeout(() => setToastMessage(null), 5000);
      }
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0D9488]" />
        <p className="text-xs">Loading property intelligence dashboard...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center font-sans">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-base">Property Record Not Found</h3>
        <Link to="/properties" className="text-xs text-[#2563EB] font-bold mt-2 inline-block">Return to Properties</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Top Banner Image Card & Property Title Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="relative h-48 md:h-60 bg-slate-900 overflow-hidden">
          <PropertyImage
            src={PROPERTY_IMAGES.hero}
            alt={property.title}
            fallbackType="property"
            className="w-full h-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />

          <div className="absolute top-4 left-4 z-10">
            <Link
              to="/properties"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition-all border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Properties</span>
            </Link>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-[10px] font-mono font-extrabold bg-[#0D9488] text-white px-2.5 py-0.5 rounded-full uppercase">
                  {property.property_id_code || `PRP-${property.id}`}
                </span>
                <RiskBadge level={property.overall_risk_level} size="sm" />
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{property.title}</h1>
              <p className="text-xs text-slate-200 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#CCFBF1]" />
                <span>Survey No: {property.survey_number || 'N/A'} • {property.address || `${property.village || ''}, ${property.district || ''}`}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start md:self-auto">
              <label className="cursor-pointer inline-flex items-center space-x-2 bg-[#0D9488] hover:bg-[#0F766E] text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors shadow-md">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload Deed'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors shadow-md"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Generating report...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download as PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className={`p-3.5 text-xs font-bold text-white flex items-center justify-between transition-all ${
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

        {/* Key Verification Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 bg-slate-50 p-4 text-xs font-sans">
          <div className="p-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Verified Owner</p>
            <p className="font-extrabold text-[#0D9488] text-sm mt-0.5">{property.current_owner || 'Unassigned / Review Needed'}</p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Ownership Confidence</p>
            <p className="font-extrabold text-[#059669] text-sm mt-0.5">{property.overall_confidence ? property.overall_confidence.toFixed(1) : 0}%</p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Documents Analyzed</p>
            <p className="font-extrabold text-[#0F172A] text-sm mt-0.5">{documents.length} Files</p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Risk Issues</p>
            <p className="font-extrabold text-[#DC2626] text-sm mt-0.5">{risks.length} Detected</p>
          </div>
        </div>
      </div>

      {/* Upload Scanning State Animation */}
      {uploading && (
        <div className="w-full">
          <DocumentScan stage="OCR" fileName="Uploading_Land_Deed..." />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar space-x-1">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'timeline', label: 'Ownership Timeline', icon: History },
          { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
          { id: 'risks', label: `Risk Analysis (${risks.length})`, icon: ShieldAlert },
          { id: 'assistant', label: 'AI Assistant', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Property Schedule Technical Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-[#0F172A] text-base border-b border-slate-100 pb-3">Property Schedule & Boundaries</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">Survey Number</p>
                  <p className="font-bold text-[#0F172A]">{property.survey_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Sub-Survey / Hissa</p>
                  <p className="font-bold text-[#0F172A]">{property.sub_survey_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Khata / Patta Number</p>
                  <p className="font-bold text-[#0F172A]">{property.khata_number || property.patta_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Area Extent</p>
                  <p className="font-bold text-[#0F172A]">{property.area_extent || '2,400 sq.ft'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Village / Hobli</p>
                  <p className="font-bold text-[#0F172A]">{property.village || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Taluk / District</p>
                  <p className="font-bold text-[#0F172A]">{property.taluk} / {property.district}</p>
                </div>
              </div>
            </div>

            {/* Recent Uploaded Documents */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-[#0F172A] text-base">Uploaded Title Deeds</h3>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500">No documents uploaded yet. Upload a Sale Deed or EC to begin.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#0D9488]" />
                        <div>
                          <p className="font-bold text-slate-900">{d.original_filename}</p>
                          <p className="text-[11px] text-slate-500">{d.document_type} • {d.page_count} Pages</p>
                        </div>
                      </div>
                      <DocumentStatus status={d.processing_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ConfidenceScore score={property.overall_confidence || 0} details={confidenceData} />
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="font-extrabold text-[#0F172A] text-base mb-1">Historical Title Transfer Chain</h3>
          <p className="text-xs text-slate-500 mb-6">Chronological graph extracted deterministically from title deeds.</p>
          <OwnershipTimeline events={ownershipEvents} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-[#0F172A] text-base">All Property Deeds</h3>
            <label className="cursor-pointer inline-flex items-center space-x-2 bg-[#0D9488] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Deed</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-[#0D9488]" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.original_filename}</h4>
                    <p className="text-xs text-slate-500">
                      Type: <b className="text-slate-900">{doc.document_type}</b> • Pages: <b>{doc.page_count}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DocumentStatus status={doc.processing_status} />
                  <Link
                    to={`/documents/${doc.id}`}
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md"
                  >
                    View OCR & Data
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-extrabold text-[#0F172A] text-base border-b border-slate-100 pb-3">Cross-Document Risk Findings</h3>
          
          <RiskCheckAnimation />

          {risks.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">No Critical Title Risks Detected</p>
              <p className="text-xs text-slate-500">Uploaded documents show consistent survey numbers and valid chain links.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {risks.map((r) => (
                <div key={r.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{r.title}</span>
                    <RiskBadge level={r.severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600">{r.description}</p>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 italic">
                    <b>Reason:</b> {r.reason}
                  </p>
                  {r.recommended_action && (
                    <div className="text-xs text-[#2563EB] bg-blue-50 p-3 rounded-xl border border-blue-200 font-semibold">
                      <b>Recommended Action:</b> {r.recommended_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assistant' && (
        <AIChat propertyId={property.id} />
      )}
    </div>
  );
};
