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
      triggerToast(res.error || 'Could not create the document.', 'error');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Templates</h1>
        <p className="text-xs text-neutral-x738279">Start from a structure that works, create a document, then fill it in.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-modal h-44" />
          ))}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">No templates available</p>
          <p className="text-xs text-ink-subtle mt-1">Check back soon.</p>
        </div>
      )}

      {!loading &&
        CATEGORY_ORDER.map((cat) => {
          const catTemplates = templates.filter((t) => t.category === cat);
          if (catTemplates.length === 0) return null;
          return (
            <div key={cat} className="space-y-4">
              <h2 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catTemplates.map((tmpl) => (
                  <div
                    key={tmpl.key}
                    className="bg-white border border-line rounded-modal p-6 shadow-card flex flex-col justify-between h-44 hover:border-line-strong transition-all"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-xe5efea flex items-center justify-center">
                        <FileText size={16} className="text-brand-strong" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-ink">{tmpl.name}</h3>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{tmpl.description}</p>
                        {tmpl.sections.length > 0 && (
                          <p className="text-[10px] text-neutral-x9ca8a0 mt-1.5">{tmpl.sections.length} sections</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUse(tmpl.key, tmpl.name)}
                      disabled={creatingKey === tmpl.key}
                      className="text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors self-start mt-2 min-h-11 disabled:opacity-60"
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
