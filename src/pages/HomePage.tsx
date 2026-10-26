import type { CSSProperties } from 'react'
import { Artwork, AvailabilityBadge, Shelf, ShowTile } from '../components/ui'
import { CHANNELS, COLLECTIONS, getChannel } from '../data/channels'
import { ERAS, allShows, availabilityOf, getEpisode, getShow } from '../data/catalog'
import { href } from '../lib/router'
import { entryAt, itemAt } from '../lib/schedule'
import { useUserData } from '../lib/store'
import { isPlayingNow } from '../lib/surf'
import { fmtRuntime, fmtTime, useNow } from '../lib/time'

function greeting(h: number) {
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Suggests a programming block for the time of day, like a cable home screen would. */
function blockFor(d: Date) {
  const h = d.getHours()
  const weekend = d.getDay() === 0 || d.getDay() === 6
  if (weekend && h >= 6 && h < 12) return 'saturday-morning-mode'
  if (h >= 15 && h < 18) return 'after-school-mode'
  if (h >= 19 || h < 2) return 'throwback-night'
  return 'comfort-tv'
}

export function HomePage() {
  const now = useNow(30_000)
  const { progress, recentChannels, favoriteShows, favoriteChannels, prefs, lastChannel } = useUserData()
  const date = new Date(now)

  const continueWatching = Object.values(progress)
    .filter((p) => !p.completed && p.positionSec > 10)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12)

  // Featured: last channel if it's airing something playable, else favorites, else first playable channel.
  const preferred = [lastChannel, ...favoriteChannels].map((id) => getChannel(id ?? '')).filter(Boolean)
  const featuredCh = [...preferred, ...CHANNELS].find((c) => c && isPlayingNow(c, now)) ?? CHANNELS[0]
  const featuredEntry = entryAt(featuredCh, now)
  const featuredShow = getShow(featuredEntry.showId)!
  const featuredItem = itemAt(featuredEntry, now)
  const featuredEp = featuredItem && getEpisode(featuredItem.episodeId)

  const block = COLLECTIONS.find((c) => c.id === blockFor(date))!
  const dayIndex = Math.floor(now / 86_400_000)
  const featuredEra = ERAS[dayIndex % ERAS.length]

  const likedGenres = new Set(favoriteShows.flatMap((id) => getShow(id)?.genres ?? []))
  const eras = prefs.preferredEras
  const recommended = allShows()
    .filter((s) => !favoriteShows.includes(s.id) && !s.genres.includes('movie'))
    .map((s) => ({
      s,
      score:
        (eras.includes(s.era) ? 3 : 0) +
        s.genres.filter((g) => likedGenres.has(g)).length +
        (availabilityOf(s) === 'playable' ? 1.5 : 0) +
        // Stable daily shuffle so the row changes from day to day.
        (((s.hue * 7 + dayIndex * 13) % 100) / 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((x) => x.s)

  return (
    <div className="home">
      <section className="hero" style={{ '--hue': featuredCh.hue } as CSSProperties}>
        <Artwork show={featuredShow} className="hero-art" />
        <div className="hero-body">
          <p className="kicker">
            {greeting(date.getHours())} · It’s {fmtTime(now)}. Here’s what’s on.
          </p>
          <p className="hero-ch">
            <span className="ch-num">{featuredCh.number}</span> {featuredCh.name}
            <span className="live-pill">On now</span>
          </p>
          <h1 className="hero-title">{featuredShow.title}</h1>
          {featuredEp && (
            <p className="hero-sub">
              “{featuredEp.title}” · {featuredEp.year} · until {fmtTime(featuredItem!.end)}
            </p>
          )}
          <p className="hero-desc">{featuredShow.description}</p>
          <div className="row-gap">
            {featuredEntry.playable ? (
              <a className="btn btn-primary btn-large" href={href(`/tune/${featuredCh.id}`)}>
                ▶ Watch live
              </a>
            ) : (
              <AvailabilityBadge availability={availabilityOf(featuredShow)} />
            )}
            <a className="btn btn-ghost btn-large" href={href('/guide')}>
              ☰ Open the guide
            </a>
          </div>
        </div>
      </section>

      {continueWatching.length > 0 && (
        <Shelf title="Continue watching">
          {continueWatching.map((p) => {
            const ep = getEpisode(p.episodeId)
            const show = ep && getShow(ep.showId)
            if (!ep || !show) return null
            return (
              <a key={p.episodeId} className="tile" href={href(`/watch/${ep.id}`)}>
                <Artwork show={show} />
                <div className="tile-body">
                  <span className="tile-title">{ep.title}</span>
                  <span className="tile-meta">
                    {show.title} · {fmtRuntime(p.durationSec - p.positionSec)} left
                  </span>
                  <span className="progress thin">
                    <span style={{ width: `${(p.positionSec / p.durationSec) * 100}%` }} />
                  </span>
                </div>
              </a>
            )
          })}
        </Shelf>
      )}

      <section className="shelf">
        <header className="shelf-head">
          <h2>What’s on now</h2>
          <a href={href('/guide')}>Full guide →</a>
        </header>
        <div className="now-grid">
          {CHANNELS.map((ch) => {
            const e = entryAt(ch, now)
            const s = getShow(e.showId)!
            const playing = isPlayingNow(ch, now)
            return (
              <a
                key={ch.id}
                className={`now-card ${e.playable ? 'is-playable' : ''}`}
                href={href(e.playable ? `/tune/${ch.id}` : `/guide?ch=${ch.id}`)}
                style={{ '--hue': ch.hue } as CSSProperties}
              >
                <span className="ch-num">{ch.number}</span>
                <span className="now-card-body">
                  <span className="now-card-ch">{ch.name}</span>
                  <span className="now-card-title">{s.title}</span>
                  <span className="now-card-meta">
                    {e.playable ? (playing ? '▶ Playing now' : '▶ Station break') : 'Listing only'} · until {fmtTime(e.end)}
                  </span>
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <Shelf title="Programming blocks" action={<a href={href('/discover')}>Discover →</a>}>
        {[block, ...COLLECTIONS.filter((c) => c.kind === 'mode' && c.id !== block.id)].map((c, i) => (
          <a key={c.id} className={`block-card ${i === 0 ? 'is-featured' : ''}`} href={href(`/collection/${c.id}`)}>
            {i === 0 && <span className="kicker">Right now</span>}
            <strong>{c.title}</strong>
            <span>{c.description}</span>
          </a>
        ))}
      </Shelf>

      {recentChannels.length > 0 && (
        <Shelf title="Recently tuned">
          {recentChannels.map((id) => {
            const ch = getChannel(id)
            if (!ch) return null
            const s = getShow(entryAt(ch, now).showId)!
            return (
              <a key={id} className="channel-chip" href={href(`/tune/${id}`)} style={{ '--hue': ch.hue } as CSSProperties}>
                <span className="ch-num">{ch.number}</span>
                <span>
                  <strong>{ch.name}</strong>
                  <span className="muted">{s.title}</span>
                </span>
              </a>
            )
          })}
        </Shelf>
      )}

      <Shelf title="Recommended for you">
        {recommended.map((s) => (
          <ShowTile key={s.id} show={s} />
        ))}
      </Shelf>

      <Shelf title={`Featured era: ${featuredEra.label}`} action={<a href={href(`/library?era=${featuredEra.id}`)}>See all →</a>}>
        {allShows()
          .filter((s) => s.era === featuredEra.id)
          .slice(0, 14)
          .map((s) => (
            <ShowTile key={s.id} show={s} />
          ))}
      </Shelf>
    </div>
  )
}
