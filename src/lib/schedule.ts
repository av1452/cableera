import { episodesFor, getShow, playableEpisodesFor } from '../data/catalog'
import type { Channel, ScheduleEntry, ScheduleItem } from '../types'

// Simulated linear schedules. Each channel's day is generated
// deterministically from (channel, date), so every viewer and every reload sees
// the same lineup without a server. Entries reference catalog ids only.

const MIN = 60_000

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function startOfDay(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function nextDay(dayStart: number): number {
  const d = new Date(dayStart)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
}

const cache = new Map<string, ScheduleEntry[]>()

function buildDay(channel: Channel, dayStart: number): ScheduleEntry[] {
  const key = `${channel.id}:${dayStart}`
  const hit = cache.get(key)
  if (hit) return hit

  const dayNum = Math.round(dayStart / (24 * 60 * MIN))
  const rand = mulberry32(hash(key))
  const pool = channel.showIds.filter((id) => getShow(id))
  // Playable shows get extra weight so vintage channels feel watchable, but
  // listing-only shows still appear so the guide reflects the whole lineup.
  const weights = pool.map((id) => (playableEpisodesFor(id).length ? 3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const cursors = new Map<string, number>()

  const pick = (avoid: string | undefined) => {
    for (let tries = 0; tries < 6; tries++) {
      let r = rand() * total
      let i = 0
      while (r >= weights[i]) r -= weights[i++]
      if (pool[i] !== avoid || pool.length === 1) return pool[i]
    }
    return pool[0]
  }

  const end = nextDay(dayStart)
  const blockMs = channel.blockMin * MIN
  const out: ScheduleEntry[] = []
  let prev: string | undefined
  for (let start = dayStart; start < end; start += blockMs) {
    const blockEnd = Math.min(start + blockMs, end)
    const showId = pick(prev)
    prev = showId
    const eps = playableEpisodesFor(showId)
    const items: ScheduleItem[] = []
    if (eps.length) {
      // Continue through the show's episodes in order; the start point shifts
      // daily so each day airs different episodes.
      let cursor = cursors.get(showId) ?? (dayNum * 5 + hash(channel.id + showId)) % eps.length
      let t = start
      for (let guard = 0; guard < eps.length; guard++) {
        const ep = eps[cursor % eps.length]
        const len = ep.runtimeSec * 1000
        if (t + len > blockEnd) break
        items.push({ episodeId: ep.id, start: t, end: t + len })
        t += len
        cursor++
      }
      cursors.set(showId, cursor)
    }
    out.push({
      id: `${channel.id}@${start}`,
      channelId: channel.id,
      showId,
      start,
      end: blockEnd,
      items,
      playable: items.length > 0,
    })
  }
  cache.set(key, out)
  return out
}

export function entriesBetween(channel: Channel, from: number, to: number): ScheduleEntry[] {
  const out: ScheduleEntry[] = []
  for (let day = startOfDay(from); day < to; day = nextDay(day)) {
    for (const e of buildDay(channel, day)) if (e.end > from && e.start < to) out.push(e)
  }
  return out
}

export function entryAt(channel: Channel, t: number): ScheduleEntry {
  return buildDay(channel, startOfDay(t)).find((e) => e.start <= t && e.end > t)!
}

export function entryAfter(entry: ScheduleEntry, channel: Channel): ScheduleEntry {
  return entryAt(channel, entry.end)
}

/** The episode airing at time t within an entry, or null during a station break. */
export function itemAt(entry: ScheduleEntry, t: number): ScheduleItem | null {
  return entry.items.find((i) => i.start <= t && i.end > t) ?? null
}

/** Next scheduled playable item on a channel at or after time t (searches 24h). */
export function nextPlayableItem(channel: Channel, t: number): { entry: ScheduleEntry; item: ScheduleItem } | null {
  let entry = entryAt(channel, t)
  for (let i = 0; i < 100; i++) {
    const item = entry.items.find((it) => it.start >= t)
    if (item) return { entry, item }
    entry = entryAfter(entry, channel)
    if (entry.start - t > 24 * 60 * MIN) break
  }
  return null
}

export function episodeCountLabel(entry: ScheduleEntry): string {
  if (!entry.items.length) return ''
  const total = episodesFor(entry.showId).length
  if (entry.items.length === 1) return total > 1 ? '1 episode' : ''
  return `${entry.items.length} shorts`
}
