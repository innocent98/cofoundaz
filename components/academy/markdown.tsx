import React from 'react';

// Minimal, safe markdown renderer for Academy content. It builds React elements
// only: no raw HTML is ever parsed or injected (a `<script>` in the source is shown
// as literal text), and links are limited to https/http/mailto or in-app paths.
// Supported: # to ###### headings, paragraphs, - * + and 1. lists, > quotes,
// ``` fences, --- rules, **bold**, *italic*, `code`, [text](url).

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
  if (u.startsWith('/') && !u.startsWith('//') && !/[\\\s]/.test(u)) return u;
  return null;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rounded bg-neutral-100 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeUrl(link[2]);
      if (!href) return <React.Fragment key={key}>{link[1]}</React.Fragment>;
      const external = /^(https?:|mailto:)/i.test(href);
      return (
        <a
          key={key}
          href={href}
          className="text-accent-700 underline underline-offset-2"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

const HEADING_CLASS: Record<number, string> = {
  1: 'text-2xl font-display font-semibold text-neutral-900 mt-6',
  2: 'text-xl font-display font-semibold text-neutral-900 mt-6',
  3: 'text-lg font-semibold text-neutral-900 mt-5',
  4: 'text-base font-semibold text-neutral-900 mt-4',
  5: 'text-sm font-semibold text-neutral-900 mt-4',
  6: 'text-sm font-semibold text-neutral-700 mt-4',
};

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let n = 0;
  const key = () => `b${n++}`;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key()} className="overflow-x-auto rounded-card bg-neutral-100 p-3 text-xs">
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const Tag = `h${level}` as 'h1';
      const k = key();
      blocks.push(
        <Tag key={k} className={HEADING_CLASS[level]}>
          {renderInline(h[2], k)}
        </Tag>,
      );
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key()} className="my-4 border-neutral-200" />);
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      const k = key();
      blocks.push(
        <blockquote key={k} className="border-l-4 border-accent-200 pl-4 italic text-neutral-700">
          {renderInline(quote.join(' '), k)}
        </blockquote>,
      );
      continue;
    }
    const ul = /^\s*[-*+]\s+/;
    const ol = /^\s*\d+[.)]\s+/;
    if (ul.test(line) || ol.test(line)) {
      const ordered = ol.test(line);
      const re = ordered ? ol : ul;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''));
      const k = key();
      const kids = items.map((t, j) => <li key={j}>{renderInline(t, `${k}-${j}`)}</li>);
      blocks.push(
        ordered ? (
          <ol key={k} className="list-decimal space-y-1 pl-6">
            {kids}
          </ol>
        ) : (
          <ul key={k} className="list-disc space-y-1 pl-6">
            {kids}
          </ul>
        ),
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|```|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    if (para.length === 0) {
      para.push(lines[i++]);
    }
    const k = key();
    blocks.push(<p key={k}>{renderInline(para.join(' '), k)}</p>);
  }

  return <div className={`space-y-3 text-sm leading-relaxed text-neutral-700 ${className}`}>{blocks}</div>;
}
