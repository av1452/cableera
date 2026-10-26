import { useLayoutEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react'
import { getShow } from '../data/catalog'
import { ProviderTag } from './ui'
import { entriesBetween } from '../lib/schedule'
import { actions, useUserData } from '../lib/store'
import { fmtTime } from '../lib/time'
import type { Channel, ScheduleEntry, Show } from '../types'

const MIN = 60_000

// Narrower channel column on phones so more of the schedule fits.
const phoneQuery = window.matchMedia('(max-width: 699px)')
const subscribePhone = (l: () => void) => {
  phoneQuery.addEventListener('change', l)
  return () => phoneQuery.removeEventListener('change', l)
}

interface Props {
  channels: Channel[]
  windowStart: number
  windowEnd: number
  now: number
  selectedId: string | null
  onSelect: (entry: ScheduleEntry) => void
  onActivate: (entry: ScheduleEntry) => void
  /** Cells not matching are dimmed (genre/era navigation). */
  matches?: (show: Show) => boolean
  /** Scroll request: a timestamp to bring into view, with a nonce to repeat. */
  scrollTo: { t: number; n: number }
}

/** The cable-style program grid. */
export function Guide({ channels, windowStart, windowEnd, now, selectedId, onSelect, onActivate, matches, scrollTo }: Props) {
  const { prefs, favoriteChannels, favoriteShows, history } = useUserData()
  const CH_COL = useSyncExternalStore(subscribePhone, () => phoneQuery.matches) ? 104 : 148
  const px = prefs.guideDensity === 'compact' ? 4.5 : 6.5
  const scroller = useRef<HTMLDivElement>(null)
  // Focus (which selects) fires on pointer-down, before click. Remember whether
  // the cell was already selected when the press began, so the first click
  // selects and only a second click on the same cell tunes in.
  const pressedSelected = useRef<boolean | null>(null)
  const width = ((windowEnd - windowStart) / MIN) * px
  const x = (t: number) => ((t - windowStart) / MIN) * px

  const rows = useMemo(
    () => channels.map((ch) => ({ ch, entries: entriesBetween(ch, windowStart, windowEnd) })),
    [channels, windowStart, windowEnd],
  )
  const watchedShows = useMemo(() => new Set(history.slice(0, 50).map((h) => h.showId)), [history])

  const times = useMemo(() => {
    const out: number[] = []
    for (let t = windowStart; t < windowEnd; t += 30 * MIN) out.push(t)
    return out
  }, [windowStart, windowEnd])

  const first = useRef(true)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const left = Math.max(0, x(scrollTo.t) - 20 * px)
    el.scrollTo({ left, behavior: first.current ? 'auto' : 'smooth' })
    first.current = false
  }, [scrollTo.n, px]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the focused cell visible beside the sticky channel column.
  const reveal = (el: HTMLElement) => {
    const sc = scroller.current
    if (!sc) return
    const cellLeft = el.offsetLeft + CH_COL
    if (cellLeft < sc.scrollLeft + CH_COL) sc.scrollTo({ left: el.offsetLeft - 8, behavior: 'smooth' })
    else if (cellLeft + Math.min(el.offsetWidth, 300) > sc.scrollLeft + sc.clientWidth)
      sc.scrollTo({ left: cellLeft + Math.min(el.offsetWidth, 300) - sc.clientWidth + 8, behavior: 'smooth' })
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]')
    if (!el) return
    const r = Number(el.dataset.row)
    const c = Number(el.dataset.col)
    let target: ScheduleEntry | undefined
    if (e.key === 'ArrowRight') target = rows[r].entries[c + 1]
    else if (e.key === 'ArrowLeft') target = rows[r].entries[c - 1]
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const row = rows[r + (e.key === 'ArrowDown' ? 1 : -1)]
      const cur = rows[r].entries[c]
      const anchor = Math.max(cur.start, windowStart, Math.min(now, cur.end - 1))
      target = row?.entries.find((x) => x.start <= anchor && x.end > anchor)
    } else if (e.key === 'Home') target = rows[r].entries[0]
    else if (e.key === 'End') target = rows[r].entries.at(-1)
    else return
    e.preventDefault()
    if (!target) return
    const next = scroller.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(target.id)}"]`)
    next?.focus({ preventScroll: true })
    if (next) reveal(next)
  }

  return (
    <div className="guide" style={{ '--px': px, '--ch-col': `${CH_COL}px` } as CSSProperties}>
      <div className="guide-scroll" ref={scroller} onKeyDown={onKeyDown}>
        <div className="guide-inner" style={{ width: CH_COL + width }}>
          <div className="guide-times" aria-hidden="true">
            <div className="guide-corner">{new Date(now).toLocaleDateString([], { weekday: 'short' })}</div>
            <div className="guide-timeline" style={{ width }}>
              {times.map((t) => (
                <span key={t} className="guide-time" style={{ left: x(t) }}>
                  {fmtTime(t)}
                </span>
              ))}
            </div>
          </div>

          {rows.map(({ ch, entries }, r) => {
            const fav = favoriteChannels.includes(ch.id)
            return (
              <div className="guide-row" key={ch.id} role="group" aria-label={`Channel ${ch.number} ${ch.name}`}>
                <div className="guide-ch" style={{ '--hue': ch.hue } as CSSProperties}>
                  <span className="ch-num">{ch.number}</span>
                  <span className="ch-name">{ch.name}</span>
                  <button
                    className={`ch-fav ${fav ? 'is-on' : ''}`}
                    aria-pressed={fav}
                    aria-label={`${fav ? 'Remove' : 'Add'} channel ${ch.number} ${fav ? 'from' : 'to'} favorites`}
                    onClick={() => actions.toggleFavoriteChannel(ch.id)}
                  >
                    {fav ? '★' : '☆'}
                  </button>
                </div>
                <div className="guide-track" style={{ width }}>
                  {entries.map((e, c) => {
                    const show = getShow(e.showId)!
                    const left = Math.max(0, x(e.start))
                    const w = x(Math.min(e.end, windowEnd)) - left
                    const live = e.start <= now && e.end > now
                    const past = e.end <= now
                    const selected = e.id === selectedId
                    // Not playable here, but on one of the viewer's services.
                    const mine = e.playable
                      ? undefined
                      : show.providerLinks.find((l) => l.verified && (l.type === 'sub' || l.type === 'free') && prefs.services.includes(l.providerId))
                    const dim = matches && !matches(show)
                    const label = [
                      show.title,
                      `${fmtTime(e.start)} to ${fmtTime(e.end)}`,
                      live ? 'on now' : past ? 'already aired' : '',
                      e.playable ? 'plays in CableEra' : mine ? `not playable here, on ${mine.providerName} (your service)` : 'listing only, not playable',
                    ]
                      .filter(Boolean)
                      .join(', ')
                    return (
                      <button
                        key={e.id}
                        data-cell
                        data-id={e.id}
                        data-row={r}
                        data-col={c}
                        tabIndex={selected ? 0 : -1}
                        className={[
                          'cell',
                          live && 'is-live',
                          past && 'is-past',
                          selected && 'is-selected',
                          e.playable ? 'is-playable' : 'is-listing',
                          mine && 'is-mine',
                          dim && 'is-dim',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{ left, width: w }}
                        aria-label={label}
                        aria-current={selected ? 'true' : undefined}
                        onFocus={() => onSelect(e)}
                        onPointerDown={() => (pressedSelected.current = selected)}
                        onClick={() => {
                          const wasSelected = pressedSelected.current ?? selected
                          pressedSelected.current = null
                          if (wasSelected) onActivate(e)
                          else onSelect(e)
                        }}
                        onKeyDown={(k) => {
                          if (k.key === 'Enter') {
                            k.preventDefault()
                            onActivate(e)
                          }
                        }}
                      >
                        <span className="cell-title">
                          {favoriteShows.includes(show.id) && <span className="cell-star" aria-hidden="true">★ </span>}
                          {show.title}
                        </span>
                        <span className="cell-meta">
                          {e.playable ? (
                            <span className="cell-play" aria-hidden="true">▶</span>
                          ) : mine ? (
                            <ProviderTag link={mine} />
                          ) : (
                            <span className="cell-tag">Listing</span>
                          )}
                          {watchedShows.has(show.id) && <span className="cell-dot" title="Recently watched" />}
                          {fmtTime(e.start)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="now-line" style={{ left: CH_COL + x(now) }} aria-hidden="true">
            <span className="now-flag">{fmtTime(now)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
