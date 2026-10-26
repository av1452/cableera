import { test as base, expect, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const FIXTURE = fileURLToPath(new URL('./fixtures/test-4x3.webm', import.meta.url))

/**
 * Test fixture: blocks third-party media so tests are deterministic, serves a
 * small local 4:3 WebM for Wikimedia video, skips the power-on animation, and
 * collects page errors (asserted empty after each test).
 */
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => sessionStorage.setItem('cableera:booted', '1'))
    await page.route(/upload\.wikimedia\.org\/.*\.(webm|ogv)/, (route) => route.fulfill({ path: FIXTURE, contentType: 'video/webm' }))
    await page.route(/(thumb\.wikimedia\.org|i\.ytimg\.com)/, (route) => route.abort())
    await page.route(/(youtube\.com|youtube-nocookie\.com|googlevideo\.com)/, (route) => route.abort())
    await use(errors)
    expect(errors, 'page errors').toEqual([])
  }, { auto: true }],
})

export { expect }

export async function seedUser(page: Page, data: object) {
  await page.addInitScript((d) => localStorage.setItem('cableera:user:v1', JSON.stringify(d)), data)
}
