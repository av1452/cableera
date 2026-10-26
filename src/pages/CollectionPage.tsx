import { Empty, PageHeader, ShowTile } from '../components/ui'
import { getCollection } from '../data/channels'
import { availabilityOf, getShow, playableEpisodesFor } from '../data/catalog'
import { href } from '../lib/router'

export function CollectionPage({ id }: { id: string }) {
  const c = getCollection(id)
  if (!c) {
    return (
      <Empty title="Collection not found">
        <a href={href('/discover')}>Back to Discover</a>
      </Empty>
    )
  }
  const shows = c.showIds.map(getShow).filter((s) => s !== undefined)
  const queue = c.showIds.flatMap((sid) => playableEpisodesFor(sid))
  const playable = shows.filter((s) => availabilityOf(s) === 'playable')
  const listing = shows.filter((s) => availabilityOf(s) !== 'playable')

  return (
    <div className="page">
      <PageHeader title={c.title} sub={c.description}>
        {queue.length > 0 ? (
          <a className="btn btn-primary btn-large" href={href(`/watch/${queue[0].id}?queue=${c.id}`)}>
            ▶ Start marathon ({queue.length} episodes)
          </a>
        ) : (
          <span className="badge badge-unavailable">No episodes play in CableEra yet</span>
        )}
      </PageHeader>
      <p className="fine">
        An editorial collection. Being listed here doesn’t mean a show is available to stream.
      </p>
      {playable.length > 0 && (
        <section className="shelf">
          <h2>Plays in CableEra</h2>
          <div className="tile-grid">
            {playable.map((s) => (
              <ShowTile key={s.id} show={s} />
            ))}
          </div>
        </section>
      )}
      {listing.length > 0 && (
        <section className="shelf">
          <h2>Also in this block (listings)</h2>
          <div className="tile-grid">
            {listing.map((s) => (
              <ShowTile key={s.id} show={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
