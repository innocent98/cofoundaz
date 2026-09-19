'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { totpSetup, totpVerify } from '@/lib/api/mfa';

type Stage = 'loading' | 'setup' | 'already' | 'backup' | 'error';

// The design system clears Tailwind's monospace font utility (only the display
// and body faces compile), so codes use a monospace stack via inline style.
const MONO = "ui-monospace, SFMono-Regular, Menlo, 'Cascadia Mono', monospace";

export default function MfaSetupPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('loading');
  const [secret, setSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<'secret' | 'codes' | null>(null);

  useEffect(() => {
    // Authenticated flow — bounce anonymous visitors back to login and return.
    if (typeof window !== 'undefined' && !localStorage.getItem('cf_token')) {
      router.replace('/login?next=/setup/mfa');
      return;
    }
    void (async () => {
      try {
        const res = await totpSetup();
        setSecret(res.secret);
        try {
          setQrDataUrl(await QRCode.toDataURL(res.otpauth_uri, { margin: 1, width: 200 }));
        } catch {
          // QR render failed — the manual key below still works everywhere.
          setQrDataUrl('');
        }
        setStage('setup');
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setStage('already');
        } else if (err instanceof ApiError && err.status === 401) {
          router.replace('/login?next=/setup/mfa');
        } else {
          const d = (err as ApiError)?.data as { error?: { message?: string } } | undefined;
          setLoadError(d?.error?.message || 'Could not start two-factor setup. Please try again.');
          setStage('error');
        }
      }
    })();
  }, [router]);

  const copy = async (text: string, which: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked — the value is visible for manual copy */
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (value.length < 6) {
      setVerifyError('Enter the 6-digit code from your app.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await totpVerify(value);
      setBackupCodes(res.backup_codes || []);
      setStage('backup');
    } catch (err) {
      const d = (err as ApiError)?.data as { error?: { message?: string } } | undefined;
      setVerifyError(d?.error?.message || "That code didn't match. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const downloadCodes = () => {
    // The user saving their own generated codes (client-side blob, user-initiated).
    const blob = new Blob([`Cofoundaz backup codes\n\n${backupCodes.join('\n')}\n`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cofoundaz-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] font-body text-[#1E2923]">
      <header className="bg-white border-b border-[#E8E8E2] px-6 py-4 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tight text-[#1E2923]">Cofoundaz</div>
        <div className="text-sm font-medium text-[#617065]">Account security</div>
      </header>

      <main className="max-w-md mx-auto py-10 px-4">
        {stage === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-[#617065] py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Preparing two-factor setup…
          </div>
        )}

        {stage === 'error' && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#FBEBEB] text-[#B0483B] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">Couldn&apos;t start setup</h1>
            <p className="text-sm text-[#617065] max-w-sm">{loadError}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-2 text-sm font-semibold text-[#183B28] hover:underline"
            >
              Back to dashboard
            </button>
          </div>
        )}

        {stage === 'already' && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">Two-factor is already on</h1>
            <p className="text-sm text-[#617065] max-w-sm">
              Your account is protected with an authenticator app. To reset it, contact support.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-2 text-sm font-semibold text-[#183B28] hover:underline"
            >
              Back to dashboard
            </button>
          </div>
        )}

        {stage === 'setup' && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] overflow-hidden">
            <div className="border-b border-[#E8E8E2] px-6 py-5 bg-[#FBFBFA]">
              <h1 className="text-lg font-display font-bold">Add a second factor</h1>
              <p className="text-sm text-[#617065] mt-0.5">
                Protect your workspace with a one-time code at sign-in.
              </p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Method choice — only the authenticator app is available server-side. */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-[#1E4D3B] bg-[#E3EFE9] rounded-card p-3 flex flex-col gap-1">
                  <Smartphone className="w-5 h-5 text-[#1E4D3B]" />
                  <span className="text-sm font-bold">Authenticator app</span>
                  <span className="text-[11px] text-[#617065]">Recommended, works offline</span>
                </div>
                <div className="border border-[#E8E8E2] bg-[#F7F7F5] rounded-card p-3 flex flex-col gap-1 opacity-70">
                  <MessageSquare className="w-5 h-5 text-[#8E9B90]" />
                  <span className="text-sm font-bold text-[#8E9B90]">SMS code</span>
                  <span className="text-[11px] text-[#A8894B] font-semibold">Coming soon</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-[#617065] text-center">
                  Scan this with your authenticator app, or enter the key by hand.
                </p>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Two-factor QR code"
                    className="w-44 h-44 rounded-card border border-[#E8E8E2] bg-white p-2"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-card border border-dashed border-[#D5DDD6] flex items-center justify-center text-xs text-[#8E9B90] text-center px-3">
                    Enter the key below in your app
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => copy(secret, 'secret')}
                  className="flex items-center gap-2 text-xs bg-[#F7F7F5] border border-[#E8E8E2] rounded-input px-3 py-2 text-[#1E2923] hover:border-[#4D6D58]"
                  style={{ fontFamily: MONO }}
                >
                  <span className="tracking-wider">{secret}</span>
                  {copied === 'secret' ? (
                    <Check className="w-3.5 h-3.5 text-[#2D5A3F]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#617065]" />
                  )}
                </button>
              </div>

              <form onSubmit={verify} className="flex flex-col gap-3 border-t border-[#E8E8E2] pt-5">
                <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider" htmlFor="totp-code">
                  Enter the 6-digit code
                </label>
                <input
                  id="totp-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full border border-[#D5DDD6] rounded-input px-3 py-2.5 text-center text-lg tracking-[0.3em] focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58]"
                />
                {verifyError && <p className="text-xs font-semibold text-[#B0483B]">{verifyError}</p>}
                <button
                  type="submit"
                  disabled={verifying}
                  className="bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Turning on…
                    </>
                  ) : (
                    'Turn on 2FA'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="text-xs text-[#8E9B90] hover:text-[#617065] text-center"
                >
                  I&apos;ll do this later
                </button>
              </form>
            </div>
          </div>
        )}

        {stage === 'backup' && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] overflow-hidden">
            <div className="border-b border-[#E8E8E2] px-6 py-5 bg-[#FBFBFA] flex items-center gap-3">
              <div className="w-10 h-10 rounded-card bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold">Two-factor is on</h1>
                <p className="text-sm text-[#617065]">Save your backup codes.</p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#617065]">
                Keep these somewhere safe — each one signs you in once if you lose your device. They won&apos;t be
                shown again.
              </p>
              {backupCodes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 bg-[#F7F7F5] border border-[#E8E8E2] rounded-card p-4">
                  {backupCodes.map((c) => (
                    <span
                      key={c}
                      className="text-sm text-[#1E2923] tracking-wider text-center"
                      style={{ fontFamily: MONO }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E9B90]">No backup codes were returned.</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => copy(backupCodes.join('\n'), 'codes')}
                  disabled={backupCodes.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#D5DDD6] hover:border-[#4D6D58] disabled:opacity-50 text-[#183B28] font-semibold py-2 rounded-card text-xs"
                >
                  {copied === 'codes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'codes' ? 'Copied' : 'Copy codes'}
                </button>
                <button
                  onClick={downloadCodes}
                  disabled={backupCodes.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#D5DDD6] hover:border-[#4D6D58] disabled:opacity-50 text-[#183B28] font-semibold py-2 rounded-card text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>

              <button
                onClick={() => router.push('/settings')}
                className="mt-1 bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card"
              >
                I&apos;ve saved my codes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
