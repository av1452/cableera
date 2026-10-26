#!/usr/bin/env node
// Refreshes US streaming availability for catalog shows from the Watchmode API
// and writes src/data/availability.generated.json.
//
// The output is NOT committed: Watchmode's terms forbid sharing its data with
// third parties and cap free-plan caching at 30 days. CI fetches it at build
// time, keeps it between runs in the Actions cache, and bundles it into the site.
//
// Usage: WATCHMODE_API_KEY=... node scripts/fetch-availability.mjs
//   WATCHMODE_MAX_REQUESTS  credit budget for this run (default 300)
//   WATCHMODE_BASE_URL      API base (default https://api.watchmode.com/v1), for testing
//
// Each run spends its budget on shows that have never been checked first, then
// on the stalest ones, so a small free quota still keeps every show current.

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const OUT = new URL('src/data/availability.generated.json', root)
const OVERRIDES = new URL('scripts/watchmode-overrides.json', root)
const KEY = process.env.WATCHMODE_API_KEY
const BASE = process.env.WATCHMODE_BASE_URL ?? 'https://api.watchmode.com/v1'
const BUDGET = Number(process.env.WATCHMODE_MAX_REQUESTS ?? 300)
const MAX_AGE_MS = 30 * 24 * 3600 * 1000 // free-plan cache limit
const REFRESH_AFTER_MS = 6 * 24 * 3600 * 1000

if (!KEY) {
  console.log('WATCHMODE_API_KEY not set: skipping availability refresh (existing data, if any, is kept).')
  process.exit(0)
}

const { SHOWS } = await import('../src/data/shows.ts')
const overrides = JSON.parse(await readFile(OVERRIDES, 'utf8'))
const now = Date.now()

let data = { source: 'Watchmode', sourceUrl: 'https://www.watchmode.com/', region: 'US', generatedAt: null, titles: {} }
if (existsSync(OUT)) data = { ...data, ...JSON.parse(await readFile(OUT, 'utf8')) }

// Drop anything older than the cache limit, and shows no longer in the catalog.
const ids = new Set(SHOWS.map((s) => s.id))
for (const [id, t] of Object.entries(data.titles)) {
  if (!ids.has(id) || now - Date.parse(t.checkedAt) > MAX_AGE_MS) delete data.titles[id]
}

let used = 0
let quota = null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path, params = {}) {
  if (used >= BUDGET) throw new BudgetError()
  const url = `${BASE}${path}?${new URLSearchParams(params)}`
  for (let attempt = 0; attempt < 4; attempt++) {
    used++
    const res = await fetch(url, { headers: { 'X-API-Key': KEY, Accept: 'application/json' } })
    const q = res.headers.get('x-account-quota')
    const qu = res.headers.get('x-account-quota-used')
    if (q) quota = `${qu}/${q}`
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1))
      continue
    }
    if (res.status === 401 || res.status === 403) throw new Error(`Watchmode rejected the API key (HTTP ${res.status}).`)
    if (!res.ok) throw new Error(`Watchmode ${path} failed: HTTP ${res.status}`)
    await sleep(250)
    return res.json()
  }
  throw new Error(`Watchmode ${path}: still rate-limited after retries`)
}

class BudgetError extends Error {}

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '')

// Catalog titles carry disambiguators like "ThunderCats (2011)" or "The Office (US)";
// search on the bare name and let the year pick the right series.
const bareTitle = (t) =>
  t
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')

function pickMatch(show, results) {
  const wantMovie = show.genres.includes('movie')
  const types = wantMovie ? ['tv_movie', 'tv_special', 'movie'] : ['tv_series', 'tv_miniseries', 'tv_special']
  const candidates = results.filter((r) => types.includes(r.type))
  const title = bareTitle(show.title)
  const sameName = candidates.filter((r) => norm(r.name) === norm(title))
  // Year must agree within a year; titles get reused (e.g. ThunderCats 1985 vs 2011).
  const byYear = (list) => list.find((r) => r.year != null && Math.abs(r.year - show.startYear) <= 1)
  return byYear(sameName) ?? byYear(candidates.filter((r) => norm(r.name).includes(norm(title)))) ?? null
}

const queue = SHOWS.filter((s) => {
  const t = data.titles[s.id]
  // A new or changed manual override takes effect on the next run.
  const overrideChanged = s.id in overrides && t && t.watchmodeId !== overrides[s.id]
  return !t || overrideChanged || now - Date.parse(t.checkedAt) > REFRESH_AFTER_MS
}).sort((a, b) => Date.parse(data.titles[a.id]?.checkedAt ?? 0) - Date.parse(data.titles[b.id]?.checkedAt ?? 0))

let refreshed = 0
let unmatched = []
try {
  for (const show of queue) {
    const prev = data.titles[show.id]
    let watchmodeId = show.id in overrides ? overrides[show.id] : prev?.watchmodeId
    let matched = prev?.matched ?? null
    if (watchmodeId === undefined) {
      // No `types` filter: it drops tv_movie/tv_special results; pickMatch filters by type.
      const res = await api('/search/', { search_field: 'name', search_value: bareTitle(show.title) })
      const hit = pickMatch(show, res.title_results ?? [])
      watchmodeId = hit?.id ?? null
      matched = hit ? { name: hit.name, year: hit.year, type: hit.type } : null
    }
    const checkedAt = new Date().toISOString()
    if (watchmodeId === null) {
      if (!(show.id in overrides)) unmatched.push(`${show.title} (${show.startYear})`)
      data.titles[show.id] = { watchmodeId: null, matched: null, checkedAt, offers: [] }
      continue
    }
    const sources = await api(`/title/${watchmodeId}/sources/`, { regions: 'US' })
    const offers = sources
      .filter((s) => (s.region ?? 'US') === 'US' && (s.web_url || s.ios_url || s.android_url))
      .map((s) => ({
        name: s.name,
        type: s.type,
        webUrl: s.web_url,
        ...(s.web_url ? {} : { iosUrl: s.ios_url, androidUrl: s.android_url }),
        seasons: s.seasons ?? null,
      }))
    data.titles[show.id] = { watchmodeId, matched, checkedAt, offers }
    refreshed++
  }
} catch (err) {
  if (err instanceof BudgetError) console.log(`Request budget of ${BUDGET} reached; remaining shows refresh next run.`)
  // An API problem shouldn't block a deploy: keep what we have and flag it in CI.
  else console.log(`::warning title=Streaming availability not refreshed::${err.message}`)
}

data.generatedAt = new Date().toISOString()
await writeFile(OUT, JSON.stringify(data, null, 1) + '\n')

const titles = Object.values(data.titles)
const withOffers = titles.filter((t) => t.offers.length).length
console.log(`Refreshed ${refreshed} shows using ${used} requests${quota ? ` (account quota used: ${quota})` : ''}.`)
console.log(`${withOffers}/${SHOWS.length} shows have US offers; ${SHOWS.length - titles.length} not yet checked.`)
if (unmatched.length) {
  console.log(`No confident Watchmode match (add an id to scripts/watchmode-overrides.json if one exists):\n  ${unmatched.join('\n  ')}`)
}
