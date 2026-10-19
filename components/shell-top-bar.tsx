'use client';

import React, { useState } from 'react';
import { DashboardNavbar } from '@/components/dashboardnavbar';
import { InviteModal } from '@/components/team/invite-modal';
import { useWorkspace } from '@/components/workspace-context';

/**
 * The PRD 2.1 global top bar (⌘K search, Health chip, bell, + Invite) plus the
 * invite modal it opens, so a section layout mounts one component and gets the
 * same shell as the dashboard.
 */
export function ShellTopBar({ title }: { title: string }) {
  const { workspaceName } = useWorkspace();
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <>
      <DashboardNavbar title={title} onInvite={() => setInviteOpen(true)} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} startupName={workspaceName} />
    </>
  );
}
