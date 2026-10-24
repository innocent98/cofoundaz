import { describe, expect, it } from 'vitest';
import { formatDuration, formatIssuedOn, safeLinkedInUrl, videoEmbedSrc } from './learning-format';

const video = { provider: 'youtube', id: 'dQw4w9WgXcQ', embed_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' };

describe('videoEmbedSrc', () => {
  it('returns null when there is no video', () => {
    expect(videoEmbedSrc(null, 0)).toBeNull();
  });
  it('resumes with ?start=', () => {
    expect(videoEmbedSrc(video, 95)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=95');
    expect(videoEmbedSrc(video, 0)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
  it('refuses any other host or scheme', () => {
    expect(videoEmbedSrc({ ...video, embed_url: 'https://www.youtube.com/embed/x' }, 0)).toBeNull();
    expect(videoEmbedSrc({ ...video, embed_url: 'http://www.youtube-nocookie.com/embed/x' }, 0)).toBeNull();
    expect(videoEmbedSrc({ ...video, embed_url: 'javascript:alert(1)' }, 0)).toBeNull();
  });
});

describe('safeLinkedInUrl', () => {
  it('only allows https linkedin.com', () => {
    expect(safeLinkedInUrl('https://www.linkedin.com/profile/add?x=1')).not.toBeNull();
    expect(safeLinkedInUrl('https://evil.example/profile/add')).toBeNull();
    expect(safeLinkedInUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(34)).toBe('34 min');
    expect(formatDuration(64)).toBe('1 h 4 min');
    expect(formatDuration(120)).toBe('2 h');
  });
  it('formats a plain date without shifting the day', () => {
    expect(formatIssuedOn('2026-10-22')).toBe('22 October 2026');
  });
});
