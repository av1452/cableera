import { expect, test } from './helpers'

test.describe('library, favorites and settings', () => {
  test('search and the playable filter', async ({ page }) => {
    await page.goto('#/library')
    await page.getByPlaceholder(/Search shows/).fill('felix')
    await expect(page.locator('.tile-grid .tile')).toHaveCount(1)
    await page.getByPlaceholder(/Search shows/).fill('')
    await page.getByRole('button', { name: /Plays in CableEra/ }).click()
    expect(await page.locator('.tile-grid .tile').count()).toBeGreaterThanOrEqual(9)
  })

  test('artwork falls back to a title card when images fail', async ({ page }) => {
    await page.goto('#/show/felix-the-cat')
    await expect(page.locator('.show-art .title-card')).toBeVisible()
  })

  test('favorites and streaming services persist across reloads', async ({ page }) => {
    await page.goto('#/show/felix-the-cat')
    await page.getByRole('button', { name: 'Add to favorites' }).click()
    await page.goto('#/settings')
    await page.locator('.service-chip', { hasText: 'Paramount+' }).click()
    await page.reload()
    await expect(page.locator('.service-chip.is-on')).toHaveText(/Paramount\+/)
    await page.goto('#/show/felix-the-cat')
    await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible()
  })

  test('copyrighted shows have no Play button', async ({ page }) => {
    await page.goto('#/show/adventure-time')
    await expect(page.getByRole('link', { name: /▶ Play/ })).toHaveCount(0)
  })
})
