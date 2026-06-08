import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlgoDialProps {
  dashboardOpen: boolean
  onToggleDashboard: () => void
}

export function AlgoDial({ dashboardOpen, onToggleDashboard }: AlgoDialProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onToggleDashboard}
        className={cn(
          'w-12 h-12 border-2 flex items-center justify-center',
          'bg-[var(--background-card)] text-[var(--foreground)] border-[var(--border)]',
          'hover:border-[var(--primary)] hover:text-[var(--primary)]',
          'transition-all duration-150 font-mono text-xs font-bold',
          dashboardOpen && 'rotate-45 bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]',
        )}
        title={dashboardOpen ? 'Fechar dashboard' : 'Abrir dashboard'}
        aria-expanded={dashboardOpen}
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
