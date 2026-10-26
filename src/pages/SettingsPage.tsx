import type { ReactNode } from 'react'
import { PageHeader } from '../components/ui'
import generated from '../data/media.generated.json'
import { AVAILABILITY_LABEL, allShows, availabilityOf, playableEpisodeCount, playableShowCount } from '../data/catalog'
import { actions, useUserData } from '../lib/store'
import type { Availability, UserPreferences } from '../types'

function Radio<K extends keyof UserPreferences>({ name, value, options }: { name: K; value: UserPreferences[K]; options: [UserPreferences[K], string][] }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map(([v, label]) => (
        <label key={String(v)} className={v === value ? 'is-on' : ''}>
          <input type="radio" name={name} checked={v === value} onChange={() => actions.setPrefs({ [name]: v } as Partial<UserPreferences>)} />
          {label}
        </label>
      ))}
    </div>
  )
}

function Toggle({ name, label, hint }: { name: keyof UserPreferences; label: string; hint?: string }) {
  const { prefs } = useUserData()
  const on = prefs[name] as boolean
  return (
    <label className="toggle">
      <span>
        {label}
        {hint && <span className="fine">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={() => actions.setPrefs({ [name]: !on })} />
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function SettingsPage() {
  const { prefs } = useUserData()
  const counts = allShows().reduce<Record<string, number>>((m, s) => {
    const a = availabilityOf(s)
    m[a] = (m[a] ?? 0) + 1
    return m
  }, {})

  return (
    <div className="page settings">
      <PageHeader title="Settings" />

      <Section title="Appearance">
        <Radio name="theme" value={prefs.theme} options={[['classic', 'Classic blue'], ['midnight', 'Midnight'], ['contrast', 'High contrast']]} />
        <Toggle name="scanlines" label="CRT scanlines on video" hint="A subtle tube-TV texture over the picture." />
        <Toggle name="bootEffect" label="Power-on effect" hint="Plays once per visit. Skipped when reduced motion is on." />
        <h3 className="h3">Motion</h3>
        <Radio name="motion" value={prefs.motion} options={[['system', 'Follow system'], ['reduced', 'Reduce motion']]} />
      </Section>

      <Section title="Guide">
        <h3 className="h3">Density</h3>
        <Radio name="guideDensity" value={prefs.guideDensity} options={[['comfortable', 'Comfortable'], ['compact', 'Compact (more time on screen)']]} />
        <Toggle name="guidePreviews" label="Live preview window" hint="Plays the selected channel muted in the guide. Uses data." />
        <h3 className="h3">Open CableEra to</h3>
        <Radio name="landing" value={prefs.landing} options={[['home', 'Home'], ['guide', 'TV Guide']]} />
      </Section>

      <Section title="Playback">
        <Toggle name="autoplayNext" label="Autoplay next episode" hint="Counts down before playing. Sound never starts on its own when the app opens." />
        <Toggle name="captions" label="Show captions when available" />
      </Section>

      <Section title="Storage & history">
        <p className="muted">Favorites, progress and history are stored in this browser only.</p>
        <div className="row-gap">
          <button className="btn btn-ghost" onClick={() => confirm('Clear watch history, progress and recent channels?') && actions.clearHistory()}>
            Clear history & progress
          </button>
          <button className="btn btn-danger" onClick={() => confirm('Reset all CableEra data on this device?') && actions.resetAll()}>
            Reset everything
          </button>
        </div>
      </Section>

      <Section title="Content availability">
        <p>
          {playableEpisodeCount()} episodes across {playableShowCount()} series play inside CableEra. Each is a
          public-domain film whose file, license tag and URL were checked on Wikimedia Commons. Everything else in the
          catalog is a listing: CableEra shows metadata and never hosts or embeds copyrighted shows.
        </p>
        <ul className="plain availability-legend">
          {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((a) => (
            <li key={a}>
              <span className={`badge badge-${a}`}>
                <span className="badge-dot" />
                {AVAILABILITY_LABEL[a]}
              </span>{' '}
              {counts[a] ?? 0} titles
            </li>
          ))}
        </ul>
        <p className="fine">
          “Find where to watch” opens an unverified JustWatch search. A provider is only listed as a source once it has
          been confirmed.
        </p>
      </Section>

      <Section title="About CableEra">
        <p>
          CableEra is a nostalgic, cable-guide-style TV prototype. Channel names and schedules are fictional and simulated,
          and not affiliated with or endorsed by any network, studio or streaming service. Show titles and character
          names belong to their respective owners.
        </p>
        <details>
          <summary>Media attribution ({(generated as unknown[]).length} files)</summary>
          <ul className="plain credits">
            {(generated as { id: string; title: string; year: number; license?: string; artist?: string; sourcePage?: string }[]).map((g) => (
              <li key={g.id}>
                <a href={g.sourcePage} target="_blank" rel="noopener noreferrer">
                  {g.title} ({g.year})
                </a>{' '}
                <span className="muted">
                  {g.artist ? `${g.artist}, ` : ''}
                  {g.license}, Wikimedia Commons
                </span>
              </li>
            ))}
          </ul>
        </details>
      </Section>
    </div>
  )
}
