import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import QRCode from 'qrcode'
import type { Asset, MenuData, PosterData, QrData, SpotlightData } from '../types'
import { VENUE } from '../data/seed'

export function useQr(url: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    if (!url) {
      setSrc(null)
      return
    }
    QRCode.toDataURL(url, { margin: 1, width: 512, color: { dark: '#0b0b0b', light: '#ffffff' } })
      .then((d) => live && setSrc(d))
      .catch(() => live && setSrc(null))
    return () => {
      live = false
    }
  }, [url])
  return src
}

const display: CSSProperties = { fontFamily: 'Oswald, "DM Sans", sans-serif' }

function Frame({ children, safeZone, className = '', label }: { children: ReactNode; safeZone?: boolean; className?: string; label?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-black/10 ${className}`} style={{ containerType: 'inline-size' }}>
      {children}
      {safeZone && (
        <div className="pointer-events-none absolute inset-[5%] rounded safe-zone">
          <span className="absolute -top-px left-2 -translate-y-full rounded-t bg-mint px-1.5 text-[10px] font-bold text-ink">SCREEN-SAFE AREA</span>
        </div>
      )}
      {label && <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{label}</span>}
    </div>
  )
}

function VenueMark({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: '1cqw' }}>
      <span className="grid place-items-center rounded-full font-bold" style={{ width: '4cqw', height: '4cqw', fontSize: '1.6cqw', background: VENUE.accent, color: VENUE.primary }}>
        {VENUE.monogram}
      </span>
      <span className="font-semibold" style={{ fontSize: '1.6cqw', color: light ? 'rgba(255,255,255,.85)' : VENUE.primary }}>{VENUE.name}</span>
    </div>
  )
}

function QrBox({ url, size = '13cqw', caption }: { url?: string; size?: string; caption?: string }) {
  const src = useQr(url)
  if (!url) return null
  return (
    <div className="flex flex-col items-center rounded-lg bg-white" style={{ padding: '0.8cqw', gap: '0.4cqw' }}>
      {src ? <img src={src} alt="QR code" style={{ width: size, height: size }} /> : <div style={{ width: size, height: size }} className="bg-gray-100" />}
      {caption && <span className="font-bold uppercase text-ink" style={{ fontSize: '1.1cqw' }}>{caption}</span>}
    </div>
  )
}

export function SpotlightSlide({ data, safeZone }: { data: SpotlightData; safeZone?: boolean }) {
  const headlineSize = data.headline.length > 18 ? '5.2cqw' : '7cqw'
  const Text = (
    <>
      <h2 className="uppercase leading-[0.95] text-white" style={{ ...display, fontSize: headlineSize, fontWeight: 700 }}>{data.headline || 'Your headline'}</h2>
      {data.offer && (
        <div className="inline-block self-start rounded uppercase" style={{ ...display, background: VENUE.accent, color: VENUE.primary, fontSize: '4.2cqw', fontWeight: 700, padding: '0.3cqw 1.4cqw', marginTop: '1.2cqw' }}>
          {data.offer}
        </div>
      )}
      {data.subline && <p className="text-white/85" style={{ fontSize: '2cqw', marginTop: '1.2cqw' }}>{data.subline}</p>}
    </>
  )
  return (
    <Frame safeZone={safeZone}>
      {data.image && <img src={data.image} alt="" className={`absolute inset-0 h-full w-full object-cover ${data.layout === 'panel' ? 'object-right' : ''}`} />}
      {data.layout === 'panel' && (
        <div className="absolute inset-y-0 left-0 flex w-[46%] flex-col justify-between" style={{ background: `linear-gradient(90deg, ${VENUE.primary} 80%, ${VENUE.primary}00)`, padding: '6cqw 5cqw 5cqw 6cqw' }}>
          <div className="flex flex-col">{Text}</div>
          <div className="flex items-end justify-between">
            <VenueMark />
          </div>
        </div>
      )}
      {data.layout === 'band' && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between" style={{ background: `linear-gradient(0deg, ${VENUE.primary} 70%, ${VENUE.primary}00)`, padding: '8cqw 6cqw 5cqw' }}>
          <div className="flex flex-col">{Text}</div>
          <VenueMark />
        </div>
      )}
      {data.layout === 'overlay' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-center" style={{ padding: '6cqw' }}>
          <div className="flex flex-col items-center [&>div]:self-center">{Text}</div>
          <div className="absolute" style={{ left: '6cqw', bottom: '5cqw' }}><VenueMark /></div>
        </div>
      )}
      {data.qrUrl && (
        <div className="absolute" style={{ right: '6cqw', bottom: '6cqw' }}>
          <QrBox url={data.qrUrl} size="11cqw" caption="Scan me" />
        </div>
      )}
    </Frame>
  )
}

export function QrSlide({ data, safeZone }: { data: QrData; safeZone?: boolean }) {
  return (
    <Frame safeZone={safeZone}>
      <div className="absolute inset-0 flex items-center justify-between" style={{ background: `radial-gradient(circle at 80% 50%, #2b6a50, ${VENUE.primary} 60%)`, padding: '6cqw' }}>
        <div className="flex max-w-[55%] flex-col" style={{ gap: '1.5cqw' }}>
          <span className="uppercase tracking-widest" style={{ color: VENUE.accent, fontSize: '1.8cqw', fontWeight: 700 }}>Scan with your phone camera</span>
          <h2 className="uppercase leading-[0.95] text-white" style={{ ...display, fontSize: data.label.length > 24 ? '5cqw' : '6.4cqw', fontWeight: 700 }}>{data.label || 'Scan to learn more'}</h2>
          <span className="truncate text-white/70" style={{ fontSize: '1.6cqw' }}>{data.url.replace(/^https?:\/\//, '')}</span>
          <div style={{ marginTop: '3cqw' }}><VenueMark /></div>
        </div>
        <QrBox url={data.url || 'https://example.com'} size="26cqw" />
      </div>
    </Frame>
  )
}

export function MenuSlide({ data, safeZone }: { data: MenuData; safeZone?: boolean }) {
  const count = data.sections.reduce((n, s) => n + s.items.length + 1.6, 0)
  const perCol = data.columns === 2 ? count / 2 : count
  const item = Math.max(1.4, Math.min(2.6, 30 / perCol))
  return (
    <Frame safeZone={safeZone}>
      <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${VENUE.primary}, #12301f)`, padding: '4.5cqw 6cqw' }}>
        <div className="flex items-end justify-between" style={{ marginBottom: '2cqw' }}>
          <h2 className="uppercase text-white" style={{ ...display, fontSize: '4.4cqw', fontWeight: 700, lineHeight: 1 }}>{data.title || 'Menu'}</h2>
          <VenueMark />
        </div>
        <div className="min-h-0 flex-1" style={{ columnCount: data.columns, columnGap: '5cqw' }}>
          {data.sections.map((s) => (
            <div key={s.id} style={{ breakInside: 'avoid', marginBottom: `${item * 0.9}cqw` }}>
              <div className="uppercase tracking-wider" style={{ ...display, color: VENUE.accent, fontSize: `${item * 1.05}cqw`, fontWeight: 700, borderBottom: `0.15cqw solid ${VENUE.accent}66`, marginBottom: `${item * 0.35}cqw` }}>
                {s.title}
              </div>
              {s.items.map((it) => (
                <div key={it.id} className="flex items-baseline text-white" style={{ fontSize: `${item}cqw`, lineHeight: 1.45, gap: '0.8cqw' }}>
                  <span className="whitespace-nowrap">{it.name}</span>
                  <span className="flex-1 border-b border-dotted border-white/30" />
                  <span className="font-semibold">{it.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function PosterSlide({ data }: { data: PosterData }) {
  return (
    <Frame>
      <div className="absolute inset-0 flex flex-col justify-center" style={{ background: data.bg, padding: '6cqw' }}>
        <span className="uppercase tracking-widest text-white/85" style={{ fontSize: '2.2cqw', fontWeight: 700 }}>{data.kicker}</span>
        <h2 className="uppercase leading-[0.9]" style={{ ...display, color: data.accent, fontSize: '9cqw', fontWeight: 700 }}>{data.title}</h2>
        <div className="absolute flex items-center text-white/80" style={{ right: '5cqw', bottom: '4cqw', fontSize: '1.6cqw', gap: '0.6cqw' }}>
          <span className="font-semibold">everpass</span>
        </div>
      </div>
    </Frame>
  )
}

export function AssetPreview({ asset, safeZone, spotlights }: { asset: Asset; safeZone?: boolean; spotlights?: Asset[] }) {
  if (asset.spotlight) return <SpotlightSlide data={asset.spotlight} safeZone={safeZone} />
  if (asset.qr) {
    if (asset.qr.mode === 'spotlight') {
      const host = spotlights?.find((s) => s.id === asset.qr!.spotlightId)
      if (host?.spotlight) return <SpotlightSlide data={{ ...host.spotlight, qrUrl: asset.qr.url }} safeZone={safeZone} />
      if (host?.poster) return <PosterWithQr poster={host.poster} url={asset.qr.url} />
    }
    return <QrSlide data={asset.qr} safeZone={safeZone} />
  }
  if (asset.menu) return <MenuSlide data={asset.menu} safeZone={safeZone} />
  if (asset.poster) return <PosterSlide data={asset.poster} />
  return <Frame><div /></Frame>
}

export function PosterWithQr({ poster, url }: { poster: PosterData; url: string }) {
  return (
    <div className="relative">
      <PosterSlide data={poster} />
      <div className="absolute inset-0" style={{ containerType: 'inline-size' }}>
        <div className="absolute" style={{ right: '5cqw', top: '50%', transform: 'translateY(-50%)' }}>
          <QrBox url={url} size="14cqw" caption="Scan me" />
        </div>
      </div>
    </div>
  )
}

/** Small thumbnail: same renderer, scaled down */
export function Thumb({ asset, assets, className = 'w-28' }: { asset: Asset; assets?: Asset[]; className?: string }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-md`}>
      <AssetPreview asset={asset} spotlights={assets} />
    </div>
  )
}
