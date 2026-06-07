import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TopBar } from '@shared/TopBar'
import { Button } from '@/components/ui/button'
import { MarvelSidebar } from '@marvel/panels/MarvelSidebar'
import { MarvelGraph } from '@marvel/MarvelGraph'

export function MarvelShell() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopBar title="Marvel Box Office Network" part="Parte 2">
        <Button
          size="sm"
          onClick={() => navigate('/')}
          className="h-7 px-2.5 text-[10px] font-mono font-bold border-2 border-black rounded-none gap-1.5 bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-black"
          style={{ boxShadow: '2px 2px 0px #000' }}
        >
          <ArrowLeft size={12} />
          Voltar ao mapa
        </Button>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        <MarvelSidebar />

        <main className="flex-1 relative overflow-hidden">
          <MarvelGraph />
        </main>
      </div>
    </div>
  )
}
