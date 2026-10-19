'use client';

import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import type { RawScript, ScriptQuestion } from '@/lib/api/validation';
import { MAX_SCRIPT_QUESTIONS, MAX_SCRIPT_TEXT, SCRIPT_HINT, moveItem, validateScriptDraft } from '@/lib/validation-format';

type Row = { key: string; id?: string; question: string; tip: string };

/**
 * Edits one saved script: title, reorderable questions with tips, add/remove.
 * Mount with `key={script.id}` so the draft resets when another script opens.
 * Save sends the whole ordered list and keeps existing question ids.
 */
export function ScriptEditor({
  script,
  onSave,
  onClose,
}: {
  script: RawScript;
  onSave: (body: { title: string; questions: ScriptQuestion[] }) => Promise<RawScript>;
  onClose: () => void;
}) {
  const counter = useRef(0);
  const [title, setTitle] = useState(script.title);
  const [rows, setRows] = useState<Row[]>(() =>
    script.questions.map((q) => ({ key: q.id, id: q.id, question: q.question, tip: q.tip }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const touch = () => {
    setSaved(false);
    setError(null);
  };
  const patch = (i: number, p: Partial<Row>) => {
    touch();
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...p } : row)));
  };
  const move = (from: number, to: number) => {
    touch();
    setRows((r) => moveItem(r, from, to));
  };
  const remove = (i: number) => {
    touch();
    setRows((r) => r.filter((_, idx) => idx !== i));
  };
  const add = () => {
    touch();
    counter.current += 1;
    setRows((r) => [...r, { key: `new-${counter.current}`, question: '', tip: '' }]);
  };

  const submit = async () => {
    const invalid = validateScriptDraft(title, rows);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const out = await onSave({
        title,
        questions: rows.map((r) => ({ ...(r.id ? { id: r.id } : {}), question: r.question, tip: r.tip })),
      });
      // Adopt server ids for newly added questions so a second save keeps them.
      setRows(out.questions.map((q) => ({ key: q.id, id: q.id, question: q.question, tip: q.tip })));
      setSaved(true);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not save the script. Try again.').message);
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full bg-white border border-sage-200 rounded-card px-3 py-2 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]';

  return (
    <section aria-label="Script editor" className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-display font-bold text-sage-900">Edit script</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-sage-600 hover:text-sage-900 cursor-pointer">
          Close
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="script-title" className="block text-xs font-semibold uppercase tracking-wider text-sage-500">
          Title
        </label>
        <input
          id="script-title"
          value={title}
          maxLength={200}
          onChange={(e) => {
            touch();
            setTitle(e.target.value);
          }}
          className={input}
        />
      </div>

      <p className="text-xs text-[#9C5B34] font-medium">Tip: {SCRIPT_HINT}</p>

      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={row.key} className="border border-sage-200 rounded-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-sage-500">Question {i + 1}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move question ${i + 1} up`}
                  className="p-1.5 rounded-input text-sage-600 hover:bg-sage-100 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === rows.length - 1}
                  aria-label={`Move question ${i + 1} down`}
                  className="p-1.5 rounded-input text-sage-600 hover:bg-sage-100 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove question ${i + 1}`}
                  className="p-1.5 rounded-input text-sage-400 hover:text-[#B0483B] hover:bg-sage-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </div>
            <textarea
              rows={3}
              aria-label={`Question ${i + 1} text`}
              value={row.question}
              maxLength={MAX_SCRIPT_TEXT}
              onChange={(e) => patch(i, { question: e.target.value })}
              className={`${input} resize-none`}
            />
            <input
              aria-label={`Question ${i + 1} interviewer tip`}
              placeholder="Interviewer tip"
              value={row.tip}
              maxLength={MAX_SCRIPT_TEXT}
              onChange={(e) => patch(i, { tip: e.target.value })}
              className={`${input} text-[#9C5B34]`}
            />
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={add}
        disabled={rows.length >= MAX_SCRIPT_QUESTIONS}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#183B28] hover:underline disabled:opacity-40 cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add question
      </button>

      {error && (
        <p role="alert" className="text-sm font-semibold text-[#B0483B]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-card text-sm inline-flex items-center gap-2 shadow-card cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save script'}
        </button>
        {saved && (
          <span role="status" className="text-sm font-semibold text-[#183B28]">
            Saved
          </span>
        )}
      </div>
    </section>
  );
}
