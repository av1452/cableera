import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { MediaSource } from '../types'

// Plays official uploads through YouTube's IFrame Player API, the embed
// method YouTube's terms allow. Same props as the file player.

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(s: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  destroy(): void
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      host?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: () => void
        onStateChange?: (e: { data: number }) => void
        onError?: (e: { data: number }) => void
      }
    },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT!)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    s.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube player failed to load'))
    }
    document.head.appendChild(s)
  })
  return apiPromise
}

const ERRORS: Record<number, string> = {
  2: 'The video link is invalid.',
  5: 'YouTube’s player couldn’t play this video in this browser.',
  100: 'The owner removed this video or made it private.',
  101: 'The owner no longer allows this video to play on other sites.',
  150: 'The owner no longer allows this video to play on other sites.',
}

interface Props {
  media: MediaSource
  startAt?: number
  autoPlay?: boolean
  muted?: boolean
  preview?: boolean
  onEnded?: () => void
  onProgress?: (positionSec: number, durationSec: number) => void
  overlay?: ReactNode
}

export function YouTubePlayer({ media, startAt = 0, autoPlay = true, muted = false, preview, onEnded, onProgress, overlay }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const cbs = useRef({ onEnded, onProgress })
  useLayoutEffect(() => {
    cbs.current = { onEnded, onProgress }
  })
  // Read once per mount: the live-tuning page recomputes startAt every second.
  const start = useRef(startAt)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    const report = () => {
      const p = player.current
      if (!p || preview) return
      const d = p.getDuration()
      if (d > 0) cbs.current.onProgress?.(p.getCurrentTime(), d)
    }
    loadApi()
      .then((YT) => {
        if (cancelled || !host.current) return
        const el = document.createElement('div')
        host.current.replaceChildren(el)
        player.current = new YT.Player(el, {
          videoId: media.youtubeId!,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            start: Math.floor(start.current),
            autoplay: autoPlay ? 1 : 0,
            mute: muted ? 1 : 0,
            controls: preview ? 0 : 1,
            playsinline: 1,
            rel: 0,
            cc_load_policy: 0,
            disablekb: preview ? 1 : 0,
          },
          events: {
            onReady: () => {
              setStatus('ready')
              if (autoPlay) player.current?.playVideo()
            },
            onStateChange: (e) => {
              if (e.data === 0) {
                report()
                cbs.current.onEnded?.()
              } else if (e.data === 2) report()
            },
            onError: (e) => {
              setError(ERRORS[e.data] ?? 'YouTube couldn’t play this video.')
              setStatus('error')
            },
          },
        })
        timer = window.setInterval(report, 5000)
      })
      .catch(() => {
        if (cancelled) return
        setError('YouTube’s player couldn’t load. Check your connection or any content blockers, then retry.')
        setStatus('error')
      })
    return () => {
      cancelled = true
      clearInterval(timer)
      report()
      player.current?.destroy()
      player.current = null
    }
  }, [media.youtubeId, autoPlay, muted, preview, attempt])

  useEffect(() => {
    if (preview) return
    const onKey = (e: KeyboardEvent) => {
      const p = player.current
      const t = e.target as HTMLElement
      if (!p || e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, dialog')) return
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        if (p.getPlayerState() === 1) p.pauseVideo()
        else p.playVideo()
      } else if (e.key === 'm') {
        if (p.isMuted()) p.unMute()
        else p.mute()
      } else if (e.key === 'f') {
        if (document.fullscreenElement) document.exitFullscreen()
        else frameRef.current?.requestFullscreen?.().catch(() => {})
      } else if (e.key === 'j' || e.key === 'l') {
        p.seekTo(Math.max(0, p.getCurrentTime() + (e.key === 'l' ? 10 : -10)), true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  return (
    <div
      ref={frameRef}
      className={`player player-youtube ${preview ? 'player-preview' : ''}`}
      style={{ aspectRatio: '16 / 9', '--frame-ratio': 16 / 9 } as CSSProperties}
    >
      <div ref={host} className="yt-host" />
      {status === 'loading' && (
        <div className="player-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span className="sr-only">Loading video</span>
        </div>
      )}
      {status === 'error' && (
        <div className="player-state player-error" role="alert">
          <strong>Can’t play this program</strong>
          <p>{error}</p>
          {!preview && (
            <div className="row-gap">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setStatus('loading')
                  setAttempt((a) => a + 1)
                }}
              >
                Retry
              </button>
              <a className="btn btn-ghost" href={media.sourcePage} target="_blank" rel="noopener noreferrer">
                Watch on YouTube ↗
              </a>
            </div>
          )}
        </div>
      )}
      {overlay}
    </div>
  )
}
