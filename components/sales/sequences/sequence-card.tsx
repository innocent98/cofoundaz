'use client';

import React, { useId, useRef, useState } from 'react';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useStepDraft } from '@/hooks/useSalesSequences';
import {
  MAX_STEPS,
  MAX_WAIT_DAYS,
  MERGE_TAGS,
  STEP_LIMIT_MESSAGE,
  archiveSequence,
  createSequence,
  previewTemplate,
  replyRateLabel,
  salesErrorMessage,
  salesFieldErrors,
  unknownTags,
  updateSequence,
  waitLabel,
  type MergeTag,
  type Sequence,
  type SequenceStep,
} from '@/lib/api/sales';
import { BTN_ACCENT, BTN_DANGER, BTN_SECONDARY, ConfirmDialog, INPUT } from '../shared';
import { EnrollmentsPanel } from './enrollments-panel';

interface StepForm {
  key: number;
  wait_days: string;
  subject: string;
  body: string;
}

const SAMPLE: Record<MergeTag, string> = { first_name: 'Ada', last_name: 'Test', company: 'Acme', sender_name: 'You' };
const BLANK: Record<MergeTag, string> = { first_name: '', last_name: '', company: '', sender_name: '' };

let nextKey = 1;
const toForm = (s: SequenceStep): StepForm => ({ key: nextKey++, wait_days: String(s.wait_days), subject: s.subject, body: s.body });

/** Starter copy for a brand-new sequence, so the first save is valid and shows how tags work. */
const STARTER: SequenceStep[] = [
  {
    wait_days: 0,
    subject: 'Quick idea for {{company}}',
    body: 'Hi {{first_name}},\n\nI had an idea that could help {{company}}. Open to a short chat this week?\n\n{{sender_name}}',
  },
];

function parseDays(v: string): number | null {
  if (!/^\d+$/.test(v.trim())) return null;
  const n = Number(v);
  return n >= 0 && n <= MAX_WAIT_DAYS ? n : null;
}

/**
 * One sequence: name, steps, "stop when the deal moves stage", pause / archive, and its people.
 * `sequence` is null for a new, unsaved sequence. The card is keyed by id + updated_at so a save or a
 * reload resets the form to what the server holds.
 */
export function SequenceCard({
  sequence,
  onSaved,
  onDiscardNew,
  onChanged,
}: {
  sequence: Sequence | null;
  onSaved: (seq: Sequence) => void;
  onDiscardNew?: () => void;
  onChanged: () => void;
}) {
  const { runAction, triggerToast } = useToast();
  const isNew = sequence === null;
  const [name, setName] = useState(sequence?.name ?? '');
  const [stopOnStage, setStopOnStage] = useState(sequence?.stop_on_stage_change ?? false);
  const [steps, setSteps] = useState<StepForm[]>(() => (sequence?.steps ?? STARTER).map(toForm));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [aiFor, setAiFor] = useState<number | null>(null);
  const [aiNote, setAiNote] = useState('');
  const [aiError, setAiError] = useState<{ key: number; message: string } | null>(null);
  const focus = useRef<{ key: number; field: 'subject' | 'body' } | null>(null);
  const fields = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());
  const nameId = useId();
  const stageId = useId();
  const draft = useStepDraft(sequence?.id ?? '');

  const saved = sequence?.steps ?? [];
  const dirty =
    isNew ||
    name.trim() !== sequence.name ||
    stopOnStage !== sequence.stop_on_stage_change ||
    steps.length !== saved.length ||
    steps.some((s, i) => s.wait_days !== String(saved[i].wait_days) || s.subject !== saved[i].subject || s.body !== saved[i].body);

  const setStep = (key: number, patch: Partial<StepForm>) => setSteps((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const insertTag = (tag: MergeTag) => {
    const target = focus.current ?? { key: steps[0].key, field: 'body' as const };
    const el = fields.current.get(`${target.key}:${target.field}`);
    const text = `{{${tag}}}`;
    const step = steps.find((s) => s.key === target.key);
    if (!step || !el) return;
    const current = step[target.field];
    const at = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? at;
    setStep(target.key, { [target.field]: current.slice(0, at) + text + current.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(at + text.length, at + text.length);
    });
  };

  const validate = (): { ok: true; payload: SequenceStep[] } | { ok: false; errs: Record<string, string> } => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name this sequence.';
    if (steps.length < 1 || steps.length > MAX_STEPS) errs.steps = STEP_LIMIT_MESSAGE;
    const payload: SequenceStep[] = [];
    steps.forEach((s, i) => {
      const days = parseDays(s.wait_days);
      if (days === null) errs[`steps.${i}.wait_days`] = `Enter a whole number of days, 0 to ${MAX_WAIT_DAYS}.`;
      if (!s.subject.trim()) errs[`steps.${i}.subject`] = 'Add a subject.';
      if (!s.body.trim()) errs[`steps.${i}.body`] = 'Write the email.';
      const bad = [...unknownTags(s.subject), ...unknownTags(s.body)];
      if (bad.length) {
        const msg = `Unknown merge tag {{${bad[0]}}}. Use first_name, last_name, company, sender_name.`;
        if (unknownTags(s.subject).length) errs[`steps.${i}.subject`] = msg;
        else errs[`steps.${i}.body`] = msg;
      }
      payload.push({ wait_days: days ?? 0, subject: s.subject.trim(), body: s.body.trim() });
    });
    return Object.keys(errs).length ? { ok: false, errs } : { ok: true, payload };
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (!v.ok) {
      setErrors(v.errs);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const input = { name: name.trim(), steps: v.payload, stop_on_stage_change: stopOnStage };
      const result = isNew ? await createSequence(input) : await updateSequence(sequence.id, input);
      triggerToast(isNew ? 'Sequence created' : 'Sequence saved');
      onSaved(result);
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const discard = () => {
    if (isNew) return onDiscardNew?.();
    setName(sequence.name);
    setStopOnStage(sequence.stop_on_stage_change);
    setSteps(sequence.steps.map(toForm));
    setErrors({});
  };

  const togglePause = async () => {
    if (isNew) return;
    const next = sequence.status === 'paused' ? 'active' : 'paused';
    setBusy(true);
    const res = await runAction(
      () => updateSequence(sequence.id, { status: next }),
      next === 'paused' ? 'Sequence paused' : 'Sequence resumed'
    );
    setBusy(false);
    if (res.ok) onSaved(res.value);
  };

  const archive = async () => {
    if (isNew) return;
    setBusy(true);
    const res = await runAction(() => archiveSequence(sequence.id), 'Sequence archived');
    setBusy(false);
    setConfirmArchive(false);
    if (res.ok) onChanged();
  };

  const writeWithAi = async (index: number, key: number) => {
    setAiError(null);
    const out = await draft.write(index, aiNote.trim() || undefined);
    if (!out) return;
    if (out.kind === 'ready') {
      setStep(key, { subject: out.draft.subject ?? '', body: out.draft.body ?? '' });
      setAiFor(null);
      setAiNote('');
      triggerToast('Draft added. Review it, then save.');
    } else {
      setAiError({ key, message: out.kind === 'slow' ? 'The AI is taking longer than usual. Try again in a moment.' : out.message });
    }
  };

  return (
    <form onSubmit={save} noValidate className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-sage-100">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={nameId} className="sr-only">
            Sequence name
          </label>
          <input
            id={nameId}
            value={name}
            maxLength={120}
            placeholder="Name this sequence"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            className="w-full text-xl md:text-2xl font-display font-bold text-sage-900 bg-transparent border-b border-transparent hover:border-sage-200 focus:border-sage-400 outline-none"
          />
          {errors.name && (
            <p role="alert" className="text-xs text-red-700">
              {errors.name}
            </p>
          )}
          {sequence && (
            <span className="text-sm text-sage-500 font-medium block">
              {sequence.active_enrollments} active · {sequence.total_enrollments} enrolled · {replyRateLabel(sequence.reply_rate)}
              {sequence.status === 'paused' ? ' · Paused' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-sage-50/50 border border-sage-200 rounded-card p-3">
          <div className="flex items-center gap-2" title="You press Mark replied on a person to stop their emails">
            <input type="checkbox" checked disabled readOnly className="rounded border-sage-300 text-[#1e4836]" id={`${stageId}-reply`} />
            <label htmlFor={`${stageId}-reply`} className="text-sm text-sage-600 font-medium cursor-not-allowed">
              Stop when they reply (press Mark replied)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={stopOnStage}
              onChange={(e) => setStopOnStage(e.target.checked)}
              className="rounded border-sage-300 text-[#1e4836] focus:ring-[#1e4836] cursor-pointer"
              id={stageId}
            />
            <label htmlFor={stageId} className="text-sm text-sage-700 font-medium cursor-pointer">
              Stop when deal moves stage
            </label>
          </div>
        </div>
      </div>

      {errors.steps && (
        <p role="alert" className="text-sm text-red-700">
          {errors.steps}
        </p>
      )}

      <div className="space-y-6 pt-2">
        {steps.map((step, i) => {
          const subjectRendered = previewTemplate(step.subject, BLANK).trim();
          const usesEmptyable = /\{\{\s*(company|last_name)\s*\}\}/.test(step.subject);
          const subjectErr = errors[`steps.${i}.subject`];
          const bodyErr = errors[`steps.${i}.body`];
          const daysErr = errors[`steps.${i}.wait_days`];
          const canAi = !isNew && i < saved.length;
          return (
            <div key={step.key} className="bg-[#f7f9f8] rounded-card p-4 md:p-6 border border-sage-200/70 flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="w-8 h-8 rounded-input bg-[#e2ede6] text-[#1e4836] font-display font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#d2e2d8]">
                {i + 1}
              </div>
              <div className="space-y-3 flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={`days-${step.key}`} className="text-xs text-sage-500 font-bold uppercase tracking-wider">
                      Wait (days)
                    </label>
                    <input
                      id={`days-${step.key}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_WAIT_DAYS}
                      value={step.wait_days}
                      onChange={(e) => setStep(step.key, { wait_days: e.target.value })}
                      aria-invalid={!!daysErr}
                      className="text-sm font-medium bg-white border border-sage-200 rounded px-2 py-1 w-20"
                    />
                    <span className="text-xs text-sage-500">{parseDays(step.wait_days) !== null ? waitLabel(Number(step.wait_days), i === 0) : ''}</span>
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-sage-500 hover:text-red-700 cursor-pointer"
                      aria-label={`Remove step ${i + 1}`}
                      onClick={() => setSteps((all) => all.filter((s) => s.key !== step.key))}
                    >
                      Remove step
                    </button>
                  )}
                </div>
                {daysErr && (
                  <p role="alert" className="text-xs text-red-700">
                    {daysErr}
                  </p>
                )}

                <div className="space-y-2">
                  <label htmlFor={`subject-${step.key}`} className="text-xs font-bold text-sage-500 uppercase tracking-wider block">
                    Subject
                  </label>
                  <input
                    id={`subject-${step.key}`}
                    ref={(el) => {
                      if (el) fields.current.set(`${step.key}:subject`, el);
                    }}
                    value={step.subject}
                    maxLength={300}
                    onFocus={() => (focus.current = { key: step.key, field: 'subject' })}
                    onChange={(e) => setStep(step.key, { subject: e.target.value })}
                    aria-invalid={!!subjectErr}
                    className="w-full font-display font-bold text-sage-900 text-base border border-sage-300 rounded-input px-3 py-2 bg-white focus:outline-none focus:border-sage-500"
                  />
                  {subjectErr && (
                    <p role="alert" className="text-xs text-red-700">
                      {subjectErr}
                    </p>
                  )}
                  {usesEmptyable && !subjectErr && (
                    <p className="text-xs text-copper-800">
                      If a contact has no company or last name, a missing value is left out, so this subject goes out as &ldquo;{subjectRendered || '(empty)'}&rdquo;.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`body-${step.key}`} className="text-xs font-bold text-sage-500 uppercase tracking-wider block">
                      Body
                    </label>
                    <button
                      type="button"
                      disabled={!canAi || draft.busyStep !== null}
                      title={canAi ? undefined : 'Save the sequence first, then the AI can write this step'}
                      onClick={() => {
                        setAiFor(aiFor === step.key ? null : step.key);
                        setAiError(null);
                      }}
                      className="text-xs font-bold text-[#9C5B34] flex items-center gap-1 hover:text-[#8A5330] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span aria-hidden="true">✨</span> Write with AI
                    </button>
                  </div>
                  {aiFor === step.key && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        aria-label="What should this email say? (optional)"
                        placeholder="What should this email say? (optional)"
                        value={aiNote}
                        maxLength={500}
                        onChange={(e) => setAiNote(e.target.value)}
                        className={`${INPUT} flex-1 min-w-[200px]`}
                      />
                      <button type="button" className={BTN_ACCENT} disabled={draft.busyStep !== null} onClick={() => void writeWithAi(i, step.key)}>
                        {draft.busyStep === i ? 'Writing...' : 'Write'}
                      </button>
                    </div>
                  )}
                  {aiError?.key === step.key && (
                    <p role="alert" className="text-xs text-red-700">
                      {aiError.message}
                    </p>
                  )}
                  <textarea
                    id={`body-${step.key}`}
                    ref={(el) => {
                      if (el) fields.current.set(`${step.key}:body`, el);
                    }}
                    value={step.body}
                    rows={5}
                    onFocus={() => (focus.current = { key: step.key, field: 'body' })}
                    onChange={(e) => setStep(step.key, { body: e.target.value })}
                    aria-invalid={!!bodyErr}
                    className="w-full text-sm text-sage-700 font-medium leading-relaxed border border-sage-300 rounded-input px-3 py-2 bg-white focus:outline-none focus:border-sage-500"
                  />
                  {bodyErr && (
                    <p role="alert" className="text-xs text-red-700">
                      {bodyErr}
                    </p>
                  )}
                  {previewing && (
                    <div className="rounded-card border border-sage-200 bg-white p-3 text-sm text-sage-700 whitespace-pre-wrap">
                      <p className="font-semibold text-sage-900">{previewTemplate(step.subject, SAMPLE)}</p>
                      {previewTemplate(step.body, SAMPLE)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1" aria-label="Merge tags">
                    {MERGE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTag(tag)}
                        className="text-[10px] bg-sage-200 text-sage-700 px-2 py-0.5 rounded font-bold uppercase cursor-pointer hover:bg-sage-300 transition-colors"
                      >
                        {`{{${tag}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={BTN_SECONDARY}
          disabled={steps.length >= MAX_STEPS}
          onClick={() => setSteps((all) => [...all, toForm({ wait_days: 3, subject: '', body: '' })])}
        >
          + Add step
        </button>
        <button type="button" className={BTN_SECONDARY} aria-pressed={previewing} onClick={() => setPreviewing((p) => !p)}>
          {previewing ? 'Hide preview' : 'Preview with a sample contact'}
        </button>
        {steps.length >= MAX_STEPS && <span className="text-xs text-sage-500">{STEP_LIMIT_MESSAGE}</span>}
      </div>

      <div className="pt-4 border-t border-sage-100 flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">🔒</span>
        <div className="text-xs text-sage-500 font-medium leading-relaxed">
          <span className="text-sage-700 font-bold block mb-0.5">Compliance note</span>
          Every email ends with your startup name and an unsubscribe link, and you cannot edit that footer. Anyone who unsubscribes or bounces is removed from every sequence and cannot be enrolled again.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={BTN_ACCENT} disabled={busy || !dirty}>
          {busy ? 'Saving...' : isNew ? 'Create sequence' : 'Save changes'}
        </button>
        {(dirty || isNew) && (
          <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={discard}>
            {isNew ? 'Cancel' : 'Discard changes'}
          </button>
        )}
        {sequence && (
          <>
            <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => void togglePause()}>
              {sequence.status === 'paused' ? 'Resume sequence' : 'Pause sequence'}
            </button>
            <button type="button" className={BTN_SECONDARY} aria-expanded={showPeople} onClick={() => setShowPeople((s) => !s)}>
              {showPeople ? 'Hide people' : `People (${sequence.total_enrollments})`}
            </button>
            <button type="button" className={BTN_DANGER} disabled={busy} onClick={() => setConfirmArchive(true)}>
              Archive
            </button>
          </>
        )}
      </div>

      {sequence && showPeople && (
        <EnrollmentsPanel sequenceId={sequence.id} stepCount={sequence.step_count} onChanged={onChanged} />
      )}

      {confirmArchive && sequence && (
        <ConfirmDialog
          title={`Archive ${sequence.name}?`}
          body={
            sequence.active_enrollments > 0
              ? `${sequence.active_enrollments} ${sequence.active_enrollments === 1 ? 'person is' : 'people are'} still being emailed. They are stopped and no more steps go out.`
              : 'It leaves your list. Nobody is being emailed from it right now.'
          }
          confirmLabel="Archive sequence"
          cancelLabel="Keep it"
          danger
          busy={busy}
          onConfirm={() => void archive()}
          onCancel={() => setConfirmArchive(false)}
        />
      )}
    </form>
  );
}
