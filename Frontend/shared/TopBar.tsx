import { Plane } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from './StatusIndicator'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title:    string
  part:     'Parte 1' | 'Parte 2'
  children?: React.ReactNode
  className?: string
}

export function TopBar({ title, part, children, className }: TopBarProps) {
  return (
    <header className={cn(
      'flex items-center justify-between px-4 py-2 border-b',
      'border-[var(--border)] bg-[var(--background-panel)]',
      className,
    )}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 border border-[var(--border)] flex items-center justify-center shrink-0">
          <Plane size={16} className="text-[var(--foreground)]" />
        </div>
        <span className="text-sm font-medium text-[var(--foreground)] font-[var(--font-ui)]">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <Badge variant="outline" className="text-[10px] font-mono border-[var(--border)] text-[var(--muted-foreground)]">
          {part}
        </Badge>
        <StatusIndicator />
      </div>
    </header>
  )
}
