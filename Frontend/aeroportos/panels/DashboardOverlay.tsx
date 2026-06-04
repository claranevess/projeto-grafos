import { BarChart3, PieChart, Sparkles, X } from 'lucide-react'

interface DashboardOverlayProps {
  onClose: () => void
}

export function DashboardOverlay({ onClose }: DashboardOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-6 text-slate-100 backdrop-blur-sm">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Gráficos e insights</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Aqui serão exibidos os gráficos e insights gerados a partir da rede de aeroportos.
            Este painel ocupa toda a tela e facilita a visualização das métricas mais importantes.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 hover:text-white"
          aria-label="Fechar dashboard"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Performance</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Tempo de execução</h3>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-slate-200">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Compare os algoritmos em tempo real e veja quais rotas são calculadas mais rapidamente.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Conectividade</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Aeroportos mais centrais</h3>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-slate-200">
              <PieChart size={20} />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Visualize os nós mais importantes da rede para entender os pontos de maior influência.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Insights</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Métricas chave</h3>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-slate-200">
              <Sparkles size={20} />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Fique por dentro de indicadores como maior caminho, grau médio e distribuição de rotas.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
          <p className="text-sm text-slate-400">Resumo</p>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>• Tempo médio de processamento das rotas.</p>
            <p>• Número de aeroportos visitados por algoritmo.</p>
            <p>• Taxa de convergência por método.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
          <p className="text-sm text-slate-400">Ação</p>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>• Adicione gráficos reais à medida que a análise avançar.</p>
            <p>• Use este painel como base para métricas e comparações.</p>
            <p>• Feche com o botão no canto superior para voltar à visualização do mapa.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
