import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AiDrawer } from './ai-drawer';
import { AiDrawerProvider, useAiDrawer } from './ai-drawer-context';

const sendMessage = vi.fn().mockResolvedValue(true);
const startNewChat = vi.fn();
let messages: unknown[] = [];

let role: string | null = 'founder';
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('./workspace-context', () => ({ useWorkspace: () => ({ me: null, role, workspaceId: null, workspaceName: null, loading: false }) }));
vi.mock('@/components/ai/ai-status-banner', () => ({ AiStatusBanner: () => null }));
vi.mock('@/hooks/useAICoFounder', () => ({
  useAICoFounder: () => ({
    messages,
    isGenerating: false,
    threadLoading: false,
    error: null,
    sendMessage,
    startNewChat,
  }),
}));

function Opener({ seed }: { seed?: string }) {
  const { openAiDrawer } = useAiDrawer();
  return <button onClick={() => openAiDrawer(seed ? { seed } : undefined)}>open</button>;
}

const setup = (seed?: string) =>
  render(
    <AiDrawerProvider>
      <Opener seed={seed} />
      <AiDrawer />
    </AiDrawerProvider>,
  );

describe('AiDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messages = [];
    role = 'founder';
  });

  it('the dock button is named "Ask your AI Co-Founder" and its hover label carries ⌘J', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Ask your AI Co-Founder' })).toBeTruthy();
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('Ask your AI Co-Founder');
    expect(tip.textContent).toContain('⌘J');
  });

  it('⌘J / Ctrl+J toggles the drawer, with either letter case', () => {
    setup();
    expect(screen.queryByText('Open full view →')).toBeNull();
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(screen.getByText('Open full view →')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'J', ctrlKey: true });
    expect(screen.queryByText('Open full view →')).toBeNull();
  });

  it('Escape closes the open drawer and does nothing when it is closed', () => {
    setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Open full view →')).toBeNull();
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(screen.getByText('Open full view →')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Open full view →')).toBeNull();
  });

  it('the floating dock is hidden below md (the tab bar has an AI tab) and shown from md up', () => {
    setup();
    const cls = screen.getByRole('button', { name: 'Ask your AI Co-Founder' }).className;
    expect(cls).toContain('hidden');
    expect(cls).toContain('md:flex');
  });

  it('the dock button opens the drawer without sending anything', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Ask your AI Co-Founder' }));
    expect(screen.getByText('Open full view →')).toBeTruthy();
    expect(startNewChat).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('a seeded open ("Tell me more") starts a fresh conversation and sends the briefing as its first message', async () => {
    setup('Tell me more about today\'s briefing.\n\nHere is the briefing:\nNovaPay is at the idea stage.');
    fireEvent.click(screen.getByText('open'));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(startNewChat).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0]).toContain('NovaPay is at the idea stage.');
    expect(startNewChat.mock.invocationCallOrder[0]).toBeLessThan(sendMessage.mock.invocationCallOrder[0]);
  });

  it('the seed is sent once, not again on later renders', async () => {
    setup('seed text');
    fireEvent.click(screen.getByText('open'));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    await act(async () => {
      fireEvent.keyDown(window, { key: 'j', metaKey: true });
      fireEvent.keyDown(window, { key: 'j', metaKey: true });
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('roles that cannot use the AI Co-Founder get no dock, no drawer and no ⌘J (hidden, not disabled)', () => {
    role = 'mentor';
    setup();
    expect(screen.queryByRole('button', { name: 'Ask your AI Co-Founder' })).toBeNull();
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(screen.queryByText('Open full view →')).toBeNull();
  });
});
