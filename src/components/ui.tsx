import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AVAILABILITY_LABEL, availabilityOf, eraLabel } from '../data/catalog'
import { whereToWatchSearch } from '../data/providers'
import { href } from '../lib/router'
import { actions, useUserData } from '../lib/store'
import { yearsLabel } from '../lib/time'
import type { Availability, Show } from '../types'

/** Show artwork, falling back to a generated title card when none exists or it fails to load. */
export function Artwork({ show, className = '', label }: { show: Show; className?: string; label?: string }) {
  const [failed, setFailed] = useState(false)
  const art = show.artwork && !failed ? show.artwork : null
  return (
    <div className={`artwork ${className}`} style={{ '--hue': show.hue } as CSSProperties}>
      {art ? (
        <img src={art.url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="title-card" aria-hidden="true">
          <span className="title-card-name">{show.title}</span>
          <span className="title-card-meta">
            {show.network.split(' (')[0]} · {show.startYear}
          </span>
        </div>
      )}
      {label && <span className="artwork-label">{label}</span>}
    </div>
  )
}

export function AvailabilityBadge({ availability, compact }: { availability: Availability; compact?: boolean }) {
  return (
    <span className={`badge badge-${availability}`} title={AVAILABILITY_LABEL[availability]}>
      <span className="badge-dot" aria-hidden="true" />
      {compact && availability === 'playable' ? 'Plays here' : AVAILABILITY_LABEL[availability]}
    </span>
  )
}

export function ShowTile({ show, sub }: { show: Show; sub?: string }) {
  const availability = availabilityOf(show)
  return (
    <a className="tile" href={href(`/show/${show.id}`)}>
      <Artwork show={show} />
      <div className="tile-body">
        <span className="tile-title">{show.title}</span>
        <span className="tile-meta">{sub ?? `${yearsLabel(show.startYear, show.endYear)} · ${eraLabel(show.era)}`}</span>
        <AvailabilityBadge availability={availability} compact />
      </div>
    </a>
  )
}

export function Shelf({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="shelf">
      <header className="shelf-head">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="shelf-row">{children}</div>
    </section>
  )
}

export function FavoriteButton({ showId, small }: { showId: string; small?: boolean }) {
  const { favoriteShows } = useUserData()
  const on = favoriteShows.includes(showId)
  return (
    <button
      className={`btn ${small ? 'btn-icon' : 'btn-ghost'} ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => actions.toggleFavoriteShow(showId)}
    >
      <span aria-hidden="true">{on ? '★' : '☆'}</span>
      {!small && (on ? ' Favorite' : ' Add to favorites')}
    </button>
  )
}

/**
 * External "find where to watch" action. Explains before leaving that CableEra
 * has not verified availability.
 */
export function WhereToWatch({ show }: { show: Show }) {
  const ref = useRef<HTMLDialogElement>(null)
  const verified = show.providerLinks.filter((l) => l.verified)
  const search = whereToWatchSearch(show)
  return (
    <>
      <button className="btn btn-ghost" onClick={() => ref.current?.showModal()}>
        Find where to watch ↗
      </button>
      <dialog ref={ref} className="dialog" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <h3>Leaving CableEra</h3>
        {verified.length ? (
          <p>These providers were confirmed to carry {show.title}:</p>
        ) : (
          <p>
            CableEra hasn’t verified where <strong>{show.title}</strong> is streaming, and doesn’t stream it itself. This
            opens a search on <strong>{search.provider.name}</strong>, an independent listings site, in a new tab.
            Results may require a subscription.
          </p>
        )}
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          {verified.map((l) => (
            <a key={l.url} className="btn btn-primary" href={l.url} target="_blank" rel="noopener noreferrer">
              Watch on {l.providerId} ↗
            </a>
          ))}
          {!verified.length && (
            <a
              className="btn btn-primary"
              href={search.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => ref.current?.close()}
            >
              Search {search.provider.name} ↗
            </a>
          )}
        </div>
      </dialog>
    </>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-static" aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  )
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children}
    </header>
  )
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}
