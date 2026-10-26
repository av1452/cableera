import type { Provider, Show } from '../types'

// Provider adapter layer. A ProviderLink on a show is only added once someone
// has confirmed availability; until then the UI offers an unverified search.

export const PROVIDERS: Provider[] = [
  { id: 'disney-plus', name: 'Disney+', homepage: 'https://www.disneyplus.com/', kind: 'subscription' },
  { id: 'hulu', name: 'Hulu', homepage: 'https://www.hulu.com/', kind: 'subscription' },
  { id: 'paramount-plus', name: 'Paramount+', homepage: 'https://www.paramountplus.com/', kind: 'subscription' },
  { id: 'hbo-max', name: 'HBO Max', homepage: 'https://www.hbomax.com/', kind: 'subscription' },
  {
    id: 'tubi',
    name: 'Tubi',
    homepage: 'https://tubitv.com/',
    kind: 'free',
    searchUrl: (q) => `https://tubitv.com/search/${encodeURIComponent(q)}`,
  },
  {
    id: 'wikimedia-commons',
    name: 'Wikimedia Commons',
    homepage: 'https://commons.wikimedia.org/',
    kind: 'archive',
  },
  {
    id: 'justwatch',
    name: 'JustWatch',
    homepage: 'https://www.justwatch.com/us',
    kind: 'search',
    searchUrl: (q) => `https://www.justwatch.com/us/search?q=${encodeURIComponent(q)}`,
  },
]

const byId = new Map(PROVIDERS.map((p) => [p.id, p]))

export function getProvider(id: string): Provider | undefined {
  return byId.get(id)
}

/** Unverified "find where to watch" search for a show. */
export function whereToWatchSearch(show: Show): { provider: Provider; url: string } {
  const provider = byId.get('justwatch')!
  return { provider, url: provider.searchUrl!(show.title) }
}
