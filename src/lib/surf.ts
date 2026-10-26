import { CHANNELS } from '../data/channels'
import { getShow } from '../data/catalog'
import type { Channel } from '../types'
import { entryAt, itemAt } from './schedule'
import { getUserData } from './store'

export const isPlayingNow = (ch: Channel, t: number) => !!itemAt(entryAt(ch, t), t)

/**
 * Channel Surf: the next channel (in lineup order) that is airing a playable
 * program right now. Favorite channels come first, then channels airing a
 * genre the viewer has favorited.
 */
export function surfFrom(currentId: string | null, t = Date.now()): Channel | null {
  const { favoriteChannels, favoriteShows } = getUserData()
  const likedGenres = new Set(favoriteShows.flatMap((id) => getShow(id)?.genres ?? []))
  const start = Math.max(0, CHANNELS.findIndex((c) => c.id === currentId))
  const rotated = [...CHANNELS.slice(start + 1), ...CHANNELS.slice(0, start + 1)].filter((c) => c.id !== currentId)
  const live = rotated.filter((c) => isPlayingNow(c, t))
  const score = (c: Channel) => {
    if (favoriteChannels.includes(c.id)) return 2
    const show = getShow(entryAt(c, t).showId)
    return show?.genres.some((g) => likedGenres.has(g)) ? 1 : 0
  }
  const best = Math.max(-1, ...live.map(score))
  return live.find((c) => score(c) === best) ?? rotated.find((c) => entryAt(c, t).playable) ?? null
}

/** Channel up/down through the lineup, wrapping around. */
export function stepChannel(currentId: string, dir: 1 | -1): Channel {
  const i = CHANNELS.findIndex((c) => c.id === currentId)
  return CHANNELS[(i + dir + CHANNELS.length) % CHANNELS.length]
}
