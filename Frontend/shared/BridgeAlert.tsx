import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'

export function BridgeAlert() {
  const open           = useStore(s => s.bridgeAlertOpen)
  const dismiss        = useStore(s => s.dismissBridgeAlert)
  const navigate       = useNavigate()

  function handleSaberMais() {
    dismiss()
    navigate('/marvel')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="max-w-md p-0 overflow-hidden animate-slide-down border-2 border-[var(--destructive)] bg-[var(--background-card)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-[var(--destructive)] bg-red-950/40">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-0.5">
              transmissão de emergência
            </p>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-red-300 leading-tight">
                URGENTE — INCIDENTE NO GALEÃO
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
            AEROPORTO INTERNACIONAL DO GALEÃO FOI ATACADO!
          </p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Autoridades confirmam incidente de grande escala no Aeroporto Internacional do
            Galeão (GIG). Conexão com voos para o Rio de Janeiro suspensa. Veja cobertura
            completa e análise de impacto na rede.
          </p>
          <blockquote className="border-l-2 border-[var(--destructive)] pl-3 text-[11px] text-[var(--muted-foreground)] italic leading-relaxed">
            "Em 2008, enquanto o Hulk destruía parte do campus da UERJ e fugia em direção ao
            Galeão, o mundo assistia a um dos maiores incidentes de segurança aérea já
            registrados no Brasil..."
          </blockquote>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSaberMais}
              className="flex-1 text-xs font-bold bg-[var(--destructive)] text-white hover:bg-red-700 rounded-none border-2 border-[var(--destructive)]"
            >
              CLIQUE AQUI PARA SABER MAIS →
            </Button>
            <Button
              variant="outline"
              onClick={dismiss}
              className="text-xs border-[var(--border)] text-[var(--muted-foreground)] rounded-none"
            >
              ignorar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
