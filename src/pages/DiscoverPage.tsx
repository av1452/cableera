import { useState } from 'react'
import { Chip, PageHeader, Shelf, ShowTile } from '../components/ui'
import { COLLECTIONS } from '../data/channels'
import { allShows, availabilityOf, playableEpisodesFor, showsAiringIn } from '../data/catalog'
import { href } from '../lib/router'
import { actions, useUserData } from '../lib/store'
import { useNow } from '../lib/time'
import type { Audience, Show } from '../types'

const YEAR_CHIPS = [1928, 1962, 1991, 1995, 1998, 2001, 2004, 2008, 2010, 2012]

const STAGES: { label: string; ages: [number, number]; audiences: Audience[] }[] = [
  { label: 'Preschool years', ages: [2, 5], audiences: ['preschool', 'kids'] },
  { label: 'Grade school', ages: [6, 11], audiences: ['kids', 'family'] },
  { label: 'Teen years', ages: [12, 17], audiences: ['family', 'teen', 'kids'] },
  { label: 'Young adult', ages: [18, 24], audiences: ['adult', 'teen', 'family'] },
]

function showsForAges(birth: number, [a, b]: [number, number], audiences: Audience[]): Show[] {
  const seen = new Set<string>()
  const out: Show[] = []
  for (let y = birth + a; y <= birth + b; y++) {
    for (const s of showsAiringIn(y)) {
      if (seen.has(s.id) || !audiences.includes(s.audience)) continue
      // Skip long-running classics that merely overlapped (e.g. a 1969 show still airing in 2005).
      if (s.startYear < birth + a - 8) continue
      seen.add(s.id)
      out.push(s)
    }
  }
  return out
}

export function DiscoverPage() {
  const { prefs } = useUserData()
  const day = Math.floor(useNow(3_600_000) / 86_400_000)
  const [year, setYear] = useState(2004)
  const [birthInput, setBirthInput] = useState(prefs.birthYear ? String(prefs.birthYear) : '')
  const birth = prefs.birthYear
  const modes = COLLECTIONS.filter((c) => c.kind === 'mode')
  const marathons = COLLECTIONS.filter((c) => c.kind === 'marathon')
  const forgotten = allShows()
    .filter((s) => availabilityOf(s) !== 'playable' && !s.genres.includes('movie'))
    .sort((a, b) => ((a.hue * 37 + day) % 97) - ((b.hue * 37 + day) % 97))
    .slice(0, 12)

  return (
    <div className="page">
      <PageHeader title="Discover" sub="Programming blocks, marathons and a trip back through the years." />

      <section className="shelf">
        <h2>Programming modes</h2>
        <div className="mode-grid">
          {modes.map((c) => (
            <a key={c.id} className={`mode-card mode-${c.id}`} href={href(`/collection/${c.id}`)}>
              <strong>{c.title}</strong>
              <span>{c.description}</span>
            </a>
          ))}
        </div>
      </section>

      <Shelf title="Theme marathons">
        {marathons.map((c) => {
          const playable = c.showIds.reduce((n, id) => n + playableEpisodesFor(id).length, 0)
          return (
            <a key={c.id} className="block-card" href={href(`/collection/${c.id}`)}>
              <strong>{c.title}</strong>
              <span>{c.description}</span>
              <span className="fine">{playable ? `▶ ${playable} playable episodes` : 'Listings only'}</span>
            </a>
          )
        })}
      </Shelf>

      <section className="shelf">
        <header className="shelf-head">
          <h2>By year: {year}</h2>
        </header>
        <div className="year-picker">
          <input
            type="range"
            min={1914}
            max={2013}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
          />
          <div className="chip-row">
            {YEAR_CHIPS.map((y) => (
              <Chip key={y} on={y === year} onClick={() => setYear(y)}>
                {y}
              </Chip>
            ))}
          </div>
        </div>
        <div className="shelf-row">
          {showsAiringIn(year).length ? (
            showsAiringIn(year).map((s) => <ShowTile key={s.id} show={s} sub={s.startYear === year ? `Premiered ${year}` : `On the air since ${s.startYear}`} />)
          ) : (
            <p className="muted">Nothing in the catalog from {year} yet.</p>
          )}
        </div>
      </section>

      <section className="shelf">
        <h2>Childhood timeline</h2>
        <form
          className="row-gap"
          onSubmit={(e) => {
            e.preventDefault()
            const y = Number(birthInput)
            actions.setPrefs({ birthYear: y >= 1940 && y <= 2015 ? y : null })
          }}
        >
          <label className="select">
            <span>Year you were born</span>
            <input type="number" min={1940} max={2015} value={birthInput} onChange={(e) => setBirthInput(e.target.value)} inputMode="numeric" />
          </label>
          <button className="btn btn-primary" type="submit">
            Build my timeline
          </button>
          <span className="fine">Stays on this device.</span>
        </form>
        {birth &&
          STAGES.map((st) => {
            const shows = showsForAges(birth, st.ages, st.audiences)
            return (
              <div key={st.label} className="timeline-stage">
                <h3 className="h3">
                  {st.label} <span className="muted">({birth + st.ages[0]}–{birth + st.ages[1]})</span>
                </h3>
                <div className="shelf-row">
                  {shows.length ? shows.map((s) => <ShowTile key={s.id} show={s} />) : <p className="muted">No catalog shows for these years yet.</p>}
                </div>
              </div>
            )
          })}
      </section>

      <Shelf title="Forgotten favorites">
        {forgotten.map((s) => (
          <ShowTile key={s.id} show={s} />
        ))}
      </Shelf>

      <section className="shelf history-card">
        <h2>Where animation began</h2>
        <p>
          Before Saturday mornings there were movie-house shorts. Gertie the Dinosaur (1914) showed audiences a
          cartoon with a personality. Felix the Cat became the first animated star in the 1920s, and Steamboat Willie
          (1928) made synchronized sound the new standard. All three play on channel 060.
        </p>
        <a className="btn btn-primary" href={href('/tune/retro-rewind')}>
          ▶ Tune to 060 Retro Rewind
        </a>
      </section>
    </div>
  )
}
