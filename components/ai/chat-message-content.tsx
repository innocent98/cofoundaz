import React from 'react';
import type { ChatMessage } from '@/lib/api/aiChat';
import { REPLY_FAILED_COPY } from '@/hooks/useAICoFounder';

// Assistant replies are freeform text that may carry light markdown (headings,
// bullets, **bold**). We render that as plain React elements (never HTML strings)
// so nothing the model returns can inject markup.

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'paragraph'; text: string };

export function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'paragraph', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: 'list', ...list });
    list = null;
  };

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);
    if (!line) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: 'heading', text: heading[1] });
    } else if (quote) {
      flushPara();
      flushList();
      if (quote[1]) blocks.push({ kind: 'quote', text: quote[1] });
    } else if (bullet || numbered) {
      flushPara();
      const ordered = !bullet;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function AssistantText({ content }: { content: string }) {
  return (
    <div className="space-y-2.5 leading-relaxed">
      {parseBlocks(content).map((b, i) => {
        if (b.kind === 'heading') {
          return <p key={i} className="font-semibold">{renderInline(b.text)}</p>;
        }
        if (b.kind === 'quote') {
          return (
            <blockquote key={i} className="border-l-2 border-sage-200 pl-3 italic text-sage-600">
              {renderInline(b.text)}
            </blockquote>
          );
        }
        if (b.kind === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i} className={`${b.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
              {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
            </Tag>
          );
        }
        return <p key={i}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}

/** Body of one chat bubble: the user's text, or the assistant's thinking / reply / failure. */
export function ChatMessageContent({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>;
  }
  if (message.status === 'generating') {
    return (
      <div className="flex items-center gap-2 h-5 text-sage-500" role="status" aria-label="Your co-founder is thinking">
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" />
        </span>
        <span className="text-xs">Thinking…</span>
      </div>
    );
  }
  if (message.status === 'failed') {
    return <p className="text-sage-600">{REPLY_FAILED_COPY}</p>;
  }
  return <AssistantText content={message.content} />;
}
