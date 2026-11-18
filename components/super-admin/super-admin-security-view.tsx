'use client';

import React from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';

export function SuperAdminSecurityView(): React.JSX.Element {
  return (
    <div className="space-y-6 font-body">
      <div>
        <h2 className="text-base font-semibold text-main">Platform Security Configuration</h2>
        <p className="text-xs text-subtle mt-0.5">
          Read-only enforced security policies across all platform consoles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy 1: Authenticator app required for all staff */}
        <div className="p-5 bg-surface border border-neutral-subtle rounded-card shadow-card flex items-start gap-4">
          <div className="p-2.5 bg-brand-50 border border-brand-200 text-brand rounded-card flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-main">
              Authenticator app required for all staff.
            </h3>
            <p className="text-xs text-subtle leading-relaxed">
              Every staff account must enroll in two-factor authentication via a TOTP authenticator
              app before console access is granted. Non-enrolled accounts are blocked at the API guard.
            </p>
          </div>
        </div>

        {/* Policy 2: Fresh code required for every staff action */}
        <div className="p-5 bg-surface border border-neutral-subtle rounded-card shadow-card flex items-start gap-4">
          <div className="p-2.5 bg-brand-50 border border-brand-200 text-brand rounded-card flex-shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-main">
              A fresh code is required for every staff action.
            </h3>
            <p className="text-xs text-subtle leading-relaxed">
              Every administrative mutation, elevation, override, or suspension requires step-up
              verification with a single-use 6-digit authenticator code and an audited reason.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
