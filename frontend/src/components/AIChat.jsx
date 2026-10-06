import React, { useState } from 'react';
import { Bot, Send, Sparkles, FileText, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '../api/client';
import { AIAnalysisAnimation } from './animations/AIAnalysisAnimation';
import { RAGVisualization } from './animations/RAGVisualization';

export const AIChat = ({ propertyId }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Who is the current owner?",
    "Show ownership history",
    "Any mortgage?",
    "Any document mismatch?",
    "What are the major risks?",
    "What documents are missing?"
  ];

  const handleSend = async (queryText) => {
    const q = queryText || question;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await apiClient.post(`/properties/${propertyId}/assistant/query`, {
        question: q
      });

      const aiMsg = {
        role: 'assistant',
        answer: res.data.answer,
        confidence: res.data.confidence_score,
        sources: res.data.sources || [],
        disclaimer: res.data.disclaimer
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          answer: "AI assistant service encountered an error. Deterministic title records remain fully accessible.",
          confidence: 0.0,
          sources: [],
          disclaimer: "AI-Assisted Property Document Analysis."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 text-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 text-[#CCFBF1]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A]">PropReady Intelligence Assistant</h3>
            <p className="text-[11px] text-slate-500">Evidence-grounded answers backed by deed OCR transcripts.</p>
          </div>
        </div>
        <span className="text-[10px] bg-[#CCFBF1] text-[#0D9488] px-3 py-1 rounded-full font-bold border border-[#0D9488]/30">
          Context Filtered
        </span>
      </div>

      {/* Suggested Query Chips - Horizontally Scrollable */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-400 text-[11px] font-extrabold uppercase whitespace-nowrap">Suggested:</span>
        {suggestedQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] transition-all text-[11px] font-medium whitespace-nowrap shadow-xs"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#0F172A] text-base">Ask Questions About Property Evidence</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Ask about title chain, recorded owners, encumbrances, survey numbers, or document consistency.
              </p>
            </div>
            <div className="w-full max-w-md">
              <RAGVisualization activeStep={2} sourcesCount={2} />
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-[#2563EB] text-white p-3.5 rounded-2xl rounded-tr-none max-w-lg text-xs font-semibold shadow-md">
                {msg.content}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl rounded-tl-none max-w-2xl text-xs space-y-3 shadow-xs text-slate-800">
                {/* Answer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-[#0F172A] text-xs flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                      <span>INTELLIGENCE RESPONSE</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Confidence: {(msg.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-xs font-normal">{msg.answer}</p>
                </div>

                {/* Evidence Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                    <p className="font-extrabold text-[#0D9488] text-[10px] uppercase tracking-wider">Document Evidence Citations:</p>
                    {msg.sources.map((src, sidx) => (
                      <div key={sidx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-slate-900 font-bold">
                          <span className="flex items-center space-x-1 text-[#2563EB]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{src.document_name} ({src.document_type})</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">Page {src.page_number}</span>
                        </div>
                        <p className="text-slate-600 italic text-[10px] line-clamp-2">"{src.snippet}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  {msg.disclaimer || "AI-Assisted Property Document Analysis. Not a legal opinion."}
                </p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="w-full max-w-md">
            <AIAnalysisAnimation />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about this property's documents..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !question.trim()}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
