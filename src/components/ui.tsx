import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AVAILABILITY_LABEL, availabilityOf, availabilitySource, eraLabel } from '../data/catalog'
import { getProvider, groupOffers, onMyServices, pickableProviders, whereToWatchSearch } from '../data/providers'
import { href } from '../lib/router'
import { actions, useUserData } from '../lib/store'
import { yearsLabel } from '../lib/time'
import type { Availability, ProviderLink, Show } from '../types'

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
  const { prefs } = useUserData()
  const mine = availability !== 'playable' && onMyServices(show, prefs.services)
    ? show.providerLinks.filter((l) => l.verified && prefs.services.includes(l.providerId) && (l.type === 'sub' || l.type === 'free'))
    : []
  return (
    <a className="tile" href={href(`/show/${show.id}`)}>
      <Artwork show={show} />
      <div className="tile-body">
        <span className="tile-title">{show.title}</span>
        <span className="tile-meta">{sub ?? `${yearsLabel(show.startYear, show.endYear)} · ${eraLabel(show.era)}`}</span>
        <span className="row-gap tight">
          <AvailabilityBadge availability={availability} compact />
          {mine.slice(0, 2).map((l) => (
            <ProviderTag key={l.providerId} link={l} />
          ))}
        </span>
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

/** Checkbox chips for the streaming services the viewer has. */
export function ServicePicker() {
  const { prefs } = useUserData()
  return (
    <div className="service-picker" role="group" aria-label="Streaming services you have">
      {pickableProviders().map((p) => {
        const on = prefs.services.includes(p.id)
        return (
          <button
            key={p.id}
            className={`service-chip ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            style={{ '--hue': p.hue ?? 210 } as CSSProperties}
            onClick={() => actions.toggleService(p.id)}
          >
            <span className="service-check" aria-hidden="true">{on ? '✓' : '+'}</span>
            {p.name}
            {p.kind === 'free' && <span className="service-free">free</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Compact provider badge, e.g. "D+", for guide cells and tiles. */
export function ProviderTag({ link }: { link: ProviderLink }) {
  const p = getProvider(link.providerId)
  return (
    <span className="provider-tag" style={{ '--hue': p?.hue ?? 210 } as CSSProperties} title={`On ${link.providerName}`}>
      {p?.short ?? link.providerName}
    </span>
  )
}

function offerNote(link: ProviderLink, yours: boolean): string {
  if (link.type === 'free') return `${link.providerName} is free to watch, with ads.`
  if (link.type === 'buy' || link.type === 'rent') return `${link.providerName} charges to ${link.type} this title.`
  if (link.type === 'tve') return `${link.providerName} requires signing in with a cable or satellite provider.`
  return yours ? `You told CableEra you have ${link.providerName}.` : `You’ll need a ${link.providerName} subscription.`
}

/**
 * Where to watch a show that doesn't play in CableEra: checked links to
 * streaming services (the viewer's own services first), each explained before
 * leaving, or an unverified search when nothing has been checked.
 */
export function WatchOptions({ show, compact }: { show: Show; compact?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { prefs } = useUserData()
  const [chosen, setChosen] = useState<ProviderLink | null>(null)
  const offers = groupOffers(show, prefs.services)
  const search = whereToWatchSearch(show)
  const hasOffers = offers.yours.length + offers.free.length + offers.subscription.length + offers.buyRent.length > 0
  const open = (l: ProviderLink | null) => {
    setChosen(l)
    ref.current?.showModal()
  }
  // Headline buttons: the viewer's services, else free options, else up to two
  // subscriptions (well-known services only, when the show is on any).
  const known = offers.subscription.filter((l) => getProvider(l.providerId)?.pickable)
  const primary = offers.yours.length ? offers.yours : offers.free.length ? offers.free : (known.length ? known : offers.subscription).slice(0, 2)
  const rest = [...offers.yours, ...offers.free, ...offers.subscription].filter((l) => !primary.includes(l))
  const checked = offers.lastChecked ? new Date(offers.lastChecked).toLocaleDateString() : null

  return (
    <>
      {hasOffers ? (
        <div className="watch-options">
          <div className="row-gap">
            {primary.map((l) => (
              <button key={l.providerId} className={`btn ${offers.yours.includes(l) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => open(l)}>
                Watch on {l.providerName} ↗
              </button>
            ))}
            {!primary.length && offers.buyRent[0] && (
              <button className="btn btn-ghost" onClick={() => open(offers.buyRent[0])}>
                {offers.buyRent[0].type === 'rent' ? 'Rent' : 'Buy'} on {offers.buyRent[0].providerName} ↗
              </button>
            )}
            {compact && rest.length > 0 && (
              <a className="btn btn-small btn-ghost" href={href(`/show/${show.id}`)}>
                +{rest.length} more
              </a>
            )}
          </div>
          {!compact && rest.length > 0 && (
            <p className="fine">
              Also streaming on{' '}
              {rest.map((l, i) => (
                <span key={l.providerId}>
                  {i > 0 && ', '}
                  <button className="link" onClick={() => open(l)}>
                    {l.providerName}
                  </button>
                  {l.type === 'free' && ' (free)'}
                </span>
              ))}
            </p>
          )}
          {!compact && offers.buyRent.length > 0 && (
            <p className="fine">
              Buy or rent:{' '}
              {offers.buyRent.map((l, i) => (
                <span key={l.providerId}>
                  {i > 0 && ', '}
                  <button className="link" onClick={() => open(l)}>
                    {l.providerName}
                  </button>
                </span>
              ))}
            </p>
          )}
          <p className="fine">
            Checked {checked} · <DataCredit />
            {!compact && !prefs.services.length && (
              <>
                {' '}· <a href={href('/settings?section=services')}>Add your services</a> to see yours first
              </>
            )}
          </p>
        </div>
      ) : (
        <button className="btn btn-ghost" onClick={() => open(null)}>
          Find where to watch ↗
        </button>
      )}
      <dialog ref={ref} className="dialog" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        {chosen ? (
          <>
            <h3>Opening {chosen.providerName}</h3>
            <p>
              {offerNote(chosen, offers.yours.includes(chosen))} CableEra doesn’t stream <strong>{show.title}</strong>; this
              opens it on {chosen.providerName} in a new tab
              {chosen.seasons ? ` (${chosen.seasons} season${chosen.seasons > 1 ? 's' : ''} listed)` : ''}.
            </p>
            <p className="fine">
              Checked {checked}. Catalogs change, so it may have moved since. <DataCredit />
            </p>
          </>
        ) : (
          <>
            <h3>Leaving CableEra</h3>
            <p>
              CableEra hasn’t verified where <strong>{show.title}</strong> is streaming, and doesn’t stream it itself. This
              opens a search on <strong>{search.provider.name}</strong>, an independent listings site, in a new tab.
              Results may require a subscription.
            </p>
          </>
        )}
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <a
            className="btn btn-primary"
            href={chosen ? chosen.url : search.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => ref.current?.close()}
          >
            {chosen ? `Open ${chosen.providerName}` : `Search ${search.provider.name}`} ↗
          </a>
        </div>
      </dialog>
    </>
  )
}

/** Required attribution wherever streaming-availability data is shown. */
export function DataCredit() {
  if (!availabilitySource) return null
  return (
    <span className="data-credit">
      Streaming data from{' '}
      <a href={availabilitySource.url} target="_blank" rel="noopener noreferrer">
        {availabilitySource.name}
      </a>
    </span>
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
