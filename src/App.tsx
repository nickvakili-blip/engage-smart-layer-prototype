import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './state/store'
import { Layout } from './shell/Layout'
import SmartHome, { CreateHub, ScheduleHub } from './smart/SmartHome'
import SpotlightFlow from './smart/create/SpotlightFlow'
import QrFlow from './smart/create/QrFlow'
import MenuBoardFlow from './smart/create/MenuBoardFlow'
import GamesOnTv from './smart/schedule/GamesOnTv'
import MarketingOnTv from './smart/schedule/MarketingOnTv'
import FillMyDay from './smart/schedule/FillMyDay'
import { Library, Placeholder, Playlist, Promotions, ScheduledPlaylists } from './advanced/AdvancedPages'

function ScrollToTop() {
  const { pathname } = useLocation()
  // Braces matter: newer Chrome returns a Promise from scrollTo, which React would call as a cleanup
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/smart" replace />} />
            <Route path="smart" element={<SmartHome />} />
            <Route path="smart/create" element={<CreateHub />} />
            <Route path="smart/create/spotlight" element={<SpotlightFlow />} />
            <Route path="smart/create/qr" element={<QrFlow />} />
            <Route path="smart/create/menu" element={<MenuBoardFlow />} />
            <Route path="smart/schedule" element={<ScheduleHub />} />
            <Route path="smart/schedule/games" element={<GamesOnTv />} />
            <Route path="smart/schedule/marketing" element={<MarketingOnTv />} />
            <Route path="smart/schedule/fill" element={<FillMyDay />} />
            <Route path="advanced" element={<Navigate to="/advanced/promotions" replace />} />
            <Route path="advanced/promotions" element={<Promotions tab="spotlights" />} />
            <Route path="advanced/promotions/qr" element={<Promotions tab="qr" />} />
            <Route path="advanced/promotions/fixed-panel" element={<Placeholder title="Fixed Panel" />} />
            <Route path="advanced/promotions/campaign-hub" element={<Placeholder title="Campaign Hub" />} />
            <Route path="advanced/library" element={<Library />} />
            <Route path="advanced/playlist" element={<Playlist />} />
            <Route path="advanced/schedule" element={<ScheduledPlaylists />} />
            <Route path="advanced/direct-share" element={<Placeholder title="Direct Share" />} />
            <Route path="advanced/audio" element={<Placeholder title="Audio" />} />
            <Route path="advanced/plugins" element={<Placeholder title="Plugins" />} />
            <Route path="advanced/insights" element={<Placeholder title="Insights (turned off)" />} />
            <Route path="*" element={<Navigate to="/smart" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
