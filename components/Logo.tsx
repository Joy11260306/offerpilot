'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-7 w-7', text: 'text-base' },
    md: { icon: 'h-9 w-9', text: 'text-lg' },
    lg: { icon: 'h-12 w-12', text: 'text-xl' }
  }

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md transition-transform group-hover:scale-105',
          sizes[size].icon
        )}
      >
        <svg
          className="h-1/2 w-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <span
        className={cn(
          'font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
          sizes[size].text
        )}
      >
        OfferPilot
      </span>
    </div>
  )
}
