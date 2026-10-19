'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import {
  createComment,
  deleteComment,
  editComment,
  listComments,
  listMembers,
  resolveComment,
  type Comment,
  type CommentEntityType,
  type TeamMember,
} from '@/lib/api/comments';
import { apiErrorInfo } from '@/lib/api/api-error';
import { relativeTime } from '@/lib/relative-time';
import { activeMentionQuery, applyMention, filterMembers, memberLabel, mentionIdsIn } from '@/lib/mentions';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';

interface Props {
  open: boolean;
  title: string;
  entityType: CommentEntityType;
  entityId: string | null;
  /** A canvas block key for a section thread; omit for a record. */
  anchor?: string;
  onClose: () => void;
  /** A comment was added, edited, resolved or deleted: refresh the counts. */
  onChanged: () => void;
}

function CommentRow({
  c,
  canResolve,
  onChanged,
  onError,
}: {
  c: Comment;
  canResolve: boolean;
  onChanged: (next: Comment | null) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<Comment | null>) => {
    setBusy(true);
    try {
      onChanged(await fn());
      setEditing(false);
    } catch (err) {
      onError(apiErrorInfo(err, 'That did not go through. Try again.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`rounded-card border px-3 py-2.5 ${c.resolved_at ? 'border-[#EBEBE6] bg-[#FAFAFA]' : 'border-[#EBEBE6] bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#1E2923]">{c.author.name?.trim() || 'A teammate'}</p>
        <p className="text-[11px] text-[#8E9B90]">
          {relativeTime(c.created_at)}
          {c.edited_at ? ', edited' : ''}
        </p>
      </div>
      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={4000}
            aria-label="Edit comment"
            className="w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58]"
          />
          <div className="flex gap-2">
            <button type="button" disabled={busy || !draft.trim()} onClick={() => run(() => editComment(c.id, draft.trim()))} className="px-3 py-1.5 bg-[#183B28] text-white rounded-card text-xs font-bold disabled:opacity-60">Save</button>
            <button type="button" onClick={() => { setEditing(false); setDraft(c.body); }} className="px-3 py-1.5 bg-white border border-[#DCDCD6] rounded-card text-xs font-bold">Cancel</button>
          </div>
        </div>
      ) : (
        <p className={`mt-1 text-xs whitespace-pre-wrap leading-relaxed ${c.resolved_at ? 'text-[#768478]' : 'text-[#1E2923]'}`}>{c.body}</p>
      )}
      {!editing && (
        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-[#768478]">
          {c.resolved_at && <span className="flex items-center gap-1 text-[#183B28]"><Check className="w-3 h-3" /> Resolved</span>}
          {(canResolve || c.is_mine) && (
            <button type="button" disabled={busy} onClick={() => run(() => resolveComment(c.id, !c.resolved_at))} className="flex items-center gap-1 hover:text-[#183B28]">
              {c.resolved_at ? <><RotateCcw className="w-3 h-3" /> Reopen</> : <><Check className="w-3 h-3" /> Resolve thread</>}
            </button>
          )}
          {c.is_mine && (
            <>
              <button type="button" disabled={busy} onClick={() => setEditing(true)} className="flex items-center gap-1 hover:text-[#183B28]"><Pencil className="w-3 h-3" /> Edit</button>
              <button type="button" disabled={busy} onClick={() => run(async () => { await deleteComment(c.id); return null; })} className="flex items-center gap-1 hover:text-[#A34B4B]"><Trash2 className="w-3 h-3" /> Delete</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

/** A comment thread for one canvas block or one record (`/team/comments`). */
export function CommentDrawer({ open, title, entityType, entityId, anchor, onClose, onChanged }: Props) {
  const { canComment, canEdit } = useBuilderAccess();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [picked, setPicked] = useState<TeamMember[]>([]);
  const [caret, setCaret] = useState(0);
  const [activeIndex, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      setComments(await listComments(entityType, entityId, anchor));
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load comments.').message);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, anchor]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setText('');
      setPicked([]);
      await load();
      try {
        setMembers(await listMembers());
      } catch {
        setMembers([]); // mentions are optional: the composer still works
      }
    })();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const mention = dismissed ? null : activeMentionQuery(text, caret);
  const suggestions = mention ? filterMembers(members, mention.query) : [];
  const listOpen = suggestions.length > 0;
  const activeOption = listOpen ? Math.min(activeIndex, suggestions.length - 1) : 0;

  const pick = (m: TeamMember) => {
    if (!mention) return;
    const r = applyMention(text, caret, mention.start, m);
    setText(r.text);
    setCaret(r.caret);
    setActive(0);
    setPicked((p) => (p.some((x) => x.user_id === m.user_id) ? p : [...p, m]));
    requestAnimationFrame(() => {
      areaRef.current?.focus();
      areaRef.current?.setSelectionRange(r.caret, r.caret);
    });
  };

  const post = async () => {
    const body = text.trim();
    if (!body || !entityId) return;
    setPosting(true);
    setError(null);
    try {
      const created = await createComment({
        entityType,
        entityId,
        ...(anchor ? { anchor } : {}),
        body,
        mentionUserIds: mentionIdsIn(body, picked),
      });
      setComments((prev) => [...prev, created]);
      setText('');
      setPicked([]);
      onChanged();
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not post your comment.');
      setError(info.status === 429 ? 'You are commenting too fast. Wait a moment and try again.' : info.message);
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#061A12]/30" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={`Comments on ${title}`} className="bg-white w-full md:max-w-md h-full shadow-raised flex flex-col">
        <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA] shrink-0">
          <h3 className="font-bold text-[#1E2923] truncate">Comments on {title}</h3>
          <button type="button" onClick={onClose} className="text-[#8E9B90] hover:text-[#1E2923] p-1 rounded-input hover:bg-[#E8E8E2]" aria-label="Close comments">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {loading && <div className="flex items-center gap-2 text-xs text-[#768478]"><Loader2 className="w-4 h-4 animate-spin" /> Loading</div>}
          {!loading && comments.length === 0 && !error && (
            <p className="text-sm text-[#768478]">No comments yet. Start the conversation.</p>
          )}
          {comments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  c={c}
                  canResolve={canEdit}
                  onError={setError}
                  onChanged={(next) => {
                    setComments((prev) => (next ? prev.map((x) => (x.id === c.id ? next : x)) : prev.filter((x) => x.id !== c.id)));
                    onChanged();
                  }}
                />
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-[#B0483B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </div>

        {canComment ? (
          <div className="px-6 py-4 border-t border-[#E8E8E2] shrink-0 relative">
            {listOpen && (
              <ul id="bb-mention-options" role="listbox" aria-label="Mention a teammate" className="absolute bottom-full left-6 right-6 mb-1 bg-white border border-[#EBEBE6] rounded-card shadow-raised overflow-hidden">
                {suggestions.map((m, i) => (
                  <li key={m.user_id}>
                    <button
                      type="button"
                      id={`bb-mention-opt-${i}`}
                      role="option"
                      tabIndex={-1}
                      aria-label={`Mention ${memberLabel(m)}, ${m.role.replace(/_/g, ' ')}`}
                      aria-selected={i === activeOption}
                      onMouseDown={(e) => { e.preventDefault(); pick(m); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F2F7F4] ${i === activeOption ? 'bg-[#F2F7F4]' : ''}`}
                    >
                      <span className="font-bold text-[#1E2923]">{memberLabel(m)}</span>
                      <span className="ml-2 text-[#8E9B90]">{m.role.replace(/_/g, ' ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              ref={areaRef}
              value={text}
              role="combobox"
              aria-expanded={listOpen}
              aria-controls="bb-mention-options"
              aria-autocomplete="list"
              aria-activedescendant={listOpen ? `bb-mention-opt-${activeOption}` : undefined}
              onChange={(e) => { setText(e.target.value); setCaret(e.target.selectionStart); setDismissed(false); setActive(0); }}
              onKeyDown={(e) => {
                if (!listOpen) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((activeOption + 1) % suggestions.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((activeOption - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  pick(suggestions[activeOption]);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setDismissed(true);
                }
              }}
              onKeyUp={(e) => setCaret(e.currentTarget.selectionStart)}
              onClick={(e) => setCaret(e.currentTarget.selectionStart)}
              rows={3}
              maxLength={4000}
              placeholder="Add a comment... @ to mention"
              aria-label="Add a comment"
              className="w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58]"
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={post} disabled={posting || !text.trim()} className="px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-60 text-white rounded-card text-xs font-bold">
                {posting ? 'Posting' : 'Comment'}
              </button>
            </div>
          </div>
        ) : (
          <p className="px-6 py-4 border-t border-[#E8E8E2] text-xs text-[#768478]">Your role can read comments but not post them.</p>
        )}
      </aside>
    </div>
  );
}
