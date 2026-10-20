import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Asset, Block, MarketingRule } from '../../types'
import { useStore } from '../../state/store'
import { SCREENS } from '../../data/seed'
import { marketingBlock, placeBlock } from '../../lib/schedule'
import { CLOSE, NOW, TIME_OPTIONS, fmtRange, fmtTime, uid } from '../../lib/time'
import { AssetPreview } from '../../ui/ScreenPreview'
import { OptionCard, ReviewLink, ScreenPicker, Segmented } from '../../ui/common'
import { Icon } from '../../ui/Icon'

type Choice = 'now' | 'rotation' | 'schedule'

const UNTIL = [NOW + 45, NOW + 105, NOW + 165, NOW + 285, CLOSE].map((t, i) => (i < 4 ? Math.round(t / 60) * 60 : t))

export function PublishStep({ asset, onBack, onRestart, onPublished, initialScreen }: { asset: Asset; onBack: () => void; onRestart: () => void; onPublished?: () => void; initialScreen?: string }) {
  const { assets, blocks, addAsset, setBlocks, addRule, addToRotation, toast } = useStore()
  const [choice, setChoice] = useState<Choice | null>(null)
  const [screens, setScreens] = useState<string[]>(initialScreen ? [initialScreen] : [])
  const [until, setUntil] = useState(UNTIL[1])
  const [start, setStart] = useState(17 * 60)
  const [end, setEnd] = useState(19 * 60)
  const [repeat, setRepeat] = useState<MarketingRule['repeat']>('today')
  const [result, setResult] = useState<{ lines: string[]; warnings: string[]; asset: Asset } | null>(null)

  const isMenu = asset.kind === 'menu'
  const rotationWindows = blocks.filter((b) => b.kind === 'marketing' || (b.kind === 'playlist' && b.title === 'Marketing rotation'))
  const needsScreens = choice === 'now' || choice === 'schedule'
  const ready = choice && (!needsScreens || screens.length > 0) && (choice !== 'schedule' || end > start)

  const publish = () => {
    if (!choice) return
    const saved: Asset = { ...asset, createdAt: asset.createdAt }
    if (!assets.some((a) => a.id === saved.id)) addAsset(saved)
    const lines: string[] = []
    const warnings: string[] = []
    const names = (ids: string[]) => ids.map((id) => SCREENS.find((s) => s.id === id)?.name).join(', ')
    const placeAll = (make: (screenId: string) => Block) => {
      let cur = blocks
      for (const sid of screens) {
        const res = placeBlock(cur, make(sid))
        if (res.placed) cur = res.blocks
        else if (res.conflict) warnings.push(`${SCREENS.find((s) => s.id === sid)?.name} is showing “${res.conflict.title}” then, so it was skipped. Live games finish first.`)
      }
      setBlocks(() => cur)
    }
    if (choice === 'now') {
      placeAll((sid) => ({ id: uid('b'), screenId: sid, start: NOW, end: until, kind: isMenu ? 'menu' : 'marketing', title: asset.name, subtitle: isMenu ? 'Menu board' : 'Playing now', assetIds: [asset.id], source: 'smart' }))
      lines.push(`Playing now on ${names(screens)} until ${fmtTime(until)}.`)
    } else if (choice === 'rotation') {
      addToRotation([asset.id])
      lines.push('Added to your marketing playlist.')
      lines.push(rotationWindows.length ? `It plays wherever that playlist runs today: ${[...new Set(rotationWindows.map((b) => SCREENS.find((s) => s.id === b.screenId)?.name))].join(', ')}.` : 'It will play whenever you put marketing on a TV.')
    } else {
      const rule: MarketingRule = { id: uid('r'), kind: 'marketing', assetIds: [asset.id], screenId: screens[0], start, end, repeat, createdAt: new Date().toISOString() }
      for (const sid of screens) addRule({ ...rule, id: uid('r'), screenId: sid })
      placeAll((sid) => (isMenu ? { id: uid('b'), screenId: sid, start, end, kind: 'menu', title: asset.name, subtitle: 'Menu board', assetIds: [asset.id], source: 'smart' } : marketingBlock({ ...rule, screenId: sid }, asset.name)))
      lines.push(`Scheduled on ${names(screens)}, ${fmtRange(start, end)}${repeat === 'today' ? ' today' : repeat === 'daily' ? ', every day' : ', weekdays'}.`)
    }
    toast(`“${asset.name}” published`, { to: choice === 'rotation' ? '/advanced/playlist' : `/advanced/schedule?screen=${screens[0]}`, label: 'Review in Advanced' })
    setResult({ lines, warnings, asset: saved })
    onPublished?.()
  }

  if (result) {
    return (
      <div className="animate-slideup mx-auto max-w-xl text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint"><Icon name="check" className="h-7 w-7" strokeWidth={3} /></span>
        <h2 className="text-2xl font-bold">It's live</h2>
        {result.lines.map((l) => <p key={l} className="mt-1 text-gray-700">{l}</p>)}
        {result.warnings.map((w) => <p key={w} className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800">{w}</p>)}
        <div className="mx-auto mt-6 max-w-sm"><AssetPreview asset={result.asset} spotlights={assets} /></div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-outline" onClick={onRestart}>Create another</button>
          <Link to="/smart" className="btn-primary">Back to Smart Home</Link>
        </div>
        <div className="mt-4 flex justify-center gap-6">
          <ReviewLink to={result.asset.kind === 'qr' ? '/advanced/promotions/qr' : '/advanced/promotions'} label="See it in Promotions" />
          {choice !== 'rotation' && <ReviewLink to={`/advanced/schedule?screen=${screens[0]}`} label="See the schedule" />}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="lg:sticky lg:top-28">
          <AssetPreview asset={asset} spotlights={assets} safeZone />
          <p className="mt-2 text-xs text-gray-500">Preview on a 16:9 screen. The dashed line is the area every TV shows in full.</p>
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-xl font-bold">Where should it play?</h2>
        <p className="mb-4 text-sm text-gray-600">Pick one. You can change it later in Advanced mode.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <OptionCard selected={choice === 'now'} onClick={() => setChoice('now')} icon="play" title="Play now on a TV" body="Takes over the TVs you pick, right away." />
          <OptionCard selected={choice === 'rotation'} onClick={() => setChoice('rotation')} icon="rotate" title="Add to marketing rotation" body="Joins the promos that cycle on your marketing TVs." disabled={isMenu} />
          <OptionCard selected={choice === 'schedule'} onClick={() => setChoice('schedule')} icon="clock" title="Schedule for a time" body="Plays on the TVs you pick during a time window." />
        </div>

        {needsScreens && (
          <div className="animate-slideup mt-6">
            <div className="label">Which TVs?</div>
            <ScreenPicker multi value={screens} onChange={setScreens} />
          </div>
        )}
        {choice === 'now' && (
          <div className="animate-slideup mt-5">
            <div className="label">Until</div>
            <div className="flex flex-wrap gap-2">
              {UNTIL.map((t) => (
                <button key={t} className={`chip ${until === t ? 'chip-on' : 'chip-off'}`} onClick={() => setUntil(t)}>
                  {t === CLOSE ? 'Close' : fmtTime(t)}
                </button>
              ))}
            </div>
          </div>
        )}
        {choice === 'schedule' && (
          <div className="animate-slideup mt-5 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="label">From</span>
                <select className="field w-36" value={start} onChange={(e) => setStart(+e.target.value)}>
                  {TIME_OPTIONS.slice(0, -1).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">To</span>
                <select className="field w-36" value={end} onChange={(e) => setEnd(+e.target.value)}>
                  {TIME_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                </select>
              </label>
            </div>
            {end <= start && <p className="text-sm text-red-600">The end time needs to be after the start time.</p>}
            <div>
              <span className="label">Repeat</span>
              <Segmented value={repeat} onChange={setRepeat} options={[{ value: 'today', label: 'Today only' }, { value: 'daily', label: 'Every day' }, { value: 'weekdays', label: 'Weekdays' }]} />
            </div>
          </div>
        )}
        {choice === 'rotation' && (
          <div className="animate-slideup mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {rotationWindows.length ? (
              <>
                Your marketing playlist plays today on:
                <ul className="mt-2 space-y-1">
                  {rotationWindows.map((b) => (
                    <li key={b.id} className="flex items-center gap-2"><Icon name="tv" className="h-4 w-4 text-gray-500" /> <b>{SCREENS.find((s) => s.id === b.screenId)?.name}</b> {fmtRange(b.start, b.end)}</li>
                  ))}
                </ul>
              </>
            ) : (
              'Nothing is playing your marketing playlist today yet. Use Marketing on a TV to give it a home.'
            )}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button className="btn-back w-32" onClick={onBack}>Back</button>
          <button className="btn-primary flex-1 sm:flex-none sm:px-10" disabled={!ready} onClick={publish}>Publish</button>
        </div>
      </div>
    </div>
  )
}
