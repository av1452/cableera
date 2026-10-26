import type { CSSProperties } from 'react'
import { PageHeader } from '../components/ui'
import { CHANNELS } from '../data/channels'
import { getShow, playableEpisodesFor } from '../data/catalog'
import { href } from '../lib/router'
import { entriesBetween, entryAt } from '../lib/schedule'
import { actions, useUserData } from '../lib/store'
import { fmtTime, useNow } from '../lib/time'

export function ChannelsPage() {
  const now = useNow(30_000)
  const { favoriteChannels } = useUserData()
  return (
    <div className="page">
      <PageHeader
        title="Channels"
        sub="Ten fictional CableEra channels with simulated schedules. They are not affiliated with any real network."
      />
      <div className="channel-list">
        {CHANNELS.map((ch) => {
          const current = entryAt(ch, now)
          const upcoming = entriesBetween(ch, current.end, current.end + 6 * 3_600_000).slice(0, 8)
          const playableShows = ch.showIds.filter((id) => playableEpisodesFor(id).length).length
          const fav = favoriteChannels.includes(ch.id)
          return (
            <article key={ch.id} className="channel-card" style={{ '--hue': ch.hue } as CSSProperties}>
              <header>
                <span className="ch-num big">{ch.number}</span>
                <div>
                  <h2>{ch.name}</h2>
                  <p className="muted">{ch.tagline}</p>
                </div>
                <button
                  className={`btn btn-icon ${fav ? 'is-on' : ''}`}
                  aria-pressed={fav}
                  aria-label={`${fav ? 'Remove' : 'Add'} ${ch.name} ${fav ? 'from' : 'to'} favorites`}
                  onClick={() => actions.toggleFavoriteChannel(ch.id)}
                >
                  {fav ? '★' : '☆'}
                </button>
              </header>
              <p>{ch.description}</p>
              <p className="fine">
                {playableShows} of {ch.showIds.length} shows play in CableEra
              </p>
              <p>
                <span className="live-pill">On now</span> <strong>{getShow(current.showId)?.title}</strong>{' '}
                <span className="muted">until {fmtTime(current.end)}</span>
              </p>
              <details>
                <summary>Coming up</summary>
                <ol className="lineup">
                  {upcoming.map((e) => (
                    <li key={e.id}>
                      <span className="muted">{fmtTime(e.start)}</span> {getShow(e.showId)?.title}{' '}
                      {e.playable ? <span className="cell-play">▶</span> : <span className="cell-tag">Listing</span>}
                    </li>
                  ))}
                </ol>
              </details>
              <div className="row-gap">
                {current.playable && (
                  <a className="btn btn-primary" href={href(`/tune/${ch.id}`)}>
                    ▶ Tune in
                  </a>
                )}
                <a className="btn btn-ghost" href={href(`/guide?ch=${ch.id}`)}>
                  View in guide
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
