'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b border-sage-100 transition-all duration-200 ${
        isScrolled ? 'shadow-card' : ''
      }`}
    >
      {/* Container with minimal horizontal padding (px-2 on mobile, px-4/px-6 on desktop) */}
      <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-2 md:px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">

          {/* Logo + Navigation Links Group */}
          <div className="flex items-center gap-8 md:gap-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-card bg-[#1B4B38] flex items-center justify-center shadow-card">
                <span className="font-display text-[#9C5B34] font-bold text-lg leading-none">C</span>
              </div>
              <span className="font-display text-2xl font-semibold text-[#12291F] tracking-tight">
                Cofoundaz
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-7">
              <a
                href="#product"
                className="text-[#33413B] hover:text-[#12291F] transition-colors text-[15px] font-normal"
              >
                Product
              </a>
              <a
                href="#pricing"
                className="text-[#33413B] hover:text-[#12291F] transition-colors text-[15px] font-normal"
              >
                Pricing
              </a>

              {/* Resources Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  onBlur={() => setTimeout(() => setResourcesOpen(false), 200)}
                  className="flex items-center gap-1.5 text-[#33413B] hover:text-[#12291F] transition-colors text-[15px] font-normal focus:outline-none cursor-pointer"
                >
                  <span>Resources</span>
                  <svg
                    className={`w-3 h-3 text-[#33413B] transition-transform duration-200 ${
                      resourcesOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {resourcesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-input bg-white shadow-raised border border-sage-100 py-2 z-50">
                    <a
                      href="#blog"
                      className="block px-4 py-2 text-sm text-[#33413B] hover:bg-sage-50 hover:text-[#12291F]"
                    >
                      Blog
                    </a>
                    <a
                      href="#guides"
                      className="block px-4 py-2 text-sm text-[#33413B] hover:bg-sage-50 hover:text-[#12291F]"
                    >
                      Guides & Tools
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#about"
                className="text-[#33413B] hover:text-[#12291F] transition-colors text-[15px] font-normal"
              >
                About
              </a>
            </nav>
          </div>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/login"
              className="text-[#1B4B38] hover:text-[#12291F] text-[15px] font-medium transition-colors"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold text-[15px] px-5 py-2.5 rounded-card shadow-card transition-all active:scale-[0.98]"
            >
              Start free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="text-[#12291F] focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-sage-100 px-4 pt-2 pb-6 space-y-3">
          <a
            href="#product"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#33413B] hover:text-[#12291F] py-2 text-base font-normal"
          >
            Product
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#33413B] hover:text-[#12291F] py-2 text-base font-normal"
          >
            Pricing
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#33413B] hover:text-[#12291F] py-2 text-base font-normal"
          >
            About
          </a>
          <div className="pt-4 border-t border-sage-100 space-y-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center text-[#1B4B38] py-2 text-base font-medium"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-[#9C5B34] text-white font-semibold py-2.5 rounded-card shadow-card"
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}