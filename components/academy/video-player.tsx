'use client';

import React, { useEffect, useRef } from 'react';
import type { LessonVideo } from '@/lib/api/learning';
import { videoEmbedSrc } from '@/lib/learning-format';

/**
 * Privacy-enhanced YouTube embed (youtube-nocookie.com). Resumes at `startS`
 * and reports the playhead every 15 s through the iframe API so the lesson's
 * saved position (`position_s`) stays current.
 */
export function VideoPlayer({
  video,
  title,
  startS,
  onPosition,
}: {
  video: LessonVideo;
  title: string;
  startS: number;
  onPosition: (seconds: number) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const last = useRef(0);
  const src = videoEmbedSrc(video, startS);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data) as { event?: string; info?: { currentTime?: number } };
        const t = msg.info?.currentTime;
        if (msg.event === 'infoDelivery' && typeof t === 'number' && t > 0 && Date.now() - last.current > 15000) {
          last.current = Date.now();
          onPosition(Math.floor(t));
        }
      } catch {
        /* not a player message */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onPosition]);

  if (!src) return null;
  const withApi = `${src}${src.includes('?') ? '&' : '?'}enablejsapi=1`;
  return (
    <div className="aspect-video overflow-hidden rounded-modal bg-black">
      <iframe
        ref={frame}
        src={withApi}
        title={title}
        className="h-full w-full"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1 }), 'https://www.youtube-nocookie.com')}
      />
    </div>
  );
}
