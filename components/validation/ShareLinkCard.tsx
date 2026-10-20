'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy } from 'lucide-react';

/** A survey share link with copy and a QR code. The token is shown once, so this is the only chance to copy it. */
export function ShareLinkCard({ url, onCopied }: { url: string; onCopied?: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 160 }).then(
      (d) => {
        if (live) setQr(d);
      },
      () => {
        if (live) setQr(null);
      }
    );
    return () => {
      live = false;
    };
  }, [url]);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2500);
      },
      () => {}
    );
  };

  return (
    <div className="mt-3 bg-[#f5f7f5] rounded-card p-3 border border-sage-200/60 space-y-2" onClick={(e) => e.stopPropagation()}>
      <span className="block text-[11px] font-semibold text-sage-500 uppercase tracking-wider">Share link (shown once, copy it now)</span>
      <div className="flex items-center gap-2">
        <span data-testid="share-url" className="block text-xs font-semibold text-[#1e4836] truncate flex-1">
          {url}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 bg-white border border-sage-200 text-sage-700 px-2.5 py-1.5 rounded-input text-xs shrink-0 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element -- a data: URL, nothing for next/image to optimise
        <img src={qr} alt="QR code for the survey link" width={160} height={160} className="rounded-input bg-white" />
      )}
    </div>
  );
}
