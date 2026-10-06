import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Lock, Mail, Eye, EyeOff, AlertCircle, 
  ArrowRight, FileText, Sparkles, ShieldCheck, Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DocumentScan } from '../components/animations/DocumentScan';
import { PropertyImage } from '../components/PropertyImage';
import { PROPERTY_IMAGES } from '../utils/propertyImages';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center relative overflow-hidden font-sans text-slate-800">
      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">

          {/* LEFT COLUMN: Brand & Product Visual Section */}
          <div className="lg:col-span-7 space-y-8 hidden md:block">
            {/* Logo / Wordmark */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-[#0F172A]">PropReady</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488] border border-[#0D9488]/30">
                  Property Intelligence
                </span>
              </div>
            </div>

            {/* Headline & Description */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
                Property intelligence, <br />
                <span className="text-[#2563EB]">backed by evidence.</span>
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed max-w-lg font-medium">
                Analyze property documents, trace ownership history, identify inconsistencies, and understand property risks with AI-assisted document intelligence.
              </p>
            </div>

            {/* Hero Image Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-xl h-64 bg-slate-900 max-w-lg group transition-all">
              <PropertyImage
                src={PROPERTY_IMAGES.document}
                alt="PropReady Property Document Intelligence"
                fallbackType="document"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="bg-[#0F172A]/85 backdrop-blur-md text-[#CCFBF1] text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-[#0D9488]/40 shadow-xs flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                  <span>OCR EXTRACT • SALE DEED & KHATA</span>
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[10px] font-extrabold text-[#93C5FD] uppercase tracking-wider">PROPERTY DOCUMENT INTELLIGENCE</p>
                <p className="font-extrabold text-sm text-white">Deed OCR Scanning, Title Chain & Risk Audit</p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 max-w-lg pt-1 text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                <span>AI OCR Pipeline</span>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>Evidence Backed</span>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Light Editorial Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-7 sm:p-9 w-full space-y-6">

              {/* Mobile Header */}
              <div className="flex items-center space-x-2.5 md:hidden">
                <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                </div>
                <span className="text-xl font-black text-[#0F172A]">PropReady</span>
              </div>

              {/* Heading */}
              <div>
                <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Welcome back</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Sign in to continue your property intelligence workspace.</p>
              </div>

              {/* Error Banner */}
              {error && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-[#DC2626] text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-extrabold text-[#0F172A] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-extrabold text-[#0F172A]">
                      Password
                    </label>
                    <a 
                      href="#forgot" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        alert('Password reset: Please contact system administrator.'); 
                      }} 
                      className="text-xs font-bold text-[#2563EB] hover:text-blue-700 transition-colors"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 font-medium cursor-pointer select-none">
                      Remember me on this device
                    </label>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Create Account Link */}
              <div className="pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-extrabold text-[#2563EB] hover:text-blue-700">
                    Create account
                  </Link>
                </p>
              </div>

              {/* Security Indicator */}
              <div className="pt-2 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Protected by RAG Context Guard & Argon2id.</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
