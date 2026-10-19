import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RouteGuard } from './route-guard';

let role: string | null = 'mentor';
let loading = false;
let pathname = '/mission';

vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ me: null, role, loading }) }));

const page = () => render(<RouteGuard><p>Mission page</p></RouteGuard>);

describe('RouteGuard', () => {
  beforeEach(() => {
    role = 'mentor';
    loading = false;
    pathname = '/mission';
  });

  it('blocks a mentor on /mission with a way back', () => {
    page();
    expect(screen.queryByText('Mission page')).toBeNull();
    expect(screen.getByText("You don't have access to this page.")).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to dashboard' }).getAttribute('href')).toBe('/dashboard');
  });

  it('blocks nested routes of a gated section', () => {
    pathname = '/mission/settings';
    page();
    expect(screen.queryByText('Mission page')).toBeNull();
  });

  it('lets a founder open /mission', () => {
    role = 'founder';
    page();
    expect(screen.getByText('Mission page')).toBeTruthy();
    expect(screen.queryByText("You don't have access to this page.")).toBeNull();
  });

  it('shows sections open to every role', () => {
    pathname = '/dashboard';
    page();
    expect(screen.getByText('Mission page')).toBeTruthy();
  });

  it('renders nothing for a gated section while the role loads (no flash)', () => {
    loading = true;
    role = null;
    page();
    expect(screen.queryByText('Mission page')).toBeNull();
    expect(screen.queryByText("You don't have access to this page.")).toBeNull();
  });

  it('shows everything when the role is unknown after loading', () => {
    role = null;
    page();
    expect(screen.getByText('Mission page')).toBeTruthy();
  });
});
