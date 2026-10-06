import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, Loader2, Download, RefreshCw } from 'lucide-react';
import apiClient from '../api/client';
import { DocumentStatus } from '../components/DocumentStatus';
import { OCRVisualization } from '../components/animations/OCRVisualization';

export const DocumentDetail = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [ocrPages, setOcrPages] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(1);

  const loadDocData = async () => {
    try {
      const [dRes, oRes, eRes] = await Promise.all([
        apiClient.get(`/documents/${id}`),
        apiClient.get(`/documents/${id}/ocr`),
        apiClient.get(`/documents/${id}/extraction`)
      ]);
      setDoc(dRes.data);
      setOcrPages(oRes.data);
      setEntities(eRes.data);
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocData();
  }, [id]);

  const handleRetry = async () => {
    try {
      await apiClient.post(`/documents/${id}/retry`);
      alert("Document processing retry initiated.");
      loadDocData();
    } catch (err) {
      alert("Failed to trigger retry.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0D9488]" />
        <p className="text-xs">Loading OCR and extracted document entities...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center font-sans">
        <p className="text-sm font-bold text-slate-800">Document Record Not Found</p>
      </div>
    );
  }

  const currentPageOcr = ocrPages.find(p => p.page_number === selectedPage);

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <Link to={`/properties/${doc.property_id}`} className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Property</span>
          </Link>
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-[#0D9488]" />
            <h1 className="text-xl font-extrabold text-[#0F172A]">{doc.original_filename}</h1>
            <DocumentStatus status={doc.processing_status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Classification: <b className="text-slate-900">{doc.document_type}</b> ({((doc.classification_confidence || 0) * 100).toFixed(0)}% confidence) • Total Pages: {doc.page_count}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {doc.processing_status === 'FAILED' && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 flex items-center space-x-1 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Processing</span>
            </button>
          )}

          {/* Download Button */}
          <a
            href={`/api/documents/${doc.id}/file`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Original File</span>
          </a>
        </div>
      </div>

      {/* OCR Animated Scanner Bar */}
      <OCRVisualization />

      {/* Main Grid: Left OCR Text Viewer, Right Structured Extracted Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page OCR Viewer */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-[#0F172A] text-sm">PaddleOCR Text Stream</h3>

            {/* Page Navigation Selector */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Select Page:</span>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900"
              >
                {Array.from({ length: doc.page_count }, (_, i) => i + 1).map(pNum => (
                  <option key={pNum} value={pNum}>Page {pNum}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#0F172A] text-[#CCFBF1] p-4 rounded-2xl font-mono text-xs max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-inner border border-slate-800">
            {currentPageOcr?.full_text || "No OCR text extracted for this page."}
          </div>
        </div>

        {/* Structured Extracted Entities */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-sm border-b border-slate-100 pb-3">Structured Extracted Information</h3>

          {entities.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No structured entities extracted yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {entities.map((ent) => (
                <div key={ent.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0F172A] uppercase text-[11px]">{ent.field_name.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] bg-[#CCFBF1] text-[#0D9488] border border-[#0D9488]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      {ent.entity_type}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#2563EB]">{ent.value}</p>
                  {ent.source_text && (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200 line-clamp-2">
                      Source Context: "{ent.source_text}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
