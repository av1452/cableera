#!/usr/bin/env node
// Builds src/data/media.generated.json from scripts/commons-sources.json.
//
// For every listed Wikimedia Commons file it records the real media URL, MIME
// type, dimensions, duration and license tag reported by the Commons API, then
// sends an HTTP request to the chosen URL to confirm it is reachable. Files whose
// license tag is not a public-domain tag, or whose URL fails, are written with
// `verified: false` so the app never shows a Play button for them.
//
// Usage: node scripts/fetch-commons-media.mjs

import { readFile, writeFile } from 'node:fs/promises'

const UA = 'CableEra-catalog-builder/0.1 (https://github.com/av1452) node-fetch'
const API = 'https://commons.wikimedia.org/w/api.php'
const root = new URL('..', import.meta.url)
const sources = JSON.parse(await readFile(new URL('scripts/commons-sources.json', root), 'utf8'))

const stripHtml = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    await sleep(2000 * (attempt + 1))
  }
  throw new Error(`Commons API failed: ${url}`)
}

async function reachable(url) {
  // Range request: confirms the file exists and supports partial content
  // (needed for seeking) without downloading the video.
  // Wikimedia rate-limits bursts with 429, so back off and retry rather than
  // recording a rate limit as a broken file.
  let status = 0
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=0-1023' } })
      await res.body?.cancel()
      status = res.status
      if (status !== 429) return { ok: status === 206 || status === 200, status, ranges: status === 206 }
    } catch {
      status = 0
    }
    await sleep(5000 * (attempt + 1))
  }
  return { ok: false, status, ranges: false }
}

const PD_TAG = /public domain|^pd\b|^cc0/i
const info = new Map()
for (let i = 0; i < sources.length; i += 10) {
  const chunk = sources.slice(i, i + 10)
  const data = await api({
    action: 'query',
    titles: chunk.map((s) => s.file).join('|'),
    prop: 'imageinfo|videoinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '640',
    viprop: 'derivatives',
  })
  const norm = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]))
  for (const page of data.query.pages) info.set(norm.get(page.title) ?? page.title, page)
  await sleep(500)
}

const checkedAt = new Date().toISOString()
const out = []
for (const src of sources) {
  const page = info.get(src.file)
  if (!page || page.missing) {
    console.warn(`MISSING  ${src.file}`)
    out.push({ ...src, verified: false, problem: 'File not found on Commons', checkedAt })
    continue
  }
  const ii = page.imageinfo[0]
  const em = ii.extmetadata ?? {}
  const meta = (k) => stripHtml(em[k]?.value)
  const ders = page.videoinfo?.[0]?.derivatives ?? []
  // Prefer a 480p VP9 transcode: much smaller than most originals, still sharp for 4:3 SD footage.
  const pick = ['480p.vp9.webm', '360p.vp9.webm', '480p.webm', '360p.webm']
    .map((suffix) => ders.find((d) => d.src.endsWith(suffix)))
    .find(Boolean)
  const url = pick?.src ?? ii.url
  const mime = pick ? 'video/webm' : ii.mime
  const license = meta('LicenseShortName')
  const check = await reachable(url)
  await sleep(1500)
  const problems = []
  if (!PD_TAG.test(license)) problems.push(`License tag "${license}" is not a public-domain tag`)
  if (!check.ok) problems.push(`Media URL returned HTTP ${check.status}`)
  const record = {
    ...src,
    url,
    mime,
    originalUrl: ii.url,
    originalMime: ii.mime,
    width: ii.width,
    height: ii.height,
    durationSec: Math.round(ii.duration ?? 0),
    thumbnail: ii.thumburl ?? null,
    sourcePage: ii.descriptionurl,
    license,
    licenseDetail: meta('UsageTerms') || meta('LicenseShortName'),
    artist: meta('Artist').slice(0, 200),
    credit: meta('Credit').slice(0, 200),
    rangeRequests: check.ranges,
    verified: problems.length === 0 && (ii.duration ?? 0) > 0,
    problem: problems.join('; ') || undefined,
    checkedAt,
  }
  console.log(`${record.verified ? 'OK ' : 'BAD'}  ${String(record.durationSec).padStart(5)}s  ${ii.width}x${ii.height}  ${license.padEnd(22)}  ${src.title}`)
  out.push(record)
}

await writeFile(new URL('src/data/media.generated.json', root), JSON.stringify(out, null, 1) + '\n')
console.log(`\n${out.filter((r) => r.verified).length}/${out.length} verified -> src/data/media.generated.json`)
