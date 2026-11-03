// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  hooks: {
    async 'nitro:config'(nitroConfig) {
      const response = await fetch(
        'https://pokeapi.co/api/v2/pokemon?limit=2000',
      )

      if (!response.ok) {
        throw new Error(
          `Impossible de récupérer les Pokémon (${response.status})`,
        )
      }

      const data = (await response.json()) as {
        results: Array<{ name: string }>
      }

      const pokemonRoutes = data.results.map(
        ({ name }) => `/pokemon/${encodeURIComponent(name)}`,
      )

      nitroConfig.prerender ??= {}
      nitroConfig.prerender.routes ??= []
      nitroConfig.prerender.routes.push(...pokemonRoutes)
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787',
    },
  },
})
