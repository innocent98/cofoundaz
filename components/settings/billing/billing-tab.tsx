'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceUrl } from '@/lib/replace-url';
import { apiErrorInfo } from '@/lib/api/api-error';
import { verifyReference, type Subscription } from '@/lib/api/billing';
import { checkoutReference, verifyMessage, type VerifyMessage } from '@/lib/billing-format';
import { Banner, Button, LoadError, Spinner } from '../ui';
import { AddonsView } from './billing-addons';
import { InvoicesView } from './billing-invoices';
import { OverviewView } from './billing-overview';
import { PaymentView } from './billing-payment';
import { PlansView } from './billing-plans';
import { UsageView } from './billing-usage';

export const BILLING_VIEWS = ['overview', 'plans', 'usage', 'invoices', 'payment', 'addons'] as const;
export type BillingView = (typeof BILLING_VIEWS)[number];
const LABELS: Record<BillingView, string> = {
  overview: 'Overview', plans: 'Plans', usage: 'Usage', invoices: 'Invoices', payment: 'Payment', addons: 'Add-ons',
};

export function BillingTab({
  isFounder,
  sub,
  subError,
  reloadSub,
}: {
  isFounder: boolean;
  sub: Subscription | null;
  subError: string | null;
  reloadSub: () => Promise<void>;
}): React.JSX.Element {
  const pathname = usePathname();
  const params = useSearchParams();
  const view: BillingView = (BILLING_VIEWS as readonly string[]).includes(params.get('view') ?? '')
    ? (params.get('view') as BillingView)
    : 'overview';

  const [returnMsg, setReturnMsg] = useState<VerifyMessage | null>(null);
  const [returnChecking, setReturnChecking] = useState(false);
  const handled = useRef<string | null>(null);

  const go = (v: BillingView) => replaceUrl(`${pathname}?tab=billing${v === 'overview' ? '' : `&view=${v}`}`);

  // Back from Paystack: verify the reference once. The query string never decides success; only the
  // verify response does. Then drop the reference from the URL so a refresh doesn't replay it.
  const reference = checkoutReference(params.toString());
  useEffect(() => {
    if (!isFounder || !reference || handled.current === reference) return;
    // Runs once per reference (also under React strict mode, which mounts twice): the guard is the ref, so the
    // result is applied without a cancelled-flag that would drop it when the first mount is torn down.
    handled.current = reference;
    setReturnChecking(true);
    void (async () => {
      try {
        const v = await verifyReference(reference);
        setReturnMsg(verifyMessage(v));
      } catch (e) {
        const info = apiErrorInfo(e, "We couldn't confirm that payment yet.");
        setReturnMsg(
            info.status === 404
              ? { tone: 'error', text: "We couldn't find that payment on this workspace." }
              : info.code === 'INVALID_REFERENCE'
                ? { tone: 'error', text: "That payment link isn't valid. Nothing was charged by it." }
                : { tone: 'info', text: "We couldn't confirm that payment yet. This page updates as soon as it lands." },
          );
      } finally {
        setReturnChecking(false);
        await reloadSub();
        replaceUrl(`${pathname}?tab=billing`);
      }
    })();
    // reloadSub/pathname are stable for the life of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFounder, reference]);

  if (!isFounder) {
    return <Banner tone="info" title="Billing is managed by your workspace founder.">Ask them if you need a receipt or a plan change.</Banner>;
  }
  if (subError && !sub) return <LoadError message={subError} onRetry={reloadSub} />;
  if (!sub) return <Spinner label="Loading billing" />;

  return (
    <div className="space-y-6">
      {returnChecking && <Banner tone="info">Confirming your payment…</Banner>}
      {returnMsg && (
        <Banner
          tone={returnMsg.tone}
          action={<Button variant="ghost" onClick={() => setReturnMsg(null)}>Dismiss</Button>}
        >
          {returnMsg.text}
        </Banner>
      )}

      <nav aria-label="Billing sections" className="flex gap-2 overflow-x-auto no-scrollbar">
        {BILLING_VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-current={view === v ? 'page' : undefined}
            onClick={() => go(v)}
            className={`px-4 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border ${
              view === v
                ? 'font-semibold bg-accent-200 text-ink border-accent-xdfc4b2 shadow-card'
                : 'font-medium text-ink-muted border-transparent hover:bg-neutral-xefefee'
            }`}
          >
            {LABELS[v]}
          </button>
        ))}
      </nav>

      {view === 'overview' && <OverviewView sub={sub} onChanged={reloadSub} onNavigate={go} />}
      {view === 'plans' && <PlansView sub={sub} onChanged={reloadSub} onNavigate={go} />}
      {view === 'usage' && <UsageView onNavigate={go} />}
      {view === 'invoices' && <InvoicesView />}
      {view === 'payment' && <PaymentView />}
      {view === 'addons' && <AddonsView />}
    </div>
  );
}
