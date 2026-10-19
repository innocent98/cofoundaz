'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage, writeMessage } from '@/hooks/useBusinessRecords';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { ArtifactHeader } from '@/components/business-builder/artifact-header';
import { ExportButton } from '@/components/business-builder/export-button';
import { PricingEditor } from '@/components/business-builder/pricing-editor';
import { PricingAdvisor } from '@/components/business-builder/pricing-advisor';
import { useRecordThreads } from '@/hooks/useRecordThreads';
import { adviceToRecord, competitorPriceRows, latestEdit } from '@/lib/bb-records';
import type { PricingAdvice } from '@/lib/api/business-builder';

const KIND = 'pricing';
const FALLBACK_MODELS = ['subscription', 'one_time', 'usage', 'freemium', 'tiered'];

export default function PricingPage() {
  const { triggerToast } = useToast();
  const { records, fields, loading, error, access, create, update, remove, refetch } = useBusinessRecords(KIND);
  const competitors = useBusinessRecords('competitors');
  const { canWrite, suggestMode } = access;
  const threads = useRecordThreads(records.map((r) => r.id));
  const edit = latestEdit(records);
  const [creating, setCreating] = useState(false);

  const modelOptions = fields.find((f) => f.key === 'model_type')?.choices ?? FALLBACK_MODELS;

  const save = async (id: string | null, data: { model_type: string; tiers: unknown[] }) => {
    const outcome = id ? await update(id, data) : await create(data);
    triggerToast(writeMessage(outcome, id ? 'Pricing updated' : 'Pricing added'));
    if (!id) setCreating(false);
  };

  const handleDelete = async (id: string, model: string) => {
    const label = model.replace(/_/g, ' ');
    if (!window.confirm(suggestMode ? `Suggest deleting the ${label} pricing model?` : `Delete the ${label} pricing model? This cannot be undone.`)) return;
    try {
      triggerToast(writeMessage(await remove(id), 'Pricing deleted'));
    } catch (err) {
      triggerToast(errMessage(err) || 'Could not delete pricing');
    }
  };

  // "Apply" writes through the same CRUD: update the existing model, or create the first one.
  const applyAdvice = async (advice: PricingAdvice) => {
    const body = adviceToRecord(advice);
    const first = records[0];
    if (first) await update(first.id, body);
    else await create(body);
    toast.success('Pricing advice applied');
  };

  const showNew = canWrite && creating;

  return (
    <div className="flex flex-col gap-6">
      <ArtifactHeader
        title="Pricing strategy"
        updatedAt={edit.updatedAt}
        updatedBy={edit.updatedBy}
        actions={
          <>
            <AiDraftButton kind={KIND} label="Draft with AI" onFilled={refetch} />
            <ExportButton target={{ kind: KIND }} />
            {canWrite && !creating && (
              <button
                onClick={() => setCreating(true)}
                className="bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
              >
                <Plus className="w-3.5 h-3.5" /><span>{suggestMode ? 'Suggest a pricing model' : 'Add pricing model'}</span>
              </button>
            )}
          </>
        }
      />

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-56 animate-pulse" />}

      {!loading && error && (
        <div className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4 text-sm text-[#A34B4B]">{error}</div>
      )}

      {!loading && !error && records.length === 0 && !showNew && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] text-[#183B28] flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2923]">No pricing model yet</p>
          <p className="text-xs text-[#768478] max-w-xs">Choose a model and lay out your tiers, what each costs and what&apos;s included. The advisor below can suggest a starting point.</p>
          {canWrite && (
            <button onClick={() => setCreating(true)} className="mt-1 flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>{suggestMode ? 'Suggest your pricing model' : 'Add your pricing model'}</span>
            </button>
          )}
        </div>
      )}

      {showNew && (
        <PricingEditor
          record={null}
          modelOptions={modelOptions}
          canWrite={canWrite}
          suggestMode={suggestMode}
          onSave={(data) => save(null, data)}
          onCancel={() => setCreating(false)}
        />
      )}

      {!loading && records.length > 0 && (
        <div className="flex flex-col gap-6">
          {records.map((rec) => (
            <PricingEditor
              key={`${rec.id}:${rec.updated_at ?? ''}`}
              record={rec}
              modelOptions={modelOptions}
              canWrite={canWrite}
              suggestMode={suggestMode}
              headerExtras={
                <>
                  {threads.button(rec.id, 'this pricing model')}
                  {canWrite && (
                    <button onClick={() => handleDelete(rec.id, String(rec.data.model_type || 'this'))} className="p-1.5 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors" aria-label="Delete pricing model">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              }
              onSave={(data) => save(rec.id, data)}
            />
          ))}
        </div>
      )}

      {!competitors.loading && (
        <PricingAdvisor initialPrices={competitorPriceRows(competitors.records)} hasPricing={records.length > 0} onApply={applyAdvice} />
      )}

      {threads.drawer}
    </div>
  );
}
