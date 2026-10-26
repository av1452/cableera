import type { Availability, ContentRights, Episode, Era, MediaSource, Show } from '../types'
import generated from './media.generated.json'
import { getProvider } from './providers'
import { SHOWS } from './shows'

// Joins editorial show metadata with verified media records. Only records the
// fetch script marked `verified` become playable MediaSources.

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
  episodeById.set(ep.id, ep)
  const list = episodesByShow.get(ep.showId) ?? []
  list.push(ep)
  episodesByShow.set(ep.showId, list)
}

for (const list of episodesByShow.values()) list.sort((a, b) => a.season - b.season || a.episode - b.episode)

// Artwork for public-domain shows: a frame from their own first playable episode.
for (const show of SHOWS) {
  const first = episodesByShow.get(show.id)?.find((e) => e.mediaId)
  const media = first?.mediaId ? mediaById.get(first.mediaId) : undefined
  if (media?.thumbnail) {
    show.artwork = { url: media.thumbnail, credit: media.attribution, sourcePage: media.sourcePage }
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
  if (verified.some((l) => getProvider(l.providerId)?.kind === 'free')) return 'free-external'
  if (verified.some((l) => getProvider(l.providerId)?.kind === 'subscription')) return 'subscription'
  if (show.rights.status.startsWith('public-domain') && verified.length) return 'public-domain-archive'
  return 'unavailable'
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  playable: 'Plays in CableEra',
  'free-external': 'Free on provider',
  subscription: 'Subscription',
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
