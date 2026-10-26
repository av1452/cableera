// Core CableEra data models. Catalog metadata, media/rights, schedules and user
// data are deliberately separate types so each can evolve (or move to a
// server) independently.

export type Era = 'early-2010s' | 'late-2000s' | 'early-2000s' | '1990s' | 'classic'

export type Genre =
  | 'animation'
  | 'sitcom'
  | 'teen'
  | 'family'
  | 'action'
  | 'adventure'
  | 'comedy'
  | 'educational'
  | 'preschool'
  | 'sci-fi'
  | 'anthology'
  | 'superhero'
  | 'anime'
  | 'silent'
  | 'movie'
  | 'holiday'
  | 'variety'

export type Audience = 'preschool' | 'kids' | 'family' | 'teen' | 'adult'

/**
 * How a title can be watched. Mirrors the five categories in the product brief:
 * - playable: at least one episode has a verified media source CableEra may stream.
 * - free-external / subscription: a *verified* external destination exists.
 * - public-domain-archive: rights checked, but only viewable at the archive.
 * - unavailable: metadata only; no verified viewing source.
 */
export type Availability = 'playable' | 'free-external' | 'subscription' | 'public-domain-archive' | 'unavailable'

export type RightsStatus =
  | 'public-domain-expired' // US copyright term expired (published 1930 or earlier, as of 2026)
  | 'public-domain-not-renewed' // US copyright lapsed for non-renewal; status reported by source archive
  | 'copyrighted'
  | 'licensed'

export interface ContentRights {
  status: RightsStatus
  /** Plain-language explanation of the rights basis. */
  basis: string
  /** Territory the assessment applies to. */
  territory: 'US'
  /** Where the license/rights tag came from, e.g. a Wikimedia Commons file page. */
  evidenceUrl?: string
}

export interface Provider {
  id: string
  name: string
  homepage: string
  kind: 'subscription' | 'free' | 'archive' | 'search'
  /** Builds a search URL for a title, when the provider supports it. */
  searchUrl?: (title: string) => string
}

export interface ProviderLink {
  providerId: string
  url: string
  /** True only when someone confirmed the title is on this provider. */
  verified: boolean
  lastChecked: string | null
}

export interface Artwork {
  url: string
  credit: string
  /** Page describing the image's license. */
  sourcePage: string
}

export interface Show {
  id: string
  title: string
  startYear: number
  endYear: number | null
  era: Era
  genres: Genre[]
  audience: Audience
  /** Original broadcaster or distributor. Informational only, not an affiliation. */
  network: string
  description: string
  rights: ContentRights
  providerLinks: ProviderLink[]
  artwork?: Artwork
  /** Typical episode runtime in minutes. */
  runtimeMin: number
  /** Hue for the generated title-card artwork. */
  hue: number
}

export interface Episode {
  id: string
  showId: string
  season: number
  episode: number
  title: string
  year: number
  runtimeSec: number
  /** Media record id. Absent when the episode has no playable source. */
  mediaId?: string
}

export interface Caption {
  src: string
  lang: string
  label: string
}

export interface MediaSource {
  id: string
  url: string
  mime: string
  width: number
  height: number
  durationSec: number
  thumbnail: string | null
  sourcePage: string
  attribution: string
  license: string
  rights: ContentRights
  captions: Caption[]
  rangeRequests: boolean
  checkedAt: string
}

export interface Channel {
  id: string
  number: string
  name: string
  tagline: string
  description: string
  hue: number
  /** Shows this channel draws from. Playable shows are scheduled more often. */
  showIds: string[]
  /** Block length in minutes. */
  blockMin: number
}

export interface ScheduleItem {
  episodeId: string
  start: number
  end: number
}

/** One guide cell. References catalog records; never copies episode data. */
export interface ScheduleEntry {
  id: string
  channelId: string
  showId: string
  start: number
  end: number
  /** Episodes played back-to-back inside the block. Empty for listing-only blocks. */
  items: ScheduleItem[]
  playable: boolean
}

export interface Collection {
  id: string
  title: string
  kind: 'mode' | 'marathon'
  description: string
  showIds: string[]
}

export interface ViewingProgress {
  episodeId: string
  positionSec: number
  durationSec: number
  updatedAt: number
  completed: boolean
}

export interface HistoryEntry {
  showId: string
  episodeId?: string
  channelId?: string
  at: number
}

export type Landing = 'home' | 'guide'

export interface UserPreferences {
  theme: 'classic' | 'midnight' | 'contrast'
  guideDensity: 'comfortable' | 'compact'
  landing: Landing
  autoplayNext: boolean
  guidePreviews: boolean
  captions: boolean
  motion: 'system' | 'reduced'
  scanlines: boolean
  bootEffect: boolean
  preferredEras: Era[]
  birthYear: number | null
}

export interface UserData {
  version: 1
  favoriteShows: string[]
  favoriteChannels: string[]
  savedShows: string[]
  progress: Record<string, ViewingProgress>
  history: HistoryEntry[]
  recentChannels: string[]
  lastChannel: string | null
  prefs: UserPreferences
}
