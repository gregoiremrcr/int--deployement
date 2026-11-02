import { Hono } from 'hono'
import type { WishlistItem } from '../types/wishlist-item'

export const createWishlistApp = (): Hono => {
  const wishlist: WishlistItem[] = []
  const app = new Hono()

  app.get('/health', (context) => context.json({ status: 'ok' }))

  app.get('/wishlist', (context) => context.json(wishlist))

  app.post('/wishlist', async (context) => {
    let item: WishlistItem

    try {
      item = await context.req.json<WishlistItem>()
    } catch {
      return context.json({ error: 'JSON invalide' }, 400)
    }

    if (
      !Number.isInteger(item.id) ||
      typeof item.name !== 'string' ||
      typeof item.image !== 'string' ||
      !Array.isArray(item.types)
    ) {
      return context.json({ error: 'Pokémon invalide' }, 400)
    }

    if (wishlist.some((pokemon) => pokemon.id === item.id)) {
      return context.json({ error: 'Pokémon déjà présent' }, 409)
    }

    if (wishlist.length >= 6) {
      return context.json({ error: 'La wishlist est limitée à 6 Pokémon' }, 409)
    }

    const savedItem: WishlistItem = {
      ...item,
      addedAt: item.addedAt ?? new Date().toISOString(),
    }
    wishlist.push(savedItem)

    return context.json(savedItem, 201)
  })

  app.delete('/wishlist/:id', (context) => {
    const id = Number(context.req.param('id'))
    const index = wishlist.findIndex((pokemon) => pokemon.id === id)

    if (index === -1) {
      return context.json({ error: 'Pokémon introuvable' }, 404)
    }

    wishlist.splice(index, 1)
    return context.body(null, 204)
  })

  return app
}

export const app = createWishlistApp()
