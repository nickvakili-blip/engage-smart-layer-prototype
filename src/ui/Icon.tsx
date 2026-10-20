const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  megaphone: 'M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a3 3 0 010 6M18 7a6 6 0 010 10',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 100-8 4 4 0 000 8z',
  playlist: 'M3 6h12M3 11h12M3 16h7M15 15l5 3-5 3z',
  audio: 'M3 6h12M3 11h12M3 16h8M19 4v12a2 2 0 11-2-2h2',
  grid: 'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z',
  chart: 'M3 17l6-6 4 4 8-8',
  help: 'M4 4h16v16H4zM9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01',
  folder: 'M3 6h6l2 2h10v11H3zM12 11l1 2 2 .3-1.5 1.4.4 2.1L12 15.8l-1.9 1 .4-2.1L9 13.3l2-.3z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  phone: 'M7 2h10v20H7zM11 18h2',
  router: 'M3 14h18v6H3zM7 17h.01M11 17h.01M12 14V9M8 6a6 6 0 018 0M6 3.5a9 9 0 0112 0',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  arrowUpRight: 'M7 17L17 7M8 7h9v9',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  plus: 'M12 5v14M5 12h14',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM16 16h2v2h-2z',
  menu: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4',
  spotlight: 'M4 5h16v11H4zM8 20h8M12 16v4M8 12l3-3 2 2 3-3',
  tv: 'M3 5h18v12H3zM8 21h8M12 17v4',
  calendar: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 21h8M10 17h4v4h-4z',
  fill: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M5 7h14M10 7V4h4v3M6 7l1 13h10l1-13',
  play: 'M7 4l13 8-13 8z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  rotate: 'M4 4v6h6M20 20v-6h-6M5.5 15a8 8 0 0013.5 2M18.5 9A8 8 0 005 7',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4',
  dots: 'M12 5h.01M12 12h.01M12 19h.01',
  filter: 'M4 6h16M7 12h10M10 18h4',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  send: 'M4 12l16-8-6 16-3-7z',
  link: 'M10 14a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1 1M14 10a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1-1',
  columns: 'M4 4h7v16H4zM13 4h7v16h-7z',
  rows: 'M4 4h16v16H4z',
  reset: 'M4 4v6h6M4.5 15a8 8 0 101.9-8.4L4 10',
  sidebar: 'M4 6h10M4 12h16M4 18h10M17 6l3 3-3 3',
  paperclip: 'M20 11.5l-8.5 8.5a5 5 0 01-7-7L13 4.5a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L14 7.5',
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }: { name: keyof typeof PATHS | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name] ?? PATHS.sparkle} />
    </svg>
  )
}

export function EverpassLogo({ className = 'h-7' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 36" className="h-full" aria-hidden>
        <path d="M2 2h30l-6 7H8zM10 13h30l-6 7H16zM2 24h30l-6 7H8z" fill="#fff" />
        <path d="M36 2h10l-6 7h-10zM42 13h4l-6 7h-4z" fill="#fff" opacity=".7" />
      </svg>
      <span className="text-[26px] font-semibold leading-none tracking-tight text-white">everpass</span>
    </div>
  )
}
