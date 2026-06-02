import { TopBar } from '@shared/TopBar'
import { MarvelSidebar } from '@marvel/panels/MarvelSidebar'
import { MarvelGraph } from '@marvel/MarvelGraph'

export function MarvelShell() {
  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopBar title="Marvel Box Office Network" part="Parte 2" />

      <div className="flex flex-1 overflow-hidden">
        <MarvelSidebar />

        <main className="flex-1 relative overflow-hidden">
          <MarvelGraph />
        </main>
      </div>
    </div>
  )
}
