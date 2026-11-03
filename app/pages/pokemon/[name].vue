<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fetchPokemon } from '~~/utils/pokeapi'

const route = useRoute()
const { t, locale } = useI18n()
const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
]
const name = computed(() => String(route.params.name ?? '').trim())

const { data: pokemon, error } = await useAsyncData(
  () => `pokemon-${name.value.toLowerCase()}`,
  () => fetchPokemon(name.value),
)

if (error.value || !pokemon.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Pokémon introuvable',
    fatal: true,
  })
}

const pokemonData = pokemon.value

const formatName = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1)

useHead(() => ({
  title: `${formatName(pokemonData.name)} | ${t('detail.titleSuffix')}`,
  meta: [
    {
      name: 'description',
      content: t('detail.description', {
        name: formatName(pokemonData.name),
      }),
    },
  ],
}))
</script>

<template>
  <main class="pokemon-page">
    <div class="language-switcher">
      <label for="language-select">Langue</label>
      <select id="language-select" v-model="locale">
        <option
          v-for="language in languages"
          :key="language.code"
          :value="language.code"
        >
          {{ language.label }}
        </option>
      </select>
    </div>
    <NuxtLink class="back-link" to="/">← {{ t('detail.back') }}</NuxtLink>

    <article class="pokemon-sheet">
      <div class="image-wrap">
        <img
          :src="pokemonData.image"
          :alt="`Image de ${formatName(pokemonData.name)}`"
        />
      </div>

      <div class="details">
        <p class="number">
          {{
            t('pokemon.number', {
              number: String(pokemonData.id).padStart(3, '0'),
            })
          }}
        </p>
        <h1>{{ formatName(pokemonData.name) }}</h1>
        <p class="label">{{ t('pokemon.types') }}</p>
        <div class="types">
          <span v-for="type in pokemonData.types" :key="type" class="type">
            {{ type }}
          </span>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.pokemon-page {
  min-height: 100vh;
  padding: 48px 24px;
  color: #17202d;
  background: #f7f8fc;
  font-family: 'DM Sans', sans-serif;
}

.language-switcher {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: min(100%, 760px);
  margin: 0 auto 24px;
  color: #687080;
  font-size: 0.85rem;
}

.language-switcher select {
  padding: 6px 10px;
  border: 1px solid #e3e6ef;
  border-radius: 8px;
  background: white;
  color: #17202d;
}

.back-link {
  display: block;
  width: min(100%, 760px);
  margin: 0 auto 24px;
  color: #5969da;
  font-weight: 700;
  text-decoration: none;
}

.pokemon-sheet {
  display: flex;
  align-items: center;
  gap: 40px;
  width: min(100%, 760px);
  margin: auto;
  padding: 40px;
  border: 1px solid #e5e8f2;
  border-radius: 28px;
  background: white;
  box-shadow: 0 18px 45px #33469e10;
}

.image-wrap {
  display: grid;
  width: 250px;
  height: 250px;
  flex: 0 0 250px;
  place-items: center;
  border-radius: 24px;
  background: #f0f2ff;
}

.image-wrap img {
  width: 220px;
  image-rendering: pixelated;
}

.number,
.label {
  color: #8991a3;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.number {
  margin: 0 0 8px;
}

h1 {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  letter-spacing: -0.06em;
  text-transform: capitalize;
}

.label {
  margin: 28px 0 8px;
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type {
  padding: 7px 12px;
  border-radius: 30px;
  color: #5969da;
  background: #eef0ff;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: capitalize;
}

@media (max-width: 620px) {
  .pokemon-sheet {
    flex-direction: column;
    padding: 24px;
    text-align: center;
  }

  .details {
    width: 100%;
  }

  .types {
    justify-content: center;
  }
}
</style>
