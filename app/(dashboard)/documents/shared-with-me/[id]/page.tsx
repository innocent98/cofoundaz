'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  addSharedComment,
  getSharedWithMe,
  listSharedComments,
  type SharedComment,
  type SharedDocFull,
} from '@/lib/api/documents';
import { formatDate, personName } from '@/lib/documents-format';
import { btnPrimary, btnSecondary, inputCls } from '@/components/documents/ui';
import { useToast } from '../../ToastContext';

export default function SharedDocumentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { triggerToast } = useToast();
  const [doc, setDoc] = useState<SharedDocFull | null>(null);
  const [comments, setComments] = useState<SharedComment[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'gone' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([getSharedWithMe(id), listSharedComments(id)]);
      setDoc(d);
      setComments(c);
      setState('ready');
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not open this document.');
      if (info.status === 404) setState('gone');
      else {
        setErrorMsg(info.message);
        setState('error');
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await load();
    })();
  }, [id, load]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      await addSharedComment(id, body.trim());
      setBody('');
      setComments(await listSharedComments(id));
      triggerToast('Comment posted.');
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not post your comment.').message, 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-3xl w-full mx-auto flex flex-col gap-6">
      <Link href="/documents/shared-with-me" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Shared with me
      </Link>

      {state === 'loading' && <div className="bg-white rounded-modal border border-line-soft shadow-card h-96 animate-pulse" />}

      {state === 'gone' && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-10 text-center text-sm text-ink-muted">
          This document is no longer shared with you, or it was removed. Ask the person who shared it if you still need access.
        </div>
      )}

      {state === 'error' && (
        <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button type="button" className={btnSecondary} onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {state === 'ready' && doc && (
        <>
          <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 md:p-10 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-ink tracking-tight">{doc.title || 'Untitled document'}</h1>
              <p className="text-[11px] text-ink-subtle mt-2">
                {doc.workspace.name} · shared by {personName(doc.shared_by)} · version {doc.version} · updated {formatDate(doc.updated_at)} ·{' '}
                {doc.permission === 'comment' ? 'You can comment' : 'View only'}
              </p>
            </div>
            {doc.sections.length === 0 && <p className="text-sm text-ink-subtle italic">This document has no content yet.</p>}
            {doc.sections.map((s, i) => (
              <section key={s.id ?? i} className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">{s.heading}</h2>
                <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{s.body}</p>
              </section>
            ))}
          </div>

          <section aria-labelledby="comments-h" className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-4">
            <h2 id="comments-h" className="text-sm font-bold text-ink">
              Comments
            </h2>
            {comments.length === 0 && <p className="text-xs text-ink-subtle">No comments yet.</p>}
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="border border-line rounded-card p-3">
                  <p className="text-[11px] text-ink-subtle">
                    {c.is_mine ? 'You' : personName(c.author)} · {formatDate(c.created_at)}
                  </p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ul>
            {doc.permission === 'comment' ? (
              <form onSubmit={post} className="flex flex-col gap-2">
                <label htmlFor="new-comment" className="sr-only">
                  Add a comment
                </label>
                <textarea
                  id="new-comment"
                  required
                  maxLength={5000}
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add a comment"
                  className={`${inputCls} resize-y`}
                />
                <button type="submit" disabled={posting || !body.trim()} className={`${btnPrimary} self-end`}>
                  {posting ? 'Posting…' : 'Post comment'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-ink-subtle">You have view access to this document, so you can’t comment on it.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
