'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useWorkspace } from '@/components/workspace-context';
import { COMMENT_MAX, MENTION_MAX, type Comment, type CommentEntityType } from '@/lib/api/comments';
import { memberLabel, type TeamMember } from '@/lib/api/members';
import { relativeStamp } from '@/lib/roadmap-format';
import { activeMention, filterCandidates, insertMention, liveMentionIds, splitMentions } from '@/lib/mentions';

interface CommentThreadProps {
  entityType: CommentEntityType;
  entityId: string;
  members: TeamMember[];
}

/** The 23.2 comments thread: post with @-mentions, edit/delete your own, resolve. Investors read only. */
export function CommentThread({ entityType, entityId, members }: CommentThreadProps) {
  const { role } = useWorkspace();
  const { comments, loading, loadError, reload, post, edit, remove, resolve, errorMessage } = useComments(entityType, entityId);
  const canPost = role !== 'investor';
  const canResolveAny = role === 'founder' || role === 'team_member';
  const [error, setError] = useState<string | null>(null);

  const labelById = useMemo(() => new Map(members.map((m) => [m.user_id, memberLabel(m)])), [members]);

  const guard = async (fn: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(errorMessage(err, fallback));
      return false;
    }
  };

  return (
    <section aria-label="Comments" className="flex flex-col gap-3">
      {loading && <p className="text-xs text-ink-subtle">Loading comments…</p>}
      {loadError && (
        <p className="text-xs text-danger-600">
          Couldn&apos;t load comments.{' '}
          <button type="button" onClick={() => void reload()} className="underline font-semibold">
            Retry
          </button>
        </p>
      )}
      {!loading && !loadError && comments.length === 0 && (
        <p className="text-xs text-ink-subtle">No comments yet.{canPost ? ' Start the conversation below.' : ''}</p>
      )}

      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            labelById={labelById}
            canResolve={canResolveAny || c.is_mine}
            onEdit={(body) => guard(() => edit(c.id, body), "Couldn't save that edit. Try again.")}
            onDelete={() => guard(() => remove(c.id), "Couldn't delete that comment. Try again.")}
            onResolve={() => guard(() => resolve(c.id, !c.resolved_at), "Couldn't update that thread. Try again.")}
          />
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}

      {canPost ? (
        <Composer
          members={members}
          onSubmit={(body, ids) => guard(() => post(body, ids), "Couldn't post that comment. Try again.")}
        />
      ) : (
        <p className="text-xs text-ink-subtle">Investors can read comments but not post.</p>
      )}
    </section>
  );
}

function CommentRow({
  comment: c,
  labelById,
  canResolve,
  onEdit,
  onDelete,
  onResolve,
}: {
  comment: Comment;
  labelById: Map<string, string>;
  canResolve: boolean;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onResolve: () => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const mentionLabels = c.mention_user_ids.map((id) => labelById.get(id) ?? '').filter(Boolean);
  const segments = splitMentions(c.body, mentionLabels);
  const resolved = !!c.resolved_at;

  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    return ok;
  };

  return (
    <li className={`rounded-card border p-3 flex flex-col gap-1.5 ${resolved ? 'bg-surface-muted border-line-soft opacity-80' : 'bg-white border-line-soft'}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-soft">
        <span className="font-bold text-ink truncate">{c.author.name?.trim() || 'Teammate'}</span>
        <span className="shrink-0">
          {relativeStamp(c.created_at)}
          {c.edited_at ? ' · edited' : ''}
          {resolved ? ' · resolved' : ''}
        </span>
      </div>

      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            if (await run(() => onEdit(body))) setEditing(false);
          }}
        >
          <textarea
            autoFocus
            onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
            aria-label="Edit comment"
            value={draft}
            maxLength={COMMENT_MAX}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !draft.trim()} className="px-3 py-1 rounded-input bg-brand-strong text-white text-xs font-bold disabled:opacity-40">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(c.body);
              }}
              className="px-3 py-1 rounded-input text-xs font-semibold text-ink-muted hover:bg-line-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-ink whitespace-pre-wrap break-words">
          {segments.map((seg, i) =>
            seg.mention ? (
              <span key={i} className="font-semibold text-accent-700 bg-accent-xfdf2e6 rounded px-0.5">
                {seg.text}
              </span>
            ) : (
              <React.Fragment key={i}>{seg.text}</React.Fragment>
            )
          )}
        </p>
      )}

      {!editing && (
        <div className="flex items-center gap-1 -ml-1.5 text-ink-soft">
          {canResolve && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onResolve)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-input text-[11px] font-semibold hover:bg-line-soft disabled:opacity-40"
            >
              {resolved ? <RotateCcw className="w-3 h-3" aria-hidden="true" /> : <Check className="w-3 h-3" aria-hidden="true" />}
              {resolved ? 'Reopen thread' : 'Resolve thread'}
            </button>
          )}
          {c.is_mine && (
            <>
              <button
                type="button"
                aria-label="Edit comment"
                disabled={busy}
                onClick={() => {
                  setDraft(c.body);
                  setEditing(true);
                }}
                className="p-1.5 rounded-input hover:bg-line-soft disabled:opacity-40"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
              </button>
              {confirmDelete ? (
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="font-semibold text-danger-600">Delete this comment?</span>
                  <button type="button" disabled={busy} onClick={() => void run(onDelete)} className="px-1.5 py-0.5 rounded-input font-bold text-danger-600 hover:bg-danger-wash">
                    Yes
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-1.5 py-0.5 rounded-input font-semibold hover:bg-line-soft">
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  aria-label="Delete comment"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-input hover:text-danger-text hover:bg-danger-wash disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

function Composer({ members, onSubmit }: { members: TeamMember[]; onSubmit: (body: string, mentionIds: string[]) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Map<string, string>>(new Map());
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const candidates = useMemo(() => members.map((m) => ({ id: m.user_id, label: memberLabel(m) })), [members]);
  const mention = dismissed ? null : activeMention(text, caret);
  const options = mention ? filterCandidates(candidates, mention.query) : [];
  const open = options.length > 0;
  const activeIndex = Math.min(active, Math.max(0, options.length - 1));

  const choose = (idx: number) => {
    const opt = options[idx];
    if (!mention || !opt) return;
    const next = insertMention(text, mention.start, caret, opt.label);
    setText(next.text);
    setCaret(next.caret);
    setPicked((prev) => new Map(prev).set(opt.id, opt.label));
    setActive(0);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const submit = async () => {
    const body = text.trim();
    if (!body || busy) return;
    const ids = liveMentionIds(text, picked).slice(0, MENTION_MAX);
    setBusy(true);
    const ok = await onSubmit(body, ids);
    setBusy(false);
    if (ok) {
      setText('');
      setPicked(new Map());
      setCaret(0);
    }
  };

  return (
    <form
      className="relative flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <textarea
        ref={ref}
        role="combobox"
        aria-label="Add a comment"
        aria-expanded={open}
        aria-controls="mention-options"
        aria-autocomplete="list"
        aria-activedescendant={open ? `mention-opt-${activeIndex}` : undefined}
        value={text}
        maxLength={COMMENT_MAX}
        rows={3}
        placeholder="Add a comment… @ to mention"
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value);
          setCaret(e.target.selectionStart);
          setDismissed(false);
          setActive(0);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((activeIndex + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((activeIndex - 1 + options.length) % options.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              choose(activeIndex);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setDismissed(true);
            }
          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
        className="w-full border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-ink-subtle disabled:opacity-60"
      />
      {open && (
        <ul
          id="mention-options"
          role="listbox"
          aria-label="Mention a teammate"
          className="absolute left-0 right-0 bottom-full mb-1 z-10 bg-white border border-line-soft rounded-card shadow-raised overflow-hidden"
        >
          {options.map((o, i) => (
            <li
              key={o.id}
              id={`mention-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              className={`px-3 py-2 text-sm cursor-pointer ${i === activeIndex ? 'bg-brand-tint font-semibold' : ''}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-subtle">
          {text.length}/{COMMENT_MAX}
        </span>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="px-4 py-1.5 rounded-input bg-brand-strong hover:bg-brand-rail text-white text-xs font-bold disabled:opacity-40 transition-colors"
        >
          {busy ? 'Posting…' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
