'use client';

import React, { useState } from 'react';
import { Copy, Eye, CheckCircle2, X, Layers } from 'lucide-react';
import {
  useRoadmapTemplates,
  RoadmapTemplateSummary,
  RoadmapTemplateDetail,
} from '@/hooks/useRoadmapTemplates';

export default function TemplatesPage() {
  const { templates, loading, error, getTemplate, applyTemplate } = useRoadmapTemplates();

  const [preview, setPreview] = useState<RoadmapTemplateDetail | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [confirmTpl, setConfirmTpl] = useState<RoadmapTemplateSummary | null>(null);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openPreview = async (id: string) => {
    setPreviewLoadingId(id);
    setActionError(null);
    const detail = await getTemplate(id);
    setPreviewLoadingId(null);
    if (detail) setPreview(detail);
    else setActionError('Could not load that template preview.');
  };

  const confirmApply = async () => {
    if (!confirmTpl) return;
    setApplying(true);
    setActionError(null);
    setResult(null);
    try {
      const res = await applyTemplate(confirmTpl.id);
      if (res.already_applied) {
        setResult(`"${confirmTpl.title}" is already applied — nothing changed.`);
      } else {
        const { phases, milestones, tasks } = res.added;
        setResult(
          `Applied "${confirmTpl.title}" — added ${phases} phase${phases === 1 ? '' : 's'}, ${milestones} milestone${milestones === 1 ? '' : 's'}, ${tasks} task${tasks === 1 ? '' : 's'}.`
        );
      }
      setConfirmTpl(null);
    } catch {
      setActionError('Could not apply that template. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8 h-full">
        <div>
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">Template Gallery</h2>
          <p className="text-xs text-[#617065] mt-1.5">
            Don&apos;t start from scratch. Layer a battle-tested roadmap pack onto your existing plan.
          </p>
        </div>

        {result && (
          <div className="bg-[#EAF2ED] border border-[#CDE1D3] rounded-card p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D5A3F] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-[#2D5A3F] leading-snug">{result}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-card p-3 text-xs font-semibold text-[#B0483B]">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-52 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-4 text-sm text-[#B0483B]">{error}</div>
        )}

        {!loading && !error && templates.length === 0 && (
          <p className="text-sm text-[#768478] italic">No templates available.</p>
        )}

        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 flex flex-col justify-between gap-6 group hover:border-[#C5CFC7] transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-[#F5F5F0] text-[#617065] text-[10px] font-bold px-2 py-1 rounded border border-[#EBEBE6] uppercase tracking-wider">
                      {t.category}
                    </span>
                    {t.applied && (
                      <span className="flex items-center gap-1 bg-[#EAF2ED] text-[#2D5A3F] text-[10px] font-bold px-2 py-1 rounded border border-[#CDE1D3]">
                        <CheckCircle2 className="w-3 h-3" /> Applied
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#1E2923]">{t.title}</h3>
                  {t.stage && (
                    <span className="w-fit bg-[#EAF2ED] text-[#2D5A3F] text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {t.stage} stage
                    </span>
                  )}
                  <p className="text-xs text-[#768478] leading-relaxed">
                    {t.milestone_count} milestone{t.milestone_count === 1 ? '' : 's'} · {t.task_count} task{t.task_count === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => openPreview(t.id)}
                    disabled={previewLoadingId === t.id}
                    className="flex-1 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] text-xs font-bold py-2.5 rounded-card transition-colors flex justify-center items-center gap-1.5 disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {previewLoadingId === t.id ? 'Loading…' : 'Preview'}
                  </button>
                  <button
                    onClick={() => { setConfirmTpl(t); setActionError(null); }}
                    className="flex-1 bg-[#183B28] hover:bg-[#11291C] text-white text-xs font-bold py-2.5 rounded-card transition-colors shadow-card flex justify-center items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t.applied ? 'Re-apply' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-modal max-w-lg w-full shadow-accent relative flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#EBEBE6] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#183B28]" />
                <h3 className="font-bold text-[#1E2923]">{preview.title}</h3>
              </div>
              <button onClick={() => setPreview(null)} className="p-1 text-[#768478] hover:text-[#1E2923] hover:bg-[#EBEBE6] rounded-input transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <p className="text-xs text-[#768478]">
                Applying adds {preview.milestone_count} milestone{preview.milestone_count === 1 ? '' : 's'} and {preview.task_count} task{preview.task_count === 1 ? '' : 's'} across {preview.phases.length} phase{preview.phases.length === 1 ? '' : 's'}. Nothing existing is removed.
              </p>
              {preview.phases.map((phase, pi) => (
                <div key={pi} className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#617065] uppercase tracking-wider">{phase.name}</h4>
                  {phase.milestones.map((ms, mi) => (
                    <div key={mi} className="pl-3 border-l-2 border-[#EBEBE6] flex flex-col gap-2">
                      <span className="text-sm font-bold text-[#1E2923]">{ms.title}</span>
                      <ul className="flex flex-col gap-1">
                        {ms.tasks.map((task, ti) => (
                          <li key={ti} className="flex items-center justify-between gap-2 text-xs text-[#556358] bg-[#F7F7F5] rounded px-3 py-1.5 border border-[#EBEBE6]">
                            <span>{task.title}</span>
                            <span className="text-[10px] font-bold text-[#768478] uppercase capitalize">{task.effort}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-[#EBEBE6] bg-[#FBFBFA] flex gap-3">
              <button onClick={() => setPreview(null)} className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors">Close</button>
              <button
                onClick={() => { const t = templates.find((x) => x.id === preview.id) ?? null; setPreview(null); setConfirmTpl(t); }}
                className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#11291C] text-white rounded-card text-sm font-bold transition-colors"
              >
                Apply this pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply confirmation modal */}
      {confirmTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !applying && setConfirmTpl(null)}>
          <div className="bg-white rounded-modal max-w-sm w-full p-6 shadow-accent relative flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-[#EAF2ED] rounded-full flex items-center justify-center border-4 border-[#CDE1D3]">
                <Copy className="w-6 h-6 text-[#2D5A3F]" />
              </div>
              <h3 className="text-xl font-display font-bold text-[#1E2923]">
                {confirmTpl.applied ? 'Re-apply this template?' : 'Apply this template?'}
              </h3>
              <p className="text-sm text-[#617065] leading-relaxed">
                <span className="font-bold text-[#1E2923]">{confirmTpl.title}</span> adds {confirmTpl.milestone_count} milestone{confirmTpl.milestone_count === 1 ? '' : 's'} and {confirmTpl.task_count} task{confirmTpl.task_count === 1 ? '' : 's'} to your roadmap.
                {confirmTpl.applied
                  ? ' It’s already applied, so this is a safe no-op.'
                  : ' Nothing currently on your roadmap gets removed.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={confirmApply}
                disabled={applying}
                className="w-full bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-bold py-3 rounded-card transition-colors shadow-card"
              >
                {applying ? 'Applying…' : 'Confirm & apply'}
              </button>
              <button
                onClick={() => setConfirmTpl(null)}
                disabled={applying}
                className="w-full bg-transparent hover:bg-[#F5F5F0] text-[#768478] font-bold py-3 rounded-card transition-colors disabled:opacity-60"
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
