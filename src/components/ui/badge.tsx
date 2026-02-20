import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variant === 'default' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        variant === 'outline' && 'bg-transparent border-zinc-700 text-zinc-400',
        className
      )}
    >
      {children}
    </span>
  )
}
