import { expect, seedUser, test } from './helpers'

test.describe('player', () => {
  test('plays a 4:3 source in a 4:3 frame without stretching, and saves progress', async ({ page }) => {
    await page.goto('#/watch/felix-saves-the-day')
    const video = page.locator('.stage video')
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 }).toBeGreaterThan(1)
    const frame = await page.locator('.stage .player').boundingBox()
    expect(frame!.width / frame!.height).toBeCloseTo(4 / 3, 1)
    expect(await video.evaluate((v) => getComputedStyle(v).objectFit)).toBe('contain')
    await video.evaluate((v: HTMLVideoElement) => v.pause())
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cableera:user:v1') ?? '{}').progress?.['felix-saves-the-day']?.positionSec ?? 0))
      .toBeGreaterThan(0.5)
  })

  test('offers to resume a partly watched episode', async ({ page }) => {
    await seedUser(page, { version: 1, progress: { 'felix-saves-the-day': { episodeId: 'felix-saves-the-day', positionSec: 120, durationSec: 402, updatedAt: Date.now(), completed: false } }, prefs: {} })
    await page.goto('#/watch/felix-saves-the-day')
    await expect(page.getByText('Resumed where you left off')).toBeVisible()
    await page.goto('#/')
    await expect(page.locator('.shelf', { hasText: 'Continue watching' }).locator('.tile')).toHaveCount(1)
  })

  test('shows a clear error with Retry when the media fails', async ({ page }) => {
    await page.route(/upload\.wikimedia\.org/, (route) => route.fulfill({ status: 429, body: 'Too Many Requests' }))
    await page.goto('#/watch/felix-in-hollywood')
    await expect(page.locator('.player-error')).toContainText('Can’t play this program')
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  })

  test('leaving a YouTube episode before its player is ready does not crash', async ({ page }) => {
    // A stand-in for YouTube's IFrame API whose player never fires onReady,
    // so it has none of its methods yet (the real API behaves this way while loading).
    await page.route('https://www.youtube.com/iframe_api', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: 'window.YT = { Player: function () {} }; window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady()',
      }),
    )
    await page.goto('#/watch/pokemon-yt-Zyt2GKb6qWw')
    await page.waitForTimeout(300)
    await page.goto('#/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('live tuning: number keys change channel', async ({ page }) => {
    await page.goto('#/tune/era-classics')
    await page.locator('body').click({ position: { x: 5, y: 300 } })
    await page.keyboard.type('060')
    await expect(page).toHaveURL(/#\/tune\/retro-rewind/)
    await page.keyboard.press('PageUp')
    await expect(page).toHaveURL(/#\/tune\/movie-night/)
  })
})
