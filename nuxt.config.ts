// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787',
      pokeApiBaseUrl:
        process.env.NUXT_PUBLIC_POKE_API_BASE_URL ??
        'https://pokeapi.co/api/v2/pokemon',
    },
  },
})
