# Contributing to CableEra

Thanks for helping. Suggestions are welcome as issues, especially shows to add and wrong streaming links. Code changes are welcome as pull requests.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
npm test         # Playwright end-to-end tests against the production build
```

The first time you run the tests, install the browser with `npx playwright install chromium`. Tests stub Wikimedia and YouTube, so they don't depend on third-party rate limits.

## The one rule: honest playback

CableEra plays something only when there's a clear right to. Every playable episode must be one of:

- **Public domain in the US,** with evidence: published 1930 or earlier, or a documented non-renewal, as recorded on a source like Wikimedia Commons. Being old or being on an archive site isn't enough.
- **An official upload** from the rights holder's own verified YouTube channel, played with YouTube's embedded player.

Never add fan uploads, rips, or unofficial embeds, and never scrape protected streams. Anything else is a listing: metadata plus checked "Watch on…" links.

## Common changes

### Add a show to the catalog

Add a row to the right era array in `src/data/shows.ts`:

```ts
['rocket-power', 'Rocket Power', 1999, 2004, 'Nickelodeon', 'early-2000s', ['animation', 'adventure'], 'kids', 22, 'One-line description.'],
```

Then add its id to a channel's `showIds` in `src/data/channels.ts` so it appears in the guide. Streaming links are found automatically on the next availability refresh.

### Fix a wrong streaming match

Add the show's Watchmode title id to `scripts/watchmode-overrides.json`, or `null` if the show isn't on Watchmode, with a short note under `_notes`. It takes effect on the next run.

### Add public-domain media

1. Add the Wikimedia Commons file to `scripts/commons-sources.json` with its show, season, episode, title and year.
2. Run `npm run media:refresh`. The script checks the license tag and URL and records duration and dimensions. Anything that fails gets `verified: false` and won't play.
3. Commit the updated `src/data/media.generated.json`.

### Add an official YouTube channel

1. Confirm it's the studio's or network's own verified channel, for example from an announcement on their website.
2. Add it to `scripts/youtube-channels.json` with its handle, channel id, owner, how you confirmed it, and a title rule matching its full-episode uploads.
3. Optionally add specific videos to `scripts/youtube-sources.json`, with `durationSec` if you don't have a YouTube API key.
4. Run `npm run data:youtube` and check every video says `OK`.

## Pull requests

- Keep changes focused, and match the surrounding code style.
- Lint, build and tests must pass. CI runs them on every PR.
- For UI changes, include a screenshot. Check a phone width (about 390px) and a large foldable or tablet width (about 1000px).
