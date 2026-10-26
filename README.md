# CableEra

*Your childhood. Your channels. Your TV.*

CableEra is a nostalgic, cable-box-style TV app: a blue program guide, numbered channels, live-style simulated schedules, and an on-demand library of the shows people grew up with, from 1990s cartoons to early-2010s Disney Channel. It is built as a responsive PWA and tuned for large foldable inner displays, but works on phones, tablets and desktops.

It is honest about what plays. Only verified public-domain films stream inside CableEra. Everything else is a guide listing with metadata.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run lint
```

Requires Node 20+.

## What's in it

| Section | What it does |
|---|---|
| **Home** | What's on now, Continue Watching, time-of-day programming block, recommendations, featured era |
| **Guide** | Cable-style grid with 10 channels, 36 hours of schedule, a now line, a live preview window, era/genre dimming, playable/favorite filters and arrow-key navigation |
| **Tune** (`#/tune/<channel>`) | Live-style viewing that joins the scheduled episode in progress, with station breaks between shorts, channel up/down, number-pad tuning (type `0 4 4`) and Channel Surf |
| **Watch** (`#/watch/<episode>`) | On-demand player with resume, up-next countdown and marathon queues |
| **Library** | Search, plus filters for era, availability, genre, network and on-air year, with sorting |
| **Channels** | Channel directory with descriptions, current and upcoming programs, and favorites |
| **Discover** | Programming modes (After School, Saturday Morning, Throwback Night, Comfort TV), 14 theme marathons, By Year, a Childhood Timeline and Forgotten Favorites |
| **My TV** | Continue watching, favorites, saved shows, channels, preferred eras and history |
| **Settings** | Theme (classic / midnight / high contrast), scanlines, power-on effect, motion, guide density, landing page, autoplay, captions, storage controls, availability counts and media credits |

### Keyboard

- **Guide:** arrow keys move through the grid, and Enter tunes in or plays. Clicking a cell selects it, and clicking the selected cell tunes in.
- **Tune:** `PageUp`/`PageDown` or `[` `]` change channels, digits tune directly, `G` or `Esc` opens the guide.
- **Player:** `Space`/`K` play and pause, `J`/`L` skip ±10s, `←`/`→` skip ±5s, `F` toggles fullscreen, `M` toggles mute.

## Content and rights

### Availability categories

Each show resolves to one of these (see `availabilityOf` in `src/data/catalog.ts`):

| Category | Meaning | Count today |
|---|---|---|
| Plays in CableEra | At least one episode has a verified media record | 9 series / 55 episodes |
| Free on provider / Subscription | A provider link someone has **confirmed** | 0 (none verified yet) |
| Public-domain archive | Rights checked, viewable only at the archive | 0 |
| Listing only | Metadata only, with no verified source | ~140 |

Listing-only shows never get a Play button. "Find where to watch" opens a JustWatch search, and a dialog first explains that CableEra hasn't verified availability. To add a verified provider, put a `ProviderLink` with `verified: true` and a `lastChecked` date on the show.

### Playable media

Every playable file is listed in `scripts/commons-sources.json` and resolved by `npm run media:refresh`. For each file, the script:

1. Asks the Wikimedia Commons API for the file's URL, MIME type, dimensions, duration and license tag.
2. Prefers the 480p VP9 transcode, which is small enough for mobile data.
3. Sends a range request to confirm the URL works and supports seeking.
4. Writes `src/data/media.generated.json`. Any file without a public-domain license tag, or with a failing URL, gets `verified: false` and can't play.

Current playable series:

| Series | Rights basis (US) |
|---|---|
| Felix the Cat (1922–1930), Gertie (1914/1921), Koko the Clown (1922/1928), Oswald (1927–1930), Mickey Mouse 1928–29 incl. *Steamboat Willie*, *The Skeleton Dance*, Aesop's Fables *Dinner Time* | Published 1930 or earlier, so the copyright term has expired |
| Fleischer *Superman* (1941–43) | Copyright not renewed, per Wikimedia Commons |
| *The Beverly Hillbillies*, 12 early episodes | Copyright not renewed, per Wikimedia Commons (not every episode of the series) |

Character names such as Mickey, Felix and Superman can still be trademarks. CableEra uses no studio logos.

**Content note:** some 1920s–40s cartoons contain racial and ethnic caricatures typical of their era. The catalog doesn't flag these yet (see Roadmap).

### Channels

The ten channels (005 Era Classics through 070 Movie Night) are fictional. Their schedules are generated deterministically per channel and day (`src/lib/schedule.ts`), so every reload and every viewer sees the same lineup without a server. The UI labels them as simulated, and they are not live broadcasts.

## Architecture

```
src/
  types.ts                  Show, Episode, MediaSource, ContentRights, Channel, ScheduleEntry, ...
  data/
    shows.ts                Editorial catalog metadata (no media)
    media.generated.json    Verified media records (generated, don't hand-edit)
    catalog.ts              Joins shows with media; availability; search
    providers.ts            Provider adapter layer (external destinations)
    channels.ts             Channel identities + editorial collections
  lib/
    schedule.ts             Simulated linear schedule generation
    store.ts                User data behind a UserDataBackend (localStorage today)
    surf.ts                 Channel surf / channel up-down
    router.ts               Hash router (static-host friendly)
  components/               Guide grid, ProgramDetails, Player, shared UI
  pages/                    One file per route
public/                     Manifest, service worker, icons
scripts/                    Media verification pipeline
```

These concerns are kept separate: catalog metadata, media/rights, scheduling, playback, UI and user data. Schedules reference catalog IDs and never copy episode data. An `Episode` can exist without a `mediaId`. To add account sync, implement `UserDataBackend` (`load`/`save`) in `src/lib/store.ts`.

### Player

The player uses native `<video>` with `preload="metadata"` and streams through range requests, never downloading whole files. The frame is 4:3 or 16:9 to match the source, and the video uses `object-fit: contain`, so footage is pillarboxed and never stretched. The player checks codec support up front, offers retry on network errors, shows "Tap to play" when the browser blocks autoplay, saves progress every 5 seconds and on pause or exit, and resumes after 10 seconds or more of viewing.

## Hosting

The build is fully static, with a relative `base` and hash routing, so it runs from any path:

- **GitHub Pages:** push to `main` with Pages set to "GitHub Actions". `.github/workflows/pages.yml` lints, builds and deploys.
- Any static host (Netlify, Vercel, S3) also works: serve `dist/`.

The service worker (production only) caches the app shell for offline guide access. It never caches video. No API keys are used. If you add a metadata API later, keep its keys server-side and don't ship them in `VITE_*` variables.

## Testing status

Tested on 2026-10-25 against the production build with Playwright (Chromium and WebKit):

- **Desktop (1440×900):** guide renders 666 cells. Cell selection, arrow-key navigation, the live preview, live tuning (joins in progress), PageUp and number-pad tuning, the 4:3 frame for 4:3 sources and 16:9 for 16:9, progress save and resume after reload, Continue Watching, favorites persisting, search, the playable filter (9 series), no Play button on copyrighted shows, the leaving-CableEra dialog, and no console errors all passed.
- **Foldable sizes (1060×840 landscape, 840×1020 portrait):** no horizontal overflow and no errors.
- **iPhone size, WebKit (393×852):** no overflow on Home, Library or Show pages. The Guide overflowed and was fixed afterwards. WebKit reports WebM as playable, and the player loaded.
- **Blocked autoplay:** falls back to "Tap to play".

Not yet tested: a real foldable or physical iPhone, PWA installation, or Safari versions older than iOS 17.4 / macOS 14, which can't play WebM. On those, the player shows a "format not supported" message instead of playing.

## Known limitations / roadmap

- **Media hosting:** files are served straight from `upload.wikimedia.org`, which rate-limits heavy use (HTTP 429). That happened during testing. For real traffic, mirror the public-domain files to your own storage or CDN and point `media.generated.json` at them. Add MP4/H.264 versions for older Safari at the same time.
- **Captions:** none of the current files has caption tracks. The `captions` field is wired up for when they're added.
- **Provider links:** none verified yet, so no copyrighted show links to a specific service.
- **Artwork:** only public-domain shows have images (frames from the films). Other shows use generated title cards until licensed artwork or an approved metadata API is added.
- **Content notes:** add per-episode advisories for dated stereotypes in vintage cartoons.
- **Episodes:** episode-level records exist only for the playable series.
- **Popularity sorting:** no popularity data yet.
