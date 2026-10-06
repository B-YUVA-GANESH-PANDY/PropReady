import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2, LayoutDashboard, FileText, Bot, 
  FileCheck, Users, Activity, Settings, LogOut, Cpu, Layers, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const userNav = [
    { name: 'Discover', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building2 },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Reports', path: '/reports', icon: FileCheck },
    { name: 'Profile', path: '/profile', icon: Settings },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'All Properties', path: '/admin/properties', icon: Building2 },
    { name: 'All Documents', path: '/admin/documents', icon: FileText },
    { name: 'Processing Jobs', path: '/admin/jobs', icon: Layers },
    { name: 'AI/RAG System', path: '/admin/monitoring', icon: Cpu },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside className="hidden md:flex w-64 bg-white text-slate-800 flex-col h-screen sticky top-0 border-r border-slate-200 z-30 font-sans shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center font-bold text-white shadow-md">
          <Building2 className="w-5 h-5 text-[#2563EB]" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tight text-[#0F172A]">PropReady</h1>
          <p className="text-[10px] text-[#0D9488] font-extrabold tracking-wider uppercase">Property Intelligence</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Role:</span>
        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
          isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#CCFBF1] text-[#0D9488] border border-[#0D9488]/30'
        }`}>
          {isAdmin ? 'ADMINISTRATOR' : 'PROPERTY USER'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* AI Indicator near bottom */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-2xl bg-[#EFF6FF] border border-[#2563EB]/20 flex items-center space-x-2.5">
        <div className="p-1.5 rounded-xl bg-[#2563EB] text-white">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-[#0F172A]">AI Intelligence Active</p>
          <p className="text-[10px] text-slate-500">Evidence Guard Protection</p>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="mb-3 px-3 py-2 rounded-2xl bg-white border border-slate-200 flex items-center space-x-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center font-bold text-xs text-white">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 truncate">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};
