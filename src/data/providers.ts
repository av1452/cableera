import type { OfferType, Provider, ProviderLink, Show } from '../types'

// Provider adapter layer. Title-specific links (ProviderLink) come only from a
// verification step: the availability job or a person. Until a show has one,
// the UI offers an unverified search instead.

export const PROVIDERS: Provider[] = [
  { id: 'netflix', name: 'Netflix', homepage: 'https://www.netflix.com/', kind: 'subscription', short: 'N', hue: 0, match: /^netflix\b/i, pickable: true },
  { id: 'disney-plus', name: 'Disney+', homepage: 'https://www.disneyplus.com/', kind: 'subscription', short: 'D+', hue: 225, match: /^disney\s*(\+|plus)/i, pickable: true },
  { id: 'hulu', name: 'Hulu', homepage: 'https://www.hulu.com/', kind: 'subscription', short: 'Hulu', hue: 140, match: /^hulu\b/i, pickable: true },
  { id: 'hbo-max', name: 'HBO Max', homepage: 'https://www.hbomax.com/', kind: 'subscription', short: 'Max', hue: 260, match: /^(hbo\s*)?max$|^hbo max/i, pickable: true },
  { id: 'paramount-plus', name: 'Paramount+', homepage: 'https://www.paramountplus.com/', kind: 'subscription', short: 'P+', hue: 210, match: /^paramount\s*(\+|plus)/i, pickable: true },
  { id: 'peacock', name: 'Peacock', homepage: 'https://www.peacocktv.com/', kind: 'subscription', short: 'Pck', hue: 45, match: /^peacock/i, pickable: true },
  { id: 'prime-video', name: 'Prime Video', homepage: 'https://www.amazon.com/primevideo', kind: 'subscription', short: 'Prime', hue: 195, match: /^(amazon\s*)?prime\s*video|^amazon prime/i, pickable: true },
  { id: 'apple-tv-plus', name: 'Apple TV+', homepage: 'https://tv.apple.com/', kind: 'subscription', short: 'tv+', hue: 0, match: /^apple\s*tv\s*(\+|plus)/i, pickable: true },
  { id: 'tubi', name: 'Tubi', homepage: 'https://tubitv.com/', kind: 'free', short: 'Tubi', hue: 30, match: /^tubi/i, pickable: true, searchUrl: (q) => `https://tubitv.com/search/${encodeURIComponent(q)}` },
  { id: 'pluto-tv', name: 'Pluto TV', homepage: 'https://pluto.tv/', kind: 'free', short: 'Pluto', hue: 50, match: /^pluto/i, pickable: true },
  { id: 'roku-channel', name: 'The Roku Channel', homepage: 'https://therokuchannel.roku.com/', kind: 'free', short: 'Roku', hue: 280, match: /roku channel/i, pickable: true },
  { id: 'pbs-kids', name: 'PBS Kids', homepage: 'https://pbskids.org/', kind: 'free', short: 'PBS', hue: 150, match: /^pbs/i, pickable: true },
  { id: 'youtube', name: 'YouTube', homepage: 'https://www.youtube.com/', kind: 'free', short: 'YT', hue: 0, match: /^youtube$/i },
  { id: 'wikimedia-commons', name: 'Wikimedia Commons', homepage: 'https://commons.wikimedia.org/', kind: 'archive' },
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

export const pickableProviders = () => PROVIDERS.filter((p) => p.pickable)

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Maps a service name from availability data to a known provider id, or a stable slug. */
export function providerIdForName(name: string): string {
  return PROVIDERS.find((p) => p.match?.test(name.trim()))?.id ?? slug(name)
}

/** Unverified "find where to watch" search for a show. */
export function whereToWatchSearch(show: Show): { provider: Provider; url: string } {
  const provider = byId.get('justwatch')!
  return { provider, url: provider.searchUrl!(show.title) }
}

export const OFFER_LABEL: Record<OfferType, string> = {
  sub: 'Subscription',
  free: 'Free',
  tve: 'With TV provider login',
  buy: 'Buy',
  rent: 'Rent',
}

export interface Offers {
  /** Subscription offers on services the viewer has, then free offers. */
  yours: ProviderLink[]
  free: ProviderLink[]
  subscription: ProviderLink[]
  buyRent: ProviderLink[]
  lastChecked: string | null
}

/** Groups a show's verified links for display, putting the viewer's services first. */
export function groupOffers(show: Show, services: string[]): Offers {
  const links = show.providerLinks.filter((l) => l.verified)
  const yours = links.filter((l) => (l.type === 'sub' || l.type === 'free') && services.includes(l.providerId))
  const isYours = (l: ProviderLink) => yours.includes(l)
  // Well-known streaming services first; cable on-demand and niche services after.
  const rank = (l: ProviderLink) => (getProvider(l.providerId)?.pickable ? 0 : 1)
  const dedupe = (list: ProviderLink[]) =>
    list.filter((l, i) => list.findIndex((x) => x.providerId === l.providerId) === i).sort((a, b) => rank(a) - rank(b))
  return {
    yours: dedupe(yours),
    free: dedupe(links.filter((l) => l.type === 'free' && !isYours(l))),
    subscription: dedupe(links.filter((l) => l.type === 'sub' && !isYours(l))),
    buyRent: dedupe(links.filter((l) => l.type === 'buy' || l.type === 'rent')),
    lastChecked: links.map((l) => l.lastChecked).filter(Boolean).sort().at(-1) ?? null,
  }
}

export const onMyServices = (show: Show, services: string[]) =>
  services.length > 0 && show.providerLinks.some((l) => l.verified && (l.type === 'sub' || l.type === 'free') && services.includes(l.providerId))
