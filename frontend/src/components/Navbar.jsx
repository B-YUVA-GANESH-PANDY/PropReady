import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, Cpu, User, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ title = "Discover" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchModal(false);
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs font-sans">
        {/* Left: Mobile Profile/Menu Icon & Title */}
        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="md:hidden w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F172A] font-bold text-xs shadow-xs"
          >
            {user?.full_name?.charAt(0) || <User className="w-4 h-4 text-[#0F172A]" />}
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight">{title}</h1>
              <span className="text-[10px] font-bold bg-[#CCFBF1] text-[#0D9488] px-2 py-0.5 rounded-full border border-[#0D9488]/30 hidden sm:inline-block">
                PROPREADY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Understand your property with confidence.</p>
          </div>
        </div>

        {/* Right: Search, Notifications, User Badge */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 md:px-3 md:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center space-x-2 text-xs font-medium transition-colors"
            title="Search property or document"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline text-slate-500">Search property...</span>
          </button>

          <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 relative transition-colors">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full"></span>
          </button>

          <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{user?.full_name}</p>
              <p className="text-[10px] text-[#0D9488] font-semibold">Verified User</p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                  <Search className="w-4 h-4 text-[#2563EB]" />
                  <span>Property & Document Intelligence Search</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type property title, survey number, seller, or document type..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
