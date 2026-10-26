import type { Availability, ContentRights, Episode, Era, MediaSource, OfferType, Show } from '../types'
import generated from './media.generated.json'
import { getProvider, providerIdForName } from './providers'
import { SHOWS } from './shows'

// Joins editorial show metadata with verified media records and checked
// streaming links. Only records a pipeline marked `verified` become playable.

// Build-time data that isn't committed (see README). Missing files yield no records.
const optional = import.meta.glob<{ default: unknown }>(['./youtube.generated.json', './availability.generated.json'], { eager: true })

interface YouTubeMedia {
  id: string
  videoId: string
  showId: string
  season: number
  episode: number
  title: string
  year: number
  durationSec: number
  channel: { name: string; handle: string; url: string } | null
  verified: boolean
  checkedAt: string
}

interface AvailabilityData {
  source: string
  sourceUrl: string
  generatedAt: string | null
  titles: Record<
    string,
    {
      checkedAt: string
      offers: { name: string; type: OfferType; webUrl: string | null; iosUrl?: string | null; androidUrl?: string | null; seasons: number | null }[]
    }
  >
}

interface GeneratedMedia {
  id: string
  showId: string
  season: number
  episode: number
  title: string
  year: number
  url?: string
  mime?: string
  width?: number
  height?: number
  durationSec?: number
  thumbnail?: string | null
  sourcePage?: string
  license?: string
  artist?: string
  rangeRequests?: boolean
  verified: boolean
  checkedAt: string
}

// Commons video thumbnails default to frame 0, which is often a black or title
// card. The thumb URL accepts `seek=<seconds>` to pick a more representative frame.
function framedThumb(url: string, durationSec: number): string {
  const seek = Math.max(1, Math.min(90, Math.round(durationSec / 3)))
  return url.replace(/\/\d+px--/, `/500px-seek%3D${seek}-`)
}

const showById = new Map(SHOWS.map((s) => [s.id, s]))
const mediaById = new Map<string, MediaSource>()
const episodeById = new Map<string, Episode>()
const episodesByShow = new Map<string, Episode[]>()

for (const g of generated as GeneratedMedia[]) {
  const show = showById.get(g.showId)
  if (!show) continue
  let mediaId: string | undefined
  if (g.verified && g.url && g.mime && g.width && g.height && g.durationSec) {
    const rights: ContentRights = { ...show.rights, evidenceUrl: g.sourcePage }
    mediaId = `commons:${g.id}`
    mediaById.set(mediaId, {
      id: mediaId,
      kind: 'file',
      url: g.url,
      mime: g.mime,
      width: g.width,
      height: g.height,
      durationSec: g.durationSec,
      thumbnail: g.thumbnail ? framedThumb(g.thumbnail, g.durationSec) : null,
      sourcePage: g.sourcePage ?? '',
      attribution: [g.artist, 'via Wikimedia Commons'].filter(Boolean).join(', '),
      license: g.license ?? 'Public domain',
      rights,
      captions: [],
      rangeRequests: g.rangeRequests ?? false,
      checkedAt: g.checkedAt,
    })
  }
  const ep: Episode = {
    id: g.id,
    showId: g.showId,
    season: g.season,
    episode: g.episode,
    title: g.title,
    year: g.year,
    runtimeSec: g.durationSec ?? show.runtimeMin * 60,
    mediaId,
  }
  addEpisode(ep)
}

function addEpisode(ep: Episode) {
  episodeById.set(ep.id, ep)
  const list = episodesByShow.get(ep.showId) ?? []
  list.push(ep)
  episodesByShow.set(ep.showId, list)
}

// Official uploads played through YouTube's embedded player.
for (const y of (optional['./youtube.generated.json']?.default ?? []) as YouTubeMedia[]) {
  const show = showById.get(y.showId)
  if (!show || !y.verified || !y.channel || !y.durationSec) continue
  const mediaId = `youtube:${y.videoId}`
  mediaById.set(mediaId, {
    id: mediaId,
    kind: 'youtube',
    youtubeId: y.videoId,
    channel: y.channel,
    url: `https://www.youtube.com/watch?v=${y.videoId}`,
    mime: 'video/youtube',
    width: 1280,
    height: 720,
    durationSec: y.durationSec,
    thumbnail: `https://i.ytimg.com/vi/${y.videoId}/hqdefault.jpg`,
    sourcePage: `https://www.youtube.com/watch?v=${y.videoId}`,
    attribution: `${y.channel.name} on YouTube`,
    license: 'Official upload',
    rights: {
      status: 'official-embed',
      basis: `Uploaded by ${y.channel.name}, the rights holder's official channel, and played with YouTube's embedded player. CableEra doesn't host it; YouTube's terms apply, ads may play, and the owner can remove it at any time.`,
      territory: 'US',
      evidenceUrl: y.channel.url,
    },
    captions: [],
    rangeRequests: false,
    checkedAt: y.checkedAt,
  })
  addEpisode({ id: y.id, showId: y.showId, season: y.season, episode: y.episode, title: y.title, year: y.year, runtimeSec: y.durationSec, mediaId })
}

// Checked streaming links. Entries older than 30 days are ignored: availability
// changes, and the data provider's free-plan terms cap caching at 30 days.
const availability = optional['./availability.generated.json']?.default as AvailabilityData | undefined
const MAX_AGE_MS = 30 * 24 * 3600 * 1000
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
for (const [showId, t] of Object.entries(availability?.titles ?? {})) {
  const show = showById.get(showId)
  if (!show || Date.now() - Date.parse(t.checkedAt) > MAX_AGE_MS) continue
  show.providerLinks = t.offers.flatMap((o) => {
    const url = o.webUrl ?? (isIOS ? o.iosUrl : isAndroid ? o.androidUrl : null) ?? null
    if (!url || !/^https:\/\//.test(url)) return []
    const providerId = providerIdForName(o.name)
    return [{ providerId, providerName: getProvider(providerId)?.name ?? o.name, type: o.type, url, seasons: o.seasons, verified: true, lastChecked: t.checkedAt }]
  })
}

/** Attribution for the streaming-availability data, when any is loaded. */
export const availabilitySource = availability?.generatedAt ? { name: availability.source, url: availability.sourceUrl } : null

for (const list of episodesByShow.values()) list.sort((a, b) => a.season - b.season || a.episode - b.episode)

// Artwork for public-domain shows: a frame from their own first playable episode.
for (const show of SHOWS) {
  const first = episodesByShow.get(show.id)?.find((e) => e.mediaId)
  const media = first?.mediaId ? mediaById.get(first.mediaId) : undefined
  if (media?.thumbnail) {
    const credit = media.kind === 'youtube' ? `video thumbnail, ${media.attribution}` : `frame from the film, ${media.attribution}`
    show.artwork = { url: media.thumbnail, credit, sourcePage: media.sourcePage }
  }
}

export const ERAS: { id: Era; label: string; range: string; years: [number, number] }[] = [
  { id: 'early-2010s', label: 'Early 2010s', range: '2010–2013', years: [2010, 2013] },
  { id: 'late-2000s', label: 'Late 2000s', range: '2005–2009', years: [2005, 2009] },
  { id: 'early-2000s', label: 'Early 2000s', range: '2000–2004', years: [2000, 2004] },
  { id: '1990s', label: '1990s', range: '1990–1999', years: [1990, 1999] },
  { id: 'classic', label: 'Classic TV & Vintage', range: '1980s & earlier', years: [1900, 1989] },
]

export const eraLabel = (era: Era) => ERAS.find((e) => e.id === era)?.label ?? era

export const allShows = (): Show[] => SHOWS
export const getShow = (id: string) => showById.get(id)
export const getEpisode = (id: string) => episodeById.get(id)
export const getMedia = (id: string | undefined) => (id ? mediaById.get(id) : undefined)
export const episodesFor = (showId: string): Episode[] => episodesByShow.get(showId) ?? []
export const playableEpisodesFor = (showId: string): Episode[] => episodesFor(showId).filter((e) => e.mediaId)
export const isPlayable = (ep: Episode | undefined): boolean => !!ep?.mediaId && mediaById.has(ep.mediaId)

export function availabilityOf(show: Show): Availability {
  if (playableEpisodesFor(show.id).length > 0) return 'playable'
  const verified = show.providerLinks.filter((l) => l.verified)
  if (verified.some((l) => l.type === 'free')) return 'free-external'
  if (verified.some((l) => l.type === 'sub')) return 'subscription'
  if (show.rights.status.startsWith('public-domain') && verified.length) return 'public-domain-archive'
  return 'unavailable'
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  playable: 'Plays in CableEra',
  'free-external': 'Free to stream',
  subscription: 'On streaming',
  'public-domain-archive': 'Public-domain archive',
  unavailable: 'Listing only',
}

/** Shows that were on the air during a given year. */
export function showsAiringIn(year: number): Show[] {
  return SHOWS.filter((s) => s.startYear <= year && (s.endYear ?? 2026) >= year && !s.genres.includes('movie'))
}

export function searchShows(query: string): Show[] {
  const q = query.trim().toLowerCase()
  if (!q) return SHOWS
  return SHOWS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.network.toLowerCase().includes(q) ||
      s.genres.some((g) => g.includes(q)) ||
      String(s.startYear).includes(q) ||
      episodesFor(s.id).some((e) => e.title.toLowerCase().includes(q)),
  )
}

export const playableShowCount = () => SHOWS.filter((s) => availabilityOf(s) === 'playable').length
export const playableEpisodeCount = () => mediaById.size
