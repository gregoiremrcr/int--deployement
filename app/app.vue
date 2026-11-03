<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Pokemon } from '~~/types/pokemon'
import type { WishlistItem } from '~~/types/wishlist-item'
import { fetchPokemon } from '~~/utils/pokeapi'
import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlist,
} from '~~/utils/wishlist-api'
import { addPokemon } from '~~/utils/wishlist'

const config = useRuntimeConfig()
const appRoute = useRoute()
const { t, locale } = useI18n()
const apiBaseUrl = String(config.public.apiBaseUrl)
const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
]
const search = ref('')
const result = ref<Pokemon | null>(null)
const wishlist = ref<WishlistItem[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const hasLoadedWishlist = ref(false)

const formatName = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1)
const isInWishlist = computed(() =>
  result.value
    ? wishlist.value.some((pokemon) => pokemon.id === result.value?.id)
    : false,
)

const searchPokemon = async (): Promise<void> => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    errorMessage.value = t('search.empty')
    result.value = null
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  result.value = null
  try {
    result.value = await fetchPokemon(query)
  } catch {
    errorMessage.value =
      t('search.notFound')
  } finally {
    isLoading.value = false
  }
}

const toggleWishlist = async (pokemon: Pokemon): Promise<void> => {
  const index = wishlist.value.findIndex((item) => item.id === pokemon.id)
  isSaving.value = true
  errorMessage.value = ''

  try {
    if (index !== -1) {
      await deleteWishlistItem(apiBaseUrl, pokemon.id)
      wishlist.value.splice(index, 1)
      return
    }

    const addition = addPokemon(wishlist.value, pokemon)
    if (addition.status === 'full') {
      errorMessage.value = t('wishlist.limit')
      return
    }

    const savedPokemon = await createWishlistItem(apiBaseUrl, pokemon)
    wishlist.value = [...wishlist.value, savedPokemon]
  } catch {
    errorMessage.value = t('wishlist.apiError')
  } finally {
    isSaving.value = false
  }
}

const removeFromWishlist = async (pokemon: WishlistItem): Promise<void> => {
  await toggleWishlist(pokemon)
}

onMounted(async (): Promise<void> => {
  try {
    wishlist.value = await getWishlist(apiBaseUrl)
  } catch {
    errorMessage.value = t('wishlist.apiError')
  } finally {
    hasLoadedWishlist.value = true
  }
})
</script>

<template>
  <NuxtPage v-if="appRoute.path !== '/'" />

  <main v-else class="page-shell">
    <div class="language-switcher">
      <label for="language-select">Langue</label>
      <select id="language-select" v-model="locale">
        <option v-for="language in languages" :key="language.code" :value="language.code">
          {{ language.label }}
        </option>
      </select>
    </div>

    <section class="hero">
      <p class="eyebrow">{{ t('app.eyebrow') }}</p>
      <h1>{{ t('app.title') }}</h1>
      <p class="intro">{{ t('app.intro') }}</p>
      <form class="search-form" @submit.prevent="searchPokemon">
        <label class="sr-only" for="pokemon-search"
          >{{ t('search.label') }}</label
        >
        <input
          id="pokemon-search"
          v-model="search"
          type="search"
          :placeholder="t('search.placeholder')"
          autocomplete="off"
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? t('search.loading') : t('search.submit') }}
        </button>
      </form>
      <p v-if="errorMessage" class="message error" role="alert">
        {{ errorMessage }}
      </p>
    </section>

    <section v-if="result" class="search-result" aria-live="polite">
      <div class="result-image-wrap">
        <img :src="result.image" :alt="`Image de ${formatName(result.name)}`" />
      </div>
      <div class="result-content">
        <p class="pokemon-number">
          {{ t('pokemon.number', { number: String(result.id).padStart(3, '0') }) }}
        </p>
        <h2>{{ formatName(result.name) }}</h2>
        <div class="types">
          <span v-for="type in result.types" :key="type" class="type">{{
            type
          }}</span>
        </div>
      </div>
      <button
        class="primary-action"
        type="button"
        @click="toggleWishlist(result)"
      >
        {{
          isSaving
            ? t('pokemon.saving')
            : isInWishlist
              ? t('pokemon.remove')
              : t('pokemon.add')
        }}
      </button>
    </section>

    <section v-if="hasLoadedWishlist" class="wishlist-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t('wishlist.eyebrow') }}</p>
          <h2>{{ t('wishlist.title') }} <span>({{ wishlist.length }})</span></h2>
        </div>
        <p v-if="wishlist.length" class="saved-label">
          {{ t('wishlist.synced') }}
        </p>
      </div>
      <div v-if="wishlist.length" class="wishlist-grid">
        <article
          v-for="pokemon in wishlist"
          :key="pokemon.id"
          class="pokemon-card"
        >
          <button
            class="remove-button"
            type="button"
            :aria-label="t('wishlist.remove', { name: formatName(pokemon.name) })"
            @click="removeFromWishlist(pokemon)"
          >
            ×
          </button>
          <img
            :src="pokemon.image"
            :alt="`Image de ${formatName(pokemon.name)}`"
          />
          <p class="pokemon-number">
            N° {{ String(pokemon.id).padStart(3, '0') }}
          </p>
          <h3>{{ formatName(pokemon.name) }}</h3>
          <div class="types">
            <span v-for="type in pokemon.types" :key="type" class="type">{{
              type
            }}</span>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">☆</div>
          <h3>{{ t('wishlist.emptyTitle') }}</h3>
        <p>{{ t('wishlist.emptyDescription') }}</p>
      </div>
    </section>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
:root {
  color: #17202d;
  background: #f7f8fc;
  font-family: 'DM Sans', sans-serif;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button,
input {
  font: inherit;
}
button {
  cursor: pointer;
}
.page-shell {
  min-height: 100vh;
  padding: 72px 24px 100px;
  background:
    radial-gradient(circle at 10% 0%, #e9efff 0, transparent 33%), #f7f8fc;
}
.language-switcher {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: min(100%, 1060px);
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
.hero,
.search-result,
.wishlist-section {
  width: min(100%, 1060px);
  margin-inline: auto;
}
.hero {
  text-align: center;
}
.eyebrow {
  margin: 0 0 12px;
  color: #5969da;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
h1,
h2,
h3 {
  font-family: 'Space Grotesk', sans-serif;
  margin: 0;
}
h1 {
  font-size: clamp(2.5rem, 7vw, 5rem);
  letter-spacing: -0.07em;
  line-height: 1;
}
h1 span,
h2 span {
  color: #6877e8;
}
.intro {
  max-width: 520px;
  margin: 22px auto 30px;
  color: #687080;
  line-height: 1.6;
}
.search-form {
  display: flex;
  gap: 10px;
  max-width: 650px;
  margin: auto;
  padding: 8px;
  border: 1px solid #e3e6ef;
  border-radius: 18px;
  background: white;
  box-shadow: 0 15px 40px #33469e12;
}
.search-form input {
  min-width: 0;
  flex: 1;
  padding: 13px 15px;
  border: 0;
  outline: 0;
  color: #17202d;
}
.search-form button,
.primary-action {
  border: 0;
  border-radius: 12px;
  padding: 13px 20px;
  color: white;
  background: #6877e8;
  font-weight: 700;
  transition: 0.2s ease;
}
button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.04);
}
button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.message {
  margin: 14px 0 0;
  font-size: 0.9rem;
}
.error {
  color: #c8495f;
}
.search-result {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 52px;
  padding: 22px 26px;
  border: 1px solid #e5e8f2;
  border-radius: 24px;
  background: white;
  box-shadow: 0 18px 45px #33469e10;
}
.result-image-wrap {
  display: grid;
  width: 120px;
  height: 120px;
  place-items: center;
  border-radius: 20px;
  background: #f0f2ff;
}
.result-image-wrap img {
  width: 110px;
  image-rendering: pixelated;
}
.result-content {
  flex: 1;
}
.pokemon-number {
  margin: 0 0 5px;
  color: #8991a3;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.result-content h2 {
  font-size: 2rem;
}
.types {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}
.type {
  padding: 5px 10px;
  border-radius: 30px;
  color: #5969da;
  background: #eef0ff;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}
.wishlist-section {
  margin-top: 72px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 24px;
}
.section-heading h2 {
  font-size: 2rem;
}
.saved-label {
  color: #6b8d72;
  font-size: 0.85rem;
}
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.pokemon-card {
  position: relative;
  padding: 18px;
  border: 1px solid #e5e8f2;
  border-radius: 20px;
  background: white;
  text-align: center;
  box-shadow: 0 10px 25px #33469e08;
}
.pokemon-card > img {
  width: 125px;
  height: 125px;
  image-rendering: pixelated;
}
.pokemon-card h3 {
  font-size: 1.15rem;
}
.pokemon-card .types {
  justify-content: center;
}
.remove-button {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  color: #9299aa;
  background: #f2f3f7;
  font-size: 1.25rem;
  line-height: 1;
}
.empty-state {
  padding: 65px 20px;
  border: 1px dashed #ccd2e2;
  border-radius: 24px;
  background: #fbfbfe;
  text-align: center;
}
.empty-icon {
  margin-bottom: 12px;
  color: #6877e8;
  font-size: 3rem;
}
.empty-state h3 {
  font-size: 1.3rem;
}
.empty-state p {
  margin-bottom: 0;
  color: #7e8595;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 620px) {
  .page-shell {
    padding-top: 48px;
  }
  .search-form {
    flex-direction: column;
    padding: 10px;
  }
  .search-form button {
    width: 100%;
  }
  .search-result {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  .result-content {
    flex-basis: calc(100% - 145px);
    text-align: left;
  }
  .primary-action {
    width: 100%;
  }
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
