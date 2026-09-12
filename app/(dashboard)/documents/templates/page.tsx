'use client';

import React, { useState } from 'react';
import { FileText, Search, Plus, Layers, Sparkles, Mail, Grid as GridIcon, DollarSign, FileSpreadsheet, Briefcase, Settings } from 'lucide-react';
import { useToast } from '../ToastContext';
import { TemplateCardItem } from '@/hooks/useDocumentsApi';

const TEMPLATE_ITEMS: TemplateCardItem[] = [
  { title: 'Business plan', description: 'Full plan, AI-filled from your workspace.', category: 'BUSINESS', icon: 'FileText' },
  { title: 'One-pager', description: 'The whole company on a single page.', category: 'BUSINESS', icon: 'Layers' },
  { title: 'Executive summary', description: 'Two pages for a warm intro.', category: 'BUSINESS', icon: 'FileText' },
  { title: 'Pitch deck', description: 'Twelve slides in the order investors expect.', category: 'FUNDRAISING', icon: 'Sparkles' },
  { title: 'Investor update', description: 'Monthly update with metrics and asks.', category: 'FUNDRAISING', icon: 'Mail' },
  { title: 'Data room index', description: 'The folder structure investors look for.', category: 'FUNDRAISING', icon: 'GridIcon' },
  { title: 'Financial model', description: 'Three statements, 36 months.', category: 'FINANCE', icon: 'DollarSign' },
  { title: 'Invoice', description: 'Branded invoice with payment terms.', category: 'FINANCE', icon: 'FileText' },
  { title: 'Budget tracker', description: 'Budget against actuals by category.', category: 'FINANCE', icon: 'FileSpreadsheet' },
  { title: 'Meeting notes', description: 'Decisions, owners, and next steps.', category: 'OPERATIONS', icon: 'FileText' },
  { title: 'Job description', description: 'Role, scope, and comp band.', category: 'OPERATIONS', icon: 'Briefcase' },
  { title: 'Standard operating procedure', description: 'Write it once, delegate forever.', category: 'OPERATIONS', icon: 'Settings' },
];

export default function TemplatesPage() {
  const { triggerToast } = useToast();
  
  const getIcon = (iconStr: string) => {
    switch(iconStr) {
      case 'FileText': return <FileText size={16} className="text-[#183B28]" />;
      case 'Layers': return <Layers size={16} className="text-[#183B28]" />;
      case 'Sparkles': return <Sparkles size={16} className="text-[#183B28]" />;
      case 'Mail': return <Mail size={16} className="text-[#183B28]" />;
      case 'GridIcon': return <GridIcon size={16} className="text-[#183B28]" />;
      case 'DollarSign': return <DollarSign size={16} className="text-[#183B28]" />;
      case 'FileSpreadsheet': return <FileSpreadsheet size={16} className="text-[#183B28]" />;
      case 'Briefcase': return <Briefcase size={16} className="text-[#183B28]" />;
      case 'Settings': return <Settings size={16} className="text-[#183B28]" />;
      default: return <FileText size={16} className="text-[#183B28]" />;
    }
  };

  return (
<main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          <div>
            <h1 className="text-3xl font-display text-[#1C2621] tracking-tight mb-1">Templates</h1>
            <p className="text-xs text-[#738279]">Start from a structure that works, then let AI fill it with your data.</p>
          </div>

          {(['BUSINESS', 'FUNDRAISING', 'FINANCE', 'OPERATIONS'] as const).map((cat) => {
            const catTemplates = TEMPLATE_ITEMS.filter((t) => t.category === cat);
            return (
              <div key={cat} className="space-y-4">
                <h2 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catTemplates.map((tmpl, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-[#E8E8E2] rounded-modal p-6 shadow-card flex flex-col justify-between h-44 hover:border-[#D5DDD6] transition-all"
                    >
                      <div className="space-y-3">
                        <div className="w-7 h-7 rounded-full bg-[#E5EFEA] flex items-center justify-center">
                          {tmpl.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923]">{tmpl.title}</h3>
                          <p className="text-xs text-[#617065] mt-1 leading-relaxed">{tmpl.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerToast(`Creating a document from ${tmpl.title}.`)}
                        className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors self-start mt-4"
                      >
                        Use template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </main>
  );
}
