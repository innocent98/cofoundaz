"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLegalApi, TemplateItem } from "@/hooks/useLegalApi";
import { X, Wand2 } from "lucide-react";

export default function TemplatesPage() {
  const { ndaTemplates, employmentTemplates, fundraisingTemplates, ipAssignmentTemplates } = useLegalApi();
  const router = useRouter();

  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);

  const handleGenerateDraft = () => {
    // Navigate directly to the review tab (in a real app, we'd pass state/ID)
    router.push("/legal/review");
  };

  const TemplateGrid = ({ title, templates }: { title: string, templates: TemplateItem[] }) => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#9C5B34]">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-modal border border-sage-200/90 p-5 shadow-card flex flex-col justify-between gap-4">
            <div>
              <h4 className="font-semibold text-base text-sage-900">{template.title}</h4>
              <p className="text-sm text-sage-600 mt-0.5">{template.description}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="bg-[#e2ede6] text-[#1e4836] text-xs font-medium px-2.5 py-1 rounded-full">{template.badge}</span>
              <button
                onClick={() => setActiveTemplate(template)}
                className="text-xs font-semibold text-sage-900 hover:text-[#9C5B34] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Use template</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Contract templates</h1>
        <p className="text-sm text-sage-600">Standardized, jurisdiction-aware templates for everyday use.</p>
      </div>

      <TemplateGrid title="NDAs" templates={ndaTemplates} />
      <TemplateGrid title="Employment & Contractors" templates={employmentTemplates} />
      <TemplateGrid title="Fundraising" templates={fundraisingTemplates} />
      <TemplateGrid title="IP Assignment" templates={ipAssignmentTemplates} />

      {/* PARAMETER DRAWER OVERLAY */}
      {activeTemplate && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] animate-fadeIn"
            onClick={() => setActiveTemplate(null)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] border-l border-sage-200 flex flex-col animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-sage-100">
              <h2 className="text-xl font-display font-bold text-sage-900">{activeTemplate.title}</h2>
              <button 
                onClick={() => setActiveTemplate(null)}
                className="p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-[#e2ede6] text-[#1e4836] text-sm p-4 rounded-card font-medium">
                Fill in the core parameters. The AI will generate a tailored draft for you to review.
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Counterparty Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Effective Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Governing Law</label>
                  <select 
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                    defaultValue={activeTemplate.badge}
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Delaware, USA">Delaware, USA</option>
                    <option value="England & Wales">England & Wales</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Additional Context</label>
                  <textarea 
                    rows={4}
                    placeholder="Any specific terms to include..."
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-sage-100 bg-sage-50/50">
              <button
                onClick={handleGenerateDraft}
                className="w-full bg-[#1e3b30] hover:bg-[#152a22] text-white font-semibold py-3 px-4 rounded-card transition-colors flex items-center justify-center gap-2 shadow-card"
              >
                <Wand2 className="w-4 h-4" />
                Generate draft
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
