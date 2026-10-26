#!/usr/bin/env node
// Builds src/data/youtube.generated.json: official full-episode uploads that
// CableEra may play through YouTube's embedded player.
//
// Safety rules:
// - Only channels in scripts/youtube-channels.json (verified rights holders) count.
// - Every video is checked through YouTube's oEmbed endpoint, which fails for
//   removed, private or embed-disabled videos, and reports the uploader. Videos
//   whose uploader isn't on the allowlist are rejected.
// - With YOUTUBE_API_KEY (YouTube Data API v3, free), the script also lists
//   each channel's uploads to discover episodes matching the channel's rules,
//   and checks duration, embeddability and US region restrictions.
//   Without a key, only scripts/youtube-sources.json is checked and durations
//   come from that file.
//
// The output is not committed (YouTube API data must be refreshed within 30
// days); CI regenerates it before each build.
//
// Usage: [YOUTUBE_API_KEY=...] node scripts/fetch-youtube-media.mjs

import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const KEY = process.env.YOUTUBE_API_KEY
const MAX_PAGES = Number(process.env.YOUTUBE_MAX_PAGES ?? 40)
const API = 'https://www.googleapis.com/youtube/v3'
const { channels } = JSON.parse(await readFile(new URL('scripts/youtube-channels.json', root), 'utf8'))
const seeds = JSON.parse(await readFile(new URL('scripts/youtube-sources.json', root), 'utf8'))
const allowed = new Map(channels.map((c) => [c.handle.toLowerCase(), c]))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function yt(path, params) {
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key: KEY })}`)
  if (!res.ok) throw new Error(`YouTube Data API ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

const isoSeconds = (d) => {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d ?? '')
  return m ? (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + +(m[4] ?? 0) : 0
}

// Strip "[FULL EPISODE]", emoji and "| Series Episode N" suffixes from an upload title.
const cleanTitle = (t) =>
  t
    .split(/\s*[[|]/)[0]
    .replace(/[\p{Extended_Pictographic}️]/gu, '')
    .trim()

/** @type {Map<string, any>} videoId -> candidate */
const candidates = new Map()
for (const s of seeds) candidates.set(s.videoId, { ...s, origin: 'curated' })

if (KEY) {
  for (const ch of channels) {
    const info = await yt('channels', { part: 'contentDetails,snippet', forHandle: ch.handle.replace(/^@/, '') })
    const channel = info.items?.[0]
    if (!channel) {
      console.warn(`Channel ${ch.handle} not found; skipping discovery`)
      continue
    }
    if (ch.channelId && channel.id !== ch.channelId) {
      console.warn(`Handle ${ch.handle} now points to ${channel.id}, not the allowlisted ${ch.channelId}; skipping`)
      continue
    }
    const uploads = channel.contentDetails.relatedPlaylists.uploads
    let pageToken
    for (let page = 0; page < MAX_PAGES; page++) {
      const list = await yt('playlistItems', { part: 'snippet', playlistId: uploads, maxResults: '50', ...(pageToken ? { pageToken } : {}) })
      for (const item of list.items ?? []) {
        const title = item.snippet.title
        const videoId = item.snippet.resourceId.videoId
        for (const rule of ch.rules) {
          const m = new RegExp(rule.title, 'iu').exec(title)
          if (!m || candidates.has(videoId)) continue
          candidates.set(videoId, {
            videoId,
            showId: rule.showId,
            season: rule.season,
            episode: Number(m[1]),
            title: cleanTitle(title),
            year: rule.year,
            origin: 'discovered',
          })
        }
      }
      pageToken = list.nextPageToken
      if (!pageToken) break
    }
  }

  // Duration, embeddability and region checks, 50 videos per request.
  const ids = [...candidates.keys()]
  for (let i = 0; i < ids.length; i += 50) {
    const res = await yt('videos', { part: 'contentDetails,status,snippet', id: ids.slice(i, i + 50).join(',') })
    for (const v of res.items ?? []) {
      const c = candidates.get(v.id)
      const rr = v.contentDetails.regionRestriction
      c.apiChannelId = v.snippet.channelId
      c.durationSec = isoSeconds(v.contentDetails.duration) || c.durationSec
      c.apiProblem =
        !v.status.embeddable ? 'Embedding disabled'
        : v.status.privacyStatus !== 'public' ? `Video is ${v.status.privacyStatus}`
        : rr?.blocked?.includes('US') || (rr?.allowed && !rr.allowed.includes('US')) ? 'Blocked in the US'
        : undefined
    }
    for (const id of ids.slice(i, i + 50)) if (!res.items?.some((v) => v.id === id)) candidates.get(id).apiProblem = 'Not returned by the API (removed or private)'
  }
} else {
  console.log('YOUTUBE_API_KEY not set: checking curated videos only (no discovery).')
}

const checkedAt = new Date().toISOString()
const out = []
for (const c of candidates.values()) {
  const problems = []
  let channel = null
  const res = await fetch(`https://www.youtube.com/oembed?${new URLSearchParams({ url: `https://www.youtube.com/watch?v=${c.videoId}`, format: 'json' })}`)
  if (res.status === 401 || res.status === 403) problems.push('Embedding disabled')
  else if (!res.ok) problems.push(`oEmbed HTTP ${res.status} (removed or private)`)
  else {
    const o = await res.json()
    const handle = (o.author_url ?? '').split('/').pop()?.toLowerCase()
    const ch = allowed.get(handle)
    if (!ch) problems.push(`Uploader ${o.author_name} (${o.author_url}) is not an allowlisted official channel`)
    else {
      channel = { name: ch.name, handle: ch.handle, url: `https://www.youtube.com/${ch.handle}` }
      if (c.apiChannelId && ch.channelId && c.apiChannelId !== ch.channelId) problems.push('Channel id mismatch')
    }
  }
  if (c.apiProblem) problems.push(c.apiProblem)
  if (!c.durationSec) problems.push('Unknown duration (add durationSec or set YOUTUBE_API_KEY)')
  const record = {
    id: `${c.showId}-yt-${c.videoId}`,
    videoId: c.videoId,
    showId: c.showId,
    season: c.season,
    episode: c.episode,
    title: c.title,
    year: c.year,
    durationSec: c.durationSec ?? 0,
    channel,
    origin: c.origin,
    verified: problems.length === 0,
    problem: problems.join('; ') || undefined,
    checkedAt,
  }
  console.log(`${record.verified ? 'OK ' : 'BAD'}  ${record.showId} S${record.season}E${record.episode}  ${record.title}${record.problem ? `  (${record.problem})` : ''}`)
  out.push(record)
  await sleep(150)
}

out.sort((a, b) => a.showId.localeCompare(b.showId) || a.season - b.season || a.episode - b.episode)
await writeFile(new URL('src/data/youtube.generated.json', root), JSON.stringify(out, null, 1) + '\n')
console.log(`\n${out.filter((r) => r.verified).length}/${out.length} verified -> src/data/youtube.generated.json`)
