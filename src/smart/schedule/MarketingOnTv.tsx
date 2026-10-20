import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Block, MarketingRule } from '../../types'
import { useStore } from '../../state/store'
import { SCREENS } from '../../data/seed'
import { PRIORITY, marketingBlock, placeBlock, subtract } from '../../lib/schedule'
import type { Interval } from '../../lib/schedule'
import { CLOSE, OPEN, TIME_OPTIONS, fmtRange, fmtTime, uid } from '../../lib/time'
import { Container, PageHeader, ReviewLink, ScreenPicker, Section, Segmented } from '../../ui/common'
import { AssetPreview, Thumb } from '../../ui/ScreenPreview'
import { Icon } from '../../ui/Icon'
import { DayTimeline } from './DayTimeline'

const PRESETS = [
  { label: 'Lunch', start: 11 * 60, end: 14 * 60 },
  { label: 'Daytime', start: 11 * 60, end: 17 * 60 },
  { label: 'Happy hour', start: 16 * 60, end: 19 * 60 },
  { label: 'Evening', start: 17 * 60, end: CLOSE },
  { label: 'All day', start: OPEN, end: CLOSE },
]

/** Marketing plays around anything that outranks it (live games, menu boards) */
function piecesFor(blocks: Block[], screenId: string, start: number, end: number): { pieces: Interval[]; around: Block[] } {
  const around = blocks.filter((b) => b.screenId === screenId && b.start < end && b.end > start && PRIORITY[b.kind] > PRIORITY.marketing)
  let pieces: Interval[] = [[start, end]]
  for (const b of around) pieces = subtract(pieces, [b.start, b.end])
  return { pieces, around }
}

export default function MarketingOnTv() {
  const [params, setParams] = useSearchParams()
  const { assets, blocks, rotation, rules, addRule, setBlocks, toast } = useStore()
  const promos = assets.filter((a) => a.kind !== 'menu' && a.enabled)
  const [picked, setPicked] = useState<string[]>(() => rotation.filter((id) => promos.some((p) => p.id === id)))
  const [screen, setScreen] = useState(SCREENS.some((s) => s.id === params.get('screen')) ? params.get('screen')! : '')
  const [start, setStart] = useState(params.get('start') ? +params.get('start')! : 11 * 60)
  const [end, setEnd] = useState(params.get('end') ? +params.get('end')! : 17 * 60)
  const [repeat, setRepeat] = useState<MarketingRule['repeat']>('daily')
  const [slide, setSlide] = useState(0)
  const savedRule = rules.find((r): r is MarketingRule => r.kind === 'marketing' && r.id === params.get('saved'))

  useEffect(() => {
    const t = setInterval(() => setSlide((n) => n + 1), 2500)
    return () => clearInterval(t)
  }, [])

  const s = SCREENS.find((x) => x.id === screen)
  const { pieces, around } = useMemo(() => (screen ? piecesFor(blocks, screen, start, end) : { pieces: [], around: [] }), [blocks, screen, start, end])
  const ready = picked.length > 0 && !!s && end > start && pieces.length > 0
  const pickedAssets = picked.map((id) => assets.find((a) => a.id === id)!).filter(Boolean)
  const current = pickedAssets[slide % Math.max(1, pickedAssets.length)]

  const save = () => {
    if (!s) return
    const rule: MarketingRule = { id: uid('r'), kind: 'marketing', assetIds: picked, screenId: screen, start, end, repeat, createdAt: new Date().toISOString() }
    addRule(rule)
    setBlocks((bs) => pieces.reduce((cur, [a, b]) => placeBlock(cur, marketingBlock({ ...rule, start: a, end: b }, 'Marketing playlist')).blocks, bs))
    toast(`Promos scheduled on ${s.name}`, { to: `/advanced/schedule?screen=${screen}`, label: 'Review in Advanced' })
    setParams({ saved: rule.id })
  }

  if (savedRule) {
    const ss = SCREENS.find((x) => x.id === savedRule.screenId)!
    return (
      <Container>
        <div className="animate-slideup mx-auto max-w-xl text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint"><Icon name="check" className="h-7 w-7" strokeWidth={3} /></span>
          <h1 className="text-2xl font-bold">{savedRule.assetIds.length} promo{savedRule.assetIds.length === 1 ? '' : 's'} on {ss.name}, {fmtRange(savedRule.start, savedRule.end)}</h1>
          <p className="mt-2 text-gray-600">{savedRule.repeat === 'today' ? 'Today only.' : savedRule.repeat === 'daily' ? 'Every day.' : 'Every weekday.'} Live games still take over when they start.</p>
          <div className="mt-6"><DayTimeline blocks={blocks} screenIds={[ss.id]} showGaps /></div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-outline" onClick={() => setParams({})}>Set up another TV</button>
            <Link to="/smart" className="btn-primary">Back to Smart Home</Link>
          </div>
          <ReviewLink to={`/advanced/schedule?screen=${ss.id}`} className="mt-4" />
        </div>
      </Container>
    )
  }

  return (
    <Container wide>
      <PageHeader
        back={{ to: '/smart', label: 'Smart Home' }}
        eyebrow="Schedule"
        title="Marketing on a TV"
        subtitle="Put your promos on a TV for part of the day. They take turns, 15 seconds each."
        right={<ReviewLink to="/advanced/playlist" className="hidden md:inline-flex" />}
      />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Section n={1} title="What should play?" hint="Your marketing playlist is already selected.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {promos.map((a) => {
                const on = picked.includes(a.id)
                return (
                  <button key={a.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))} className={`relative overflow-hidden rounded-lg border-2 text-left transition ${on ? 'border-pine' : 'border-gray-200 hover:border-gray-400'}`}>
                    <Thumb asset={a} assets={assets} className="w-full" />
                    <div className="flex items-center gap-2 p-2">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 ${on ? 'border-pine bg-pine text-white' : 'border-gray-300'}`}>{on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}</span>
                      <span className="truncate text-sm font-semibold">{a.name}</span>
                    </div>
                  </button>
                )
              })}
              <Link to="/smart/create/spotlight" className="grid min-h-[120px] place-items-center rounded-lg border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:border-pine hover:text-pine">
                <span className="flex flex-col items-center gap-1"><Icon name="plus" className="h-6 w-6" />New Spotlight</span>
              </Link>
            </div>
          </Section>
          <Section n={2} title="On which TV?">
            <ScreenPicker value={screen ? [screen] : []} onChange={(v) => setScreen(v[0])} filter={(x) => x.kind === 'tv'} />
          </Section>
          <Section n={3} title="When?">
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} className={`chip ${start === p.start && end === p.end ? 'chip-on' : 'chip-off'}`} onClick={() => { setStart(p.start); setEnd(p.end) }}>
                  {p.label} <span className="opacity-60">{fmtRange(p.start, p.end)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label><span className="label">From</span>
                <select className="field w-36" value={start} onChange={(e) => setStart(+e.target.value)}>{TIME_OPTIONS.slice(0, -1).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select>
              </label>
              <label><span className="label">To</span>
                <select className="field w-36" value={end} onChange={(e) => setEnd(+e.target.value)}>{TIME_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select>
              </label>
              <Segmented value={repeat} onChange={setRepeat} options={[{ value: 'today', label: 'Today' }, { value: 'daily', label: 'Every day' }, { value: 'weekdays', label: 'Weekdays' }]} />
            </div>
            {end <= start && <p className="mt-2 text-sm text-red-600">The end time needs to be after the start time.</p>}
          </Section>
        </div>
        <div>
          <div className="card p-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-2">Summary</div>
            {current ? <AssetPreview asset={current} spotlights={assets} /> : <div className="grid aspect-video place-items-center rounded-lg bg-gray-100 text-sm text-gray-500">Pick at least one promo</div>}
            {pickedAssets.length > 1 && (
              <div className="mt-2 flex justify-center gap-1">{pickedAssets.map((a, i) => <span key={a.id} className={`h-1.5 w-4 rounded-full ${i === slide % pickedAssets.length ? 'bg-pine' : 'bg-gray-300'}`} />)}</div>
            )}
            <p className="mt-4 text-lg font-bold">
              {picked.length || 'No'} promo{picked.length === 1 ? '' : 's'}{s ? ` on ${s.name}` : ''}, {fmtRange(start, end)}{repeat === 'daily' ? ', every day' : repeat === 'weekdays' ? ', weekdays' : ', today'}.
            </p>
            {around.length > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                {around.map((b) => `${b.title} (${fmtRange(b.start, b.end)})`).join(', ')} stays on. Your promos play around it.
              </p>
            )}
            <button className="btn-primary mt-5 w-full" disabled={!ready} onClick={save}>Save</button>
          </div>
        </div>
      </div>
      {s && (
        <div className="mt-6">
          <div className="eyebrow mb-2">Today on {s.name}</div>
          <DayTimeline blocks={blocks} screenIds={[s.id]} focus={{ screenId: s.id, start, end }} />
        </div>
      )}
    </Container>
  )
}
