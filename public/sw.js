// CableEra service worker: caches the app shell so the guide opens offline.
// Video is never cached (it streams from Wikimedia with range requests).
const CACHE = 'cableera-shell-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin || req.headers.has('range')) return
  // Network first for navigations (fresh deploys), cache fallback offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }
  // Stale-while-revalidate for hashed build assets and icons.
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      const net = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => hit)
      return hit || net
    }),
  )
})
