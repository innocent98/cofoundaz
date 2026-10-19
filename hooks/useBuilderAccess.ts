'use client';

import { useMemo } from 'react';
import { useWorkspace } from '@/components/workspace-context';
import { builderAccess, type BuilderAccess } from '@/lib/bb-access';

/** The caller's real workspace role, turned into what Business Builder lets them do. */
export function useBuilderAccess(): BuilderAccess & { role: string | null; roleLoading: boolean } {
  const { role, loading } = useWorkspace();
  return useMemo(() => ({ ...builderAccess(role, loading), role, roleLoading: loading }), [role, loading]);
}
