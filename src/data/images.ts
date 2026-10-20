const toUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const bokeh = (n: number, seed: number, color: string) =>
  Array.from({ length: n }, (_, i) => {
    const x = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1
    const y = (Math.sin(seed + i * 78.233) * 12345.6789) % 1
    const r = 30 + ((i * 37) % 70)
    return `<circle cx='${Math.abs(x) * 1600}' cy='${Math.abs(y) * 560}' r='${r}' fill='${color}' opacity='${0.06 + (i % 4) * 0.04}'/>`
  }).join('')

export const STOUT_PHOTO = toUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
<defs>
<radialGradient id='bg' cx='62%' cy='38%' r='85%'><stop offset='0' stop-color='#8a5527'/><stop offset='.55' stop-color='#3b2212'/><stop offset='1' stop-color='#120904'/></radialGradient>
<linearGradient id='beer' x1='0' x2='1'><stop offset='0' stop-color='#0c0503'/><stop offset='.42' stop-color='#2a130a'/><stop offset='.55' stop-color='#3d1e0e'/><stop offset='1' stop-color='#090403'/></linearGradient>
<linearGradient id='head' y1='0' y2='1'><stop offset='0' stop-color='#fff8e8'/><stop offset='1' stop-color='#e2c895'/></linearGradient>
<linearGradient id='bar' y1='0' y2='1'><stop offset='0' stop-color='#6b3e1b'/><stop offset='.15' stop-color='#4a2a12'/><stop offset='1' stop-color='#1d0f06'/></linearGradient>
</defs>
<rect width='1600' height='900' fill='url(#bg)'/>
${bokeh(14, 3, '#ffcf7a')}
<rect y='720' width='1600' height='180' fill='url(#bar)'/>
<ellipse cx='1010' cy='772' rx='190' ry='20' fill='#000' opacity='.45'/>
<path d='M850 170 L1170 170 L1130 760 Q1010 784 890 760 Z' fill='url(#beer)'/>
<path d='M850 170 L1170 170 L1164 258 Q1010 270 856 258 Z' fill='url(#head)'/>
<path d='M872 190 L900 740' stroke='#fff' stroke-width='14' opacity='.12' stroke-linecap='round'/>
<path d='M1146 200 L1118 730' stroke='#fff' stroke-width='6' opacity='.08' stroke-linecap='round'/>
<ellipse cx='1010' cy='170' rx='160' ry='12' fill='#fffaf0'/>
</svg>`)

export const TACOS_PHOTO = toUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
<defs><radialGradient id='bg' cx='65%' cy='50%' r='80%'><stop offset='0' stop-color='#2f8f8a'/><stop offset='1' stop-color='#0d3b3a'/></radialGradient></defs>
<rect width='1600' height='900' fill='url(#bg)'/>
${bokeh(10, 7, '#ffffff')}
<ellipse cx='1050' cy='520' rx='430' ry='300' fill='#f3efe6'/>
<ellipse cx='1050' cy='520' rx='370' ry='250' fill='#e7e0d2'/>
${[0, 1, 2].map((i) => {
  const cx = 830 + i * 220
  return `<g transform='translate(${cx} 520) rotate(${-12 + i * 12})'>
  <path d='M-150 40 A150 150 0 0 1 150 40 Z' fill='#e9b44c'/>
  <path d='M-128 30 A128 120 0 0 1 128 30' fill='none' stroke='#7a3b1a' stroke-width='38'/>
  <circle cx='-70' cy='-30' r='16' fill='#4caf50'/><circle cx='-10' cy='-50' r='14' fill='#d64545'/><circle cx='50' cy='-30' r='15' fill='#4caf50'/>
  <circle cx='20' cy='-15' r='12' fill='#fff3c4'/><circle cx='-40' cy='-6' r='11' fill='#d64545'/>
  </g>`
}).join('')}
<circle cx='1340' cy='330' r='60' fill='#9ccc65'/><circle cx='1340' cy='330' r='44' fill='#c5e1a5'/>
</svg>`)

export const MENU_PHOTO = toUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1500'>
<rect width='1200' height='1500' fill='#4a2f1d'/>
<g transform='rotate(-3 600 750)'>
<rect x='180' y='110' width='840' height='1280' fill='#000' opacity='.35' transform='translate(14 18)'/>
<rect x='180' y='110' width='840' height='1280' fill='#f7f1e3'/>
<text x='600' y='230' font-family='Georgia,serif' font-size='64' font-weight='700' text-anchor='middle' fill='#1f4d3a'>COPPER TAP</text>
<text x='600' y='280' font-family='Georgia,serif' font-size='28' text-anchor='middle' fill='#7a5b3a' letter-spacing='6'>KITCHEN &amp; BAR</text>
${[
  ['STARTERS', 360, [['Buffalo Wings', '14'], ['Pretzel Bites', '11'], ['Loaded Nachos', '13']]],
  ['BURGERS &amp; SANDWICHES', 680, [['Tap House Burger', '16'], ['Crispy Chicken Sandwich', '15'], ['French Dip', '17']]],
  ['ON DRAFT', 1000, [['Guinness', '8'], ['Local IPA', '7'], ['House Lager', '6']]],
].map(([title, y, items]) => `<text x='250' y='${y}' font-family='Georgia,serif' font-size='34' font-weight='700' fill='#1f4d3a'>${title}</text>
<line x1='250' y1='${(y as number) + 16}' x2='950' y2='${(y as number) + 16}' stroke='#c9b894' stroke-width='2'/>
${(items as string[][]).map(([n, p], i) => `<text x='250' y='${(y as number) + 76 + i * 64}' font-family='Georgia,serif' font-size='32' fill='#2b2b2b'>${n}</text><text x='950' y='${(y as number) + 76 + i * 64}' font-family='Georgia,serif' font-size='32' text-anchor='end' fill='#2b2b2b'>${p}</text>`).join('')}`).join('')}
<text x='600' y='1330' font-family='Georgia,serif' font-size='24' font-style='italic' text-anchor='middle' fill='#7a5b3a'>Ask about today's specials</text>
</g>
</svg>`)

export const SAMPLE_PHOTOS = [
  { id: 'stout', label: 'Pint of stout', src: STOUT_PHOTO },
  { id: 'tacos', label: 'Taco platter', src: TACOS_PHOTO },
]

/** Downscale an uploaded photo so it fits a 1080p screen and localStorage */
export function readAndResize(file: File, maxW = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.onerror = () => resolve(reader.result as string)
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/** "No photo": a plain venue-colour background so the text carries the slide */
export const BRAND_BG = toUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
<defs><radialGradient id='g' cx='78%' cy='45%' r='75%'><stop offset='0' stop-color='#e8a33d' stop-opacity='.55'/><stop offset='.5' stop-color='#2b6a50'/><stop offset='1' stop-color='#12301f'/></radialGradient></defs>
<rect width='1600' height='900' fill='url(#g)'/>
<circle cx='1260' cy='420' r='260' fill='none' stroke='#e8a33d' stroke-opacity='.35' stroke-width='18'/>
<circle cx='1260' cy='420' r='180' fill='none' stroke='#fff' stroke-opacity='.12' stroke-width='10'/>
</svg>`)
