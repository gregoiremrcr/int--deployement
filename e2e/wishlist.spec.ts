import { expect, test } from '@playwright/test'

test.beforeEach(async ({ request }) => {
  const response = await request.delete('http://127.0.0.1:8787/wishlist/900025')
  expect([204, 404]).toContain(response.status())
})

test.afterEach(async ({ request }) => {
  await request.delete('http://127.0.0.1:8787/wishlist/900025')
})

test('search and add a Pokemon through the Hono API', async ({ page }) => {
  await page.route('**/api/v2/pokemon/pikachu', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 900025,
        name: 'pikachu',
        sprites: { front_default: 'https://example.com/pikachu.png' },
        types: [{ type: { name: 'electric' } }],
      }),
    }),
  )

  await page.goto('/')
  await expect(page.locator('.wishlist-section')).toBeVisible()
  const searchInput = page.locator('#pokemon-search')
  await expect(searchInput).toBeEditable()
  await searchInput.fill('pikachu')
  await expect(searchInput).toHaveValue('pikachu')
  await page.getByRole('button', { name: 'Rechercher' }).click()
  await expect(page.locator('.search-result h2')).toHaveText('Pikachu')

  await page.locator('.primary-action').click()
  await expect(
    page.locator('.pokemon-card').filter({ hasText: 'Pikachu' }).locator('h3'),
  ).toHaveText('Pikachu')

  await page.reload()
  await expect(
    page.locator('.pokemon-card').filter({ hasText: 'Pikachu' }).locator('h3'),
  ).toHaveText('Pikachu')
})
