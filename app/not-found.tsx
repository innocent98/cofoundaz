import { Button } from '@/ui/primitives'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[620px] flex-col items-center px-4 py-28 text-center">
      <div aria-hidden="true" className="font-display text-[88px] font-bold leading-none text-green-100">
        404
      </div>
      <h1 className="mt-2 font-display text-[28px] font-semibold text-balance text-green-900 md:text-[34px]">
        Well, this page didn’t survive product-market fit.
      </h1>
      <div className="mt-7">
        <Button href="/" variant="accent" size="lg">
          Back home
        </Button>
      </div>
    </main>
  )
}
