'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Copy, Download, Monitor, ShieldCheck } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';
import { apiErrorInfo } from '@/lib/api/api-error';
import { totpSetup, totpVerify, type TotpSetupResult } from '@/lib/api/mfa';
import {
  changePassword,
  disableMfa,
  getMfaStatus,
  listSessions,
  regenerateBackupCodes,
  revokeOtherSessions,
  revokeSession,
  type AuthSession,
  type MfaStatus,
} from '@/lib/api/settings';
import { copyText } from '@/lib/clipboard';
import { formatDate } from '@/lib/billing-format';
import { Banner, Button, Card, FieldError, Label, LoadError, Spinner, TextInput } from './ui';

const MONO = "ui-monospace, SFMono-Regular, Menlo, 'Cascadia Mono', monospace";

// ------------------------------------------------------------ password

function PasswordCard(): React.JSX.Element {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errs, setErrs] = useState<{ cur?: string; next?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const local: typeof errs = {};
    if (!cur) local.cur = 'Enter your current password.';
    if (next.length < 8 || !/\d/.test(next)) local.next = 'Add a number and make it at least 8 characters.';
    if (confirm !== next) local.confirm = "The passwords don't match.";
    if (Object.keys(local).length) return setErrs(local);
    setBusy(true);
    setErrs({});
    try {
      const r = await changePassword(cur, next);
      setCur('');
      setNext('');
      setConfirm('');
      toast.success(
        r.other_sessions_signed_out > 0
          ? `Password changed. ${r.other_sessions_signed_out} other ${r.other_sessions_signed_out === 1 ? 'device was' : 'devices were'} signed out.`
          : 'Password changed.',
      );
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't change your password. Try again.");
      if (info.code === 'CURRENT_PASSWORD_WRONG') setErrs({ cur: info.message });
      else if (info.code === 'WEAK_PASSWORD' || info.code === 'PASSWORD_UNCHANGED') setErrs({ next: info.message });
      else setErrs({ form: info.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Password" description="Changing it signs you out everywhere else.">
      <form onSubmit={submit} noValidate className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <Label htmlFor="pw-cur">Current password</Label>
          <TextInput id="pw-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} aria-invalid={!!errs.cur} />
          <FieldError message={errs.cur} />
        </div>
        <div>
          <Label htmlFor="pw-new">New password</Label>
          <TextInput id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={!!errs.next} />
          <FieldError message={errs.next} />
        </div>
        <div>
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <TextInput id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errs.confirm} />
          <FieldError message={errs.confirm} />
        </div>
        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <Button type="submit" loading={busy}>Change password</Button>
          <FieldError message={errs.form} />
        </div>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------ backup codes

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const copyAll = async () => {
    const ok = await copyText(codes.join('\n'));
    if (ok) toast.success('Codes copied.');
    else toast.error("Couldn't copy. Select the codes and copy them by hand.");
  };
  const download = () => {
    const blob = new Blob([`Cofoundaz backup codes\n\n${codes.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cofoundaz-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <Banner tone="warn" title="Save these backup codes now">
        Each code works once if you lose your authenticator. We can&rsquo;t show them again.
      </Banner>
      <ul className="grid grid-cols-2 gap-2 bg-surface-subtle border border-line rounded-modal p-4 text-sm text-ink" style={{ fontFamily: MONO }}>
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copyAll}><Copy className="w-3.5 h-3.5" aria-hidden />Copy</Button>
        <Button variant="secondary" onClick={download}><Download className="w-3.5 h-3.5" aria-hidden />Download</Button>
        <Button onClick={onDone}>I&rsquo;ve saved them</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ 2FA

type MfaDialog = null | 'setup' | 'regen' | 'disable';

function MfaCard(): React.JSX.Element {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<MfaDialog>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await getMfaStatus());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, "We couldn't load your two-factor status.").message);
    }
  }, []);
  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const close = () => {
    setDialog(null);
    void (async () => {
      await load();
    })();
  };

  return (
    <Card
      title="Two-factor authentication"
      description="Ask for a code from an authenticator app each time you sign in."
    >
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !status ? (
        <Spinner />
      ) : status.enabled ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-ink">
            <ShieldCheck className="w-5 h-5 text-brand-strong shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">On</p>
              <p className="text-xs text-ink-subtle">
                Authenticator app{status.enabled_at ? `, since ${formatDate(status.enabled_at)}` : ''}.{' '}
                {status.backup_codes_remaining} backup {status.backup_codes_remaining === 1 ? 'code' : 'codes'} left.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialog('regen')}>New backup codes</Button>
            <Button variant="danger" onClick={() => setDialog('disable')}>Turn off</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-ink-subtle">Two-factor is off. Turn it on to protect your account if your password leaks.</p>
          <Button onClick={() => setDialog('setup')}>Turn on</Button>
        </div>
      )}

      {dialog === 'setup' && <SetupDialog onClose={close} />}
      {dialog === 'regen' && <RegenDialog onClose={close} />}
      {dialog === 'disable' && <DisableDialog onClose={close} />}
    </Card>
  );
}

function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <ModalDialog
      label={label}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      className="bg-white border border-line rounded-[24px] p-6 md:p-7 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-accent space-y-5 outline-none"
    >
      <h3 className="text-xl font-display font-medium text-ink">{label}</h3>
      {children}
    </ModalDialog>
  );
}

function SetupDialog({ onClose }: { onClose: () => void }) {
  const [setup, setSetup] = useState<TotpSetupResult | null>(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const s = await totpSetup();
        if (!alive) return;
        setSetup(s);
        try {
          const url = await QRCode.toDataURL(s.otpauth_uri, { margin: 1, width: 200 });
          if (alive) setQr(url);
        } catch {
          /* manual key still works */
        }
      } catch (e) {
        if (alive) setErr(apiErrorInfo(e, "We couldn't start two-factor setup.").message);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return setErr('Enter the 6-digit code from your app.');
    setBusy(true);
    setErr(null);
    try {
      setCodes((await totpVerify(code.trim())).backup_codes);
    } catch (e2) {
      setErr(apiErrorInfo(e2, "That code didn't match. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  if (codes) {
    return (
      <Dialog label="Two-factor is on" onClose={onClose}>
        <BackupCodes codes={codes} onDone={onClose} />
      </Dialog>
    );
  }
  return (
    <Dialog label="Turn on two-factor" onClose={onClose}>
      {!setup ? (
        err ? <FieldError message={err} /> : <Spinner label="Preparing setup" />
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-xs text-ink-subtle">Scan this with an authenticator app, or enter the key by hand. Then type the 6-digit code it shows.</p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Two-factor QR code" width={200} height={200} className="mx-auto border border-line rounded-modal" />
          )}
          <p className="text-center text-xs text-ink break-all" style={{ fontFamily: MONO }}>{setup.secret}</p>
          <div>
            <Label htmlFor="mfa-code">6-digit code</Label>
            <TextInput id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} />
            <FieldError message={err} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={busy} className="flex-1">Turn on</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function RegenDialog({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return setErr('Enter your password.');
    setBusy(true);
    setErr(null);
    try {
      setCodes((await regenerateBackupCodes(pw)).backup_codes);
    } catch (e2) {
      setErr(apiErrorInfo(e2, "We couldn't make new codes.").message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog label="New backup codes" onClose={onClose}>
      {codes ? (
        <BackupCodes codes={codes} onDone={onClose} />
      ) : (
        <form onSubmit={go} className="space-y-4" noValidate>
          <p className="text-xs text-ink-subtle">This replaces your current codes. The old ones stop working.</p>
          <div>
            <Label htmlFor="regen-pw">Password</Label>
            <TextInput id="regen-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <FieldError message={err} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={busy} className="flex-1">Make new codes</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function DisableDialog({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [errs, setErrs] = useState<{ pw?: string; code?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: typeof errs = {};
    if (!pw) local.pw = 'Enter your password.';
    if (!code.trim()) local.code = 'Enter a code from your app, or a backup code.';
    if (Object.keys(local).length) return setErrs(local);
    setBusy(true);
    setErrs({});
    try {
      await disableMfa(pw, code.trim());
      toast.success('Two-factor is off.');
      onClose();
    } catch (e2) {
      const info = apiErrorInfo(e2, "We couldn't turn two-factor off.");
      if (info.code === 'CURRENT_PASSWORD_WRONG') setErrs({ pw: info.message });
      else if (info.code === 'MFA_INVALID_CODE') setErrs({ code: info.message });
      else setErrs({ form: info.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog label="Turn off two-factor" onClose={onClose}>
      <form onSubmit={go} className="space-y-4" noValidate>
        <p className="text-xs text-ink-subtle">Your account will be protected by your password alone. You stay signed in on your devices.</p>
        <div>
          <Label htmlFor="dis-pw">Password</Label>
          <TextInput id="dis-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <FieldError message={errs.pw} />
        </div>
        <div>
          <Label htmlFor="dis-code">Authenticator or backup code</Label>
          <TextInput id="dis-code" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
          <FieldError message={errs.code} />
        </div>
        <FieldError message={errs.form} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Keep it on</Button>
          <Button type="submit" variant="danger" loading={busy} className="flex-1">Turn off</Button>
        </div>
      </form>
    </Dialog>
  );
}

// ------------------------------------------------------------ sessions

function SessionsCard(): React.JSX.Element {
  const [rows, setRows] = useState<AuthSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listSessions());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, "We couldn't load your sign-ins.").message);
    }
  }, []);
  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const signOut = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await revokeSession(id);
      toast.success('Signed out that device.');
      await load();
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't sign that device out.");
      setActionError(info.status === 404 ? 'That sign-in is already gone.' : info.message);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const signOutOthers = async () => {
    setBusyId('others');
    setActionError(null);
    try {
      const r = await revokeOtherSessions();
      toast.success(r.revoked ? `Signed out ${r.revoked} other ${r.revoked === 1 ? 'device' : 'devices'}.` : 'No other devices were signed in.');
      await load();
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't sign the other devices out.");
      setActionError(
        info.code === 'CURRENT_SESSION_UNKNOWN' ? "We couldn't tell which device this is. Sign in again, then retry." : info.message,
      );
    } finally {
      setBusyId(null);
    }
  };

  const others = rows?.filter((r) => !r.current).length ?? 0;
  // GET /auth/sessions marks the current device from the refresh *cookie* only. This app keeps its refresh
  // token in localStorage, so on a cross-origin deploy no row may be marked; then a per-row "Sign out"
  // could end this very session, so only the bulk action (which sends the token) is offered.
  const knowsCurrent = rows?.some((r) => r.current) ?? false;
  return (
    <Card
      title="Where you're signed in"
      description="Sign out any device you don't recognise."
      action={
        others > 0 || (rows && !knowsCurrent && rows.length > 1) ? (
          <Button variant="secondary" loading={busyId === 'others'} onClick={signOutOthers}>
            Sign out other devices
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="text-xs text-ink-subtle">No active sign-ins.</p>
      ) : (
        <>
        {!knowsCurrent && (
          <p className="text-[11px] text-ink-subtle mb-3">
            We can&rsquo;t tell which of these is this device. &ldquo;Sign out other devices&rdquo; keeps this one signed in.
          </p>
        )}
        <ul className="divide-y divide-line">
          {rows.map((s) => (
            <li key={s.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Monitor className="w-4 h-4 mt-0.5 text-ink-muted shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {s.label}
                    {s.current && <span className="ml-2 text-[10px] font-bold uppercase bg-brand-tint text-brand-strong rounded-full px-2 py-0.5">This device</span>}
                  </p>
                  <p className="text-[11px] text-ink-subtle">
                    {s.ip ? `${s.ip} · ` : ''}Signed in {formatDate(s.signed_in_at)}
                  </p>
                </div>
              </div>
              {knowsCurrent && !s.current && (
                <Button variant="secondary" loading={busyId === s.id} onClick={() => signOut(s.id)}>
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
        </>
      )}
      <FieldError message={actionError} />
    </Card>
  );
}

export function SecurityTab(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PasswordCard />
      <MfaCard />
      <SessionsCard />
    </div>
  );
}
