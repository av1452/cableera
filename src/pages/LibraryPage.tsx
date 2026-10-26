import { useMemo, useState } from 'react'
import { Chip, DataCredit, Empty, PageHeader, ShowTile } from '../components/ui'
import { ERAS, availabilitySource, availabilityOf, playableEpisodeCount, searchShows } from '../data/catalog'
import { onMyServices } from '../data/providers'
import { useRoute } from '../lib/router'
import { useUserData } from '../lib/store'
import type { Era, Genre } from '../types'

const GENRES: Genre[] = ['animation', 'sitcom', 'teen', 'family', 'action', 'adventure', 'comedy', 'educational', 'preschool', 'superhero', 'anime', 'sci-fi', 'anthology', 'silent', 'movie', 'holiday']
type Sort = 'title' | 'year-asc' | 'year-desc' | 'recent'

export function LibraryPage() {
  const { query } = useRoute()
  const { history, favoriteShows, prefs } = useUserData()
  const [q, setQ] = useState('')
  const [eras, setEras] = useState<Era[]>(() => (query.get('era') ? [query.get('era') as Era] : []))
  const [genre, setGenre] = useState<Genre | ''>('')
  const [network, setNetwork] = useState('')
  const [year, setYear] = useState('')
  const [source, setSource] = useState<'all' | 'playable' | 'mine' | 'free' | 'streaming' | 'listing' | 'favorites'>('all')
  const [sort, setSort] = useState<Sort>('title')

  const base = useMemo(() => searchShows(q), [q])
  const networks = useMemo(
    () => [...new Set(base.map((s) => s.network.split(' (')[0].split(' / ')[0]))].sort(),
    [base],
  )
  const recentRank = useMemo(() => {
    const m = new Map<string, number>()
    history.forEach((h, i) => !m.has(h.showId) && m.set(h.showId, i))
    return m
  }, [history])

  const results = base
    .filter((s) => !eras.length || eras.includes(s.era))
    .filter((s) => !genre || s.genres.includes(genre))
    .filter((s) => !network || s.network.includes(network))
    .filter((s) => !year || (s.startYear <= Number(year) && (s.endYear ?? 2026) >= Number(year)))
    .filter((s) => {
      if (source === 'playable') return availabilityOf(s) === 'playable'
      if (source === 'mine') return onMyServices(s, prefs.services)
      if (source === 'free') return s.providerLinks.some((l) => l.verified && l.type === 'free')
      if (source === 'streaming') return s.providerLinks.some((l) => l.verified && (l.type === 'sub' || l.type === 'free'))
      if (source === 'listing') return availabilityOf(s) === 'unavailable'
      if (source === 'favorites') return favoriteShows.includes(s.id)
      return true
    })
    .sort((a, b) => {
      if (sort === 'year-asc') return a.startYear - b.startYear
      if (sort === 'year-desc') return b.startYear - a.startYear
      if (sort === 'recent') return (recentRank.get(a.id) ?? 1e9) - (recentRank.get(b.id) ?? 1e9)
      return a.title.localeCompare(b.title)
    })

  const toggleEra = (e: Era) => setEras(eras.includes(e) ? eras.filter((x) => x !== e) : [...eras, e])
  const clear = () => {
    setQ('')
    setEras([])
    setGenre('')
    setNetwork('')
    setYear('')
    setSource('all')
  }

  return (
    <div className="page">
      <PageHeader
        title="Library"
        sub={`${base.length} shows and specials · ${playableEpisodeCount()} episodes play in CableEra`}
      />
      <div className="filters">
        <label className="search">
          <span className="sr-only">Search shows</span>
          <input
            type="search"
            placeholder="Search shows, networks, years, episodes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="chip-row" role="group" aria-label="Eras">
          {ERAS.map((e) => (
            <Chip key={e.id} on={eras.includes(e.id)} onClick={() => toggleEra(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label="Availability">
          {(
            [
              ['all', 'Everything'],
              ['playable', '▶ Plays in CableEra'],
              ...(availabilitySource
                ? ([
                    ['mine', '✓ On my services'],
                    ['streaming', 'Streaming anywhere'],
                    ['free', 'Free to stream'],
                  ] as const)
                : []),
              ['listing', 'Listing only'],
              ['favorites', '★ Favorites'],
            ] as const
          ).map(([id, label]) => (
            <Chip key={id} on={source === id} onClick={() => setSource(id)}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="select-row">
          <label className="select">
            <span>Genre</span>
            <select value={genre} onChange={(e) => setGenre(e.target.value as Genre | '')}>
              <option value="">Any</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span>Network</span>
            <select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="">Any</option>
              {networks.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span>On the air in</span>
            <input
              type="number"
              min={1914}
              max={2026}
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="select">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="title">A–Z</option>
              <option value="year-desc">Newest first</option>
              <option value="year-asc">Oldest first</option>
              <option value="recent">Recently watched</option>
            </select>
          </label>
        </div>
      </div>
      {source === 'mine' && !prefs.services.length && (
        <p className="fine">
          You haven’t picked any services yet. <a href="#/settings?section=services">Choose your services</a>.
        </p>
      )}
      {availabilitySource && (source === 'mine' || source === 'free' || source === 'streaming') && (
        <p className="fine">
          <DataCredit />
        </p>
      )}
      {results.length ? (
        <div className="tile-grid">
          {results.map((s) => (
            <ShowTile key={s.id} show={s} />
          ))}
        </div>
      ) : (
        <Empty title="Nothing on this channel">
          No shows match those filters. <button className="link" onClick={clear}>Clear filters</button>
        </Empty>
      )}
    </div>
  )
}
