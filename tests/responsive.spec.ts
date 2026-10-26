import { expect, test } from './helpers'

for (const path of ['', 'guide', 'library', 'show/beverly-hillbillies', 'settings']) {
  test(`no horizontal overflow: /${path || 'home'}`, async ({ page }) => {
    await page.goto(`#/${path}`)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('phone: tab bar sits at the bottom of the screen', async ({ page }) => {
  await page.goto('#/guide')
  const nav = await page.locator('.nav').boundingBox()
  const vh = page.viewportSize()!.height
  expect(nav!.y + nav!.height).toBeGreaterThan(vh - 4)
})
