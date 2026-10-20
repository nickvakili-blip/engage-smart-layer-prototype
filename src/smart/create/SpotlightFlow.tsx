import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Asset, SpotlightData } from '../../types'
import { useDraft } from '../../state/store'
import { SAMPLE_PHOTOS, readAndResize } from '../../data/images'
import { todayStamp, uid } from '../../lib/time'
import { AutoChecklist, Container, PageHeader, ReviewLink, Segmented, Steps } from '../../ui/common'
import { SpotlightSlide } from '../../ui/ScreenPreview'
import { Icon } from '../../ui/Icon'
import { PublishStep } from './PublishStep'

const STEPS = ['photo', 'words', 'design', 'publish'] as const
type Step = (typeof STEPS)[number]
const LABELS = ['Photo', 'Words', 'Design', 'Publish']

const OFFER_RE = /(\d+\s*%\s*off|\$\s*\d+(?:\.\d{2})?(?:\s*(?:off|each|pints?|drafts?|wings|tacos))?|half[-\s]?price|bogo|buy one,? get one(?: free)?|2\s*for\s*\$?\d+|free\s+\w+)/i

/** "Guinness 50% off" → headline "Guinness", offer "50% off" */
export function splitOffer(text: string): { headline: string; offer: string } {
  const m = text.match(OFFER_RE)
  if (!m) return { headline: text.trim(), offer: '' }
  const headline = text.replace(m[0], '').replace(/\s{2,}/g, ' ').replace(/^[\s,:\-–—]+|[\s,:\-–—]+$/g, '')
  return { headline: headline || m[0], offer: headline ? m[0].replace(/\s+/g, ' ') : '' }
}

interface Draft extends SpotlightData {
  id: string
  quick: string
  name: string
  qrOn: boolean
}

const initial = (): Draft => ({ id: uid('a'), image: '', quick: '', headline: '', offer: '', subline: '', layout: 'panel', name: '', qrOn: false, qrUrl: '' })

export default function SpotlightFlow() {
  const [params, setParams] = useSearchParams()
  const [draft, update, clear] = useDraft<Draft>('spotlight', initial())
  const step = (STEPS.includes(params.get('step') as Step) ? params.get('step') : 'photo') as Step
  const go = (s: Step) => {
    const p = new URLSearchParams(params)
    p.set('step', s)
    setParams(p)
    window.scrollTo({ top: 0 })
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [formatted, setFormatted] = useState(0)

  // Pre-fill from the plain-language box
  useEffect(() => {
    const h = params.get('headline')
    if (h && !draft.quick) {
      const s = splitOffer(h)
      update({ quick: h, ...s, name: s.headline })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard deep links into later steps without a photo
  useEffect(() => {
    if (step !== 'photo' && step !== 'publish' && !draft.image) go('photo')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    if (step !== 'design') return
    setFormatted(0)
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setFormatted(n), n * 280))
    return () => timers.forEach(clearTimeout)
  }, [step])

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const src = await readAndResize(file)
    setBusy(false)
    update({ image: src })
    go('words')
  }

  const data: SpotlightData = { image: draft.image, headline: draft.headline, offer: draft.offer, subline: draft.subline, layout: draft.layout, qrUrl: draft.qrOn ? draft.qrUrl : undefined }
  const asset: Asset = { id: draft.id, name: draft.name || draft.headline || 'New Spotlight', kind: 'spotlight', createdAt: todayStamp(), enabled: true, owner: 'Nick', fromSmart: true, spotlight: data }

  return (
    <Container wide={step === 'design' || step === 'publish'}>
      <PageHeader
        back={{ to: '/smart', label: 'Smart Home' }}
        eyebrow="Create"
        title="Spotlight"
        subtitle="One photo and a few words, turned into a promo slide for your TVs."
        right={<ReviewLink to="/advanced/promotions" label="Open Promotions" className="hidden md:inline-flex" />}
      />
      <Steps steps={LABELS} current={STEPS.indexOf(step)} />

      {step === 'photo' && (
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-xl font-bold">Start with a photo</h2>
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => camRef.current?.click()} className="flex items-center gap-4 rounded-xl bg-ink p-5 text-left text-white hover:bg-black/80">
              <Icon name="camera" className="h-8 w-8" />
              <span><span className="block text-lg font-bold">Take a photo</span><span className="text-sm text-white/70">Uses your phone camera</span></span>
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-4 rounded-xl border-2 border-ink p-5 text-left hover:bg-gray-50">
              <Icon name="upload" className="h-8 w-8" />
              <span><span className="block text-lg font-bold">Upload an image</span><span className="text-sm text-gray-600">JPG or PNG</span></span>
            </button>
          </div>
          {busy && <p className="mt-3 text-sm text-gray-600">Preparing your photo…</p>}
          <div className="mt-8">
            <div className="eyebrow mb-3">Or try a sample</div>
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_PHOTOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    update({ image: p.src })
                    go('words')
                  }}
                  className={`overflow-hidden rounded-xl border-2 text-left transition hover:border-pine ${draft.image === p.src ? 'border-pine' : 'border-transparent'}`}
                >
                  <img src={p.src} alt={p.label} className="aspect-video w-full object-cover" />
                  <span className="block p-2 text-sm font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'words' && (
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <img src={draft.image} alt="" className="h-16 w-28 rounded-lg object-cover" />
            <button className="text-sm font-semibold text-pine hover:underline" onClick={() => go('photo')}>Change photo</button>
          </div>
          <label className="block">
            <span className="mb-1 block text-xl font-bold">What's the offer?</span>
            <span className="mb-3 block text-sm text-gray-600">Type it the way you'd say it. We'll lay it out.</span>
            <input
              autoFocus
              className="field text-lg"
              placeholder="Guinness 50% off"
              value={draft.quick}
              onChange={(e) => {
                const s = splitOffer(e.target.value)
                update({ quick: e.target.value, ...s, name: s.headline })
              }}
            />
          </label>
          {draft.quick && (
            <div className="animate-slideup mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-md bg-gray-100 px-2.5 py-1"><span className="text-gray-500">Headline</span> <b>{draft.headline}</b></span>
              {draft.offer && <span className="rounded-md bg-amber-100 px-2.5 py-1"><span className="text-amber-700">Offer</span> <b>{draft.offer}</b></span>}
            </div>
          )}
          <label className="mt-6 block">
            <span className="label">Extra line <span className="font-normal text-gray-500">(optional)</span></span>
            <input className="field" placeholder="All day Tuesday · Bar & patio" value={draft.subline} onChange={(e) => update({ subline: e.target.value })} />
          </label>
          <div className="mt-6 rounded-xl border p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Add a QR code</span>
                <span className="text-sm text-gray-600">Guests scan it to open a link</span>
              </span>
              <input type="checkbox" className="h-5 w-5 accent-pine" checked={draft.qrOn} onChange={(e) => update({ qrOn: e.target.checked })} />
            </label>
            {draft.qrOn && <input className="field mt-3" placeholder="https://coppertap.com/specials" value={draft.qrUrl} onChange={(e) => update({ qrUrl: e.target.value })} />}
          </div>
          <div className="mt-8 flex gap-3">
            <button className="btn-back w-32" onClick={() => go('photo')}>Back</button>
            <button className="btn-primary flex-1 sm:flex-none sm:px-10" disabled={!draft.headline} onClick={() => go('design')}>See it on screen</button>
          </div>
        </div>
      )}

      {step === 'design' && (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SpotlightSlide data={data} safeZone />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">Layout</span>
              <Segmented
                value={draft.layout}
                onChange={(layout) => update({ layout })}
                options={[{ value: 'panel', label: 'Side panel' }, { value: 'band', label: 'Bottom band' }, { value: 'overlay', label: 'Full overlay' }]}
              />
            </div>
          </div>
          <div>
            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <AutoChecklist done={formatted} items={['Cropped to fit every TV', 'Text sized to read from 20 feet', 'Copper Tap logo and colors added', 'Checked against the screen-safe area']} />
            </div>
            <div className="space-y-4">
              <label className="block"><span className="label">Headline</span><input className="field" value={draft.headline} onChange={(e) => update({ headline: e.target.value })} /></label>
              <label className="block"><span className="label">Offer</span><input className="field" value={draft.offer} placeholder="50% off" onChange={(e) => update({ offer: e.target.value })} /></label>
              <label className="block"><span className="label">Extra line</span><input className="field" value={draft.subline} onChange={(e) => update({ subline: e.target.value })} /></label>
              {draft.qrOn && <label className="block"><span className="label">QR link</span><input className="field" value={draft.qrUrl} onChange={(e) => update({ qrUrl: e.target.value })} /></label>}
              <label className="block"><span className="label">Name in your library</span><input className="field" value={draft.name} onChange={(e) => update({ name: e.target.value })} /></label>
            </div>
            <div className="mt-8 flex gap-3">
              <button className="btn-back w-32" onClick={() => go('words')}>Back</button>
              <button className="btn-primary flex-1 sm:flex-none sm:px-10" onClick={() => go('publish')}>Next: publish</button>
            </div>
          </div>
        </div>
      )}

      {step === 'publish' && (
        <PublishStep
          asset={asset}
          initialScreen={params.get('screen') ?? undefined}
          onBack={() => go('design')}
          onPublished={clear}
          onRestart={() => {
            clear()
            setParams({})
          }}
        />
      )}
    </Container>
  )
}
