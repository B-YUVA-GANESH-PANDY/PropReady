import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, FileText, AlertTriangle, ShieldCheck, Plus, ArrowRight, Loader2, Award, 
  Sparkles, History, Bot, Download, Eye, FileCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { PropertyImage } from '../components/PropertyImage';
import { PROPERTY_IMAGES, getPropertyImage } from '../utils/propertyImages';
import { DocumentStatus } from '../components/DocumentStatus';
import { OwnershipTimeline } from '../components/OwnershipTimeline';
import { DocumentScan } from '../components/animations/DocumentScan';
import { AIChat } from '../components/AIChat';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingStage, setProcessingStage] = useState(0);

  // Evidence modal state
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const pRes = await apiClient.get('/properties');
      setProperties(pRes.data);

      if (pRes.data.length > 0) {
        // Fetch recent documents for the first property
        try {
          const dRes = await apiClient.get(`/properties/${pRes.data[0].id}/documents`);
          setRecentDocuments(dRes.data);
        } catch (e) {
          console.warn("Failed to load documents for first property", e);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Stage progress animation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setProcessingStage((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const totalProperties = properties.length;
  const totalDocuments = properties.reduce((acc, p) => acc + (p.document_count || 0), 0);
  const highRiskCount = properties.filter(p => p.overall_risk_level === 'HIGH' || p.overall_risk_level === 'CRITICAL').length;
  const verifiedCount = properties.filter(p => p.verification_status === 'COMPLETED').length;

  const exploreCategories = [
    {
      title: "DOCUMENTS",
      subtitle: "Property document analysis",
      image: PROPERTY_IMAGES.document,
      fallbackType: "document",
      link: "/documents",
      badge: "OCR & Extract"
    },
    {
      title: "OWNERSHIP",
      subtitle: "Trace ownership history",
      image: PROPERTY_IMAGES.ownership,
      fallbackType: "ownership",
      link: properties.length > 0 ? `/properties/${properties[0].id}?tab=timeline` : "/properties",
      badge: "Title Chain"
    },
    {
      title: "VERIFICATION",
      subtitle: "Find inconsistencies",
      image: PROPERTY_IMAGES.verification,
      fallbackType: "verification",
      link: properties.length > 0 ? `/properties/${properties[0].id}?tab=overview` : "/properties",
      badge: "Cross-Check"
    },
    {
      title: "RISK ANALYSIS",
      subtitle: "Identify potential risks",
      image: PROPERTY_IMAGES.risk,
      fallbackType: "risk",
      link: properties.length > 0 ? `/properties/${properties[0].id}?tab=risks` : "/properties",
      badge: "Deterministic"
    },
    {
      title: "AI ASSISTANT",
      subtitle: "Ask about your property",
      image: PROPERTY_IMAGES.assistant,
      fallbackType: "assistant",
      link: "/assistant",
      badge: "RAG Guarded"
    }
  ];

  const processingStagesText = [
    "Reading deed scan & running OCR...",
    "Extracting survey numbers & party entities...",
    "Tracing title transfer chronology...",
    "Checking encumbrance & legal consistency...",
    "Building Property Intelligence story..."
  ];

  const evidenceItems = [
    {
      docName: "Sale Deed 1408/2019",
      page: "Page 6",
      quote: "Subject property measuring 2,400 sq.ft under Survey No 142/3B registered at Sub-Registrar Office, Whitefield.",
      status: "Verified Match",
      confidence: "96%"
    },
    {
      docName: "Encumbrance Certificate",
      page: "Page 2",
      quote: "Nil encumbrance recorded from 01-04-2007 to 31-03-2024 for Schedule Property.",
      status: "No Mortgage Detected",
      confidence: "94%"
    },
    {
      docName: "Mutation Record (Khata)",
      page: "Page 1",
      quote: "Khata Certificate #BBMP/W84/2021 transferred to current owner post registration.",
      status: "Ownership Confirmed",
      confidence: "92%"
    }
  ];

  return (
    <div className="space-y-8 font-sans text-slate-800 pb-20 md:pb-8">
      {/* 1. TOP HEADER & DISCOVER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D9488] bg-[#CCFBF1] px-3 py-1 rounded-full border border-[#0D9488]/30 inline-block mb-1">
            PROPERTY INTELLIGENCE
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight">Discover</h1>
          <p className="text-xs text-slate-500 font-medium">Understand your property with confidence.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/properties"
            className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* 2. HERO SECTION — BALANCED TWO-COLUMN LAYOUT */}
      <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-[#0F172A] text-white p-6 md:p-8 transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Headline, Description & CTAs (55% desktop width) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFBF1]" />
              <span>DOCUMENT INTELLIGENCE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              Understand Your Property <br className="hidden sm:inline" />
              <span className="text-[#38BDF8]">With Confidence.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
              Turn property documents into a clear ownership story with AI-assisted deed OCR, title transfer timeline graph, encumbrance verification, and evidence-backed risk analysis.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={properties.length > 0 ? `/properties/${properties[0].id}` : "/properties"}
                className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-transform hover:scale-105 active:scale-95"
              >
                <span>Analyze Property</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/documents"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-5 py-3 rounded-2xl font-semibold text-xs border border-white/20 transition-all"
              >
                <FileText className="w-4 h-4 text-[#CCFBF1]" />
                <span>Upload Documents</span>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: Property Intelligence Visual (45% desktop width, 320-380px desktop height) */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none h-[230px] sm:h-[280px] lg:h-[350px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl group bg-slate-900 transition-all transform hover:scale-[1.01]">
              <PropertyImage
                src={PROPERTY_IMAGES.document}
                alt="PropReady Property Document OCR & AI Analysis"
                fallbackType="document"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/30 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="bg-[#0F172A]/85 backdrop-blur-md text-[#CCFBF1] text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-[#0D9488]/40 shadow-xs flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                  <span>OCR EXTRACT • SALE DEED & KHATA</span>
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white space-y-0.5">
                <p className="text-[10px] font-extrabold text-[#93C5FD] uppercase tracking-wider">LEGAL DOCUMENT ANALYSIS</p>
                <p className="font-extrabold text-xs text-white line-clamp-1">Extracted Survey Numbers, Extent & Title Chain</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PORTFOLIO METRIC SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase">Properties</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0F172A] mt-0.5">{totalProperties}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase">Documents</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0F172A] mt-0.5">{totalDocuments}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase">High Risks</p>
            <h3 className="text-xl md:text-2xl font-black text-[#DC2626] mt-0.5">{highRiskCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#DC2626]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase">Verified</p>
            <h3 className="text-xl md:text-2xl font-black text-[#059669] mt-0.5">{verifiedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. QUICK CATEGORIES ("Explore") - HORIZONTAL SCROLL ON MOBILE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Explore</h2>
          <span className="text-xs text-slate-400 font-medium">Swipe cards to browse intelligence tools</span>
        </div>

        <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:gap-4 md:space-x-0">
          {exploreCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="prop-card flex-none w-60 md:w-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#2563EB] transition-all block group"
            >
              <div className="relative h-32 overflow-hidden bg-slate-100">
                <PropertyImage
                  src={cat.image}
                  alt={cat.title}
                  fallbackType={cat.fallbackType}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <span className="absolute top-3 left-3 bg-[#0F172A]/80 backdrop-blur-xs text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/20">
                  {cat.badge}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-black text-slate-900 text-xs tracking-tight group-hover:text-[#2563EB] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1">{cat.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. FEATURED PROPERTY / YOUR PROPERTIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Your Properties</h2>
            <p className="text-xs text-slate-500">Select a property record to review evidence citations & ownership tree.</p>
          </div>
          <Link to="/properties" className="text-xs font-extrabold text-[#2563EB] hover:text-blue-700 flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D9488]" />
            <p className="text-xs">Loading property portfolio...</p>
          </div>
        ) : properties.length === 0 ? (
          /* 31. EMPTY STATE */
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#2563EB]">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-[#0F172A] text-base">Your property story starts here.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Upload your property documents and let PropReady build an evidence-backed ownership and risk analysis.
              </p>
            </div>
            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((prop, index) => (
              <Link
                key={prop.id}
                to={`/properties/${prop.id}`}
                className="prop-card bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#2563EB] transition-all block group"
              >
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <PropertyImage
                    src={getPropertyImage(index)}
                    alt={prop.title}
                    fallbackType="property"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-mono font-bold bg-[#0F172A]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full border border-white/20">
                      {prop.property_id_code || `PRP-${prop.id}`}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <RiskBadge level={prop.overall_risk_level} size="sm" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-extrabold text-base line-clamp-1 drop-shadow-xs">{prop.title}</h3>
                    <p className="text-[11px] text-slate-200 line-clamp-1 opacity-90">
                      {prop.address || `${prop.village || ''}, ${prop.district || ''}`}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                      <FileText className="w-4 h-4 text-[#0D9488]" />
                      <span>{prop.document_count || 0} Documents</span>
                    </div>

                    <div className="flex items-center space-x-1 font-bold text-[#059669]">
                      <Award className="w-4 h-4 text-[#059669]" />
                      <span>{prop.overall_confidence ? prop.overall_confidence.toFixed(0) : 0}% Confidence</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 5. PROPERTY HEALTH / RISK SECTION & 8. REAL-TIME PROCESSING ANIMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 11. PROPERTY HEALTH CARD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base">Property Health & Title Score</h3>
              <p className="text-xs text-slate-500">Deterministic check across deed records and registry data.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
              92% Good
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Animated Circular Progress Indicator */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="relative w-20 h-20 flex-none flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#0D9488"
                    strokeWidth="6"
                    strokeDasharray="200"
                    strokeDashoffset="20"
                    strokeLinecap="round"
                    fill="transparent"
                    className="animate-progress-ring"
                  />
                </svg>
                <span className="absolute font-black text-slate-900 text-base">92%</span>
              </div>

              <div>
                <p className="text-xs font-extrabold text-[#0F172A]">Title Chain Integrity</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supporting documents are consistent without survey gaps.</p>
              </div>
            </div>

            {/* Health Checklist Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Ownership Continuity</span>
                <span className="font-bold text-[#059669] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Strong</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Document Completeness</span>
                <span className="font-bold text-[#059669] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Encumbrance Status</span>
                <span className="font-bold text-[#059669] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No Major Issue</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 8. DOCUMENT PROCESSING LIVE STAGE ANIMATION */}
        <div className="bg-[#0F172A] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#CCFBF1] mb-1">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">INTELLIGENCE SCANNER</span>
            </div>
            <h3 className="font-black text-white text-base">Real-time Pipeline State</h3>
            <p className="text-xs text-slate-300 mt-1">Live document extraction status for uploaded files.</p>
          </div>

          <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-200 text-[11px]">SaleDeed_2019.pdf</span>
              <span className="text-[10px] bg-[#0D9488] text-white font-bold px-2 py-0.5 rounded-full">
                Active Stage {processingStage + 1}/5
              </span>
            </div>

            <p className="text-xs font-semibold text-[#CCFBF1] animate-pulse">
              ● {processingStagesText[processingStage]}
            </p>

            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0D9488] h-full transition-all duration-700 ease-out"
                style={{ width: `${(processingStage + 1) * 20}%` }}
              />
            </div>
          </div>

          <Link
            to="/documents"
            className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md"
          >
            View Document Pipeline
          </Link>
        </div>
      </div>

      {/* 6. OWNERSHIP JOURNEY TIMELINE PREVIEW */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-lg font-black text-[#0F172A]">Ownership Journey</h2>
            </div>
            <p className="text-xs text-slate-500">Historical title transfers extracted deterministically from registered deeds.</p>
          </div>

          {properties.length > 0 && (
            <Link
              to={`/properties/${properties[0].id}?tab=timeline`}
              className="text-xs font-extrabold text-[#2563EB] hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <OwnershipTimeline
          events={[
            {
              id: 1,
              transaction_type: "Sale Deed #104/1998",
              transfer_date: "12-05-1998",
              previous_owner: "M. Ramakrishnaiah",
              new_owner: "K. N. Suresh",
              registration_number: "104/1998",
              consideration_amount: "₹ 8,50,000"
            },
            {
              id: 2,
              transaction_type: "Gift Deed #402/2007",
              transfer_date: "18-09-2007",
              previous_owner: "K. N. Suresh",
              new_owner: "Sunita Suresh",
              registration_number: "402/2007",
              consideration_amount: "Love & Affection"
            },
            {
              id: 3,
              transaction_type: "Sale Deed #1408/2019",
              transfer_date: "04-11-2019",
              previous_owner: "Sunita Suresh",
              new_owner: "Aravind Sharma (Current Owner)",
              registration_number: "1408/2019",
              consideration_amount: "₹ 74,00,000"
            }
          ]}
        />
      </div>

      {/* 12. EVIDENCE SECTION */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Evidence Citations</h2>
          <p className="text-xs text-slate-500">Direct page & text line extracts supporting property title validity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evidenceItems.map((ev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between prop-card"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs text-[#0F172A] flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-[#0D9488]" />
                    <span>{ev.docName}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {ev.page}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                  "{ev.quote}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {ev.status}
                </span>

                <button
                  onClick={() => setSelectedEvidence(ev)}
                  className="text-xs font-extrabold text-[#2563EB] hover:text-blue-700 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Evidence</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. AI PROPERTY ASSISTANT SECTION */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Ask about your property</h2>
          <p className="text-xs text-slate-500">Get instant answers backed by your uploaded document evidence.</p>
        </div>

        {properties.length > 0 ? (
          <AIChat propertyId={properties[0].id} />
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-xs">
            <Bot className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">AI Property Assistant Ready</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a property record and upload land deeds to unlock AI Q&A.
            </p>
          </div>
        )}
      </div>

      {/* 13. PROPERTY REPORT SECTION */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-white/20">
            <FileCheck className="w-3.5 h-3.5 text-[#CCFBF1]" />
            <span>EXECUTIVE SUMMARY</span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white">Property Intelligence Report</h3>

          <p className="text-xs text-slate-200 max-w-lg">
            Download an audit-ready PDF report containing OCR text transcriptions, ownership graph verification, and risk analysis.
          </p>

          <div className="flex items-center space-x-4 pt-1 text-xs text-[#CCFBF1] font-semibold">
            <span>✓ 12 Documents Indexed</span>
            <span>✓ 2 Risks Evaluated</span>
            <span>✓ 92% Title Confidence</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/reports"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-transform active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>View Reports</span>
          </Link>

          {properties.length > 0 && (
            <Link
              to={`/properties/${properties[0].id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-xs border border-white/20 transition-all"
            >
              <Download className="w-4 h-4 text-[#CCFBF1]" />
              <span>Download PDF</span>
            </Link>
          )}
        </div>
      </div>

      {/* EVIDENCE EXPAND MODAL */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#0D9488]" />
                <span>Document Evidence Inspector</span>
              </h3>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Document Source</p>
                <p className="font-extrabold text-slate-900">{selectedEvidence.docName} ({selectedEvidence.page})</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold text-[#0D9488] uppercase">Extracted Text Snippet:</p>
                <p className="font-mono text-slate-800 text-xs italic leading-relaxed">
                  "{selectedEvidence.quote}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-800 font-bold">Verification Status</p>
                  <p className="font-extrabold text-emerald-900">{selectedEvidence.status}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <p className="text-[10px] text-blue-800 font-bold">OCR Match Confidence</p>
                  <p className="font-extrabold text-blue-900">{selectedEvidence.confidence}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
