import type { Region } from '@/lib/constants'

export interface UIState {
  selectedNode:         string | null
  tooltipNode:          string | null
  tooltipPos:           { x: number; y: number } | null
  activeRegions:        Set<Region>
  bridgeAlertOpen:      boolean
  bridgeAlertDismissed: boolean
  dialOpen:             boolean
  setSelectedNode:      (iata: string | null) => void
  setTooltip:           (node: string | null, pos: { x: number; y: number } | null) => void
  toggleRegion:         (r: Region) => void
  setAllRegions:        (regions: Region[]) => void
  triggerBridgeAlert:   () => void
  dismissBridgeAlert:   () => void
  setDialOpen:          (v: boolean) => void
}

export const createUISlice = (set: (fn: (s: UIState) => Partial<UIState>) => void): UIState => ({
  selectedNode:         null,
  tooltipNode:          null,
  tooltipPos:           null,
  activeRegions:        new Set(['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste']),
  bridgeAlertOpen:      false,
  bridgeAlertDismissed: false,
  dialOpen:             false,
  setSelectedNode: iata => set(() => ({ selectedNode: iata })),
  setTooltip:      (node, pos) => set(() => ({ tooltipNode: node, tooltipPos: pos })),
  toggleRegion: r => set(s => {
    const next = new Set(s.activeRegions)
    next.has(r) ? next.delete(r) : next.add(r)
    return { activeRegions: next }
  }),
  setAllRegions: regions => set(() => ({ activeRegions: new Set(regions) })),
  triggerBridgeAlert: () => set(s => s.bridgeAlertDismissed ? {} : { bridgeAlertOpen: true }),
  dismissBridgeAlert: () => set(() => ({ bridgeAlertOpen: false, bridgeAlertDismissed: true })),
  setDialOpen:     v => set(() => ({ dialOpen: v })),
})
