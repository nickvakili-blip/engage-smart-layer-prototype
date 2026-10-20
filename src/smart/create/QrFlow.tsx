import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Asset, QrData } from '../../types'
import { useDraft, useStore } from '../../state/store'
import { todayStamp, uid } from '../../lib/time'
import { Container, OptionCard, PageHeader, ReviewLink, Steps } from '../../ui/common'
import { AssetPreview, Thumb } from '../../ui/ScreenPreview'
import { PublishStep } from './PublishStep'
import { QR_LABEL_IDEAS, normalizeUrl, validUrl } from './helpers'
import { CreateChat, StepByStepDivider, clearChat } from './CreateChat'
import { qrBrain } from './chatBrains'
import type { QrSlots } from './chatBrains'

const STEPS = ['link', 'layout', 'publish'] as const
type Step = (typeof STEPS)[number]


interface Draft extends QrData {
  id: string
  name: string
}

const initial = (): Draft => ({ id: uid('a'), url: '', label: '', mode: 'full', name: '' })

export default function QrFlow() {
  const [params, setParams] = useSearchParams()
  const { assets } = useStore()
  const [draft, update, clear] = useDraft<Draft>('qr', initial())
  const step = (STEPS.includes(params.get('step') as Step) ? params.get('step') : 'link') as Step
  const go = (s: Step) => {
    const p = new URLSearchParams(params)
    p.set('step', s)
    setParams(p)
    window.scrollTo({ top: 0 })
  }
  const spotlights = assets.filter((a) => a.kind === 'spotlight')

  useEffect(() => {
    const u = params.get('url')
    if (u && !draft.url) update({ url: u })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step !== 'link' && step !== 'publish' && !validUrl(draft.url)) go('link')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const qr: QrData = { url: normalizeUrl(draft.url), label: draft.label, mode: draft.mode, spotlightId: draft.spotlightId }
  const host = spotlights.find((s) => s.id === draft.spotlightId)
  const asset: Asset = {
    id: draft.id,
    name: draft.name || draft.label || 'QR code',
    kind: 'qr',
    createdAt: todayStamp(),
    enabled: true,
    owner: 'Nick',
    fromSmart: true,
    qr,
  }

  return (
    <Container wide={step !== 'link'}>
      <PageHeader
        back={{ to: '/smart', label: 'Smart Home' }}
        eyebrow="Create"
        title="QR code"
        subtitle="Point guests to a link. They scan the screen with their phone camera."
        right={<ReviewLink to="/advanced/promotions/qr" label="Open QR Campaigns" className="hidden md:inline-flex" />}
      />
      <Steps steps={['Link', 'Layout', 'Publish']} current={STEPS.indexOf(step)} />

      {step === 'link' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <CreateChat<QrSlots>
              chatKey="qr"
              brain={qrBrain}
              slots={draft}
              onPatch={(p) => update({ ...p, ...(p.label ? { name: p.label } : {}) })}
              onDone={(next) => go(next as Step)}
              examples={['coppertap.com/rewards, join our rewards club', 'Leave us a review at g.page/coppertap', 'Add a QR to the Paramount spotlight linking to coppertap.com/watch']}
              placeholder="e.g. coppertap.com/rewards, join our rewards club"
            />
            <StepByStepDivider />
          </div>
          <label className="block">
            <span className="mb-1 block text-xl font-bold">Where should the QR code go?</span>
            <span className="mb-3 block text-sm text-gray-600">A landing page, menu, sign-up form or review page.</span>
            <input autoFocus className="field text-lg" inputMode="url" placeholder="https://www.example.com" value={draft.url} onChange={(e) => update({ url: e.target.value })} />
          </label>
          {draft.url && !validUrl(draft.url) && <p className="-mt-4 text-sm text-red-600">That doesn't look like a web address yet.</p>}
          <div>
            <label className="block">
              <span className="label">What should the screen say? <span className="font-normal text-gray-500">(optional)</span></span>
              <input className="field" placeholder="Join our rewards club" value={draft.label} onChange={(e) => update({ label: e.target.value, name: e.target.value })} />
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {QR_LABEL_IDEAS.map((l) => (
                <button key={l} className={`chip ${draft.label === l ? 'chip-on' : 'chip-off'}`} onClick={() => update({ label: l, name: l })}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1 sm:flex-none sm:px-10" disabled={!validUrl(draft.url)} onClick={() => go('layout')}>Next</button>
          </div>
        </div>
      )}

      {step === 'layout' && (
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <AssetPreview asset={asset} spotlights={assets} safeZone />
            <p className="mt-2 text-xs text-gray-500">This is a real, scannable code. Try it with your phone.</p>
          </div>
          <div>
            <h2 className="mb-3 text-xl font-bold">How should it appear?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard selected={draft.mode === 'full'} onClick={() => update({ mode: 'full' })} icon="qr" title="Full-screen QR slide" body="A big code with your message. Easiest to scan from across the room." />
              <OptionCard selected={draft.mode === 'spotlight'} onClick={() => update({ mode: 'spotlight', spotlightId: draft.spotlightId ?? spotlights[0]?.id })} icon="spotlight" title="Add to a Spotlight" body="Puts a small code in the corner of a promo you already have." />
            </div>
            {draft.mode === 'spotlight' && (
              <div className="animate-slideup mt-5">
                <div className="label">Which Spotlight?</div>
                <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                  {spotlights.map((s) => (
                    <button key={s.id} onClick={() => update({ spotlightId: s.id })} className={`flex items-center gap-3 rounded-lg border-2 p-2 text-left ${draft.spotlightId === s.id ? 'border-pine bg-pine-light' : 'border-gray-200 hover:border-gray-400'}`}>
                      <Thumb asset={s} className="w-24" />
                      <span className="font-semibold">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="mt-6 block"><span className="label">Name in your library</span><input className="field" value={draft.name} placeholder={host ? `${host.name} + QR` : 'QR code'} onChange={(e) => update({ name: e.target.value })} /></label>
            <div className="mt-8 flex gap-3">
              <button className="btn-back w-32" onClick={() => go('link')}>Back</button>
              <button className="btn-primary flex-1 sm:flex-none sm:px-10" onClick={() => go('publish')}>Next: publish</button>
            </div>
          </div>
        </div>
      )}

      {step === 'publish' && (
        <PublishStep
          asset={asset}
          onBack={() => go('layout')}
          onPublished={() => {
            clear()
            clearChat('qr')
          }}
          onRestart={() => {
            clear()
            clearChat('qr')
            setParams({})
          }}
        />
      )}
    </Container>
  )
}
