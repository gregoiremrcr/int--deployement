const mode = process.argv[2]
const apiBaseUrl = process.env.API_BASE_URL
const frontendBaseUrl = process.env.FRONTEND_BASE_URL

if (!['api', 'production'].includes(mode)) {
  throw new Error('Usage: node scripts/smoke.mjs <api|production>')
}

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL doit contenir l’URL racine de l’API.')
}

const check = async (name, url, validate) => {
  const response = await fetch(url)
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status} pour ${url}`)
  }

  validate?.(body, response)
  process.stdout.write(`OK ${name}: HTTP ${response.status}\n`)
}

const apiUrl = new URL(apiBaseUrl)
await check('API health', new URL('/health', apiUrl), (body) => {
  if (JSON.parse(body).status !== 'ok') {
    throw new Error('API health: le statut attendu est « ok ».')
  }
})

if (mode === 'production') {
  if (!frontendBaseUrl) {
    throw new Error('FRONTEND_BASE_URL doit contenir le domaine Vercel public.')
  }

  await check('API wishlist read', new URL('/wishlist', apiUrl), (body) => {
    if (!Array.isArray(JSON.parse(body))) {
      throw new Error('API wishlist read: la réponse doit être un tableau.')
    }
  })

  const frontendUrl = new URL(frontendBaseUrl)
  await check('Nuxt SSR home', frontendUrl, (body) => {
    if (!body.includes('<html')) {
      throw new Error('Nuxt SSR home: réponse HTML attendue.')
    }
  })
  await check(
    'Nuxt SSR Pokémon detail',
    new URL('/pokemon/pikachu', frontendUrl),
    (body) => {
      if (!body.includes('Pikachu')) {
        throw new Error(
          'Nuxt SSR Pokémon detail: Pikachu doit être rendu côté serveur.',
        )
      }
    },
  )
}
