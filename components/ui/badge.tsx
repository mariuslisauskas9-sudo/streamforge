import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-(--color-accent)/15 text-(--color-accent)',
        green: 'bg-(--color-green)/15 text-(--color-green)',
        amber: 'bg-(--color-amber)/15 text-(--color-amber)',
        coral: 'bg-(--color-coral)/15 text-(--color-coral)',
        blue: 'bg-(--color-blue)/15 text-(--color-blue)',
        muted: 'bg-(--color-bg-hover) text-(--color-text-muted)',
        outline: 'border border-(--color-border) text-(--color-text-secondary)',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
