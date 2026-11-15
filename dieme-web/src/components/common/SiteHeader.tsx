'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';

interface SiteHeaderProps {
  onSelectProgram?: (programId: number) => void;
}

export function SiteHeader({ onSelectProgram }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-[#06080D]/85 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Official Dieme Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <DigicastBrandLogo size="md" />
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-300">
          <Link href="/#hero" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="hover:text-emerald-400 transition-colors">
            Pricing Passes
          </Link>
          <Link href="/#why-dieme" className="hover:text-emerald-400 transition-colors">
            Why Dieme
          </Link>
          <Link href="/#about-us" className="hover:text-emerald-400 transition-colors">
            About Us
          </Link>
          <Link href="/#faq" className="hover:text-emerald-400 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Right Action Button */}
        <div className="hidden sm:flex items-center">
          <Link
            href="/login"
            prefetch={false}
            className="px-6 py-2 rounded-full text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-emerald-500/40 hover:text-emerald-300 shadow-sm"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0D15] border-b border-white/10 px-6 py-4 space-y-1 text-sm font-medium animate-in slide-in-from-top-4 duration-300">
          <Link href="/#hero" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-white hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-slate-300 hover:text-emerald-400 transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-slate-300 hover:text-emerald-400 transition-colors">
            Pricing Passes
          </Link>
          <Link href="/#why-dieme" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-slate-300 hover:text-emerald-400 transition-colors">
            Why Dieme
          </Link>
          <Link href="/#about-us" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-slate-300 hover:text-emerald-400 transition-colors">
            About Us
          </Link>
          <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-slate-300 hover:text-emerald-400 transition-colors">
            FAQ
          </Link>
          <div className="pt-3 pb-2 border-t border-white/10">
            <Link
              href="/login"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 transition shadow-lg shadow-emerald-400/20 active:scale-[0.98]"
            >
              Sign In to Studio
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
