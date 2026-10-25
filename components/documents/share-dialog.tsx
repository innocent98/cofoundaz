'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  createGrant,
  createShareLink,
  listGrants,
  listShareLinks,
  revokeGrant,
  revokeShareLink,
  updateGrant,
  type Grant,
  type GrantPermission,
  type ShareLink,
} from '@/lib/api/documents';
import { formatDate } from '@/lib/documents-format';
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
  onClose,
  onChanged,
}: {
  doc: { id: string; title: string };
  onClose: () => void;
  onChanged?: () => void;
}) {
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
  const [linkExpires, setLinkExpires] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [g, l] = await Promise.all([listGrants(doc.id), listShareLinks(doc.id)]);
      setGrants(g);
      setLinks(l);
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorInfo(err, 'Could not load who has access.').message);
    }
  }, [doc.id]);

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

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingLink(true);
    try {
      const link = await createShareLink(doc.id, linkEmail.trim(), linkAccess, linkExpires ? 30 : null);
      setNewLink(link ?? null);
      triggerToast(`Link sent to ${linkEmail.trim()}.`);
      setLinkEmail('');
      changed();
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not create the link.').message, 'error');
    } finally {
      setSendingLink(false);
    }
  };

  const revokeLink = async (l: ShareLink) => {
    try {
      await revokeShareLink(doc.id, l.id);
      triggerToast('Link revoked.');
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not revoke the link.').message, 'error');
    }
    changed();
  };

  const activeLinks = links.filter((l) => l.status === 'active' && !l.revoked_at);

  return (
    <Dialog label={`Share “${doc.title}”`} onClose={onClose} wide>
      <div className="p-6 space-y-7">
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
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate">{g.grantee.name || g.grantee.email}</p>
                    {g.grantee.name && <p className="text-[11px] text-ink-subtle truncate">{g.grantee.email}</p>}
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

        <section className="space-y-3 border-t border-line pt-6" aria-labelledby="share-link">
          <h4 id="share-link" className={labelCls}>
            Anyone with the link
          </h4>
          <p className="text-[11px] text-ink-subtle">
            We email a read-only link. Anyone who has the link can open the document without signing in, so only send it to
            people you trust. The link is shown once.
          </p>
          {newLink ? (
            <div className="flex items-center gap-2">
              <input readOnly aria-label="New share link" value={newLink} className={`${inputCls} bg-surface-faint truncate`} />
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  void navigator.clipboard?.writeText(newLink);
                  triggerToast('Link copied.');
                }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          ) : (
            <form onSubmit={sendLink} className="space-y-2">
              <div className="flex flex-col md:flex-row gap-2">
                <label htmlFor="link-email" className="sr-only">
                  Email address for the link
                </label>
                <input
                  id="link-email"
                  type="email"
                  required
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={inputCls}
                />
                <PermissionSelect value={linkAccess} onChange={setLinkAccess} label="Link permission" />
                <button type="submit" disabled={sendingLink} className={`${btnSecondary} shrink-0`}>
                  {sendingLink ? 'Sending…' : 'Send link'}
                </button>
              </div>
              <label className="flex items-center gap-2 min-h-11 text-xs text-neutral-600 font-medium">
                <input type="checkbox" checked={linkExpires} onChange={(e) => setLinkExpires(e.target.checked)} className="w-4 h-4" />
                Link expires in 30 days
              </label>
            </form>
          )}
          {activeLinks.length > 0 && (
            <ul className="divide-y divide-line border border-line rounded-card">
              {activeLinks.map((l) => (
                <li key={l.id} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate">{l.email}</p>
                    <p className="text-[11px] text-ink-subtle">
                      {PERMISSION_LABEL[l.access_level] ?? 'Can view'} ·{' '}
                      {l.expires_at ? `expires ${formatDate(l.expires_at)}` : 'no expiry'}
                    </p>
                  </div>
                  <button type="button" aria-label={`Revoke link for ${l.email}`} onClick={() => void revokeLink(l)} className={btnIcon}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
