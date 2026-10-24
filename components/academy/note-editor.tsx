'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getNote, learningErrorMessage, saveNote } from '@/lib/api/learning';
import { useResource } from '@/hooks/useLearning';

const MAX = 20000;

function Editor({ lessonId, initial, initialUpdatedAt }: { lessonId: string; initial: string; initialUpdatedAt: string | null }) {
  const [body, setBody] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(initialUpdatedAt ? 'saved' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const save = useCallback(
    async (text: string) => {
      setState('saving');
      try {
        await saveNote(lessonId, text);
        setState('saved');
        setError(null);
      } catch (err) {
        setState('error');
        setError(learningErrorMessage(err));
      }
    },
    [lessonId],
  );

  const onChange = (text: string) => {
    setBody(text);
    setState('idle');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(text), 800);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <textarea
        aria-label="Private notes"
        value={body}
        maxLength={MAX}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot down key takeaways for this lesson. Only you can see these notes."
        className="min-h-48 w-full flex-1 resize-none rounded-card border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 focus:border-brand-700 focus:outline-none"
      />
      <p className="text-xs text-neutral-600" role="status" aria-live="polite">
        {state === 'saving' && 'Saving...'}
        {state === 'saved' && 'Saved'}
        {state === 'error' && (
          <>
            <span className="text-danger-700">{error ?? 'Could not save.'}</span>{' '}
            <button type="button" onClick={() => void save(body)} className="font-semibold underline">Retry</button>
          </>
        )}
        {state === 'idle' && `${body.length} / ${MAX}`}
      </p>
    </div>
  );
}

/** Private per-lesson note: loads once, then saves on a debounce. Render with `key={lessonId}`. */
export function NoteEditor({ lessonId }: { lessonId: string }) {
  const fetcher = useCallback(() => getNote(lessonId), [lessonId]);
  const res = useResource(fetcher);
  if (res.status === 'loading' && !res.data) return <p className="text-sm text-neutral-600">Loading your notes...</p>;
  if (!res.data) {
    return (
      <p role="alert" className="text-sm text-danger-700">
        {res.error ?? 'Could not load your notes.'}{' '}
        <button type="button" onClick={res.reload} className="font-semibold underline">Retry</button>
      </p>
    );
  }
  return <Editor lessonId={lessonId} initial={res.data.body} initialUpdatedAt={res.data.updated_at} />;
}
