import { useEffect, type ReactNode } from 'react'
import { DataCredit, PageHeader, ServicePicker } from '../components/ui'
import generated from '../data/media.generated.json'
import { AVAILABILITY_LABEL, allShows, availabilitySource, availabilityOf, getMedia, playableEpisodeCount, playableShowCount, playableEpisodesFor } from '../data/catalog'
import { useRoute } from '../lib/router'
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

function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="settings-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function SettingsPage() {
  const { prefs } = useUserData()
  const { query } = useRoute()
  const section = query.get('section')
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView({ block: 'start' })
  }, [section])
  const youtube = allShows().flatMap((s) => playableEpisodesFor(s.id).map((e) => getMedia(e.mediaId)!).filter((m) => m.kind === 'youtube'))
  const counts = allShows().reduce<Record<string, number>>((m, s) => {
    const a = availabilityOf(s)
    m[a] = (m[a] ?? 0) + 1
    return m
  }, {})

  return (
    <div className="page settings">
      <PageHeader title="Settings" />

      <Section title="My streaming services" id="services">
        <p className="muted">
          Pick the services you have. CableEra puts their “Watch on…” buttons first and marks their shows in the guide.
          Stored on this device only.
        </p>
        <ServicePicker />
        {!availabilitySource && (
          <p className="fine">Streaming availability hasn’t been loaded in this build yet, so no shows are matched to services.</p>
        )}
      </Section>

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
          {playableEpisodeCount()} episodes across {playableShowCount()} series play inside CableEra. Most are
          public-domain films whose file, license tag and URL were checked on Wikimedia Commons.{' '}
          {youtube.length > 0 &&
            `${youtube.length} are official uploads from rights holders’ verified YouTube channels, played with YouTube’s embedded player. `}
          CableEra never hosts copyrighted shows or embeds unofficial uploads.
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
          “Watch on…” links come from a streaming-availability check, dated on each show and refreshed at least every 30
          days. <DataCredit /> Without a checked link, “Find where to watch” opens an unverified JustWatch search.
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
        {youtube.length > 0 && (
          <details>
            <summary>Official YouTube uploads ({youtube.length})</summary>
            <ul className="plain credits">
              {youtube.map((m) => (
                <li key={m.id}>
                  <a href={m.sourcePage} target="_blank" rel="noopener noreferrer">
                    {m.youtubeId}
                  </a>{' '}
                  <span className="muted">{m.attribution}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Section>
    </div>
  )
}
