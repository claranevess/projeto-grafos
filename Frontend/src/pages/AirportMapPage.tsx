import { AppShell } from '@aeroportos/layout/AppShell'
import { useGraph } from '@/hooks/useGraph'

export default function AirportMapPage() {
  useGraph()
  return <AppShell />
}
