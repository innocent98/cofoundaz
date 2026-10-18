import { useEffect, useMemo, useState } from 'react';
import { listMembers, memberLabel, type TeamMember } from '@/lib/api/members';

/** Active workspace members for pickers and @-mentions (GET /team/members). */
export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    listMembers()
      .then((m) => {
        if (live) setMembers(m);
      })
      .catch(() => {
        if (live) setError(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const emailById = useMemo(() => new Map(members.map((m) => [m.user_id, m.email])), [members]);
  const labelById = useMemo(() => new Map(members.map((m) => [m.user_id, memberLabel(m)])), [members]);
  return { members, loading, error, emailById, labelById };
}
