'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Guide §7–§8: the positioning-map row holds only the AXES (editable labels);
// competitor coordinates live on the competitor RECORDS (map_x/map_y) and are
// only PROJECTED here (renamed x/y). PUT accepts `axes` only — a `competitors`
// key in the body is silently ignored (the coordinate-on-competitor trap).

export interface Axis {
  label: string;
  low: string;
  high: string;
}
export interface PositioningAxes {
  x: Axis;
  y: Axis;
}
export interface MapCompetitor {
  id: string;
  name: string;
  x: number | null;
  y: number | null;
  threat_level: string;
}

const DEFAULT_AXES: PositioningAxes = {
  x: { label: 'Price', low: 'Low', high: 'High' },
  y: { label: 'Quality', low: 'Low', high: 'High' },
};

export function useBusinessPositioningMap() {
  const [axes, setAxes] = useState<PositioningAxes>(DEFAULT_AXES);
  const [competitors, setCompetitors] = useState<MapCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { axes?: PositioningAxes; competitors?: MapCompetitor[] } }>(
        '/business-builder/positioning-map'
      );
      const d = res?.data;
      if (d?.axes) setAxes(d.axes);
      setCompetitors(Array.isArray(d?.competitors) ? d.competitors : []);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to load positioning map');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  // PUT accepts axes only; response is `{axes}` (no competitors) — keep the
  // competitor projection we already have and just update the axes.
  const saveAxes = useCallback(async (next: PositioningAxes) => {
    const res = await apiClient<{ data?: { axes?: PositioningAxes } }>('/business-builder/positioning-map', {
      method: 'PUT',
      body: JSON.stringify({ axes: next }),
    });
    if (res?.data?.axes) setAxes(res.data.axes);
    return res?.data?.axes ?? next;
  }, []);

  return { axes, competitors, loading, error, refetch: load, saveAxes };
}
