import { Artwork, AvailabilityBadge, Empty, FavoriteButton, WhereToWatch } from '../components/ui'
import { CHANNELS } from '../data/channels'
import { availabilityOf, episodesFor, eraLabel, getShow } from '../data/catalog'
import { href } from '../lib/router'
import { entriesBetween } from '../lib/schedule'
import { actions, useUserData } from '../lib/store'
import { fmtDay, fmtRuntime, fmtTime, useNow, yearsLabel } from '../lib/time'

const RIGHTS_LABEL = {
  'public-domain-expired': 'Public domain (US): copyright expired',
  'public-domain-not-renewed': 'Public domain (US): copyright not renewed',
  copyrighted: 'Copyrighted',
  licensed: 'Licensed to CableEra',
} as const

export function ShowPage({ showId }: { showId: string }) {
  const show = getShow(showId)
  const now = useNow(60_000)
  const { progress, savedShows } = useUserData()
  if (!show) {
    return (
      <Empty title="Show not found">
        <a href={href('/library')}>Browse the library</a>
      </Empty>
    )
  }
  const availability = availabilityOf(show)
  const eps = episodesFor(show.id)
  const playable = eps.filter((e) => e.mediaId)
  const resume = playable.find((e) => progress[e.id] && !progress[e.id].completed) ?? playable.find((e) => !progress[e.id]?.completed) ?? playable[0]
  const saved = savedShows.includes(show.id)

  // Upcoming airings across all channels in the next 24 hours.
  const airings = CHANNELS.filter((c) => c.showIds.includes(show.id))
    .flatMap((c) => entriesBetween(c, now, now + 86_400_000).filter((e) => e.showId === show.id).map((e) => ({ c, e })))
    .sort((a, b) => a.e.start - b.e.start)
    .slice(0, 6)

  const seasons = [...new Set(eps.map((e) => e.season))]

  return (
    <div className="page show-page">
      <section className="show-hero">
        <Artwork show={show} className="show-art" />
        <div>
          <p className="kicker">
            {eraLabel(show.era)} · {yearsLabel(show.startYear, show.endYear)} · {show.network}
          </p>
          <h1>{show.title}</h1>
          <p className="details-meta">
            {show.genres.join(', ')} · For {show.audience} · ~{show.runtimeMin} min
          </p>
          <p className="details-desc">{show.description}</p>
          <div className="row-gap">
            <AvailabilityBadge availability={availability} />
            {resume && (
              <a className="btn btn-primary" href={href(`/watch/${resume.id}`)}>
                ▶ {progress[resume.id] ? 'Resume' : 'Play'} “{resume.title}”
              </a>
            )}
            {availability !== 'playable' && <WhereToWatch show={show} />}
            <FavoriteButton showId={show.id} />
            <button className={`btn btn-ghost ${saved ? 'is-on' : ''}`} aria-pressed={saved} onClick={() => actions.toggleSavedShow(show.id)}>
              {saved ? '✓ Saved' : '+ Save'}
            </button>
          </div>
          <div className="rights-box">
            <strong>{RIGHTS_LABEL[show.rights.status]}</strong>
            <p>{show.rights.basis}</p>
            {availability === 'unavailable' && (
              <p className="fine">
                No viewing source has been verified for this title. CableEra shows its metadata only, and never claims a
                show is available somewhere without checking.
              </p>
            )}
            {show.artwork && (
              <p className="fine">
                Artwork: frame from the film, {show.artwork.credit}.{' '}
                <a href={show.artwork.sourcePage} target="_blank" rel="noopener noreferrer">
                  Source ↗
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {airings.length > 0 && (
        <section className="shelf">
          <h2>Airing on CableEra channels</h2>
          <ul className="airings">
            {airings.map(({ c, e }) => (
              <li key={e.id}>
                <a href={href(e.start <= now && e.playable ? `/tune/${c.id}` : `/guide?ch=${c.id}`)}>
                  <span className="ch-num">{c.number}</span> {c.name} · {fmtDay(e.start)} {fmtTime(e.start)}
                  {e.start <= now && <span className="live-pill small">On now</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {eps.length > 0 && (
        <section className="shelf">
          <h2>Episodes</h2>
          {seasons.map((s) => (
            <div key={s}>
              {seasons.length > 1 && <h3 className="h3">Season {s}</h3>}
              <ol className="episode-list wide">
                {eps
                  .filter((e) => e.season === s)
                  .map((e) => {
                    const p = progress[e.id]
                    return (
                      <li key={e.id}>
                        {e.mediaId ? (
                          <a href={href(`/watch/${e.id}`)}>
                            <span className="ep-num">{e.episode}</span>
                            <span className="ep-title">▶ {e.title}</span>
                            <span className="muted">
                              {e.year} · {fmtRuntime(e.runtimeSec)}
                              {p?.completed ? ' · ✓ Watched' : p ? ` · ${Math.round((p.positionSec / p.durationSec) * 100)}% watched` : ''}
                            </span>
                          </a>
                        ) : (
                          <span className="ep-unavailable">
                            <span className="ep-num">{e.episode}</span>
                            <span className="ep-title">{e.title}</span>
                            <span className="muted">Not playable</span>
                          </span>
                        )}
                      </li>
                    )
                  })}
              </ol>
            </div>
          ))}
        </section>
      )}
      {eps.length === 0 && (
        <p className="fine">Episode-level records haven’t been added for this show yet.</p>
      )}
    </div>
  )
}
