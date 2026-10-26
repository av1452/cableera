import { useEffect, useMemo, useState } from 'react'
import { Guide } from '../components/Guide'
import { Player } from '../components/Player'
import { ProgramDetails } from '../components/ProgramDetails'
import { Artwork, Chip, DataCredit } from '../components/ui'
import { CHANNELS, getChannel } from '../data/channels'
import { ERAS, availabilitySource, getEpisode, getMedia, getShow, playableEpisodesFor } from '../data/catalog'
import { onMyServices } from '../data/providers'
import { navigate, useRoute } from '../lib/router'
import { entryAt, itemAt, startOfDay } from '../lib/schedule'
import { useUserData } from '../lib/store'
import { fmtDay, fmtTime, useNow } from '../lib/time'
import type { Era, Genre, ScheduleEntry, Show } from '../types'

const HOUR = 3_600_000
const JUMPS: { label: string; hour: number }[] = [
  { label: 'Morning', hour: 7 },
  { label: 'After school', hour: 15 },
  { label: 'Prime time', hour: 20 },
  { label: 'Late night', hour: 23 },
]
const GENRES: Genre[] = ['animation', 'sitcom', 'teen', 'action', 'educational', 'preschool', 'superhero', 'anime', 'movie']

export function GuidePage() {
  const now = useNow(15_000)
  const { query } = useRoute()
  const { lastChannel, favoriteChannels, prefs } = useUserData()
  const today = startOfDay(now)
  const windowStart = today
  const windowEnd = today + 36 * HOUR

  const [era, setEra] = useState<Era | ''>('')
  const [genre, setGenre] = useState<Genre | ''>('')
  const [playableOnly, setPlayableOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [watchable, setWatchable] = useState(false)
  const [scrollTo, setScrollTo] = useState({ t: now, n: 0 })

  const channels = useMemo(
    () =>
      CHANNELS.filter((c) => !favOnly || favoriteChannels.includes(c.id)).filter(
        (c) => !playableOnly || c.showIds.some((id) => playableEpisodesFor(id).length),
      ),
    [favOnly, playableOnly, favoriteChannels],
  )

  const initialChannel = getChannel(query.get('ch') ?? '') ?? getChannel(lastChannel ?? '') ?? CHANNELS[0]
  const [selected, setSelected] = useState<ScheduleEntry>(() => entryAt(initialChannel, now))
  const selChannel = getChannel(selected.channelId)!

  // Debounce the live preview so arrowing through the grid doesn't start a
  // download for every cell passed over.
  const [settledId, setSettledId] = useState<string | null>(null)
  useEffect(() => {
    const id = setTimeout(() => setSettledId(selected.id), 700)
    return () => clearTimeout(id)
  }, [selected])
  const previewEntry = settledId === selected.id ? selected : null

  const matches =
    era || genre || watchable
      ? (show: Show) =>
          (!era || show.era === era) &&
          (!genre || show.genres.includes(genre)) &&
          (!watchable || playableEpisodesFor(show.id).length > 0 || onMyServices(show, prefs.services))
      : undefined

  const activate = (e: ScheduleEntry) => {
    const live = e.start <= Date.now() && e.end > Date.now()
    if (e.playable && live) navigate(`/tune/${e.channelId}`)
    else if (e.playable && e.items[0]) navigate(`/watch/${e.items[0].episodeId}`)
    else setSelected(e)
  }

  const show = getShow(selected.showId)!
  const liveItem = previewEntry && previewEntry.start <= now && previewEntry.end > now ? itemAt(previewEntry, now) : null
  const liveMedia = liveItem ? getMedia(getEpisode(liveItem.episodeId)?.mediaId) : undefined

  return (
    <div className="guide-page">
      <section className="info-strip">
        <div className="preview">
          {prefs.guidePreviews && liveItem && liveMedia ? (
            <Player
              key={liveItem.episodeId}
              media={liveMedia}
              preview
              muted
              autoPlay
              startAt={(now - liveItem.start) / 1000}
            />
          ) : (
            <Artwork
              show={show}
              className="preview-art"
              label={
                selected.start > now
                  ? `Starts ${fmtTime(selected.start)}`
                  : selected.end <= now
                    ? 'Aired earlier'
                    : selected.playable
                      ? prefs.guidePreviews
                        ? 'Tuning…'
                        : 'On now'
                      : 'Listing only'
              }
            />
          )}
          <span className="preview-ch" aria-hidden="true">
            {selChannel.number}
          </span>
        </div>
        <ProgramDetails entry={selected} channel={selChannel} now={now} />
      </section>

      <div className="guide-bar">
        <div className="guide-bar-group">
          <strong className="guide-date">{fmtDay(now)}</strong>
          <button className="btn btn-small btn-primary" onClick={() => setScrollTo({ t: Date.now(), n: scrollTo.n + 1 })}>
            Now
          </button>
          {JUMPS.map((j) => (
            <button
              key={j.label}
              className="btn btn-small btn-ghost"
              onClick={() => setScrollTo({ t: today + j.hour * HOUR, n: scrollTo.n + 1 })}
            >
              {j.label}
            </button>
          ))}
        </div>
        <div className="guide-bar-group">
          <label className="select">
            <span className="sr-only">Era</span>
            <select value={era} onChange={(e) => setEra(e.target.value as Era | '')}>
              <option value="">All eras</option>
              {ERAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Genre</span>
            <select value={genre} onChange={(e) => setGenre(e.target.value as Genre | '')}>
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <Chip on={playableOnly} onClick={() => setPlayableOnly(!playableOnly)}>
            ▶ Playable channels
          </Chip>
          {prefs.services.length > 0 && (
            <Chip on={watchable} onClick={() => setWatchable(!watchable)}>
              ✓ Watchable for me
            </Chip>
          )}
          <Chip on={favOnly} onClick={() => setFavOnly(!favOnly)}>
            ★ Favorites
          </Chip>
        </div>
      </div>

      {channels.length ? (
        <Guide
          channels={channels}
          windowStart={windowStart}
          windowEnd={windowEnd}
          now={now}
          selectedId={selected.id}
          onSelect={setSelected}
          onActivate={activate}
          matches={matches}
          scrollTo={scrollTo}
        />
      ) : (
        <p className="empty-inline">No favorite channels yet. Tap ☆ next to a channel name to add one.</p>
      )}
      <p className="fine guide-note">
        Simulated schedule, not a live broadcast. CableEra channels are fictional and not affiliated with any network.
        <span className="legend">
          <span className="cell-play">▶</span> plays in CableEra
          {prefs.services.length > 0 && availabilitySource && (
            <>
              {' '}· <span className="provider-tag">D+</span> on your service
            </>
          )}{' '}
          · <span className="cell-tag">Listing</span> guide listing only
          {availabilitySource && (
            <>
              {' '}· <DataCredit />
            </>
          )}
        </span>
      </p>
    </div>
  )
}
