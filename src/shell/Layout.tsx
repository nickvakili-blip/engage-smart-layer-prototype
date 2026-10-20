import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { EverpassLogo, Icon } from '../ui/Icon'
import { useStore } from '../state/store'
import { ErrorBoundary } from './ErrorBoundary'
import { VENUE } from '../data/seed'

function ModeToggle({ className = '' }: { className?: string }) {
  const { pathname } = useLocation()
  const advanced = pathname.startsWith('/advanced')
  return (
    <div className={`flex rounded-full bg-white/10 p-1 text-sm font-semibold ${className}`} role="tablist" aria-label="Mode">
      <Link to="/smart" role="tab" aria-selected={!advanced} className={`rounded-full px-3.5 py-1.5 transition ${!advanced ? 'bg-mint text-ink' : 'text-white/80 hover:text-white'}`}>
        Smart
      </Link>
      <Link to="/advanced/promotions" role="tab" aria-selected={advanced} className={`rounded-full px-3.5 py-1.5 transition ${advanced ? 'bg-white text-ink' : 'text-white/80 hover:text-white'}`}>
        Advanced
      </Link>
    </div>
  )
}

function OrgMenu() {
  const [open, setOpen] = useState(false)
  const { reset, toast } = useStore()
  const navigate = useNavigate()
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 rounded-lg bg-white/10 py-2 pl-2 pr-3 text-white hover:bg-white/15 md:min-w-[250px]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky to-teal text-xs font-bold">{VENUE.monogram}</span>
        <span className="hidden truncate text-[15px] font-medium md:block">{VENUE.org}</span>
        <Icon name="chevronDown" className="ml-auto hidden h-4 w-4 md:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-white p-2 text-ink shadow-xl ring-1 ring-black/5" onMouseLeave={() => setOpen(false)}>
          <div className="px-3 py-2">
            <div className="text-sm font-semibold">{VENUE.org}</div>
            <div className="text-xs text-gray-500">{VENUE.name} · 6 screens</div>
          </div>
          <div className="my-1 border-t" />
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => {
              reset()
              setOpen(false)
              navigate('/smart')
              toast('Demo reset to the starting schedule')
            }}
          >
            <Icon name="reset" className="h-4 w-4" /> Reset demo data
          </button>
        </div>
      )}
    </div>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-ink px-4 md:h-[92px] md:px-8">
      <Link to="/smart" aria-label="Everpass home"><EverpassLogo className="h-6 md:h-9" /></Link>
      <nav className="ml-10 hidden items-center gap-10 text-[19px] text-white/75 xl:flex">
        <span>Home</span>
        <span>Schedule</span>
        <span>On-Demand</span>
        <span className="font-bold text-white">Marketing</span>
      </nav>
      <div className="ml-auto flex items-center gap-3 md:gap-6">
        <ModeToggle className="hidden sm:flex" />
        <div className="hidden items-center gap-6 text-white lg:flex">
          <Icon name="search" className="h-7 w-7" />
          <Icon name="phone" className="h-7 w-7" />
          <Icon name="router" className="h-7 w-7 text-mint" />
        </div>
        <OrgMenu />
      </div>
    </header>
  )
}

const SECTIONS: { title?: string; items: { to: string; label: string; icon: string; badge?: string; external?: boolean; muted?: boolean }[] }[] = [
  { items: [{ to: '#', label: 'Sports Marketing', icon: 'folder', external: true }] },
  { title: 'Smart', items: [{ to: '/smart', label: 'Smart Home', icon: 'bolt', badge: 'New' }] },
  {
    title: 'Content',
    items: [
      { to: '/advanced/promotions', label: 'Promotions', icon: 'megaphone' },
      { to: '/advanced/library', label: 'Library', icon: 'image' },
      { to: '/advanced/direct-share', label: 'Direct Share', icon: 'camera' },
    ],
  },
  {
    title: 'Programming',
    items: [
      { to: '/advanced/playlist', label: 'Playlist', icon: 'playlist' },
      { to: '/advanced/audio', label: 'Audio', icon: 'audio' },
      { to: '/advanced/plugins', label: 'Plugins', icon: 'grid' },
    ],
  },
  { title: 'Report', items: [{ to: '/advanced/insights', label: 'Insights', icon: 'chart', muted: true, badge: 'Off' }] },
  { items: [{ to: '#', label: 'Help Center', icon: 'help', external: true }] },
]

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { pathname } = useLocation()
  return (
    <aside className={`sticky top-[92px] hidden h-[calc(100vh-92px)] shrink-0 overflow-y-auto bg-rail text-white md:block ${collapsed ? 'w-[84px]' : 'w-[276px]'} transition-all`}>
      <button onClick={onToggle} className="m-5 ml-7 text-white/90" aria-label="Toggle sidebar">
        <Icon name="sidebar" className="h-6 w-6" />
      </button>
      {SECTIONS.map((sec, i) => (
        <div key={i} className="border-b border-white/15 px-3 pb-3 pt-2 last:border-0">
          {sec.title && !collapsed && <div className="px-4 pb-2 pt-3 text-[17px] uppercase tracking-wide text-white/70">{sec.title}</div>}
          {sec.items.map((it) => {
            const active = it.to !== '#' && (it.to === '/smart' ? pathname.startsWith('/smart') : pathname.startsWith(it.to))
            const inner = (
              <>
                <Icon name={it.icon} className="h-6 w-6 shrink-0" />
                {!collapsed && <span className="truncate">{it.label}</span>}
                {!collapsed && it.external && <Icon name="arrowUpRight" className="h-4 w-4" />}
                {!collapsed && it.badge && (
                  <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${it.badge === 'New' ? 'bg-mint text-ink' : 'bg-white/15 text-white/70'}`}>{it.badge}</span>
                )}
              </>
            )
            const cls = `my-1 flex items-center gap-3 rounded-full px-4 py-3.5 text-[18px] transition ${active ? 'bg-pine font-medium' : 'hover:bg-white/5'} ${it.muted ? 'opacity-50' : ''}`
            return it.to === '#' ? (
              <span key={it.label} className={cls}>{inner}</span>
            ) : (
              <NavLink key={it.label} to={it.to} className={cls} title={it.label}>
                {inner}
              </NavLink>
            )
          })}
        </div>
      ))}
    </aside>
  )
}

function MobileNav() {
  const { pathname } = useLocation()
  const items = [
    { to: '/smart', label: 'Home', icon: 'home', match: (p: string) => p === '/smart' },
    { to: '/smart/create', label: 'Create', icon: 'plus', match: (p: string) => p.startsWith('/smart/create') },
    { to: '/smart/schedule', label: 'Schedule', icon: 'calendar', match: (p: string) => p.startsWith('/smart/schedule') },
    { to: '/advanced/promotions', label: 'Advanced', icon: 'sliders', match: (p: string) => p.startsWith('/advanced') },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((it) => {
        const on = it.match(pathname)
        return (
          <Link key={it.to} to={it.to} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on ? 'text-pine' : 'text-gray-500'}`}>
            <span className={`grid h-8 w-12 place-items-center rounded-full ${on ? 'bg-pine-light' : ''}`}>
              <Icon name={it.icon} className="h-5 w-5" />
            </span>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div key={t.id} className="animate-slideup pointer-events-auto flex max-w-xl items-center gap-4 rounded-md bg-[#08b04a] px-5 py-4 text-[15px] font-medium text-white shadow-lg md:text-[17px]">
          <span>{t.message}</span>
          {t.link && (
            <Link to={t.link.to} onClick={() => dismissToast(t.id)} className="whitespace-nowrap font-bold underline underline-offset-2">
              {t.link.label}
            </Link>
          )}
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss"><Icon name="x" className="h-5 w-5" strokeWidth={2.5} /></button>
        </div>
      ))}
    </div>
  )
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  return (
    <div className="min-h-full">
      <TopBar />
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <main className="min-w-0 flex-1 pb-24 md:pb-10">
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav />
      <Toasts />
      <a href="#" className="fixed bottom-24 right-4 z-30 hidden h-16 w-16 place-items-center rounded-full bg-[#4a8a73] text-4xl font-bold text-white shadow-lg md:grid md:bottom-6" aria-label="Help">?</a>
    </div>
  )
}
