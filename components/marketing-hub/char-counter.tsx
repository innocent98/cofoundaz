import React from 'react';

/**
 * "n / limit" under a variant. Over the limit it turns red AND says how far over, so the state is
 * never carried by colour alone. `kind` tells a hard platform limit from a recommended length.
 */
export function CharCounter({
  count,
  limit,
  kind = 'hard',
  platformLabel,
}: {
  count: number;
  limit: number | null | undefined;
  kind?: 'hard' | 'recommended';
  platformLabel?: string;
}) {
  if (typeof limit !== 'number') {
    return <p className="text-xs text-sage-500 tabular-nums">{count} characters</p>;
  }
  const over = count > limit;
  const forPlatform = platformLabel ? ` for ${platformLabel}` : '';
  return (
    <p
      className={`text-xs tabular-nums ${over ? 'text-red-700 font-semibold' : 'text-sage-500'}`}
      aria-label={`${count} of ${limit} characters${forPlatform}${over ? `, ${count - limit} over` : ''}`}
    >
      <span aria-hidden="true">
        {count} / {limit}
        {over
          ? ` (${count - limit} over${kind === 'recommended' ? ', may be cut off' : ', the platform will reject it'})`
          : ''}
      </span>
    </p>
  );
}
