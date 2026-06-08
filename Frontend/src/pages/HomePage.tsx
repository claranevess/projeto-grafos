import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] p-10 shadow-[0_20px_80px_rgba(0,0,0,0.14)] backdrop-blur-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-6">Projeto Grafos</h1>
        <p className="text-base text-[var(--muted-foreground)] mb-8 leading-7">
          Escolha o dataset que deseja explorar. Você pode alternar entre a visualização de aeroportos e a rede Marvel.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Button size="lg" className="w-full" onClick={() => navigate('/airport')}>
            Aeroportos
          </Button>
          <Button size="lg" className="w-full" onClick={() => navigate('/marvel')}>
            Marvel
          </Button>
        </div>
      </div>
    </div>
  )
}
