import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import Sidebar from './sidebar';

let role: string | null = 'founder';
let roleLoading = false;
let missionOpen = 0;

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('@/hooks/useNotifications', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('@/hooks/useStartupProfile', () => ({
  useStartupProfile: () => ({ name: 'NovaPay', stageLabel: 'Idea stage', logoUrl: null, founderName: 'Victor Founder', founderRole: 'Founder & CEO', loading: false }),
}));
vi.mock('@/hooks/useMissionOpenCount', () => ({ useMissionOpenCount: (enabled: boolean) => (enabled ? missionOpen : 0) }));
vi.mock('@/lib/api/profile', () => ({ logout: vi.fn() }));
vi.mock('@/components/workspace-context', () => ({
  useWorkspace: () => ({
    me: { user: { id: 'u', email: 'v@example.com' }, profile: { avatar_url: null }, memberships: [{ startup_id: 's', name: 'NovaPay', role }], active_workspace_id: 's' },
    role,
    loading: roleLoading,
  }),
}));

const nav = () => screen.getByRole('complementary', { name: 'Main navigation' });
const hasLink = (name: RegExp | string) => within(nav()).queryByRole('link', { name }) !== null;

describe('Sidebar (PRD 2.1)', () => {
  beforeEach(() => {
    role = 'founder';
    roleLoading = false;
    missionOpen = 0;
  });

  it('hides Funding Hub, Investor Readiness and Marketplace until their APIs ship', () => {
    render(<Sidebar />);
    for (const label of ['Funding Hub', 'Investor Readiness', 'Marketplace']) {
      expect(hasLink(label)).toBe(false);
    }
  });

  it('founder sees every group, including the founder-only Journal with its lock', () => {
    render(<Sidebar />);
    for (const label of ['Dashboard', "Today's Mission", 'Health Score', 'Roadmap', 'Finance Hub', 'Team', 'Journal']) {
      expect(hasLink(label)).toBe(true);
    }
    expect(['OVERVIEW', 'BUILD', 'GROW', 'FUND & PROTECT', 'RESOURCES', 'WORKSPACE'].every((t) => within(nav()).queryByText(t))).toBe(true);
  });

  it('accountant sees only Finance Hub, Documents and Calendar (invited meetings only) plus Dashboard; everything else is hidden, not disabled', () => {
    role = 'accountant';
    render(<Sidebar />);
    for (const label of ['Dashboard', 'Finance Hub', 'Documents', 'Calendar']) expect(hasLink(label)).toBe(true);
    for (const label of ["Today's Mission", 'AI Co-Founder', 'Marketing Hub', 'Journal', 'Team', 'Roadmap', 'Legal & Compliance']) {
      expect(hasLink(label)).toBe(false);
    }
    // a group with no visible items disappears with it
    expect(within(nav()).queryByText('BUILD')).toBeNull();
    expect(within(nav()).queryByText('FUND & PROTECT')).toBeNull();
    // bottom links stay
    expect(hasLink('Notifications')).toBe(true);
    expect(hasLink('Settings & Billing')).toBe(true);
  });

  it('Journal is hidden from a team member', () => {
    role = 'team_member';
    render(<Sidebar />);
    expect(hasLink('Journal')).toBe(false);
    expect(hasLink("Today's Mission")).toBe(true);
  });

  it("Today's Mission shows the open-task badge, and none at zero", () => {
    missionOpen = 4;
    const { unmount } = render(<Sidebar />);
    expect(screen.getByLabelText('4 open tasks')).toBeTruthy();
    unmount();
    missionOpen = 0;
    render(<Sidebar />);
    expect(screen.queryByLabelText(/open task/)).toBeNull();
  });

  it('a role with no mission gets no badge', () => {
    role = 'mentor';
    missionOpen = 4;
    render(<Sidebar />);
    expect(screen.queryByLabelText(/open task/)).toBeNull();
  });

  it('shows a navigation skeleton while the role loads, not the full list that would then shrink', () => {
    roleLoading = true;
    render(<Sidebar />);
    expect(screen.getByRole('status', { name: 'Loading navigation' })).toBeTruthy();
    expect(hasLink('Finance Hub')).toBe(false);
  });

  it('the avatar footer shows the workspace role, not the profile title', () => {
    role = 'mentor';
    render(<Sidebar />);
    const footer = screen.getByRole('button', { name: /Victor Founder/ });
    expect(within(footer).getByText('Mentor')).toBeTruthy();
    expect(within(footer).queryByText(/Founder & CEO/)).toBeNull();
  });

  it('avatar menu: Profile, Preferences, Sign out (PRD 2.1)', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: /Victor Founder/ }));
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe('/account');
    expect(screen.getByRole('link', { name: 'Preferences' }).getAttribute('href')).toBe('/notifications?tab=preferences');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeTruthy();
    expect(screen.queryByText('Log out')).toBeNull();
  });
});
