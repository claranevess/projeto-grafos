import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import AirportMapPage from '@/pages/AirportMapPage'
import MarvelPage from '@/pages/MarvelPage'
import HomePage from '@/pages/HomePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function ThemeSync() {
  const { pathname } = useLocation()
  useEffect(() => {
    const theme = pathname.startsWith('/marvel') ? 'neo-brutalism' : 'solar-dusk'
    document.documentElement.setAttribute('data-theme', theme)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeSync />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/airport" element={<AirportMapPage />} />
          <Route path="/marvel" element={<MarvelPage />} />
        </Routes>
        <Toaster richColors position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
