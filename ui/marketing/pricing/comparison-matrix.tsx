import { pricing } from '@/content/pricing'
import type { MatrixCell } from '@/content/types'
import { cn } from '@/lib/cn'

function Cell({ cell }: { cell: MatrixCell }) {
  if (cell.kind === 'yes') {
    return (
      <>
        <span aria-hidden="true" className="text-[15px] font-bold text-green-600">✓</span>
        <span className="sr-only">Included</span>
      </>
    )
  }
  return <span className="text-[13px] font-semibold text-sage-500">{cell.value}</span>
}

export function ComparisonMatrix() {
  return (
    <div
      data-matrix-scroll
      role="region"
      aria-label={pricing.matrixTitle}
      tabIndex={0}
      // contain-layout: overflow-x-auto alone clips this table visually and
      // scrolls it correctly (verified: this element's own scrollWidth >
      // clientWidth), but does not fully isolate layout for the purposes of
      // document.documentElement's scrollable-overflow computation — the
      // table's min-w-[560px] content was still leaking into the ROOT's
      // scrollable region, making the *whole page* horizontally draggable
      // (confirmed with window.scrollTo actually moving the viewport).
      // contain-layout establishes a real containment boundary and stops
      // that leak without affecting this element's own internal scroll.
      className="overflow-x-auto rounded-[14px] border border-green-100 bg-white shadow-card contain-layout"
    >
      <table className="w-full min-w-[560px] border-collapse text-left">
        <caption className="sr-only">{pricing.matrixTitle}</caption>
        <thead>
          <tr className="bg-green-900 text-white">
            <th scope="col" className="px-5 py-4 text-[13px] font-bold">Features</th>
            {/* Column headers are derived from pricing.plans so a rename can't desync
                the table from the cards; the brass highlight follows plan.popular
                rather than a hardcoded index. */}
            {pricing.plans.map((plan) => (
              <th
                key={plan.name}
                scope="col"
                className={cn('px-4 py-4 text-center text-[13px] font-bold', plan.popular && 'text-brass-500')}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        {pricing.matrix.map((section) => (
          <tbody key={section.section}>
            <tr>
              <th
                colSpan={4}
                scope="colgroup"
                className="border-t border-green-100 bg-sage-100 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-sage-500"
              >
                {section.section}
              </th>
            </tr>
            {section.rows.map((row) => (
              <tr key={row.feature} className="border-t border-green-50">
                <th scope="row" className="px-5 py-3.5 text-sm font-normal text-sage-900">
                  {row.feature}
                </th>
                <td className="px-3 py-3.5 text-center"><Cell cell={row.starter} /></td>
                <td className="bg-green-50 px-3 py-3.5 text-center"><Cell cell={row.growth} /></td>
                <td className="px-3 py-3.5 text-center"><Cell cell={row.scale} /></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
