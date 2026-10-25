/** A short, readable name for a canvas note, used in button labels. */
export function noteLabel(text: string, max = 40): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return 'empty note';
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
