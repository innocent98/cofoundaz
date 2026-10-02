import { useState, useEffect } from 'react';
import { getOnboardingState } from '@/lib/api/onboarding';
import { ApiError } from '@/lib/api/client';

export interface StartupProfile {
  /** Workspace / startup name (e.g. "Kolo"). Null until loaded or if unset. */
  name: string | null;
  /** Display label for the current stage, e.g. "Validation stage". */
  stageLabel: string | null;
  /** Uploaded startup logo URL, or null if none uploaded. */
  logoUrl: string | null;
  /** Signed-in founder's full name. */
  founderName: string | null;
  /** Founder's role title (e.g. "Founder", "CEO"). */
  founderRole: string | null;
  loading: boolean;
}

// StartupStage values are lowercase ('idea' | 'validation' | ...); the comp
// renders them as "Validation stage". Capitalise and append " stage" unless the
// label already ends in it.
function toStageLabel(stage: string | null | undefined): string | null {
  const s = (stage ?? '').trim();
  if (!s) return null;
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return /stage$/i.test(cap) ? cap : `${cap} stage`;
}

/**
 * Reads the real startup identity (name, stage, logo) and founder identity
 * (name, role) from the onboarding profile — `GET /onboarding/state` — so the
 * sidebar renders the user's actual workspace instead of a hardcoded placeholder.
 * One lightweight fetch on mount; the sidebar lives in the dashboard layout, so
 * it loads once per session rather than per route change.
 */
export function useStartupProfile(): StartupProfile {
  const [profile, setProfile] = useState<StartupProfile>({
    name: null,
    stageLabel: null,
    logoUrl: null,
    founderName: null,
    founderRole: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await getOnboardingState();
        if (!active) return;
        setProfile({
          name: s.name ?? null,
          stageLabel: toStageLabel(s.stage),
          logoUrl: s.logo_url ?? null,
          founderName: s.full_name ?? null,
          founderRole: s.role_title ?? null,
          loading: false,
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          console.warn('Startup profile unauthorized:', err.message);
        }
        // Honest failure: stop loading, keep everything null so the UI shows
        // neutral fallbacks rather than fabricated data.
        setProfile((prev) => ({ ...prev, loading: false }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return profile;
}
