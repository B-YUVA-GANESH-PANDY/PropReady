import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, Bot, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const navItems = [
    { name: 'Discover', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building2 },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 px-3 py-2 shadow-lg font-sans">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[#2563EB] font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-transparent'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
