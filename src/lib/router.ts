import { useSyncExternalStore } from 'react'

// Minimal hash router: works on static hosts like GitHub Pages with no rewrites.

function subscribe(l: () => void) {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}

const getHash = () => window.location.hash.replace(/^#/, '') || '/'

export interface Route {
  path: string[]
  query: URLSearchParams
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash)
  const [p, q = ''] = hash.split('?')
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) }
}

export const href = (path: string) => `#${path}`

export function navigate(path: string, replace = false) {
  if (replace) window.location.replace(href(path))
  else window.location.hash = path
}
