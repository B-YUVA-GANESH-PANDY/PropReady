import React, { useState } from 'react';
import { User, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      await apiClient.put('/users/me', { full_name: fullName });
      setMsg("Profile details updated successfully.");
    } catch (error) {
      setErr("Failed to update profile details.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      await apiClient.put('/users/me/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setMsg("Password changed successfully.");
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      setErr(error.response?.data?.detail || "Failed to change security password.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[#2563EB] text-xs font-extrabold uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>USER PROFILE</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">Account & Security Settings</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage personal details and secure Argon2id authentication credentials.</p>
        </div>
        <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-md">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-[#059669] p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="bg-rose-50 border border-rose-200 text-[#DC2626] p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Account Info Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-extrabold text-[#0F172A] text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
          <User className="w-4 h-4 text-[#2563EB]" />
          <span>Personal Information</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Email Address (Read Only)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20"
          >
            Update Details
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-extrabold text-[#0F172A] text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-[#0D9488]" />
          <span>Security Credentials (Argon2id Enforced)</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl font-bold text-xs shadow-md"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};
