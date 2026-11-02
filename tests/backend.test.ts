import { describe, expect, it } from 'vitest'
import type { WishlistItem } from '../types/wishlist-item'
import { createWishlistApp } from '../backend/app'

const pikachu: WishlistItem = {
  id: 25,
  name: 'pikachu',
  image: 'pikachu.png',
  types: ['electric'],
}

describe('wishlist Hono API', () => {
  it('GET /health renvoie 200', async () => {
    const app = createWishlistApp()

    const response = await app.request('/health')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('GET /wishlist renvoie un tableau vide au démarrage', async () => {
    const app = createWishlistApp()

    const response = await app.request('/wishlist')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('POST puis GET /wishlist conserve le Pokémon en mémoire', async () => {
    const app = createWishlistApp()

    const postResponse = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pikachu),
    })
    const getResponse = await app.request('/wishlist')

    expect(postResponse.status).toBe(201)
    expect(getResponse.status).toBe(200)
    expect(await getResponse.json()).toHaveLength(1)
  })

  it('DELETE /wishlist/:id supprime le Pokémon', async () => {
    const app = createWishlistApp()

    await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pikachu),
    })
    const deleteResponse = await app.request('/wishlist/25', {
      method: 'DELETE',
    })

    expect(deleteResponse.status).toBe(204)
    expect(await (await app.request('/wishlist')).json()).toEqual([])
  })
})
