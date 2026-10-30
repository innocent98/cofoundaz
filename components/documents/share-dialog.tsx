'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  createGrant,
  createLinkShare,
  listGrants,
  listLinkShares,
  revokeGrant,
  revokeLinkShare,
  setShareExpiry,
  updateGrant,
  type Grant,
  type GrantPermission,
  type ShareLink,
  type ShareTarget,
} from '@/lib/api/documents';
import { formatDate } from '@/lib/documents-format';
import { copyText } from '@/lib/clipboard';
import { endOfDayIso, shareExpiryBounds } from '@/lib/documents-sign';
import { useToast } from '@/app/(dashboard)/documents/ToastContext';
import { Dialog, btnIcon, btnPrimary, btnSecondary, inputCls, labelCls } from './ui';

const PERMISSION_LABEL: Record<GrantPermission, string> = { view: 'Can view', comment: 'Can comment' };

function PermissionSelect({
  value,
  onChange,
  label,
}: {
  value: GrantPermission;
  onChange: (v: GrantPermission) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as GrantPermission)}
      className="min-h-11 border border-line-strong rounded-input px-2 text-xs font-semibold text-ink bg-white"
    >
      <option value="view">{PERMISSION_LABEL.view}</option>
      <option value="comment">{PERMISSION_LABEL.comment}</option>
    </select>
  );
}

/**
 * Share dialog for a rich document: per-person grants (Can view / Can comment,
 * by email) plus the older "anyone with the link" token links (D-DOC-1).
 */
export function ShareDialog({
  doc,
  kind = 'document',
  onClose,
  onChanged,
}: {
  doc: { id: string; title: string };
  /** An uploaded file can only be shared by link (view only); a document can also be granted to people. */
  kind?: 'document' | 'file';
  onClose: () => void;
  onChanged?: () => void;
}) {
  const target: ShareTarget = { kind, id: doc.id };
  const isFile = kind === 'file';
  const { triggerToast } = useToast();
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<GrantPermission>('view');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [linkEmail, setLinkEmail] = useState('');
  const [linkAccess, setLinkAccess] = useState<GrantPermission>('view');
  const [expiry, setExpiry] = useState<'7' | '30' | '90' | 'never' | 'custom'>('30');
  const [customDate, setCustomDate] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  // Links the browser would not copy for us: shown in a read-only field so they can be copied by hand.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const reveal = (id: string) => setRevealed((prev) => new Set(prev).add(id));
  const [editDate, setEditDate] = useState('');
  const bounds = shareExpiryBounds();

  const load = useCallback(async () => {
    try {
      const [g, l] = await Promise.all([isFile ? Promise.resolve<Grant[]>([]) : listGrants(doc.id), listLinkShares({ kind, id: doc.id })]);
      setGrants(g);
      setLinks(l);
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorInfo(err, 'Could not load who has access.').message);
    }
  }, [doc.id, kind, isFile]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const changed = () => {
    onChanged?.();
    void load();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      await createGrant(doc.id, email.trim(), permission);
      triggerToast(`Shared with ${email.trim()}.`);
      setEmail('');
      changed();
    } catch (err) {
      setAddError(apiErrorInfo(err, 'Could not share the document.').message);
    } finally {
      setAdding(false);
    }
  };

  const setGrantPermission = async (g: Grant, p: GrantPermission) => {
    try {
      await updateGrant(doc.id, g.id, p);
      triggerToast(`${g.grantee.email} now ${PERMISSION_LABEL[p].toLowerCase()}.`);
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not change access.').message, 'error');
    }
    changed();
  };

  const revoke = async (g: Grant) => {
    try {
      await revokeGrant(doc.id, g.id);
      triggerToast(`Removed ${g.grantee.email}.`);
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not remove access.').message, 'error');
    }
    changed();
  };

  /** The expiry body for a create: a date wins; otherwise a number of days or null for never. */
  const expiryBody = (): { expires_at?: string; expires_in_days?: number | null } | string => {
    if (expiry === 'custom') {
      if (!customDate) return 'Pick the date the link should stop working.';
      if (customDate < bounds.min || customDate > bounds.max) return 'Pick a date from tomorrow to one year from now.';
      return { expires_at: endOfDayIso(customDate) };
    }
    return { expires_in_days: expiry === 'never' ? null : Number(expiry) };
  };

  const create = async (withEmail: boolean) => {
    const exp = expiryBody();
    if (typeof exp === 'string') {
      setLinkError(exp);
      return;
    }
    setSendingLink(true);
    setLinkError(null);
    try {
      const made = await createLinkShare(target, {
        ...(withEmail ? { email: linkEmail.trim() } : {}),
        access_level: isFile ? 'view' : linkAccess,
        ...exp,
      });
      if (withEmail) {
        triggerToast(`Link sent to ${linkEmail.trim()}.`);
        setLinkEmail('');
      } else {
        const copied = made.link ? await copyText(made.link) : false;
        if (!copied && made.link) reveal(made.id);
        triggerToast(copied ? 'Link created and copied.' : 'Link created. Copy it from the field below.');
      }
      changed();
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not create the link.');
      setLinkError(info.status === 429 ? 'You have made a lot of links in a short time. Try again in a little while.' : info.message);
    } finally {
      setSendingLink(false);
    }
  };

  const revokeLink = async (l: ShareLink) => {
    try {
      await revokeLinkShare(target, l.id);
      triggerToast('Link revoked. It stops working now.');
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not revoke the link.').message, 'error');
    }
    changed();
  };

  const saveExpiry = async (l: ShareLink, never: boolean) => {
    if (!never && (!editDate || editDate < bounds.min || editDate > bounds.max)) {
      triggerToast('Pick a date from tomorrow to one year from now.', 'error');
      return;
    }
    try {
      await setShareExpiry(target, l.id, never ? null : endOfDayIso(editDate));
      triggerToast(never ? 'Link set to never expire.' : `Link now expires ${formatDate(endOfDayIso(editDate))}.`);
      setEditing(null);
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not change the expiry.').message, 'error');
    }
    changed();
  };

  const copyLink = async (l: ShareLink) => {
    if (!l.link) return;
    if (await copyText(l.link)) triggerToast('Link copied.');
    else {
      reveal(l.id);
      triggerToast('Your browser blocked copying. The link is shown below: select it and copy it.', 'error');
    }
  };

  const activeLinks = links.filter((l) => l.status === 'active' && !l.revoked_at);

  return (
    <Dialog label={`Share “${doc.title}”`} onClose={onClose} wide>
      <div className="p-6 space-y-7">
        {!isFile && (
        <section className="space-y-3" aria-labelledby="share-people">
          <h4 id="share-people" className={labelCls}>
            People with access
          </h4>
          <form onSubmit={add} className="flex flex-col md:flex-row gap-2">
            <label htmlFor="grant-email" className="sr-only">
              Email address
            </label>
            <input
              id="grant-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className={inputCls}
            />
            <PermissionSelect value={permission} onChange={setPermission} label="Permission for the new person" />
            <button type="submit" disabled={adding} className={`${btnPrimary} shrink-0`}>
              {adding ? 'Sharing…' : 'Share'}
            </button>
          </form>
          {addError && (
            <p role="alert" className="text-xs font-semibold text-danger-600">
              {addError}
            </p>
          )}
          <p className="text-[11px] text-ink-subtle">
            They will find it under Shared with me after they sign in with this email address.
          </p>

          {loadError && (
            <p role="alert" className="text-xs font-semibold text-danger-600">
              {loadError}{' '}
              <button type="button" className="underline min-h-11 px-2" onClick={() => void load()}>
                Retry
              </button>
            </p>
          )}
          {grants === null && !loadError && <div className="h-12 bg-surface-muted rounded-card animate-pulse" />}
          {grants && grants.length === 0 && <p className="text-xs text-ink-subtle">Not shared with anyone yet.</p>}
          {grants && grants.length > 0 && (
            <ul className="divide-y divide-line border border-line rounded-card">
              {grants.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2 px-3 py-1.5">
                  <div className="min-w-0 flex-1 basis-44">
                    <p className="text-xs font-semibold text-ink break-words">{g.grantee.name || g.grantee.email}</p>
                    {g.grantee.name && <p className="text-[11px] text-ink-subtle break-words">{g.grantee.email}</p>}
                  </div>
                  {g.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-100 text-accent-800">Invited</span>
                  )}
                  <PermissionSelect
                    value={g.permission}
                    onChange={(p) => void setGrantPermission(g, p)}
                    label={`Permission for ${g.grantee.email}`}
                  />
                  <button type="button" aria-label={`Remove access for ${g.grantee.email}`} onClick={() => void revoke(g)} className={btnIcon}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        <section className={`space-y-3 ${isFile ? '' : 'border-t border-line pt-6'}`} aria-labelledby="share-link">
          <h4 id="share-link" className={labelCls}>
            Anyone with the link
          </h4>
          <p className="text-[11px] text-ink-subtle">
            Anyone who has the link can open {isFile ? 'this file' : 'this document'} without signing in{isFile ? '' : ', and read it'}. Share it only with people you trust, and pick an expiry. You can copy the link again or turn it off at any time.
          </p>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Link works for
                <select aria-label="Link expiry" value={expiry} onChange={(e) => setExpiry(e.target.value as typeof expiry)} className="min-h-11 border border-line-strong rounded-input px-2 text-xs font-semibold text-ink bg-white">
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="custom">Until a date</option>
                  <option value="never">Never expires</option>
                </select>
              </label>
              {expiry === 'custom' && (
                <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                  Expires on
                  <input type="date" aria-label="Link expiry date" min={bounds.min} max={bounds.max} value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="min-h-11 border border-line-strong rounded-input px-2 text-xs text-ink bg-white" />
                </label>
              )}
              <button type="button" disabled={sendingLink} onClick={() => void create(false)} className={btnPrimary}>
                {sendingLink ? 'Creating…' : 'Create link for anyone'}
              </button>
            </div>
            {expiry === 'never' && <p className="text-[11px] text-warning-800">This link keeps working until you revoke it.</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create(true);
            }}
            className="flex flex-col md:flex-row gap-2"
          >
            <label htmlFor="link-email" className="sr-only">
              Email address for the link
            </label>
            <input id="link-email" type="email" required value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="Or email the link to name@company.com" className={inputCls} />
            {!isFile && <PermissionSelect value={linkAccess} onChange={setLinkAccess} label="Link permission" />}
            <button type="submit" disabled={sendingLink} className={`${btnSecondary} shrink-0`}>
              Send link
            </button>
          </form>
          {linkError && (
            <p role="alert" className="text-xs font-semibold text-danger-600">
              {linkError}
            </p>
          )}

          {activeLinks.length > 0 && (
            <ul className="divide-y divide-line border border-line rounded-card" aria-label="Active links">
              {activeLinks.map((l) => (
                <li key={l.id} className="px-3 py-1.5 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1 basis-44">
                      <p className="text-xs font-semibold text-ink break-words">{l.anyone_with_link || !l.email ? 'Anyone with the link' : l.email}</p>
                      <p className="text-[11px] text-ink-subtle">
                        {PERMISSION_LABEL[l.access_level] ?? 'Can view'} · {l.expires_at ? `expires ${formatDate(l.expires_at)}` : 'no expiry'}
                        {l.last_viewed_at ? ` · last opened ${formatDate(l.last_viewed_at)}` : ' · not opened yet'}
                      </p>
                    </div>
                    {l.link ? (
                      <button type="button" aria-label={`Copy link for ${l.email ?? 'anyone'}`} onClick={() => void copyLink(l)} className={`${btnSecondary} px-3`}>
                        <Copy size={13} /> Copy
                      </button>
                    ) : (
                      <span className="text-[11px] text-ink-subtle max-w-40">This older link cannot be shown again. Make a new one.</span>
                    )}
                    <button type="button" className="min-h-11 px-2 text-xs font-semibold text-brand-strong hover:text-accent-bronze" onClick={() => { setEditing(editing === l.id ? null : l.id); setEditDate(''); }}>
                      Change expiry
                    </button>
                    <button type="button" aria-label={`Revoke link for ${l.email ?? 'anyone'}`} onClick={() => void revokeLink(l)} className={btnIcon}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {l.link && revealed.has(l.id) && (
                    <input
                      readOnly
                      aria-label={`Link for ${l.email ?? 'anyone'}`}
                      value={l.link}
                      onFocus={(e) => e.currentTarget.select()}
                      className={`${inputCls} bg-surface-faint text-xs mb-1`}
                    />
                  )}
                  {editing === l.id && (
                    <div className="flex flex-wrap items-end gap-2 pb-1">
                      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                        New expiry date
                        <input type="date" aria-label="New expiry date" min={bounds.min} max={bounds.max} value={editDate} onChange={(e) => setEditDate(e.target.value)} className="min-h-11 border border-line-strong rounded-input px-2 text-xs text-ink bg-white" />
                      </label>
                      <button type="button" className={btnPrimary} onClick={() => void saveExpiry(l, false)}>
                        Save date
                      </button>
                      <button type="button" className={btnSecondary} onClick={() => void saveExpiry(l, true)}>
                        Never expires
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {activeLinks.length === 0 && grants !== null && <p className="text-xs text-ink-subtle">No active links.</p>}
        </section>

        <div className="flex justify-end">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Dialog>
  );
}
