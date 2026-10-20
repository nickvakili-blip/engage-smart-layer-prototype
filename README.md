# Engage Smart Layer: Prototype

A clickable prototype of the **Smart Create + Smart Schedule** layer from the *Engage Smart Layer: Lightweight PRD* (Oct 2026). It sits inside today's Everpass Manager shell as a new **Smart** item in the sidebar. **Advanced** mode, which is today's toolset, is always one tap away.

Everything is simulated in the browser: there's no backend, and the demo data is saved in `localStorage`. To start over, open the org menu (top right) and choose **Reset demo data**.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
```

## What's in it

| PRD item | Route | Notes |
|---|---|---|
| Smart Home | `/smart` | Six action buttons, a plain-language box, proactive prompts ("4 games today aren't on any of your TVs"), and the live state of all 6 screens |
| Spotlight | `/smart/create/spotlight` | Photo (camera, upload or sample), then words ("Guinness 50% off" is split into a headline and an offer), then auto-format, then publish |
| QR code | `/smart/create/qr` | Real, scannable QR. Shown as a full-screen slide or added to an existing Spotlight |
| Menu board | `/smart/create/menu` | Photo or PDF, then a simulated "reading your menu" step, then items and prices you can edit, in 1 or 2 columns |
| Publish (shared) | last step of each Create flow | Three equal choices: **Play now on a TV**, **Add to marketing rotation**, **Schedule for a time** |
| Games on a TV | `/smart/schedule/games` | Team or league, TV, and how often. Saves a recurring rule and shows the next games and any clashes |
| Marketing on a TV | `/smart/schedule/marketing` | Promos, TV, and a time window. Promos play around live games |
| Fill my day | `/smart/schedule/fill` | Shows the gaps, proposes a fill in priority order, lets you remove items, then apply |
| Advanced mode | `/advanced/*` | Mocks of Promotions, Library, Playlist and Scheduled Playlists. Everything made in Smart appears here with a **Smart** badge |

Every view and every step has its own URL (`?step=`, `?view=`, `?saved=`), following the Manager V2 rule that every view has a URL.

## Demo venue

**Copper Tap Kitchen & Bar** (org: DTV Demo Company). The demo is pinned to **Tue Oct 20, 2026, 12:15 PM, America/Chicago**, open 11am–11pm.

| Screen | Type | Starting schedule |
|---|---|---|
| Bar TV 1 | Live sports + signage | Balanced Mix 11–5, World Series 7–10:30 |
| Bar TV 2 | Live sports + signage | Entertainment Heavy 11–2, Lakers at Celtics 6:30–9 |
| Dining Room | Live sports + signage | Promotion Heavy 11–9 |
| Patio | Signage only | Happy Hour rotation 5–7 |
| Private Room | Live sports + signage | Nothing all day |
| Host Stand | Menu board | House Menu all day |

Today has 6 games, and 4 of them aren't on any TV.

## Fill priority

The fill order from the PRD is implemented in `src/lib/schedule.ts`:

1. **Scheduled live game**: a game that a saved *Games on a TV* rule asked for.
2. **Scheduled marketing**: a window that a saved *Marketing on a TV* rule asked for.
3. **Auto-filled live game**: today's games that nobody has placed yet, put on the first free live-sports TV. If no TV is free, the game may replace a default playlist; it never replaces a game or a promo.
4. **Default content**: the Balanced Mix playlist. Signage-only TVs get the marketing rotation instead, and menu boards get the house menu.

When content is placed, the existing Manager rules apply. Content that ranks lower is trimmed around the new item. A game that is already on is never cut off, and it finishes before the next one starts.

## Proposed vocabulary

This answers an open question in the PRD.

- **Schedule**: *when* something plays (a time window or a rule).
- **Playlist**: *what* plays (an ordered set of content, such as Balanced Mix or the marketing playlist).
- **Queue**: not used anywhere in the Smart layer.

The UI never says "AI". The smart parts are presented as a faster interface: buttons first, with one optional plain-language box.

## What's simulated

- Menu reading always returns the sample Copper Tap menu.
- The plain-language box uses keyword matching (`src/smart/intent.ts`) to open one of the six flows with fields pre-filled.
- Games, entitlements and the schedule API are seeded data (`src/data/seed.ts`).
- Uploaded photos are downscaled in the browser and stored locally.

## Suggested demo script

1. On **Smart Home**, point out the two prompts: 5 screens have gaps, and 4 games aren't on any TV.
2. Open **Spotlight**, take a sample stout photo, type "Guinness 50% off", choose **Play now** on the Patio. This should take under a minute.
3. In the plain-language box, type "Eagles games on Bar TV 1 every weekend", then choose **Save**.
4. Open **Fill my day**, choose **Fill my day**, remove one item, then choose **Apply**. Every screen is now covered.
5. Switch to **Advanced**. The Spotlight, the rules and the filled schedule are all there and editable.

## Stack

Vite, React 19, TypeScript, Tailwind 3, React Router 6, and `qrcode`. It deploys as a static SPA, and `vercel.json` rewrites all routes to `index.html`.
