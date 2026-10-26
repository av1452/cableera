import { expect, test } from './helpers'

test.describe('TV guide', () => {
  test('renders ten channels of schedule with a now line', async ({ page }) => {
    await page.goto('#/guide')
    await expect(page.locator('.guide-row')).toHaveCount(10)
    expect(await page.locator('.cell').count()).toBeGreaterThan(300)
    await expect(page.locator('.now-line')).toBeVisible()
    await expect(page.getByText('Simulated schedule, not a live broadcast')).toBeVisible()
  })

  test('first click selects, second click on a playable live cell tunes in', async ({ page }) => {
    await page.goto('#/guide?ch=after-school')
    const live = page.locator('.guide-row').first().locator('.cell.is-live')
    await live.click()
    await expect(live).toHaveClass(/is-selected/)
    await expect(page).toHaveURL(/#\/guide/)
    await expect(page.locator('.details a', { hasText: 'Watch live' })).toBeVisible()
    await live.click()
    await expect(page).toHaveURL(/#\/tune\/era-classics/)
  })

  test('arrow keys move the selection between channels', async ({ page }) => {
    await page.goto('#/guide')
    const selected = page.locator('.cell.is-selected')
    const before = await selected.getAttribute('data-id')
    await selected.focus()
    await page.keyboard.press('ArrowDown')
    const after = await page.locator('.cell.is-selected').getAttribute('data-id')
    expect(after).not.toBe(before)
    expect(after).toMatch(/^saturday-morning@/)
  })

  test('listing-only programs never get a Play button', async ({ page }) => {
    await page.goto('#/guide')
    await page.locator('.cell.is-listing.is-live').first().click()
    await expect(page.locator('.details a', { hasText: /^▶ Watch/ })).toHaveCount(0)
    await page.getByRole('button', { name: /Find where to watch/ }).click()
    await expect(page.locator('dialog[open]')).toContainText('hasn’t verified')
  })
})
