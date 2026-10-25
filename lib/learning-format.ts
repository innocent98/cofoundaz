import type { CourseLevel, LessonVideo } from '@/lib/api/learning';

export function levelLabel(level: CourseLevel | string): string {
  return level ? level.charAt(0).toUpperCase() + level.slice(1) : '';
}

export function stageLabel(stage: string): string {
  return stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : '';
}

export function formatDuration(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${min} min`;
}

/**
 * The only player source we trust: the privacy-enhanced YouTube embed the API
 * returns. Anything else (other host, http, odd path) yields null and the lesson
 * falls back to transcript only. `positionS` resumes playback via `?start=`.
 */
export function videoEmbedSrc(video: LessonVideo | null, positionS: number): string | null {
  if (!video) return null;
  try {
    const u = new URL(video.embed_url);
    if (u.protocol !== 'https:' || u.hostname !== 'www.youtube-nocookie.com' || !u.pathname.startsWith('/embed/')) {
      return null;
    }
    if (positionS > 0) u.searchParams.set('start', String(Math.floor(positionS)));
    return u.toString();
  } catch {
    return null;
  }
}

/** Only a LinkedIn add-to-profile link is opened from a certificate. */
export function safeLinkedInUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'www.linkedin.com' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function formatIssued(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "2026-10-22" to "22 October 2026" (no timezone shift). */
export function formatIssuedOn(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
