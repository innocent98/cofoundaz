'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { useToast } from '../ToastContext';
import { useDocumentTemplates, TemplateCategory } from '@/hooks/useDocumentTemplates';

const CATEGORY_ORDER: TemplateCategory[] = ['BUSINESS', 'FUNDRAISING', 'FINANCE', 'OPERATIONS'];

export default function TemplatesPage() {
  const { triggerToast } = useToast();
  const router = useRouter();
  const { templates, loading, creatingKey, createFromTemplate } = useDocumentTemplates();

  const handleUse = async (key: string, name: string) => {
    const res = await createFromTemplate(key);
    if (res.ok) {
      triggerToast(`Created “${res.title || name}”.`);
      router.push('/documents');
    } else {
      triggerToast(res.error || 'Could not create the document.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-display text-[#1C2621] tracking-tight mb-1">Templates</h1>
        <p className="text-xs text-[#738279]">Start from a structure that works — create a document, then fill it in.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E8E8E2] rounded-modal h-44" />
          ))}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="bg-white border border-[#E8E8E2] rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-[#1E2923]">No templates available</p>
          <p className="text-xs text-[#8E9B90] mt-1">Check back soon.</p>
        </div>
      )}

      {!loading &&
        CATEGORY_ORDER.map((cat) => {
          const catTemplates = templates.filter((t) => t.category === cat);
          if (catTemplates.length === 0) return null;
          return (
            <div key={cat} className="space-y-4">
              <h2 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catTemplates.map((tmpl) => (
                  <div
                    key={tmpl.key}
                    className="bg-white border border-[#E8E8E2] rounded-modal p-6 shadow-card flex flex-col justify-between h-44 hover:border-[#D5DDD6] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-full bg-[#E5EFEA] flex items-center justify-center">
                        <FileText size={16} className="text-[#183B28]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-[#1E2923]">{tmpl.name}</h3>
                        <p className="text-xs text-[#617065] mt-1 leading-relaxed">{tmpl.description}</p>
                        {tmpl.sections.length > 0 && (
                          <p className="text-[10px] text-[#9CA8A0] mt-1.5">{tmpl.sections.length} sections</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUse(tmpl.key, tmpl.name)}
                      disabled={creatingKey === tmpl.key}
                      className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors self-start mt-4 disabled:opacity-60"
                    >
                      {creatingKey === tmpl.key ? 'Creating…' : 'Use template →'}
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
