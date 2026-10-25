import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageContent, parseBlocks } from './chat-message-content';
import type { ChatMessage } from '@/lib/api/aiChat';

const m = (over: Partial<ChatMessage>): ChatMessage => ({
  id: '1', role: 'assistant', status: 'ready', content: '', created_at: 't', ...over,
});

describe('parseBlocks', () => {
  it('splits headings, bullets and paragraphs', () => {
    const blocks = parseBlocks('## 1. Ship it\n\nDo **not** wait.\n- One country\n- One flow');
    expect(blocks).toEqual([
      { kind: 'heading', text: '1. Ship it' },
      { kind: 'paragraph', text: 'Do **not** wait.' },
      { kind: 'list', ordered: false, items: ['One country', 'One flow'] },
    ]);
  });
});

describe('parseBlocks quotes', () => {
  it('turns a > line into a quote block without the marker', () => {
    expect(parseBlocks('Write this:\n> “We help gig workers save.”')).toEqual([
      { kind: 'paragraph', text: 'Write this:' },
      { kind: 'quote', text: '“We help gig workers save.”' },
    ]);
  });
});

describe('ChatMessageContent', () => {
  it('renders bold and lists as elements, never raw markup', () => {
    const { container } = render(<ChatMessageContent message={m({ content: 'Do **not** wait\n- a' })} />);
    expect(container.querySelector('strong')?.textContent).toBe('not');
    expect(container.querySelector('li')?.textContent).toBe('a');
  });

  it('does not inject HTML from the model', () => {
    const { container } = render(<ChatMessageContent message={m({ content: '<img src=x onerror=alert(1)>' })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img');
  });

  it('shows a thinking state while generating', () => {
    render(<ChatMessageContent message={m({ status: 'generating' })} />);
    expect(screen.getByText('Thinking…')).toBeTruthy();
  });

  it('shows the honest failure copy when failed', () => {
    render(<ChatMessageContent message={m({ status: 'failed' })} />);
    expect(screen.getByText("Couldn't reach your co-founder. Try again.")).toBeTruthy();
  });
});
