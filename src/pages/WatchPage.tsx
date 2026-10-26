import { useEffect, useState } from 'react'
import { Player } from '../components/Player'
import { Empty } from '../components/ui'
import { getCollection } from '../data/channels'
import { episodesFor, getEpisode, getMedia, getShow, playableEpisodesFor } from '../data/catalog'
import { href, navigate } from '../lib/router'
import { actions, getUserData, useUserData } from '../lib/store'
import { fmtRuntime } from '../lib/time'
import type { Episode } from '../types'

function nextEpisode(ep: Episode, queueId: string | null): Episode | undefined {
  const list = queueId
    ? (getCollection(queueId)?.showIds ?? []).flatMap((id) => playableEpisodesFor(id))
    : playableEpisodesFor(ep.showId)
  const i = list.findIndex((e) => e.id === ep.id)
  return i >= 0 ? list[i + 1] : undefined
}

/** On-demand playback of a single episode, with resume and up-next. */
export function WatchPage({ episodeId, queueId }: { episodeId: string; queueId: string | null }) {
  const ep = getEpisode(episodeId)
  const show = ep && getShow(ep.showId)
  const media = getMedia(ep?.mediaId)
  const { progress, prefs } = useUserData()
  const [countdown, setCountdown] = useState<number | null>(null)
  const next = ep ? nextEpisode(ep, queueId) : undefined
  const queue = queueId ? getCollection(queueId) : undefined

  // Read the resume point once per episode, not on every progress save.
  const [startAt] = useState(() => {
    const p = getUserData().progress[episodeId]
    return p && !p.completed && p.positionSec > 10 ? p.positionSec : 0
  })

  useEffect(() => {
    if (ep) actions.recordView({ showId: ep.showId, episodeId: ep.id })
  }, [ep])

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      if (next) navigate(`/watch/${next.id}${queueId ? `?queue=${queueId}` : ''}`, true)
      return
    }
    const id = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown, next, queueId])

  if (!ep || !show) {
    return (
      <Empty title="Episode not found">
        <a href={href('/library')}>Browse the library</a>
      </Empty>
    )
  }
  if (!media) {
    // Never show a player for something that can't play.
    return (
      <Empty title={`“${ep.title}” isn’t playable in CableEra`}>
        <a href={href(`/show/${show.id}`)}>See {show.title} details and viewing options</a>
      </Empty>
    )
  }

  const eps = episodesFor(show.id)
  return (
    <div className="watch-page">
      <div className="stage">
        <Player
          key={ep.id}
          media={media}
          startAt={startAt}
          autoPlay
          onProgress={(positionSec, durationSec) => actions.saveProgress({ episodeId: ep.id, positionSec, durationSec })}
          onEnded={() => {
            if (prefs.autoplayNext && next) setCountdown(8)
          }}
          overlay={
            countdown !== null && next ? (
              <div className="up-next" role="status">
                <span className="kicker">Up next in {countdown}s</span>
                <strong>{next.title}</strong>
                <div className="row-gap">
                  <button className="btn btn-primary" onClick={() => setCountdown(0)}>
                    Play now
                  </button>
                  <button className="btn btn-ghost" onClick={() => setCountdown(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null
          }
        />
      </div>
      <aside className="watch-info">
        <div className="row-gap">
          <a className="btn btn-ghost" href={href('/guide')}>
            ☰ Back to guide
          </a>
          <a className="btn btn-ghost" href={href(`/show/${show.id}`)}>
            Show info
          </a>
        </div>
        {queue && <p className="kicker">Marathon: {queue.title}</p>}
        <h1 className="watch-title">{ep.title}</h1>
        <p className="watch-sub">
          <a href={href(`/show/${show.id}`)}>{show.title}</a> · S{ep.season} E{ep.episode} · {ep.year} ·{' '}
          {fmtRuntime(ep.runtimeSec)} · {media.width >= media.height * 1.6 ? '16:9' : '4:3'}
        </p>
        {startAt > 0 && <p className="fine">Resumed where you left off.</p>}
        <div className="rights-box">
          <strong>{media.license}</strong> · {media.attribution}
          <p>{media.rights.basis}</p>
          <a href={media.sourcePage} target="_blank" rel="noopener noreferrer">
            View source and license ↗
          </a>
          <span className="fine"> Verified {new Date(media.checkedAt).toLocaleDateString()}</span>
          {media.captions.length === 0 && <p className="fine">No captions are available for this program.</p>}
        </div>
        <h2 className="h3">Episodes</h2>
        <ol className="episode-list">
          {eps.map((e) => {
            const p = progress[e.id]
            const pct = p ? Math.min(100, (p.positionSec / p.durationSec) * 100) : 0
            return (
              <li key={e.id}>
                <a
                  href={href(`/watch/${e.id}${queueId ? `?queue=${queueId}` : ''}`)}
                  className={e.id === ep.id ? 'is-on' : ''}
                  aria-current={e.id === ep.id ? 'true' : undefined}
                >
                  <span className="ep-num">{e.episode}</span>
                  <span className="ep-title">{e.title}</span>
                  <span className="muted">
                    {e.year} · {fmtRuntime(e.runtimeSec)}
                    {p?.completed && ' · ✓ Watched'}
                  </span>
                  {pct > 0 && !p?.completed && (
                    <span className="progress thin">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      </aside>
    </div>
  )
}
