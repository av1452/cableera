import { Artwork, Chip, Empty, PageHeader, ServicePicker, Shelf, ShowTile } from '../components/ui'
import { getChannel } from '../data/channels'
import { ERAS, getEpisode, getShow } from '../data/catalog'
import { href } from '../lib/router'
import { actions, useUserData } from '../lib/store'
import { fmtRuntime } from '../lib/time'

export function MyTvPage() {
  const { progress, favoriteShows, favoriteChannels, savedShows, history, recentChannels, prefs } = useUserData()
  const continueWatching = Object.values(progress)
    .filter((p) => !p.completed && p.positionSec > 10)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const shows = (ids: string[]) => ids.map(getShow).filter((s) => s !== undefined)
  const toggleEra = (id: (typeof ERAS)[number]['id']) =>
    actions.setPrefs({
      preferredEras: prefs.preferredEras.includes(id) ? prefs.preferredEras.filter((e) => e !== id) : [...prefs.preferredEras, id],
    })

  return (
    <div className="page">
      <PageHeader title="My TV" sub="Saved on this device only. Nothing is uploaded." />

      {continueWatching.length > 0 ? (
        <Shelf title="Continue watching">
          {continueWatching.map((p) => {
            const ep = getEpisode(p.episodeId)
            const show = ep && getShow(ep.showId)
            if (!ep || !show) return null
            return (
              <a key={p.episodeId} className="tile" href={href(`/watch/${ep.id}`)}>
                <Artwork show={show} />
                <div className="tile-body">
                  <span className="tile-title">{ep.title}</span>
                  <span className="tile-meta">
                    {show.title} · {fmtRuntime(p.durationSec - p.positionSec)} left
                  </span>
                  <span className="progress thin">
                    <span style={{ width: `${(p.positionSec / p.durationSec) * 100}%` }} />
                  </span>
                </div>
              </a>
            )
          })}
        </Shelf>
      ) : (
        <Empty title="Nothing in progress">Episodes you start in CableEra will wait for you here.</Empty>
      )}

      <Shelf title="Favorite shows">
        {favoriteShows.length ? shows(favoriteShows).map((s) => <ShowTile key={s.id} show={s} />) : <p className="muted">Tap ☆ on any show to add it.</p>}
      </Shelf>

      <Shelf title="Saved shows">
        {savedShows.length ? shows(savedShows).map((s) => <ShowTile key={s.id} show={s} />) : <p className="muted">Use + Save on a show page to keep it here.</p>}
      </Shelf>

      <section className="shelf">
        <h2>Channels</h2>
        <div className="two-col">
          <div>
            <h3 className="h3">Favorites</h3>
            {favoriteChannels.length ? (
              <ul className="plain">
                {favoriteChannels.map((id) => {
                  const ch = getChannel(id)
                  return ch && <li key={id}><a href={href(`/tune/${id}`)}><span className="ch-num">{ch.number}</span> {ch.name}</a></li>
                })}
              </ul>
            ) : (
              <p className="muted">Star channels in the guide.</p>
            )}
          </div>
          <div>
            <h3 className="h3">Recently tuned</h3>
            {recentChannels.length ? (
              <ul className="plain">
                {recentChannels.map((id) => {
                  const ch = getChannel(id)
                  return ch && <li key={id}><a href={href(`/tune/${id}`)}><span className="ch-num">{ch.number}</span> {ch.name}</a></li>
                })}
              </ul>
            ) : (
              <p className="muted">No channels tuned yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="shelf">
        <h2>My streaming services</h2>
        <p className="muted">Shows on these services get a “Watch on…” button and a badge in the guide.</p>
        <ServicePicker />
      </section>

      <section className="shelf">
        <h2>Preferred eras</h2>
        <p className="muted">Recommendations on Home lean toward these.</p>
        <div className="chip-row">
          {ERAS.map((e) => (
            <Chip key={e.id} on={prefs.preferredEras.includes(e.id)} onClick={() => toggleEra(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>Watch history</h2>
          {history.length > 0 && (
            <button className="btn btn-small btn-ghost" onClick={() => confirm('Clear watch history and progress?') && actions.clearHistory()}>
              Clear
            </button>
          )}
        </header>
        {history.length ? (
          <ol className="history">
            {history.slice(0, 40).map((h) => {
              const show = getShow(h.showId)
              const ep = h.episodeId ? getEpisode(h.episodeId) : undefined
              const ch = h.channelId ? getChannel(h.channelId) : undefined
              return (
                <li key={`${h.at}-${h.showId}`}>
                  <span className="muted">{new Date(h.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <a href={href(ep?.mediaId ? `/watch/${ep.id}` : `/show/${h.showId}`)}>
                    {show?.title}
                    {ep && ` · ${ep.title}`}
                  </a>
                  {ch && <span className="muted">on {ch.number} {ch.name}</span>}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="muted">Your history is empty.</p>
        )}
      </section>
      <p className="fine">
        Viewing preferences live in <a href={href('/settings')}>Settings</a>.
      </p>
    </div>
  )
}
