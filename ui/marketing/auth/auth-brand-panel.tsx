"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

const VALUE_PROPS = [
  "Set up in under 10 minutes",
  "No credit card required",
  "Your data is never used to train AI",
] as const;

function Tick() {
  return (
    <div className="w-7 h-7 rounded-input bg-brand-x14382a flex items-center justify-center text-brand-x4ade80 shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </div>
  );
}

export function AuthBrandPanel() {
  // PRD §01.1: the value-prop line rotates. All three stay in the DOM for screen readers;
  // the active one is bolder (never dimmed: contrast).
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % VALUE_PROPS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-brand-x0b241a text-white px-6 py-4 lg:p-12 flex flex-col justify-between lg:min-h-screen">
      <Link href="/" className="flex items-center gap-3 w-fit">
        <BrandLogo tone="light" height={32} eager />
      </Link>

      {/* Tagline and value props are desktop-only: under lg the form must start above the fold. */}
      <div className="hidden lg:block my-12 lg:my-0 space-y-8 max-w-md">
        {/* Decorative tagline, not a heading: the page's single <h1> is the form's own. */}
        <p className="font-display italic text-4xl lg:text-5xl leading-tight font-light text-white">
          The co-founder
          <br />
          who never sleeps.
        </p>

        <ul className="space-y-4 pt-2">
          {VALUE_PROPS.map((line, i) => (
            <li
              key={line}
              className="flex items-center gap-3"
            >
              <Tick />
              <span className={`text-sm transition-colors duration-500 ${i === active ? "font-semibold text-white" : "font-medium text-brand-100/90"}`}>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden lg:block text-xs text-brand-200/70">© 2026 Cofoundaz</div>
    </div>
  );
}
