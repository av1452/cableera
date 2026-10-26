import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Player } from '../components/Player'
import { Artwork, AvailabilityBadge, Empty, WhereToWatch } from '../components/ui'
import { CHANNELS, getChannel, getChannelByNumber } from '../data/channels'
import { availabilityOf, getEpisode, getMedia, getShow } from '../data/catalog'
import { href, navigate } from '../lib/router'
import { entryAt, itemAt, nextPlayableItem } from '../lib/schedule'
import { stepChannel, surfFrom } from '../lib/surf'
import { actions } from '../lib/store'
import { fmtDuration, fmtTime, useNow } from '../lib/time'

/** Live-style viewing of a simulated channel: joins the scheduled episode in progress. */
export function TunePage({ channelId }: { channelId: string }) {
  const channel = getChannel(channelId)
  const now = useNow(1000)
  const [digits, setDigits] = useState('')
  const [banner, setBanner] = useState(true)
  const digitTimer = useRef<number | undefined>(undefined)

  const entry = channel ? entryAt(channel, now) : null
  const item = entry ? itemAt(entry, now) : null
  // Pin the playing item so the 1s clock tick doesn't restart the video.
  const itemKey = item ? `${item.episodeId}@${item.start}` : null
  // When an episode finishes slightly ahead of its slot, show the station break
  // until the schedule moves on.
  const [endedKey, setEndedKey] = useState<string | null>(null)
  const playingId = itemKey !== endedKey ? itemKey : null

  useEffect(() => {
    if (!channel) return
    actions.tuneChannel(channel.id)
    const id = setTimeout(() => setBanner(false), 5000)
    return () => clearTimeout(id)
  }, [channel])

  useEffect(() => {
    if (channel && entry) actions.recordView({ showId: entry.showId, episodeId: item?.episodeId, channelId: channel.id })
  }, [channel, entry?.showId, item?.episodeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Remote-control keys: channel up/down and direct number entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, dialog') || !channel) return
      if (e.key === 'PageUp' || e.key === 'ChannelUp' || e.key === ']') {
        e.preventDefault()
        navigate(`/tune/${stepChannel(channel.id, 1).id}`, true)
      } else if (e.key === 'PageDown' || e.key === 'ChannelDown' || e.key === '[') {
        e.preventDefault()
        navigate(`/tune/${stepChannel(channel.id, -1).id}`, true)
      } else if (e.key === 'g' || e.key === 'Escape') {
        navigate('/guide')
      } else if (/^\d$/.test(e.key)) {
        setDigits((d) => {
          const next = (d + e.key).slice(-3)
          clearTimeout(digitTimer.current)
          const go = () => {
            const ch = getChannelByNumber(next)
            setDigits('')
            if (ch) navigate(`/tune/${ch.id}`, true)
          }
          if (next.length === 3) setTimeout(go, 300)
          else digitTimer.current = window.setTimeout(go, 1400)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [channel])

  if (!channel || !entry) {
    return (
      <Empty title="No signal">
        That channel doesn’t exist. <a href={href('/guide')}>Back to the guide</a>
      </Empty>
    )
  }

  const show = getShow(entry.showId)!
  const ep = item && playingId ? getEpisode(item.episodeId) : undefined
  const media = getMedia(ep?.mediaId)
  const upNext = nextPlayableItem(channel, now)
  const surf = () => {
    const ch = surfFrom(channel.id)
    if (ch) navigate(`/tune/${ch.id}`, true)
  }

  return (
    <div className="watch-page tune">
      <div className="stage">
        {media && item && ep ? (
          <Player
            key={`${item.episodeId}@${item.start}`}
            media={media}
            autoPlay
            startAt={(now - item.start) / 1000}
            onEnded={() => setEndedKey(itemKey)}
          />
        ) : entry.playable ? (
          <div className="player interstitial" style={{ aspectRatio: '4 / 3' }}>
            <div className="station-id" style={{ '--hue': channel.hue } as CSSProperties}>
              <span className="station-num">{channel.number}</span>
              <span className="station-name">{channel.name}</span>
              <span className="station-tag">{channel.tagline}</span>
            </div>
            {upNext && (
              <p className="interstitial-next">
                We’ll be right back. Up next: <strong>{getEpisode(upNext.item.episodeId)?.title}</strong> in{' '}
                {fmtDuration((upNext.item.start - now) / 1000)}
              </p>
            )}
          </div>
        ) : (
          <div className="player interstitial listing" style={{ aspectRatio: '4 / 3' }}>
            <Artwork show={show} className="interstitial-art" />
            <div className="interstitial-body">
              <AvailabilityBadge availability={availabilityOf(show)} />
              <h2>{show.title}</h2>
              <p>
                This time slot is a listing only. CableEra doesn’t stream {show.title}, so there’s no picture here.
              </p>
              <div className="row-gap">
                <button className="btn btn-primary" onClick={surf}>
                  Surf to something playable
                </button>
                <WhereToWatch show={show} />
              </div>
              {upNext && (
                <p className="fine">
                  Next playable program on {channel.number}: {getShow(upNext.entry.showId)?.title} at{' '}
                  {fmtTime(upNext.item.start)}
                </p>
              )}
            </div>
          </div>
        )}

        {banner && (
          <div className="channel-banner" role="status">
            <span className="banner-num">{channel.number}</span>
            <span className="banner-name">{channel.name}</span>
            <span className="banner-show">{show.title}</span>
          </div>
        )}
        {digits && (
          <div className="digit-entry" aria-live="assertive">
            {digits.padEnd(3, '–')}
          </div>
        )}
      </div>

      <aside className="watch-info">
        <div className="tune-controls" role="toolbar" aria-label="Channel controls">
          <button className="btn btn-ghost" onClick={() => navigate(`/tune/${stepChannel(channel.id, -1).id}`, true)} aria-label="Channel down">
            CH ▼
          </button>
          <div className="tune-num">
            <span className="ch-num big">{channel.number}</span>
            <span>{channel.name}</span>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate(`/tune/${stepChannel(channel.id, 1).id}`, true)} aria-label="Channel up">
            CH ▲
          </button>
        </div>
        <div className="row-gap">
          <button className="btn btn-primary" onClick={surf}>
            ⇄ Channel surf
          </button>
          <a className="btn btn-ghost" href={href(`/guide?ch=${channel.id}`)}>
            ☰ Guide
          </a>
        </div>
        <p className="kicker">
          <span className="live-pill">On now</span> {fmtTime(entry.start)} – {fmtTime(entry.end)} · Simulated channel
        </p>
        <h1 className="watch-title">{show.title}</h1>
        {ep && (
          <p className="watch-sub">
            “{ep.title}” ({ep.year}) <a href={href(`/watch/${ep.id}`)}>Watch from the beginning</a>
          </p>
        )}
        <p className="details-desc">{show.description}</p>
        {media && (
          <p className="fine">
            {media.license} · {media.attribution} ·{' '}
            <a href={media.sourcePage} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>
          </p>
        )}
        <h2 className="h3">Coming up on {channel.number}</h2>
        <ol className="lineup">
          {[1, 2, 3, 4].reduce(
            (acc) => {
              const last = acc.at(-1)!
              acc.push(entryAt(channel, last.end))
              return acc
            },
            [entry],
          )
            .slice(1)
            .map((e) => (
              <li key={e.id}>
                <span className="muted">{fmtTime(e.start)}</span> {getShow(e.showId)?.title}{' '}
                {e.playable ? <span className="cell-play">▶</span> : <span className="cell-tag">Listing</span>}
              </li>
            ))}
        </ol>
        <p className="fine">
          Keys: PageUp/PageDown or [ ] change channels · type a number (e.g. 0 4 4) to tune · G opens the guide ·
          Space plays/pauses · F fullscreen
        </p>
        <nav className="mini-lineup" aria-label="All channels">
          {CHANNELS.map((c) => (
            <a key={c.id} href={href(`/tune/${c.id}`)} className={c.id === channel.id ? 'is-on' : ''} aria-current={c.id === channel.id ? 'page' : undefined}>
              {c.number}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  )
}
