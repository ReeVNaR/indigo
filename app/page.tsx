"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key, ShieldCheck } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// --- Icons ---

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
  const [error, setError] = useState("");
  const router = useRouter();

  // Reset Password Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.');
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess(false);

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterKey, newPassword: newPassInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.error || 'Reset failed. Check your Master Key.');
        return;
      }

      setResetSuccess(true);
      setMasterKey("");
      setNewPassInput("");
      
      // Auto close after 2s
      setTimeout(() => setIsResetModalOpen(false), 2000);
    } catch (err) {
      console.error(err);
      setResetError('Reset failed. Connection error.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-denim">
      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#fdfbf7] rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[500px] sm:min-h-[550px]">

        {/* Selvedge Strip on Left */}
        <div className="absolute left-[8px] sm:left-[12px] top-0 bottom-0 z-20 h-full flex items-center justify-center w-[8px] sm:w-[12px]">
          <div className="h-full w-[1px] sm:w-[2px] bg-red-500 mx-[2px] opacity-90 box-border border-r border-l border-red-700"></div>
          <div className="h-full border-l border-dashed border-gray-300 opacity-50 absolute right-[-2px] sm:right-[-4px]"></div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col items-center px-6 sm:px-10 py-8 sm:py-10 pl-12 sm:pl-16 pt-10 sm:pt-16">

          {/* Logo & Header */}
          <div className="mb-4 sm:mb-2 flex flex-col items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#131b2e] flex items-center justify-center mb-4 sm:mb-6 shadow-lg border border-amber-100/20 overflow-hidden">
              <img src="/Logo.png" alt="Dadashri Designers" className="w-full h-full object-contain scale-105" />
            </div>

            <h1 className="text-center leading-[1.2] mb-2">
              <span className="font-bold text-4xl sm:text-3xl text-[#131c3f]">Dadashri Designers</span>
            </h1>
            <p className="text-orange-500 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase mb-4 opacity-90">
              COUTURE • FASHION • QUALITY
            </p>
            <div className="w-16 h-[1px] bg-orange-400/30 mb-4 sm:mb-8"></div>
          </div>

          {/* Login Form */}
          <form className="w-full space-y-4 sm:space-y-5" onSubmit={handleLogin}>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-lg text-center animate-in fade-in slide-in-from-top-1 duration-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-1">
              <Label htmlFor="email" className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block ml-0.5">
                USERNAME / EMAIL
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <UserIcon />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-6 sm:py-3 border-gray-200 rounded-lg text-sm transition-all bg-white shadow-sm focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-1">
              <div className="flex justify-between items-end">
                <Label htmlFor="password" className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block ml-0.5">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-600 transition-colors uppercase tracking-wide outline-none focus:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <LockIcon />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-6 sm:py-3 border-gray-200 rounded-lg text-sm transition-all bg-white shadow-sm focus-visible:ring-amber-500/20 focus-visible:border-amber-500 tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2 sm:pt-4 pb-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-5 sm:py-3 bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 shadow-md font-bold uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed h-auto"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <span className="w-4 h-4 flex items-center mr-2"><ArrowRightIcon /></span>
                )}
                {loading ? 'AUTHENTICATING...' : 'ENTER WORKSHOP'}
              </Button>
            </div>

          </form>

        </div>
      </div>

      {/* Footer outside card */}
      <div className="mt-8 relative z-10 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300 px-4 text-center">
        <VerifiedIcon />
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-wide uppercase font-mono">
          EST. 2026 • CRAFTED FOR ELEGANCE
        </p>
      </div>

      {/* Forgot Password Reset Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-stone-100 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <form onSubmit={handleResetPassword}>
            <DialogHeader className="px-6 py-5 border-b border-stone-50 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-[#131c3f] uppercase tracking-tight">Recover Access</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Use your Master Reset Key</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-5">
              {resetError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wide">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wide flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Password Updated Successfully!
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="masterKey" className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block ml-0.5">
                  Master Security Key
                </Label>
                <Input
                  id="masterKey"
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full px-4 py-3 border-stone-100 bg-stone-50 rounded-xl text-sm font-bold text-[#131c3f] focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-gray-300"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-50">
                <Label htmlFor="newPassInput" className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block ml-0.5">
                  New Admin Password
                </Label>
                <Input
                  id="newPassInput"
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-4 py-3 border-stone-100 bg-stone-50 rounded-xl text-sm font-bold text-[#131c3f] focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-gray-300"
                  placeholder="Minimum 4 characters"
                  required
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-stone-50 border-t border-stone-100 sm:justify-center">
              <Button
                type="submit"
                disabled={resetLoading || resetSuccess}
                className="w-full sm:w-64 bg-[#131c3f] hover:bg-black text-white py-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg disabled:opacity-50"
              >
                {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm New Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
