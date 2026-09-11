'use client';

import React, { useState } from 'react';
import { Copy, Eye, AlertTriangle } from 'lucide-react';

const mockTemplates = [
  { id: 't1', title: 'B2B SaaS Pre-Seed', tasks: 28, description: 'Standard roadmap to get a B2B SaaS product from idea to your first 10 paying customers.' },
  { id: 't2', title: 'Marketplace Seed', tasks: 34, description: 'Dual-sided validation, liquidity focus, and core platform build.' },
  { id: 't3', title: 'Hardware MVP', tasks: 45, description: 'Prototyping, BOM, supplier sourcing, and initial manufacturing run.' },
  { id: 't4', title: 'D2C Consumer Brand', tasks: 22, description: 'Brand identity, formulation, packaging, and Shopify launch.' },
];

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null);

  const applyTemplate = () => {
    // In a real app, this calls an API to merge template data
    alert('Template applied successfully!');
    setSelectedTemplate(null);
  };

  return (
    <>
      <div className="flex flex-col gap-8 h-full">
        <div>
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
            Template Gallery
          </h2>
          <p className="text-xs text-[#617065] mt-1.5">
            Don&apos;t start from scratch. Apply battle-tested roadmaps for your specific vertical.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.map(t => (
            <div key={t.id} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 flex flex-col justify-between gap-6 group hover:border-[#C5CFC7] transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="bg-[#F5F5F0] text-[#617065] text-[10px] font-bold px-2 py-1 rounded border border-[#EBEBE6] uppercase tracking-wider">
                    {t.tasks} Tasks
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-[#1E2923]">{t.title}</h3>
                <p className="text-xs text-[#768478] leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button 
                  className="flex-1 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] text-xs font-bold py-2.5 rounded-card transition-colors flex justify-center items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button 
                  onClick={() => setSelectedTemplate(t)}
                  className="flex-1 bg-[#183B28] hover:bg-[#11291C] text-white text-xs font-bold py-2.5 rounded-card transition-colors shadow-sm flex justify-center items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Apply template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div 
            className="bg-white rounded-modal max-w-sm w-full p-6 shadow-2xl relative flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-[#FDF2F2] rounded-full flex items-center justify-center border-4 border-[#FAD7D7]">
                <AlertTriangle className="w-6 h-6 text-[#B0483B]" />
              </div>
              <h3 className="text-xl font-display font-bold text-[#1E2923]">Merge this template?</h3>
              <p className="text-sm text-[#617065] leading-relaxed">
                Applying <span className="font-bold text-[#1E2923]">{selectedTemplate.title}</span> merges its tasks into your roadmap. 
                <br/><br/>
                <span className="font-semibold text-[#B0483B]">Nothing currently on your roadmap gets deleted.</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={applyTemplate}
                className="w-full bg-[#B0483B] hover:bg-[#993A2E] text-white font-bold py-3 rounded-card transition-colors shadow-sm"
              >
                Confirm & Merge
              </button>
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="w-full bg-transparent hover:bg-[#F5F5F0] text-[#768478] font-bold py-3 rounded-card transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
