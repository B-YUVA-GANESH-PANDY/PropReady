import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, FileText, Activity, Cpu, Layers, ShieldCheck, 
  AlertTriangle, Loader2, RefreshCw, CheckCircle2, Clock 
} from 'lucide-react';
import apiClient from '../../api/client';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAdminData = async () => {
    try {
      const [mRes, monRes, uRes, aRes, jRes] = await Promise.all([
        apiClient.get('/admin/metrics'),
        apiClient.get('/admin/monitoring'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/audit-logs'),
        apiClient.get('/admin/jobs')
      ]);

      setMetrics(mRes.data);
      setMonitoring(monRes.data);
      setUsers(uRes.data);
      setAuditLogs(aRes.data);
      setJobs(jRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 font-sans">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#2563EB]" />
        <p className="text-xs font-medium">Loading admin portal metrics & security audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Top Banner */}
      <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-[#2563EB] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SECURE OPERATIONS
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">PropReady Operations Center</h1>
          <p className="text-xs text-slate-300 mt-1">System health monitoring, user access control, background job queue, and security audit logs.</p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 text-xs font-bold flex items-center space-x-2 self-start md:self-center"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh System Data</span>
        </button>
      </div>

      {/* Admin Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase">Total Users</p>
          <h3 className="text-2xl font-black text-[#0F172A] mt-1">{metrics?.total_users || 0}</h3>
          <p className="text-[11px] text-[#059669] font-bold mt-1">{metrics?.active_users || 0} Active Accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase">System Properties</p>
          <h3 className="text-2xl font-black text-[#0F172A] mt-1">{metrics?.total_properties || 0}</h3>
          <p className="text-[11px] text-[#DC2626] font-bold mt-1">{metrics?.high_risk_properties || 0} High Risk Items</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase">Total Documents</p>
          <h3 className="text-2xl font-black text-[#0F172A] mt-1">{metrics?.total_documents || 0}</h3>
          <p className="text-[11px] text-slate-500 font-bold mt-1">{metrics?.processing_queue || 0} In Queue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase">AI Queries Processed</p>
          <h3 className="text-2xl font-black text-[#2563EB] mt-1">{metrics?.ai_queries || 0}</h3>
          <p className="text-[11px] text-[#0D9488] font-bold mt-1">Local FAISS RAG Engine</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar space-x-1">
        {[
          { id: 'overview', label: 'System Overview & AI Status', icon: Cpu },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'jobs', label: `Processing Jobs (${jobs.length})`, icon: Layers },
          { id: 'audit', label: `Security Audit Logs (${auditLogs.length})`, icon: Activity },
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

      {/* Tab 1: System Health & AI Status */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-[#0F172A] text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#0D9488]" />
              <span>Local Open-Weight AI & RAG Diagnostics</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500">LLM Provider:</span>
                <span className="font-extrabold text-slate-900 uppercase">{monitoring?.llm_provider}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500">Configured LLM Model:</span>
                <span className="font-extrabold text-[#2563EB]">{monitoring?.llm_model}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500">LLM Availability:</span>
                <span className="font-extrabold text-[#059669]">{monitoring?.llm_availability}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500">Vector Store Database:</span>
                <span className="font-extrabold text-[#0D9488]">FAISS Local ({monitoring?.vector_store?.indexed_chunks || 0} Chunks)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500">OCR Engine:</span>
                <span className="font-extrabold text-slate-900">{monitoring?.ocr_engine}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-[#0F172A] text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Security Architecture Status</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-2.5 text-[#059669] bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span><b>Password Storage:</b> Argon2id Hashing Enforced</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[#059669] bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span><b>Authorization:</b> Strict User & Property Isolation at Backend API</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[#059669] bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span><b>Prompt Injection:</b> Document context treated strictly as static data</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[#059669] bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span><b>Public Registration:</b> Restricted to USER role only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-base border-b border-slate-100 pb-3">Registered Platform Accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 uppercase text-[10px] font-extrabold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-400">#{u.id}</td>
                    <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.role === 'ADMIN' ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-[#CCFBF1] border border-[#0D9488]/30 text-[#0D9488]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[#059669] font-bold">Active</span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Background Jobs */}
      {activeTab === 'jobs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-base border-b border-slate-100 pb-3">Document Processing Pipeline Queue</h3>
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active background processing jobs recorded.</p>
            ) : (
              jobs.map((j) => (
                <div key={j.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">Job #{j.id} • Doc #{j.document_id}</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">Status: <span className="text-[#2563EB]">{j.status}</span> ({j.stage_progress}%)</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{new Date(j.started_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-base border-b border-slate-100 pb-3">Security Audit Trail Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 uppercase text-[10px] font-extrabold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-900">{log.user_id ? `User #${log.user_id}` : 'System'}</td>
                    <td className="p-3 font-bold text-[#2563EB]">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.resource_type ? `${log.resource_type} #${log.resource_id}` : '-'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 border border-emerald-200 text-[#059669]' : 'bg-rose-50 border border-rose-200 text-[#DC2626]'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
