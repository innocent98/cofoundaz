'use client'

import { Roboto } from 'next/font/google'

// colour-ok-file: Google's Sign-In branding rules fix these exact colours; they are not Cofoundaz brand colours.
// Google's own Sign-In branding (light theme): white fill, #747775 1px border,
// #1F1F1F text, Roboto Medium 14px, 20px multicolour "G" with the standard
// 12px side padding and 10px gap, 4px radius. Colours are Google's, never the
// Cofoundaz brand colours. The app has no dark mode, so only the light theme ships.
const roboto = Roboto({ subsets: ['latin'], weight: '500', display: 'swap' })

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

interface GoogleButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}

export function GoogleButton({ label, onClick, disabled = false, busy = false }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      className={`${roboto.className} flex h-10 w-full items-center justify-center gap-2.5 rounded-[4px] border border-[#747775] bg-white px-3 text-sm font-medium leading-5 text-[#1F1F1F] transition-colors hover:bg-[#F8F9FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F1F1F] disabled:cursor-not-allowed disabled:border-[#1F1F1F]/12 disabled:bg-[#1F1F1F]/12 disabled:text-[#1F1F1F]/38`}
    >
      <GoogleG />
      <span>{label}</span>
    </button>
  )
}
