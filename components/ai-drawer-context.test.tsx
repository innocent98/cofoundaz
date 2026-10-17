import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AiDrawerProvider, useAiDrawer } from './ai-drawer-context';

const wrapper = ({ children }: { children: React.ReactNode }) => <AiDrawerProvider>{children}</AiDrawerProvider>;

describe('AI drawer context', () => {
  it('opens and closes', () => {
    const { result } = renderHook(() => useAiDrawer(), { wrapper });
    act(() => result.current.openAiDrawer());
    expect(result.current.isAiDrawerOpen).toBe(true);
    expect(result.current.seed).toBeNull();
    act(() => result.current.closeAiDrawer());
    expect(result.current.isAiDrawerOpen).toBe(false);
  });

  it('a seeded open ("Tell me more") carries the text, with a new id each time so the same text can be re-sent', () => {
    const { result } = renderHook(() => useAiDrawer(), { wrapper });
    act(() => result.current.openAiDrawer({ seed: 'About my briefing' }));
    expect(result.current.isAiDrawerOpen).toBe(true);
    const first = result.current.seed;
    expect(first?.text).toBe('About my briefing');
    act(() => result.current.clearSeed());
    expect(result.current.seed).toBeNull();
    act(() => result.current.openAiDrawer({ seed: 'About my briefing' }));
    expect(result.current.seed?.id).toBeGreaterThan(0);
  });

  it('a click event passed as the argument is not treated as a seed', () => {
    const { result } = renderHook(() => useAiDrawer(), { wrapper });
    act(() => (result.current.openAiDrawer as unknown as (e: unknown) => void)({ type: 'click' }));
    expect(result.current.seed).toBeNull();
    expect(result.current.isAiDrawerOpen).toBe(true);
  });

  it('a blank seed is ignored', () => {
    const { result } = renderHook(() => useAiDrawer(), { wrapper });
    act(() => result.current.openAiDrawer({ seed: '   ' }));
    expect(result.current.seed).toBeNull();
  });
});
