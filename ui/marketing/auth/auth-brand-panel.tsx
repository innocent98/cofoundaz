import Link from "next/link";

export function AuthBrandPanel() {
  return (
    <div className="bg-[#0b241a] text-white p-8 lg:p-12 flex flex-col justify-between min-h-screen">
      {/* Top Header / Logo */}
      <Link href="/" className="flex items-center gap-3 w-fit">
        <div className="w-9 h-9 bg-white text-[#0b241a] font-bold text-xl rounded-xl flex items-center justify-center shadow-sm">
          C
        </div>
        <span className="font-serif text-2xl tracking-tight font-medium text-white">
          Cofoundaz
        </span>
      </Link>

      {/* Main Content */}
      <div className="my-12 lg:my-0 space-y-8 max-w-md">
        <h1 className="font-serif italic text-4xl lg:text-5xl leading-tight font-light text-white">
          The co-founder
          <br />
          who never sleeps.
        </h1>

        <div className="space-y-4 pt-2">
          {/* Feature Item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#14382a] flex items-center justify-center text-[#4ade80] shrink-0">
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
            <span className="text-sm font-medium text-emerald-100/90">
              Set up in under 10 minutes
            </span>
          </div>

          {/* Feature Item 2 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#14382a] flex items-center justify-center text-[#4ade80] shrink-0">
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
            <span className="text-sm font-medium text-emerald-100/90">
              No credit card required
            </span>
          </div>

          {/* Feature Item 3 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#14382a] flex items-center justify-center text-[#4ade80] shrink-0">
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
            <span className="text-sm font-medium text-emerald-100/90">
              Your data is never used to train AI
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-emerald-200/40">
        © 2026 Cofoundaz
      </div>
    </div>
  );
}