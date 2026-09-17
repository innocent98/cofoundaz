'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Sun,
  Diamond,
  Smile,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function BusinessBuilderOverviewPage() {
  const getProgressColor = (pct: number) => {
    if (pct === 100) return '#183B28';
    if (pct >= 60) return '#2D5A3F';
    if (pct >= 40) return '#8A5330';
    return '#B26B6B';
  };

  const modules = [
    {
      id: 'bmc',
      title: 'Business Model Canvas',
      description: 'The nine building blocks of how you create value.',
      progress: 80,
      path: '/business-builder/business-model-canvas',
      icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'lean',
      title: 'Lean Canvas',
      description: 'A one-page problem-to-solution snapshot.',
      progress: 60,
      path: '/business-builder/lean-canvas',
      icon: <LayoutGrid className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'mission',
      title: 'Mission & Vision',
      description: 'Why you exist and the world if you win.',
      progress: 100,
      path: '/business-builder/mission-vision',
      icon: <Sun className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'value-prop',
      title: 'Value Proposition',
      description: 'The fit between customer needs and what you offer.',
      progress: 70,
      path: '/business-builder/value-proposition',
      icon: <Diamond className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'personas',
      title: 'Customer Personas',
      description: 'Who you are building for, in detail.',
      progress: 50,
      path: '/business-builder/personas',
      icon: <Smile className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'pricing',
      title: 'Pricing Strategy',
      description: 'Your model and tiers, grounded in willingness to pay.',
      progress: 40,
      path: '/business-builder/pricing',
      icon: <span className="text-xs font-bold text-[#183B28]">₦</span>,
    },
    {
      id: 'revenue',
      title: 'Revenue Model',
      description: 'Where the money comes from and how much.',
      progress: 55,
      path: '/business-builder/revenue-model',
      icon: <TrendingUp className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'competitive',
      title: 'Competitive Analysis',
      description: 'Who else is out there and where you win.',
      progress: 65,
      path: '/business-builder/competitive-analysis',
      icon: <Target className="w-4 h-4 text-[#183B28]" />,
    },
    {
      id: 'swot',
      title: 'SWOT',
      description: 'Strengths, weaknesses, opportunities, threats.',
      progress: 35,
      path: '/business-builder/swot',
      icon: <ShieldAlert className="w-4 h-4 text-[#183B28]" />,
    },
  ];

  return (
    <>
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Business Builder
        </h2>
        <p className="text-xs text-[#768478] mt-1.5 max-w-xl">
          Define the business. Every artifact you finish here feeds your plan, your score, and your pitch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((card) => {
          const strokeColor = getProgressColor(card.progress);
          return (
            <Link
              key={card.id}
              href={card.path}
              className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6 hover:shadow-card transition-shadow group cursor-pointer block"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-modal bg-[#E6EFEA] flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>

                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#EBEBE6"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={
                          2 * Math.PI * 16 * (1 - card.progress / 100)
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-[#1E2923]">
                      {card.progress}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-[#1E2923] group-hover:text-[#183B28] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#768478] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-[#183B28] pt-2">
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
