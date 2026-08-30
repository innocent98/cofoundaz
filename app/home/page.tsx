'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';

const testimonials = [
  {
    quote: "“It feels like having a co-founder, a lawyer, and a CFO in one place. I stopped guessing and started shipping.”",
    initials: "AN",
    name: "Amara Nwosu",
    role: "Kolo, savings for gig workers",
  },
  {
    quote: "“The daily mission is the first thing I open. Small wins, every day, and the Health Score kept climbing.”",
    initials: "DK",
    name: "Daniel Kariuki",
    role: "Shamba, agri-logistics",
  },
  {
    quote: "“We built our data room and closed our pre-seed in six weeks. Investors noticed how organized we were.”",
    initials: "FA",
    name: "Fatima Adeyemi",
    role: "Payflow, B2B payments",
  },
];

function MarketingHomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate testimonials every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="min-h-screen bg-[#F2F6F3] text-[#12291F] font-body scroll-smooth">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="pt-12 pb-24 px-2 md:px-4 lg:px-6 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D5E0DA] bg-[#E9F0EC] text-xs font-medium text-[#2C4A3E]">
              <span className="w-2 h-2 rounded-full bg-[#9C5B34]" />
              AI operating system for founders
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-[68px] font-semibold text-[#12291F] tracking-tight leading-[1.08]">
              The co-founder who never sleeps.
            </h1>

            <p className="text-lg md:text-xl text-[#3A5247] leading-relaxed max-w-xl font-normal">
              Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.
            </p>

            <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <Link
                href="/signup"
                className="bg-[#9C5B34] hover:bg-[#8A5330] text-[#12291F] font-semibold text-base px-7 py-3.5 rounded-card shadow-card transition-all text-center"
              >
                Start free
              </Link>
              <a
                href="#how-it-works"
                className="bg-white hover:bg-sage-50 text-[#12291F] font-medium text-base px-7 py-3.5 rounded-card border border-[#D5E0DA] shadow-card transition-colors text-center"
              >
                See how it works
              </a>
            </div>

            <p className="text-xs text-[#627D72] italic pt-1">
              No credit card required.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-modal bg-[#0F2D24] shadow-raised border border-[#1B4B38] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#0C241D] border-b border-[#183B30]">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4E7A6B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3D6357]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2E4D43]" />
                </div>
                <div className="text-xs text-[#7A9C90] font-body">
                  app.cofoundaz.com/dashboard
                </div>
                <div className="w-12" />
              </div>

              <div className="flex min-h-[460px]">
                <div className="w-16 bg-[#0C241D] p-3 flex flex-col items-center space-y-3 border-r border-[#183B30]">
                  <div className="w-9 h-9 rounded-input bg-[#1B4B38] flex items-center justify-center font-display text-[#9C5B34] font-bold text-sm">
                    C
                  </div>
                  <div className="w-9 h-9 rounded-input bg-[#183B30]/60" />
                  <div className="w-9 h-9 rounded-input bg-[#183B30]/40" />
                  <div className="w-9 h-9 rounded-input bg-[#183B30]/40" />
                  <div className="w-9 h-9 rounded-input bg-[#183B30]/40" />
                </div>

                <div className="flex-1 bg-[#F5F8F6] p-6 text-[#12291F] flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[#12291F]">
                      Good morning, Amara.
                    </h3>
                    <p className="text-xs text-[#526E63] mt-0.5">
                      Here&apos;s where Kolo stands today.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 bg-white p-5 rounded-modal border border-[#E3EBE7] shadow-card flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold tracking-wider text-[#688277] uppercase mb-2">
                        Startup Health
                      </span>
                      
                      <div className="relative w-28 h-28 flex items-center justify-center my-1">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-[#E3EBE7]"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#1B4B38]"
                            strokeDasharray="72, 100"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-display text-3xl font-bold text-[#12291F]">72</span>
                          <span className="text-[10px] font-medium text-[#2E6B52]">+4 this week</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                      <div className="bg-white p-4 rounded-modal border border-[#E3EBE7] shadow-card">
                        <span className="text-[10px] font-bold tracking-wider text-[#688277] uppercase block mb-2.5">
                          Today&apos;s Mission
                        </span>
                        <div className="space-y-2 text-xs text-[#2C4A3E]">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-[#1B4B38] text-white flex items-center justify-center text-[10px]">✓</div>
                            <span className="line-through text-[#7A9C90]">Interview 3 gig workers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-[#A8C2B7]" />
                            <span>Draft your Lean Canvas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-[#A8C2B7]" />
                            <span>Set your pricing tiers</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3.5 rounded-card border border-[#E3EBE7] shadow-card">
                          <span className="text-[10px] font-bold tracking-wider text-[#688277] uppercase block">Runway</span>
                          <span className="font-display text-xl font-bold text-[#12291F] mt-1 block">8.4 mo</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-card border border-[#E3EBE7] shadow-card">
                          <span className="text-[10px] font-bold tracking-wider text-[#688277] uppercase block">Monthly Revenue</span>
                          <span className="font-display text-xl font-bold text-[#12291F] mt-1 block">₦1.6M</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#12291F] text-white p-3.5 rounded-card flex items-center gap-3 border border-[#1F4235] shadow-card">
                    <div className="w-6 h-6 rounded-input bg-[#9C5B34] flex items-center justify-center shrink-0">
                      <span className="text-xs text-[#12291F]">✦</span>
                    </div>
                    <p className="text-xs text-[#D8E5DF] font-normal leading-tight">
                      Your riskiest untested assumption is pricing. Want an experiment for it?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="bg-white py-24 px-2 md:px-4 lg:px-6 border-t border-[#E3EBE7]">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl lg:text-[52px] font-semibold text-center text-[#12291F] tracking-tight leading-[1.15] max-w-2xl mx-auto">
            Building a startup shouldn&apos;t feel like guessing.
          </h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-modal border border-[#E3EBE7] shadow-card flex flex-col justify-between hover:border-[#C8D9D1] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-6">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-body text-xl font-bold text-[#12291F] tracking-tight">
                  Scattered everywhere
                </h3>
                <p className="mt-3 text-base text-[#4A6357] leading-relaxed font-normal">
                  Your plan is in a doc, your numbers in a sheet, your tasks in your head. Nothing connects.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-modal border border-[#E3EBE7] shadow-card flex flex-col justify-between hover:border-[#C8D9D1] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-6">
                  <span className="font-semibold text-lg leading-none">₦</span>
                </div>
                <h3 className="font-body text-xl font-bold text-[#12291F] tracking-tight">
                  Advice is expensive
                </h3>
                <p className="mt-3 text-base text-[#4A6357] leading-relaxed font-normal">
                  Lawyers, accountants, and marketers charge by the hour, exactly when you have the least to spend.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-modal border border-[#E3EBE7] shadow-card flex flex-col justify-between hover:border-[#C8D9D1] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-6">
                  <span className="font-semibold text-lg leading-none">?</span>
                </div>
                <h3 className="font-body text-xl font-bold text-[#12291F] tracking-tight">
                  What do I do next?
                </h3>
                <p className="mt-3 text-base text-[#4A6357] leading-relaxed font-normal">
                  Every day starts with a hundred options and no clear priority.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-[#12291F] text-white py-20 px-2 md:px-4 lg:px-6">
        <div className="max-w-[1440px] mx-auto text-center">
          <span className="text-xs font-semibold tracking-widest text-[#9C5B34] uppercase block mb-2.5">
            How It Works
          </span>

          <h2 className="font-display text-3xl md:text-4xl lg:text-4xl font-semibold text-white tracking-tight leading-snug max-w-2xl mx-auto">
            One workspace. One score. One next step.
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
            <div className="bg-[#1B382C] p-8 rounded-modal border border-[#234738] flex flex-col justify-between hover:border-[#2D5A47] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#9C5B34] text-[#12291F] font-bold text-base flex items-center justify-center mb-6">
                  1
                </div>
                <h3 className="font-body text-xl font-bold text-white tracking-tight">
                  Tell us about your startup
                </h3>
                <p className="mt-3 text-base text-[#A1B8AD] leading-relaxed font-normal">
                  A 10 minute assessment calibrates your roadmap, your Health Score, and every AI advisor to your exact stage and industry.
                </p>
              </div>
            </div>

            <div className="bg-[#1B382C] p-8 rounded-modal border border-[#234738] flex flex-col justify-between hover:border-[#2D5A47] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#9C5B34] text-[#12291F] font-bold text-base flex items-center justify-center mb-6">
                  2
                </div>
                <h3 className="font-body text-xl font-bold text-white tracking-tight">
                  Meet your AI Co-Founder
                </h3>
                <p className="mt-3 text-base text-[#A1B8AD] leading-relaxed font-normal">
                  Ask anything. It routes your question to the right specialist across legal, finance, marketing, sales, and fundraising, with full context on your business.
                </p>
              </div>
            </div>

            <div className="bg-[#1B382C] p-8 rounded-modal border border-[#234738] flex flex-col justify-between hover:border-[#2D5A47] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#9C5B34] text-[#12291F] font-bold text-base flex items-center justify-center mb-6">
                  3
                </div>
                <h3 className="font-body text-xl font-bold text-white tracking-tight">
                  Do today&apos;s mission
                </h3>
                <p className="mt-3 text-base text-[#A1B8AD] leading-relaxed font-normal">
                  Every morning, get the 1 to 3 highest-leverage actions. Complete them, build your streak, watch your Health Score climb.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EVERYTHING CONNECTED (PRODUCT) SECTION */}
      <section id="product" className="bg-white py-24 px-2 md:px-4 lg:px-6 border-t border-[#E3EBE7]">
        <div className="max-w-[1440px] mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-4xl font-semibold text-[#12291F] tracking-tight leading-snug max-w-3xl mx-auto">
            Everything a founder juggles, connected.
          </h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l-8 8h16l-8-8zM12 20l8-8H4l8 8z" />
                  </svg>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Startup Health Score
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  An explainable 0 to 100 read on your whole business.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <span className="text-base font-medium">✦</span>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  AI Co-Founder
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Ten specialist advisors behind one chat.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <span className="text-base font-semibold">→</span>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Stage-based Roadmap
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  From idea to scale, re-planned when life happens.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Business Builder
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Canvases to a full business plan in minutes.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <span className="text-base font-bold">✓</span>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Validation Hub
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Test assumptions before you spend.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <span className="font-semibold text-base">₦</span>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Finance Hub
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Runway, forecasts, and invoices without a spreadsheet.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <div className="w-3.5 h-3.5 rotate-45 bg-[#1B4B38] rounded-xs" />
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Funding Hub
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Data room, cap table, grants, and investor pipeline.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-modal border border-[#E3EBE7] shadow-card hover:border-[#C8D9D1] transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1B4B38] flex items-center justify-center mb-5">
                  <span className="text-base font-bold">★</span>
                </div>
                <h3 className="font-body text-lg font-bold text-[#12291F] tracking-tight">
                  Marketplace
                </h3>
                <p className="mt-2 text-sm text-[#4A6357] leading-relaxed font-normal">
                  Vetted human experts when AI is not enough.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIAL SECTION */}
      <section className="bg-[#12291F] text-white py-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-white">
            Founders are building faster.
          </h2>

          <blockquote className="font-display italic text-2xl md:text-3xl lg:text-4xl text-[#E3EBE7] leading-relaxed max-w-3xl mx-auto font-normal transition-all duration-300 min-h-[120px] flex items-center justify-center">
            {currentTestimonial.quote}
          </blockquote>

          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-[#2A5242] text-[#9C5B34] font-semibold text-sm flex items-center justify-center border border-[#3D6B57]">
              {currentTestimonial.initials}
            </div>
            <div className="text-left">
              <div className="font-body font-bold text-sm text-white">
                {currentTestimonial.name}
              </div>
              <div className="text-xs text-[#8BA89B]">
                {currentTestimonial.role}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#9C5B34]' : 'bg-[#2A5242]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. DATA PRIVACY & SECURITY SECTION (ABOUT) */}
      <section id="about" className="bg-[#F2F6F3] py-16 px-4 md:px-6 lg:px-8 border-t border-[#E3EBE7]">
        <div className="max-w-[1440px] mx-auto">
          <div className="bg-[#EAF0EC] border border-[#D5E0DA] rounded-modal p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <div className="w-10 h-10 rounded-card bg-[#1B4B38] flex items-center justify-center text-[#9C5B34]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#12291F] tracking-tight">
                  Your startup&apos;s data is yours.
                </h2>

                <p className="text-base text-[#3A5247] leading-relaxed font-normal">
                  Isolated workspaces, encryption in transit and at rest, granular sharing controls, and a full audit trail.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-card border border-[#E3EBE7] shadow-card">
                  <h3 className="font-body text-sm font-bold text-[#12291F]">
                    Isolated workspaces
                  </h3>
                  <p className="mt-1 text-xs text-[#526E63] leading-relaxed">
                    Tenant-isolated data with row-level policies.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-card border border-[#E3EBE7] shadow-card">
                  <h3 className="font-body text-sm font-bold text-[#12291F]">
                    Encrypted throughout
                  </h3>
                  <p className="mt-1 text-xs text-[#526E63] leading-relaxed">
                    In transit and at rest, always.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-card border border-[#E3EBE7] shadow-card">
                  <h3 className="font-body text-sm font-bold text-[#12291F]">
                    Granular sharing
                  </h3>
                  <p className="mt-1 text-xs text-[#526E63] leading-relaxed">
                    Control access per document and per role.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-card border border-[#E3EBE7] shadow-card">
                  <h3 className="font-body text-sm font-bold text-[#12291F]">
                    Full audit trail
                  </h3>
                  <p className="mt-1 text-xs text-[#526E63] leading-relaxed">
                    Every sensitive action is logged.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="bg-[#0D221A] text-white py-24 px-4 md:px-6 lg:px-8 text-center border-b border-[#18382B]">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-display text-4xl md:text-5xl lg:text-[56px] font-semibold text-white tracking-tight leading-tight">
            Stop guessing. Start building.
          </h2>

          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-block bg-[#9C5B34] hover:bg-[#8A5330] text-[#12291F] font-semibold text-base px-8 py-3.5 rounded-card shadow-card transition-all"
            >
              Start free
            </Link>
          </div>

          <p className="text-sm text-[#8BA89B] italic pt-1 font-body">
            Set up in under 10 minutes.
          </p>
        </div>
      </section>

      {/* 8. FOOTER SECTION */}
      <footer className="bg-[#0D221A] text-white pt-16 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#18382B]">
            
            {/* Brand column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-input bg-[#1B4B38] flex items-center justify-center font-display text-[#9C5B34] font-bold text-sm">
                  C
                </div>
                <span className="font-display text-xl font-semibold text-white tracking-tight">
                  Cofoundaz
                </span>
              </div>
              <p className="text-sm text-[#8BA89B] max-w-sm leading-relaxed">
                The AI operating system that takes founders from idea to profitability.
              </p>
            </div>

            {/* Links column 1: Product */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-bold tracking-wider text-white uppercase block">
                PRODUCT
              </span>
              <ul className="space-y-2.5 text-sm text-[#8BA89B]">
                <li><a href="#product" className="hover:text-white transition-colors">Overview</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>

            {/* Links column 2: Company */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-bold tracking-wider text-white uppercase block">
                COMPANY
              </span>
              <ul className="space-y-2.5 text-sm text-[#8BA89B]">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="mailto:support@cofoundaz.com" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Links column 3: Legal */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-xs font-bold tracking-wider text-white uppercase block">
                LEGAL
              </span>
              <ul className="space-y-2.5 text-sm text-[#8BA89B]">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#627D72]">
            <p>© 2026 Cofoundaz. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <a href="#" className="hover:text-white transition-colors" aria-label="X (Twitter)">
                𝕏
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                in
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default MarketingHomePage;