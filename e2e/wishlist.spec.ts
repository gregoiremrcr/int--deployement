import { expect, test } from '@playwright/test'

const apiUrl = 'http://127.0.0.1:8787'

test.beforeEach(async ({ request }) => {
  const response = await request.delete(`${apiUrl}/wishlist/900025`)
  expect([204, 404]).toContain(response.status())
})

test.afterEach(async ({ request }) => {
  await request.delete(`${apiUrl}/wishlist/900025`)
})

test('searches, adds and persists a Pokemon through the Hono API', async ({
  page,
}) => {
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

test('changes language and keeps it after a reload', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toContainText('wishlist', {
    ignoreCase: true,
  })
  for (const language of ['fr', 'en', 'zh', 'de', 'it', 'es']) {
    await page.locator('#language-select').selectOption(language)
    await expect(page.locator('#language-select')).toHaveValue(language)
    await expect(page.locator('h1')).not.toBeEmpty()
  }

  await page.locator('#language-select').selectOption('en')
  await expect(page.locator('h1')).toContainText(/My .*wishlist/)

  await page.reload()
  await expect(page.locator('#language-select')).toHaveValue('en')
  await expect(page.locator('h1')).toContainText(/My .*wishlist/)
})

test('opens a Pokémon detail sheet', async ({ page }) => {
  await page.goto('/pokemon/pikachu')

  await expect(page.locator('.pokemon-sheet')).toBeVisible()
  await expect(page.locator('.pokemon-sheet h1')).toHaveText('Pikachu')
  await expect(page.locator('.pokemon-sheet .type')).toContainText('electric')
  await expect(page.locator('.back-link')).toBeVisible()
})

test.fixme('likes a Pokémon and persists the like', async ({ page }) => {
  // À activer lorsque les endpoints /likes et le bouton de like seront branchés.
  await page.goto('/pokemon/pikachu')
  await page.getByRole('button', { name: /like/i }).click()
  await expect(page.getByTestId('pokemon-like-count')).toHaveText('1')
  await page.reload()
  await expect(page.getByTestId('pokemon-like-count')).toHaveText('1')
})
