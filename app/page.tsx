"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Icons ---

const ScissorsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const VerifiedIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-gray-500 mr-2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// --- Page Component ---

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Connect to Supabase Auth
      // const { error } = await supabase.auth.signInWithPassword({ email, password });

      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));

      // For now, allow entry to demonstrate flow until Supabase is active
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-denim">
      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#fdfbf7] rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[550px]">

        {/* Selvedge Strip on Left */}
        <div className="absolute left-[12px] top-0 bottom-0 z-20 h-full flex items-center justify-center w-[12px]">
          <div className="h-full w-[2px] bg-red-500 mx-[2px] opacity-90 box-border border-r border-l border-red-700"></div>
          <div className="h-full border-l border-dashed border-gray-300 opacity-50 absolute right-[-4px]"></div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col items-center px-10 py-10 pl-16 pt-16">

          {/* Logo & Header */}
          <div className="mb-2 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#131b2e] flex items-center justify-center mb-6 shadow-lg border border-amber-100/20 overflow-hidden">
              <img src="/Logo.png" alt="Dadashri Designers" className="w-full h-full object-contain scale-105" />
            </div>

            <h1 className="text-center leading-tight mb-2">
              <span className="font-bold text-4xl block text-[#131c3f] font-medium">Dadashri Designers</span>
            </h1>
            <p className="text-orange-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 opacity-90">
              COUTURE • FASHION • QUALITY
            </p>
            <div className="w-16 h-[1px] bg-orange-400/30 mb-8"></div>
          </div>

          {/* Login Form */}
          <form className="w-full space-y-5" onSubmit={handleLogin}>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block ml-0.5">
                USERNAME / EMAIL
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm hover:border-gray-300"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label htmlFor="password" className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block ml-0.5">
                  Password
                </label>
                <a href="#" className="text-[11px] font-bold text-orange-400 hover:text-orange-600 transition-colors uppercase tracking-wide">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm hover:border-gray-300 tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all transform active:scale-[0.98] uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : (
                  <span className="w-4 h-4 flex items-center"><ArrowRightIcon /></span>
                )}
                {loading ? 'AUTHENTICATING...' : 'ENTER WORKSHOP'}
              </button>
            </div>

          </form>


        </div>
      </div>

      {/* Footer outside card */}
      <div className="mt-8 relative z-10 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300">
        <VerifiedIcon />
        <p className="text-[11px] font-medium text-slate-300 tracking-wide uppercase font-mono">
          EST. 2026 • CRAFTED FOR ELEGANCE
        </p>
      </div>

    </div>
  );
}
