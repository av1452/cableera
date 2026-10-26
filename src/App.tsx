import { useEffect, useState } from 'react'
import { ChannelsPage } from './pages/ChannelsPage'
import { CollectionPage } from './pages/CollectionPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { GuidePage } from './pages/GuidePage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { MyTvPage } from './pages/MyTvPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShowPage } from './pages/ShowPage'
import { TunePage } from './pages/TunePage'
import { WatchPage } from './pages/WatchPage'
import { Empty } from './components/ui'
import { href, navigate, useRoute } from './lib/router'
import { getUserData, useUserData } from './lib/store'
import { surfFrom } from './lib/surf'
import { fmtTime, useNow } from './lib/time'

const NAV = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/guide', label: 'Guide', icon: '☰' },
  { path: '/library', label: 'Library', icon: '▤' },
  { path: '/channels', label: 'Channels', icon: '#' },
  { path: '/discover', label: 'Discover', icon: '✦' },
  { path: '/mytv', label: 'My TV', icon: '★' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

// Honor the "open to" preference on a fresh launch only.
if (!window.location.hash && getUserData().prefs.landing === 'guide') navigate('/guide', true)

function Page() {
  const { path, query } = useRoute()
  const [section, id] = path
  switch (section) {
    case undefined:
      return <HomePage />
    case 'guide':
      return <GuidePage key={query.get('ch') ?? ''} />
    case 'library':
      return <LibraryPage key={query.get('era') ?? ''} />
    case 'show':
      return <ShowPage key={id} showId={id} />
    case 'watch':
      return <WatchPage key={id} episodeId={id} queueId={query.get('queue')} />
    case 'tune':
      return <TunePage key={id} channelId={id} />
    case 'channels':
      return <ChannelsPage />
    case 'discover':
      return <DiscoverPage />
    case 'collection':
      return <CollectionPage key={id} id={id} />
    case 'mytv':
      return <MyTvPage />
    case 'settings':
      return <SettingsPage />
    default:
      return (
        <Empty title="No signal">
          This page doesn’t exist. <a href={href('/')}>Go home</a>
        </Empty>
      )
  }
}

function Clock() {
  const now = useNow(10_000)
  return (
    <time className="clock" dateTime={new Date(now).toISOString()}>
      {fmtTime(now)}
    </time>
  )
}

function Boot() {
  const { prefs } = useUserData()
  const reduced =
    prefs.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [show, setShow] = useState(() => {
    try {
      return prefs.bootEffect && !reduced && !sessionStorage.getItem('cableera:booted')
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem('cableera:booted', '1')
    } catch {
      /* ignore */
    }
    const id = setTimeout(() => setShow(false), 1100)
    return () => clearTimeout(id)
  }, [show])
  return show ? <div className="boot" aria-hidden="true" onClick={() => setShow(false)} /> : null
}

export default function App() {
  const { path } = useRoute()
  const { prefs, lastChannel } = useUserData()
  const active = `/${path[0] ?? ''}`
  const watching = path[0] === 'watch' || path[0] === 'tune'

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = prefs.theme
    root.dataset.motion = prefs.motion
  }, [prefs.theme, prefs.motion])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path[0], path[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  const surf = () => {
    const ch = surfFrom(path[0] === 'tune' ? path[1] : lastChannel)
    if (ch) navigate(`/tune/${ch.id}`)
  }

  return (
    <div className={`app ${watching ? 'is-watching' : ''}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Boot />
      <header className="topbar">
        <a className="logo" href={href('/')} aria-label="CableEra home">
          <span className="logo-cable">CABLE</span>
          <span className="logo-era">ERA</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a
              key={n.path}
              href={href(n.path)}
              className={`nav-item nav-${n.label.replace(/\s/g, '').toLowerCase()} ${active === n.path ? 'is-on' : ''}`}
              aria-current={active === n.path ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {n.icon}
              </span>
              <span className="nav-label">{n.label}</span>
            </a>
          ))}
        </nav>
        <div className="topbar-right">
          <button className="btn btn-small btn-ghost surf-btn" onClick={surf} title="Channel surf">
            ⇄ <span className="surf-label">Surf</span>
          </button>
          <a className="btn btn-small btn-ghost topbar-settings" href={href('/settings')} aria-label="Settings">
            ⚙
          </a>
          <Clock />
        </div>
      </header>
      <main id="main" className="main">
        <Page />
      </main>
    </div>
  )
}
