import type { FitLink } from '@/lib/api/business-builder';

/** A fit-line joins a pain reliever to a pain, or a gain creator to a gain. */
export const FIT_PAIRS: Record<string, string> = {
  pain_relievers: 'pains',
  gain_creators: 'gains',
};

export function targetBlockFor(fromBlock: string): string | null {
  return FIT_PAIRS[fromBlock] ?? null;
}

export function isFromBlock(block: string): boolean {
  return block in FIT_PAIRS;
}

export function sameLink(a: FitLink, b: FitLink): boolean {
  return a.from_block === b.from_block && a.from_item === b.from_item && a.to_block === b.to_block && a.to_item === b.to_item;
}

/** Builds a link from a source and a target, or null when the pair is not valid. */
export function makeLink(from: { block: string; item: string }, to: { block: string; item: string }): FitLink | null {
  if (FIT_PAIRS[from.block] !== to.block) return null;
  return { from_block: from.block, from_item: from.item, to_block: to.block, to_item: to.item };
}

/** Adds the link, or removes it when it already exists (the same gesture toggles). Returns a new list. */
export function toggleLink(links: FitLink[], link: FitLink): FitLink[] {
  return links.some((l) => sameLink(l, link)) ? links.filter((l) => !sameLink(l, link)) : [...links, link];
}

/** The id the DOM uses to find a chip. */
export function chipId(block: string, item: string): string {
  return `${block}::${item}`;
}

/** Lines whose both ends still exist on the canvas (the API prunes on read; this guards a stale local list). */
export function liveLinks(links: FitLink[], listOf: (block: string) => string[]): FitLink[] {
  return links.filter((l) => listOf(l.from_block).includes(l.from_item) && listOf(l.to_block).includes(l.to_item));
}

/** A smooth S-curve between two points, for the fit-line SVG. */
export function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(24, Math.abs(x2 - x1) / 2);
  const c1 = x1 < x2 ? x1 + dx : x1 - dx;
  const c2 = x1 < x2 ? x2 - dx : x2 + dx;
  return `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
}
