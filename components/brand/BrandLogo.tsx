import Image from 'next/image';

// The real Cofoundaz marks, generated from the brand PNGs (see docs/sop/2026-10-24-brand-logo.md).
// `tone="light"` is the white-wordmark version for dark surfaces (sidebar rail, admin portals).
const ASSETS = {
  wordmark: { dark: '/brand/cofoundaz-wordmark.png', light: '/brand/cofoundaz-wordmark-light.png', ratio: 591 / 96 },
  mark: { dark: '/brand/cofoundaz-mark.png', light: '/brand/cofoundaz-mark-light.png', ratio: 1 },
} as const;

type Props = {
  variant?: keyof typeof ASSETS;
  tone?: 'dark' | 'light';
  /** Rendered height in px; width follows the asset's aspect ratio. */
  height?: number;
  className?: string;
  /** Above-the-fold logos load eagerly (Next 16 deprecates `priority`). */
  eager?: boolean;
};

export default function BrandLogo({ variant = 'wordmark', tone = 'dark', height = 28, className, eager }: Props) {
  const asset = ASSETS[variant];
  return (
    <Image
      src={asset[tone]}
      alt="Cofoundaz"
      width={Math.round(height * asset.ratio)}
      height={height}
      loading={eager ? 'eager' : undefined}
      className={className}
    />
  );
}
