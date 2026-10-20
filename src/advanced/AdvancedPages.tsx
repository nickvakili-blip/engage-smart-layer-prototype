import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/store'
import { FOLLOWS, GAMES, PLAYLIST_NAMES, SCREENS, gameTitle } from '../data/seed'
import { KIND_META, matchesRule, screenBlocks } from '../lib/schedule'
import { CLOSE, OPEN, dateFor, fmtRange, fmtTime } from '../lib/time'
import type { Asset } from '../types'
import { Icon } from '../ui/Icon'
import { Thumb } from '../ui/ScreenPreview'

function AdvancedBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-sm md:px-10">
      <span className="badge bg-ink text-white">Advanced mode</span>
      <span className="text-gray-600">The full toolset. Everything made in Smart shows up here.</span>
      <Link to="/smart" className="ml-auto font-semibold text-pine hover:underline">← Back to Smart</Link>
    </div>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <AdvancedBanner />
      <div className="px-4 pt-4 md:px-5">{children}</div>
    </>
  )
}

const FORMAT: Record<Asset['kind'], { label: string; cls: string }> = {
  spotlight: { label: 'Image', cls: 'bg-sky text-white' },
  qr: { label: 'QR', cls: 'bg-ink text-white' },
  menu: { label: 'Menu', cls: 'bg-emerald-600 text-white' },
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-[#4a8a73]' : 'bg-gray-300'}`} aria-pressed={on} aria-label="Enable">
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export function Promotions({ tab }: { tab: 'spotlights' | 'qr' }) {
  const { assets, blocks, updateAsset } = useStore()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const rows = assets.filter((a) => (tab === 'qr' ? a.kind === 'qr' : a.kind !== 'qr')).filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
  const tabs = [
    { to: '/advanced/promotions', label: 'Spotlights', end: true },
    { to: '/advanced/promotions/qr', label: 'QR Campaigns' },
    { to: '/advanced/promotions/fixed-panel', label: 'Fixed Panel' },
    { to: '/advanced/promotions/campaign-hub', label: 'Campaign Hub' },
  ]
  return (
    <Page>
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `whitespace-nowrap px-6 py-4 text-[17px] md:px-14 ${isActive ? 'border-b-4 border-[#4a8a73] text-[#4a8a73]' : 'text-ink'}`}>{t.label}</NavLink>
        ))}
      </div>
      <div className="my-6 flex flex-wrap items-center gap-3">
        <button className="grid h-12 w-12 place-items-center rounded-full bg-gray-100"><Icon name="filter" /></button>
        <label className="flex h-12 w-full max-w-[290px] items-center gap-2 rounded-full bg-gray-100 px-5 text-gray-500">
          <Icon name="search" className="h-5 w-5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="w-full bg-transparent text-ink outline-none" />
        </label>
        <div className="relative ml-auto">
          <button onClick={() => setMenuOpen((o) => !o)} className="btn-primary h-14 px-8 text-base">Add Your Own <Icon name="chevronDown" className="h-4 w-4" /></button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg bg-white p-1.5 shadow-xl ring-1 ring-black/5" onMouseLeave={() => setMenuOpen(false)}>
              <Link to="/smart/create/spotlight" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Spotlight <span className="text-xs text-pine">· quick create</span></Link>
              <Link to="/smart/create/qr" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">QR code <span className="text-xs text-pine">· quick create</span></Link>
              <Link to="/smart/create/menu" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Menu board <span className="text-xs text-pine">· quick create</span></Link>
              <span className="block rounded px-3 py-2 text-sm text-gray-400">Upload file…</span>
            </div>
          )}
        </div>
        <button className="btn-outline h-14 px-5 text-base"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-teal to-grape text-xs text-white">C</span> Connect to Canva</button>
      </div>
      {tab === 'qr' && !rows.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
          No QR campaigns yet. <Link to="/smart/create/qr" className="font-semibold text-pine">Create one in Smart</Link> or use the full QR wizard.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-gray-100 text-[17px] font-bold">
              <tr>
                <th className="w-16 p-4"><span className="block h-6 w-6 rounded border-2 border-gray-700" /></th>
                <th className="p-4">{tab === 'qr' ? 'Campaign' : 'Spotlight'}</th>
                <th className="p-4">Name ⇅</th>
                <th className="p-4">Created Date ⇅</th>
                <th className="p-4 text-center leading-tight">Scheduled<br />Status</th>
                <th className="p-4">Format ⇅</th>
                <th className="p-4">Owner ⇅</th>
                <th className="p-4">Enable ⇅</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const scheduled = blocks.some((b) => b.assetIds?.includes(a.id) && b.kind !== 'playlist')
                return (
                  <tr key={a.id} className={`border-b ${a.fromSmart ? 'bg-mint/10' : ''}`}>
                    <td className="p-4"><span className="block h-6 w-6 rounded border-2 border-gray-700" /></td>
                    <td className="p-4"><Thumb asset={a} assets={assets} className="w-28" /></td>
                    <td className="p-4 text-[17px]">
                      {a.name}
                      {a.fromSmart && <span className="badge ml-2 bg-mint text-ink">Smart</span>}
                    </td>
                    <td className="p-4 text-[17px]">{a.createdAt}</td>
                    <td className="p-4 text-center"><span className="badge bg-purple-100 text-purple-700">{scheduled ? 'Sched.' : '24/7'}</span></td>
                    <td className="p-4"><span className={`badge ${FORMAT[a.kind].cls}`}><Icon name={a.kind === 'qr' ? 'qr' : a.kind === 'menu' ? 'menu' : 'image'} className="h-3 w-3" />{FORMAT[a.kind].label}</span></td>
                    <td className="p-4">{a.owner}</td>
                    <td className="p-4"><Toggle on={a.enabled} onChange={() => updateAsset(a.id, { enabled: !a.enabled })} /></td>
                    <td className="p-4"><Icon name="dots" className="h-6 w-6" strokeWidth={3} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="my-8 flex items-center justify-center gap-6 text-lg">
        Page <span>1</span> of 1 <span className="text-[#4a8a73]">20 rows ⌄</span>
      </div>
    </Page>
  )
}

export function Library() {
  const { assets } = useStore()
  return (
    <Page>
      <h1 className="mb-6 mt-4 text-3xl">Library</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {assets.map((a) => (
          <div key={a.id} className="card overflow-hidden">
            <Thumb asset={a} assets={assets} className="w-full" />
            <div className="flex items-center gap-2 p-3">
              <span className="truncate font-semibold">{a.name}</span>
              {a.fromSmart && <span className="badge bg-mint text-ink">Smart</span>}
              <span className={`badge ml-auto ${FORMAT[a.kind].cls}`}>{FORMAT[a.kind].label}</span>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

export function Playlist() {
  const { assets, rotation } = useStore()
  const [tab, setTab] = useState<'spotlights' | 'qr'>('spotlights')
  const avail = assets.filter((a) => a.enabled && (tab === 'qr' ? a.kind === 'qr' : a.kind !== 'qr'))
  const mix = [
    { k: 'Spotlights', v: 21, c: '#0e9aa7' },
    { k: 'QR Campaigns', v: 20, c: '#5bd3e8' },
    { k: 'Entertainment', v: 24, c: '#8a3ee0' },
    { k: 'Social', v: 25, c: '#ffbf00' },
    { k: 'Plugins', v: 10, c: '#ec5fe0' },
  ]
  let acc = 0
  const conic = mix.map((m) => `${m.c} ${acc}% ${(acc += m.v)}%`).join(',')
  return (
    <Page>
      <div className="mb-6 mt-4 flex items-center justify-between">
        <h1 className="text-4xl text-gray-700">Playlist</h1>
        <span className="rounded-lg border-2 border-gray-200 px-4 py-3 font-semibold text-gray-300">PREVIEW PLAYLIST</span>
      </div>
      <div className="card grid gap-8 p-6 lg:grid-cols-2">
        <div>
          <span className="badge bg-grape text-white">Now playing</span>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">Choose Your Smart Playlist</h2>
              <p className="mt-2 max-w-xs text-lg text-gray-500">Let EverPass Engage automatically display the content mix that drives the goal of your screens.</p>
            </div>
            <Link to="/advanced/schedule" className="btn-outline">Go to Advanced Scheduling</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {Object.values(PLAYLIST_NAMES).map((n) => (
              <span key={n} className="rounded-lg border-l-4 border-sky px-4 py-2 shadow-card">
                <span className="block text-lg font-semibold">{n}</span>
                <span className="text-xs italic">Created by EverPass</span>
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-8">
            <div className="relative h-48 w-48 rounded-full" style={{ background: `conic-gradient(${conic})` }}>
              <div className="absolute inset-8 grid place-items-center rounded-full bg-white text-center">
                <div><div className="text-4xl font-bold">21%</div><div className="text-sm">SPOTLIGHTS</div></div>
              </div>
            </div>
            <ul className="space-y-2 text-sm font-semibold">
              {mix.map((m) => <li key={m.k} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: m.c }} />{m.k.toUpperCase()} ({m.v}%)</li>)}
            </ul>
          </div>
          <div className="mt-8 rounded-lg bg-amber-50 p-4">
            <div className="font-bold">Marketing playlist</div>
            <p className="mb-3 text-sm text-gray-600">Plays on every marketing block. “Add to marketing rotation” in Smart adds to this list.</p>
            <ol className="space-y-2">
              {rotation.map((id, i) => {
                const a = assets.find((x) => x.id === id)
                if (!a) return null
                return (
                  <li key={id} className="flex items-center gap-3"><span className="w-5 text-right text-sm text-gray-500">{i + 1}</span><Thumb asset={a} assets={assets} className="w-20" /><span className="font-semibold">{a.name}</span>{a.fromSmart && <span className="badge bg-mint text-ink">Smart</span>}</li>
                )
              })}
            </ol>
          </div>
        </div>
        <div className="lg:border-l lg:pl-8">
          <h2 className="text-3xl font-semibold">Available Content</h2>
          <p className="mt-1 text-lg text-gray-500">Content displayed here is eligible and enabled to appear on screen.</p>
          <div className="my-5 flex flex-wrap gap-2">
            {(['spotlights', 'qr'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md px-5 py-3 ${tab === t ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'}`}>{t === 'qr' ? 'QR Campaigns' : 'Spotlights'}</button>
            ))}
            {['Entertainment', 'Social', 'Plugins'].map((t) => <span key={t} className="rounded-md bg-gray-200 px-5 py-3 text-gray-700">{t}</span>)}
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-lg"><tr><th className="p-3">Spotlight</th><th className="p-3">Name</th><th className="p-3">Attributes</th></tr></thead>
            <tbody>
              {avail.map((a) => (
                <tr key={a.id} className="border-b"><td className="p-3"><Thumb asset={a} assets={assets} className="w-28" /></td><td className="p-3 text-lg">{a.name}</td><td className="p-3"><span className={`badge ${FORMAT[a.kind].cls}`}>{FORMAT[a.kind].label}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  )
}

const ROW = 46 // px per hour in the week view

export function ScheduledPlaylists() {
  const { blocks, rules } = useStore()
  const [params, setParams] = useSearchParams()
  const screenId = SCREENS.some((s) => s.id === params.get('screen')) ? params.get('screen')! : 'bar1'
  const screen = SCREENS.find((s) => s.id === screenId)!
  const days = Array.from({ length: 7 }, (_, i) => i)
  const hours = Array.from({ length: (CLOSE - OPEN) / 60 }, (_, i) => OPEN + i * 60)
  const top = (t: number) => ((t - OPEN) / 60) * ROW
  const gameRules = rules.filter((r) => r.kind === 'games' && r.screenId === screenId)
  const futureGames = (day: number) => (day === 0 ? [] : GAMES.filter((g) => g.day === day && gameRules.some((r) => r.kind === 'games' && matchesRule(g, r))))

  return (
    <Page>
      <div className="mb-4 flex flex-wrap gap-2">
        {SCREENS.map((s) => (
          <button key={s.id} onClick={() => setParams({ screen: s.id })} className={`chip ${s.id === screenId ? 'chip-on' : 'chip-off'}`}>
            <Icon name={s.kind === 'menu' ? 'menu' : 'tv'} className="h-4 w-4" />{s.name}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card overflow-x-auto p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Scheduled Playlists · {screen.name}</h1>
            <span className="text-lg">OCT. 20 – OCT. 26, 2026</span>
          </div>
          <p className="mb-4 text-sm"><b>GENIUS:</b> Learn how to take next-level control of your screens with Playlists. <span className="text-[#4a8a73]">Click here.</span></p>
          <div className="flex min-w-[860px]">
            <div className="w-16 shrink-0 pt-8">
              {hours.map((h) => <div key={h} style={{ height: ROW }} className="text-[11px] text-gray-500">{fmtTime(h)}</div>)}
            </div>
            {days.map((d) => (
              <div key={d} className="flex-1 px-0.5">
                <div className="h-8 text-center text-[11px] font-semibold">
                  {d === 0 ? 'TODAY ' : dateFor(d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() + ' '}
                  <span className="text-gray-400">{dateFor(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</span>
                </div>
                <div className="relative rounded-sm border-t-4 border-mint bg-[#dbe8e4]" style={{ height: ROW * hours.length }}>
                  {d !== 0 && (
                    <div className="p-2">
                      <div className="truncate text-xs font-semibold">Smart Mode</div>
                      <span className="badge mt-1 bg-mint/70 text-[9px] text-ink">Default playlist</span>
                    </div>
                  )}
                  {d === 0 && screenBlocks(blocks, screenId).map((b) => (
                    <div key={b.id} className={`absolute inset-x-0.5 overflow-hidden rounded border-l-4 px-1.5 py-1 ${KIND_META[b.kind].bg} ${KIND_META[b.kind].border}`} style={{ top: top(b.start), height: top(b.end) - top(b.start) - 2 }}>
                      <div className={`truncate text-[11px] font-bold ${KIND_META[b.kind].text}`}>{b.title}</div>
                      <div className="truncate text-[10px] text-gray-600">{fmtRange(b.start, b.end)}</div>
                      {b.source === 'smart' && <span className="badge mt-0.5 bg-mint text-[9px] text-ink">Smart</span>}
                    </div>
                  ))}
                  {futureGames(d).map((g) => (
                    <div key={g.id} className="absolute inset-x-0.5 overflow-hidden rounded border-l-4 border-grape bg-white px-1.5 py-1" style={{ top: top(Math.max(OPEN, g.start)), height: top(Math.min(CLOSE, g.end)) - top(Math.max(OPEN, g.start)) - 2 }}>
                      <div className="truncate text-[11px] font-bold text-grape">{gameTitle(g)}</div>
                      <div className="truncate text-[10px] text-gray-600">{fmtRange(g.start, g.end)}</div>
                      <span className="badge mt-0.5 bg-mint text-[9px] text-ink">Smart rule</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {(['game', 'autogame', 'marketing', 'playlist', 'menu'] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${KIND_META[k].dot}`} />{KIND_META[k].label}</span>)}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl">List of Playlists</h2>
            <span className="btn-primary">Create new</span>
          </div>
          {['Smart Mode', ...Object.values(PLAYLIST_NAMES)].map((n) => (
            <div key={n} className="mb-3 rounded-lg border-t-4 border-mint p-4 shadow-card"><span className="text-lg">{n}</span></div>
          ))}
          <h3 className="mb-2 mt-6 font-bold">Rules created in Smart</h3>
          {rules.length ? (
            <ul className="space-y-2 text-sm">
              {rules.map((r) => (
                <li key={r.id} className="rounded-lg bg-gray-50 p-3">
                  {r.kind === 'games'
                    ? <><b>{FOLLOWS.find((f) => f.id === r.follow)?.label} games</b> on {SCREENS.find((s) => s.id === r.screenId)?.name} · {r.recurrence === 'every' ? 'every game' : r.recurrence === 'weekends' ? 'weekends' : 'nights'}</>
                    : <><b>{r.assetIds.length} promo{r.assetIds.length === 1 ? '' : 's'}</b> on {SCREENS.find((s) => s.id === r.screenId)?.name} · {fmtRange(r.start, r.end)} · {r.repeat}</>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">None yet. Rules made with Games on a TV or Marketing on a TV appear here, fully editable.</p>
          )}
        </div>
      </div>
    </Page>
  )
}

export function Placeholder({ title }: { title: string }) {
  return (
    <Page>
      <h1 className="mt-4 text-3xl">{title}</h1>
      <p className="mt-2 max-w-xl text-gray-600">This page stays as it is today in Advanced mode. It isn't part of this prototype.</p>
      <Link to="/smart" className="btn-primary mt-6">Back to Smart</Link>
    </Page>
  )
}
