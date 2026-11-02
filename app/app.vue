<script setup lang="ts">
import type { Pokemon } from '~~/types/pokemon'
import type { WishlistItem } from '~~/types/wishlist-item'
import { fetchPokemon } from '~~/utils/pokeapi'
import { addPokemon } from '~~/utils/wishlist'

const STORAGE_KEY = 'pokemon-wishlist'
const search = ref('')
const result = ref<Pokemon | null>(null)
const wishlist = ref<WishlistItem[]>([])
const isLoading = ref(false)
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
    errorMessage.value = 'Saisissez un nom ou un numéro de Pokémon.'
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
      'Pokémon introuvable. Vérifiez le nom ou le numéro saisi.'
  } finally {
    isLoading.value = false
  }
}

const saveWishlist = (): void =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist.value))

const toggleWishlist = (pokemon: Pokemon): void => {
  const index = wishlist.value.findIndex((item) => item.id === pokemon.id)

  if (index !== -1) {
    wishlist.value.splice(index, 1)
    saveWishlist()
    return
  }

  const addition = addPokemon(wishlist.value, pokemon)
  if (addition.status === 'full') {
    errorMessage.value = 'La wishlist est limitée à 6 Pokémon.'
    return
  }

  wishlist.value = addition.wishlist
  saveWishlist()
}

const removeFromWishlist = (pokemon: WishlistItem): void => {
  wishlist.value = wishlist.value.filter((item) => item.id !== pokemon.id)
  saveWishlist()
}

onMounted((): void => {
  try {
    const savedWishlist = localStorage.getItem(STORAGE_KEY)
    wishlist.value = savedWishlist
      ? (JSON.parse(savedWishlist) as WishlistItem[])
      : []
  } catch {
    wishlist.value = []
  } finally {
    hasLoadedWishlist.value = true
  }
})
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Pokédex personnel</p>
      <h1>Ma <span>wishlist</span> Pokémon</h1>
      <p class="intro">
        Recherchez un Pokémon, ajoutez-le à votre collection et retrouvez-le
        après chaque visite.
      </p>
      <form class="search-form" @submit.prevent="searchPokemon">
        <label class="sr-only" for="pokemon-search"
          >Rechercher un Pokémon</label
        >
        <input
          id="pokemon-search"
          v-model="search"
          type="search"
          placeholder="Nom ou numéro, ex. pikachu ou 25"
          autocomplete="off"
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Recherche…' : 'Rechercher' }}
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
          N° {{ String(result.id).padStart(3, '0') }}
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
        {{ isInWishlist ? 'Retirer de la wishlist' : 'Ajouter à la wishlist' }}
      </button>
    </section>

    <section v-if="hasLoadedWishlist" class="wishlist-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Votre collection</p>
          <h2>
            Wishlist <span>({{ wishlist.length }})</span>
          </h2>
        </div>
        <p v-if="wishlist.length" class="saved-label">Sauvegardée localement</p>
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
            :aria-label="`Retirer ${formatName(pokemon.name)} de la wishlist`"
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
        <h3>Votre wishlist est vide</h3>
        <p>Recherchez votre premier Pokémon pour commencer votre collection.</p>
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
