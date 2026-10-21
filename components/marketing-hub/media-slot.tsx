'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useMedia } from '@/hooks/useMarketingApi';
import {
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  marketingErrorMessage,
  uploadMedia,
  type MarketingMedia,
} from '@/lib/api/marketing';
import { BTN_DANGER, BTN_SECONDARY } from './states';
import { ConfirmDialog } from './confirm-dialog';

/**
 * An image preview that never shows a broken-image box. `url` is storage dependent (a relative
 * path on local-disk storage, a CDN URL when deployed), so a load failure falls back to the
 * file name instead of pretending the image is there.
 */
export function MediaThumb({ media, className = 'h-28 w-28' }: { media: MarketingMedia; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-1 rounded-card border border-sage-200 bg-sage-50 p-2 text-center`}>
        <ImagePlus className="h-5 w-5 text-sage-600" aria-hidden="true" />
        <span className="w-full truncate text-[11px] text-sage-600">{media.filename}</span>
        <span className="text-[10px] text-sage-500">Preview unavailable</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the URL is the API's, whatever storage backs it
    <img
      src={media.url}
      alt={media.filename}
      className={`${className} rounded-card border border-sage-200 object-cover bg-sage-50`}
      onError={() => setFailed(true)}
    />
  );
}

function Library({ onPick }: { onPick: (m: MarketingMedia) => void }) {
  const { media, status, error, remove } = useMedia();
  const [confirm, setConfirm] = useState<MarketingMedia | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (status === 'loading') return <p className="text-xs text-sage-500">Loading your images...</p>;
  if (status === 'error' || status === 'forbidden') return <p role="alert" className="text-xs text-red-700">{error}</p>;
  if (media.length === 0) return <p className="text-xs text-sage-500">No images uploaded yet.</p>;

  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-3 gap-2">
        {media.map((m) => (
          <li key={m.id} className="relative">
            <button type="button" onClick={() => onPick(m)} aria-label={`Use ${m.filename}`} className="block w-full cursor-pointer">
              <MediaThumb media={m} className="h-20 w-full" />
            </button>
            <button
              type="button"
              onClick={() => setConfirm(m)}
              aria-label={`Delete ${m.filename} from your library`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-card cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="text-xs text-red-700">{err}</p>}
      {confirm && (
        <ConfirmDialog
          title="Delete this image?"
          body={`"${confirm.filename}" is removed from your library. Posts that use it keep working, with no image.`}
          confirmLabel="Delete image"
          danger
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await remove(confirm.id);
              setErr(null);
              setConfirm(null);
            } catch (e) {
              setErr(marketingErrorMessage(e));
              setConfirm(null);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

/** The entry drawer's media slot: attach one image, from a fresh upload or the library. */
export function MediaSlot({
  media,
  onChange,
}: {
  media: MarketingMedia | null;
  onChange: (m: MarketingMedia | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!MEDIA_TYPES.includes(file.type)) {
      setError('Upload a PNG, JPEG, GIF or WebP image.');
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      setError('That image is over 5 MB. Choose a smaller one.');
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadMedia(file));
    } catch (e) {
      setError(marketingErrorMessage(e));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Image</span>
      <div className="flex items-start gap-4">
        {media ? (
          <MediaThumb media={media} />
        ) : (
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-sage-300 bg-sage-50 text-center">
            <ImagePlus className="h-5 w-5 text-sage-600" aria-hidden="true" />
            <span className="text-[11px] text-sage-500">No image</span>
          </div>
        )}
        <div className="flex flex-col items-start gap-2">
          <input
            ref={input}
            id="cal-media-file"
            type="file"
            accept={MEDIA_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <label htmlFor="cal-media-file" className={`${BTN_SECONDARY} inline-block ${uploading ? 'opacity-60' : ''}`}>
            {uploading ? 'Uploading...' : media ? 'Upload a different image' : 'Upload an image'}
          </label>
          <button type="button" onClick={() => setShowLibrary((v) => !v)} aria-expanded={showLibrary} className={BTN_SECONDARY}>
            {showLibrary ? 'Hide library' : 'Choose from library'}
          </button>
          {media && (
            <button type="button" onClick={() => onChange(null)} className={BTN_DANGER}>
              Remove from this post
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-sage-500">PNG, JPEG, GIF or WebP, up to 5 MB. Only your marketing team can see these images.</p>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {showLibrary && (
        <Library
          onPick={(m) => {
            onChange(m);
            setShowLibrary(false);
          }}
        />
      )}
    </div>
  );
}
