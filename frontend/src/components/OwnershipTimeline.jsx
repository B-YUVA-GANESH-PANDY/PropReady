import React, { useState } from 'react';
import { Calendar, FileText, ShieldCheck, Info, ArrowRight, UserCheck } from 'lucide-react';

export const OwnershipTimeline = ({ events = [] }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center font-sans shadow-xs">
        <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="font-extrabold text-[#0F172A] text-sm">No Ownership Events Recorded</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Upload title deeds (Sale Deed, Gift Deed, Partition Deed) to construct the property's historical transfer chain automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="relative pl-6 border-l-2 border-[#0D9488] space-y-6 my-4">
        {events.map((ev, index) => (
          <div 
            key={ev.id || index} 
            className="relative group transition-all duration-300"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* Timeline node marker with subtle ring animation */}
            <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-[#0D9488] border-4 border-white shadow-md group-hover:scale-125 transition-transform" />

            {/* Event Card */}
            <div 
              onClick={() => setSelectedEvent(ev)}
              className="prop-card bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#2563EB] transition-all cursor-pointer border-l-4 border-l-[#0D9488]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#CCFBF1] text-[#0D9488] text-xs font-bold border border-[#0D9488]/30">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{ev.transaction_type}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.transfer_date || 'Date Unspecified'}</span>
                </span>
              </div>

              {/* Ownership Transfer Flow */}
              <div className="flex items-center space-x-3 my-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">TRANSFEROR / SELLER</p>
                  <p className="text-xs font-bold text-slate-700">{ev.previous_owner || 'Prior Owner'}</p>
                </div>
                <div className="text-[#0D9488] font-bold px-2 text-sm">➔</div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#0D9488] font-extrabold uppercase tracking-wider">TRANSFEREE / BUYER</p>
                  <p className="text-xs font-extrabold text-[#0F172A]">{ev.new_owner}</p>
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                <span>Reg No: <b className="text-slate-800 font-semibold">{ev.registration_number || 'N/A'}</b></span>
                {ev.consideration_amount && (
                  <span>Consideration: <b className="text-[#059669] font-bold">{ev.consideration_amount}</b></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
                <span>Ownership Transfer Evidence</span>
              </h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <p className="text-slate-400 font-medium">Transaction Type</p>
                <p className="font-extrabold text-sm text-[#0F172A]">{selectedEvent.transaction_type}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400">Previous Owner</p>
                  <p className="font-bold text-slate-800">{selectedEvent.previous_owner || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">New Owner</p>
                  <p className="font-bold text-[#0F172A]">{selectedEvent.new_owner}</p>
                </div>
                <div>
                  <p className="text-slate-400">Execution Date</p>
                  <p className="font-bold text-slate-800">{selectedEvent.transfer_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Sub-Registrar Office</p>
                  <p className="font-bold text-slate-800">{selectedEvent.registration_office || 'Local SRO'}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
