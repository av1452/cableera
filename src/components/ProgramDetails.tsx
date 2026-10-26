import { availabilityOf, eraLabel, getEpisode, getShow } from '../data/catalog'
import { href } from '../lib/router'
import { itemAt } from '../lib/schedule'
import { fmtRuntime, fmtTime } from '../lib/time'
import type { Channel, ScheduleEntry } from '../types'
import { AvailabilityBadge, FavoriteButton, WatchOptions } from './ui'

/** Selected-program info: the right half of the guide's info strip. */
export function ProgramDetails({ entry, channel, now }: { entry: ScheduleEntry; channel: Channel; now: number }) {
  const show = getShow(entry.showId)!
  const live = entry.start <= now && entry.end > now
  const past = entry.end <= now
  const current = live ? itemAt(entry, now) : null
  const pct = live ? ((now - entry.start) / (entry.end - entry.start)) * 100 : 0
  const firstEp = entry.items[0] && getEpisode(entry.items[0].episodeId)

  return (
    <div className="details" aria-live="polite">
      <div className="details-kicker">
        <span className="ch-pill">
          {channel.number} {channel.name}
        </span>
        <span>
          {fmtTime(entry.start)} – {fmtTime(entry.end)}
        </span>
        {live && <span className="live-pill">On now</span>}
        {past && <span className="muted">Aired earlier</span>}
      </div>
      <h2 className="details-title">{show.title}</h2>
      <p className="details-meta">
        {eraLabel(show.era)} · {show.genres.slice(0, 3).join(', ')} · Originally on {show.network}
      </p>
      {live && (
        <div className="progress" aria-label={`${Math.round(pct)}% elapsed`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="details-desc">{show.description}</p>

      {entry.items.length > 0 && (
        <ol className="details-items">
          {entry.items.map((it) => {
            const ep = getEpisode(it.episodeId)!
            const isNow = current?.episodeId === it.episodeId
            return (
              <li key={it.episodeId} className={isNow ? 'is-now' : ''}>
                <span className="muted">{fmtTime(it.start)}</span> {ep.title}{' '}
                <span className="muted">
                  ({ep.year}, {fmtRuntime(ep.runtimeSec)})
                </span>
                {isNow && <span className="live-pill small">Now</span>}
              </li>
            )
          })}
          {live && !current && <li className="is-now">Station break: next block at {fmtTime(entry.end)}</li>}
        </ol>
      )}

      <div className="details-actions">
        {entry.playable && live && (
          <a className="btn btn-primary" href={href(`/tune/${channel.id}`)}>
            ▶ Watch live
          </a>
        )}
        {entry.playable && !live && firstEp && (
          <a className="btn btn-primary" href={href(`/watch/${firstEp.id}`)}>
            ▶ Watch now
          </a>
        )}
        {!entry.playable && (
          <>
            <AvailabilityBadge availability={availabilityOf(show)} />
            <WatchOptions show={show} compact />
          </>
        )}
        <a className="btn btn-ghost" href={href(`/show/${show.id}`)}>
          Show info
        </a>
        <FavoriteButton showId={show.id} small />
      </div>
      {!entry.playable && (
        <p className="fine">
          {show.providerLinks.length
            ? 'This program doesn’t play in CableEra. Watch it on a streaming service instead.'
            : 'This program is a guide listing only. CableEra doesn’t stream it.'}
        </p>
      )}
    </div>
  )
}
