import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export function AuthBrandPanel() {
  return (
    <div className="bg-brand-x0b241a text-white p-8 lg:p-12 flex flex-col justify-between min-h-screen">
      {/* Top Header / Logo */}
      <Link href="/" className="flex items-center gap-3 w-fit">
        <BrandLogo tone="light" height={32} eager />
      </Link>

      {/* Main Content */}
      <div className="my-12 lg:my-0 space-y-8 max-w-md">
        {/* Decorative brand tagline — not a heading. The page's single <h1>
            is the auth form's own heading (see auth-form.tsx); keeping this a
            <p> avoids two <h1>s per auth page (a11y: one h1 per page). */}
        <p className="font-display italic text-4xl lg:text-5xl leading-tight font-light text-white">
          The co-founder
          <br />
          who never sleeps.
        </p>

        <div className="space-y-4 pt-2">
          {/* Feature Item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-input bg-brand-x14382a flex items-center justify-center text-brand-x4ade80 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-brand-100/90">
              Set up in under 10 minutes
            </span>
          </div>

          {/* Feature Item 2 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-input bg-brand-x14382a flex items-center justify-center text-brand-x4ade80 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-brand-100/90">
              No credit card required
            </span>
          </div>

          {/* Feature Item 3 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-input bg-brand-x14382a flex items-center justify-center text-brand-x4ade80 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-brand-100/90">
              Your data is never used to train AI
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-brand-200/70">
        © 2026 Cofoundaz
      </div>
    </div>
  );
}