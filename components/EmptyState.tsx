'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center',
      className
    )}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {title}
      </h2>
      <p className="mb-6 max-w-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
