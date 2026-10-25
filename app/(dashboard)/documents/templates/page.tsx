'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Scale } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { TEMPLATE_CATEGORIES } from '@/lib/api/documents';
import { btnSecondary } from '@/components/documents/ui';

export default function TemplatesPage() {
  const { templates, loading, error, refetch } = useDocumentTemplates();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Templates</h1>
        <p className="text-xs text-neutral-x738279">Pick a template, check what we filled in for you, and let AI draft the rest.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" aria-label="Loading templates">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-modal h-44" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">Could not load the templates</p>
          <p className="text-xs text-ink-subtle mt-1">Check your connection and try again.</p>
          <button type="button" onClick={() => void refetch()} className={`${btnSecondary} mt-4`}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">No templates available</p>
          <p className="text-xs text-ink-subtle mt-1">There are no templates for your workspace yet.</p>
        </div>
      )}

      {!loading &&
        TEMPLATE_CATEGORIES.map((cat) => {
          const catTemplates = templates.filter((t) => t.category === cat);
          if (catTemplates.length === 0) return null;
          return (
            <section key={cat} className="space-y-4" aria-label={`${cat} templates`}>
              <h2 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catTemplates.map((tmpl) => (
                  <div
                    key={tmpl.key}
                    className="bg-white border border-line rounded-modal p-6 shadow-card flex flex-col justify-between min-h-44 gap-3 hover:border-line-strong transition-all"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-xe5efea flex items-center justify-center">
                        {tmpl.disclaimer ? <Scale size={16} className="text-brand-strong" /> : <FileText size={16} className="text-brand-strong" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-ink">{tmpl.name}</h3>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{tmpl.description}</p>
                        <p className="text-[10px] text-neutral-x9ca8a0 mt-1.5">
                          {tmpl.sections.length} sections{tmpl.disclaimer ? ' · Draft, not legal advice' : ''}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/documents/templates/${encodeURIComponent(tmpl.key)}`}
                      aria-label={`Use the ${tmpl.name} template`}
                      className="text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors self-start inline-flex items-center min-h-11"
                    >
                      Use template →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
    </main>
  );
}
