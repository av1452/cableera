import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useUserData } from '../lib/store'
import type { MediaSource } from '../types'
import { YouTubePlayer } from './YouTubePlayer'

type Status = 'loading' | 'ready' | 'waiting' | 'blocked' | 'error'

interface Props {
  media: MediaSource
  /** Seconds into the media to start at (resume point or live offset). */
  startAt?: number
  autoPlay?: boolean
  muted?: boolean
  /** Bare preview mode for the guide: no controls, no keyboard shortcuts. */
  preview?: boolean
  onEnded?: () => void
  onProgress?: (positionSec: number, durationSec: number) => void
  overlay?: ReactNode
}

const ERRORS: Record<number, string> = {
  1: 'Playback was stopped before the video loaded.',
  2: 'A network problem interrupted the video. Check your connection and try again.',
  3: 'The video couldn’t be decoded. It may be damaged, or your browser may not support it.',
}

/**
 * Native <video> playback inside a TV frame. The frame matches the source's
 * shape (4:3 or 16:9) and the video uses object-fit: contain, so footage is
 * pillarboxed or letterboxed and never stretched.
 */
function FilePlayer({ media, startAt = 0, autoPlay = true, muted = false, preview, onEnded, onProgress, overlay }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const { prefs } = useUserData()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const lastReport = useRef(0)
  const cbs = useRef({ onEnded, onProgress })
  useLayoutEffect(() => {
    cbs.current = { onEnded, onProgress }
  })

  const wide = media.width / media.height >= 1.6
  const frameAspect = wide ? '16 / 9' : '4 / 3'

  // Check codec support before the browser tries (e.g. WebM on older Safari).
  const unsupported = typeof document !== 'undefined' && document.createElement('video').canPlayType(media.mime) === ''

  function toggleFullscreen() {
    const frame = frameRef.current
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) document.exitFullscreen()
    else if (frame?.requestFullscreen) frame.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.())
    else v?.webkitEnterFullscreen?.() // iPhone Safari only supports fullscreen on the video element
  }

  const report = (force = false) => {
    const v = ref.current
    if (!v || !v.duration || preview) return
    const now = Date.now()
    if (!force && now - lastReport.current < 5000) return
    lastReport.current = now
    cbs.current.onProgress?.(v.currentTime, v.duration)
  }

  useEffect(() => {
    if (preview) return
    const onKey = (e: KeyboardEvent) => {
      const v = ref.current
      const t = e.target as HTMLElement
      if (!v || e.metaKey || e.ctrlKey || e.altKey) return
      if (t.closest('input, textarea, select, dialog')) return
      // Let the native controls handle keys while the video itself is focused.
      const onVideo = t === v
      switch (e.key) {
        case ' ':
        case 'k':
          if (onVideo && e.key === ' ') return
          e.preventDefault()
          if (v.paused) v.play().catch(() => setStatus('blocked'))
          else v.pause()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          v.muted = !v.muted
          break
        case 'j':
          v.currentTime = Math.max(0, v.currentTime - 10)
          break
        case 'l':
          v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10)
          break
        case 'ArrowLeft':
          if (onVideo) return
          v.currentTime = Math.max(0, v.currentTime - 5)
          break
        case 'ArrowRight':
          if (onVideo) return
          v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  // Save position when leaving the page mid-episode.
  useEffect(() => () => report(true), []) // eslint-disable-line react-hooks/exhaustive-deps

  function onLoadedMetadata() {
    const v = ref.current!
    if (startAt > 1 && startAt < v.duration - 2) v.currentTime = startAt
    setStatus('ready')
    if (autoPlay) {
      v.play().catch(() => {
        // Autoplay with sound was refused: wait for a tap rather than forcing mute.
        setStatus('blocked')
      })
    }
  }

  function onError() {
    const code = ref.current?.error?.code ?? 0
    // Code 4 for a format we already know the browser supports usually means the
    // host answered with an error page (e.g. a temporary rate limit), not video.
    setError(
      code === 4
        ? 'The video host didn’t send a playable file. It may be temporarily unavailable or rate-limiting requests. Try again in a minute.'
        : (ERRORS[code] ?? 'The video failed to load.'),
    )
    setStatus('error')
  }

  const showError = unsupported || status === 'error'

  return (
    <div
      ref={frameRef}
      className={`player ${preview ? 'player-preview' : ''} ${prefs.scanlines ? 'with-scanlines' : ''}`}
      style={{ aspectRatio: frameAspect, '--frame-ratio': wide ? 16 / 9 : 4 / 3 } as CSSProperties}
    >
      {!unsupported && (
        <video
          ref={ref}
          key={media.id}
          src={media.url}
          preload="metadata"
          playsInline
          controls={!preview}
          muted={muted}
          poster={media.thumbnail ?? undefined}
          onLoadedMetadata={onLoadedMetadata}
          onWaiting={() => setStatus('waiting')}
          onPlaying={() => setStatus('ready')}
          onTimeUpdate={() => report()}
          onPause={() => report(true)}
          onEnded={() => {
            report(true)
            cbs.current.onEnded?.()
          }}
          onError={onError}
          aria-label="Video player"
        >
          {media.captions.map((c) => (
            <track key={c.src} kind="captions" src={c.src} srcLang={c.lang} label={c.label} default={prefs.captions} />
          ))}
        </video>
      )}

      {(status === 'loading' || status === 'waiting') && !showError && (
        <div className="player-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span className="sr-only">Loading video</span>
        </div>
      )}

      {status === 'blocked' && !showError && !preview && (
        <button
          className="player-state player-tap"
          onClick={() => {
            ref.current?.play().then(() => setStatus('ready')).catch(() => setStatus('blocked'))
          }}
        >
          <span className="big-play" aria-hidden="true">▶</span>
          <span>Tap to play</span>
        </button>
      )}

      {showError && (
        <div className="player-state player-error" role="alert">
          <strong>{unsupported ? 'Format not supported' : 'Can’t play this program'}</strong>
          <p>
            {unsupported
              ? `This browser can’t play ${media.mime} video. Recent Chrome, Firefox, Edge and Safari (iOS 17.4+/macOS 14+) can.`
              : error}
          </p>
          {!preview && (
            <div className="row-gap">
              {!unsupported && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setStatus('loading')
                    setError('')
                    ref.current?.load()
                  }}
                >
                  Retry
                </button>
              )}
              <a className="btn btn-ghost" href={media.sourcePage} target="_blank" rel="noopener noreferrer">
                Open source page ↗
              </a>
            </div>
          )}
        </div>
      )}
      {overlay}
    </div>
  )
}

/** Plays a media record with the right engine: native video or YouTube's embed. */
export function Player(props: Props) {
  return props.media.kind === 'youtube' ? <YouTubePlayer {...props} /> : <FilePlayer {...props} />
}
