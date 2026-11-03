import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { WishlistItem } from '../types/wishlist-item'

type WishlistRow = {
  id: number
  name: string
  image: string
  types: string[]
  added_at: string
}

type RepositoryError = Error & { code?: string }

export interface WishlistRepository {
  list: () => Promise<WishlistItem[]>
  insert: (item: WishlistItem) => Promise<WishlistItem>
  remove: (id: number) => Promise<boolean>
}

const toWishlistItem = (row: WishlistRow): WishlistItem => ({
  id: row.id,
  name: row.name,
  image: row.image,
  types: row.types,
  addedAt: row.added_at,
})

const createSupabaseRepository = (): WishlistRepository => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Les variables Supabase doivent être définies dans le fichier .env',
    )
  }

  const supabase = createClient(url, key)

  return {
    async list() {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id, name, image, types, added_at')
        .order('added_at', { ascending: true })

      if (error) throw error
      return (data as WishlistRow[]).map(toWishlistItem)
    },

    async insert(item) {
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          id: item.id,
          name: item.name,
          image: item.image,
          types: item.types,
          added_at: item.addedAt ?? new Date().toISOString(),
        })
        .select('id, name, image, types, added_at')
        .single()

      if (error) throw error
      return toWishlistItem(data as WishlistRow)
    },

    async remove(id) {
      const { data, error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', id)
        .select('id')

      if (error) throw error
      return data.length > 0
    },
  }
}

const createMemoryRepository = (): WishlistRepository => {
  const items: WishlistItem[] = []

  return {
    list: async () => items,
    insert: async (item) => {
      if (items.some((savedItem) => savedItem.id === item.id)) {
        const error = new Error('duplicate') as RepositoryError
        error.code = '23505'
        throw error
      }

      if (items.length >= 6) {
        const error = new Error('wishlist full') as RepositoryError
        error.code = '23514'
        throw error
      }

      const savedItem = {
        ...item,
        addedAt: item.addedAt ?? new Date().toISOString(),
      }
      items.push(savedItem)
      return savedItem
    },
    remove: async (id) => {
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) return false
      items.splice(index, 1)
      return true
    },
  }
}

const createDefaultRepository = (): WishlistRepository => {
  if (process.env.WISHLIST_STORAGE === 'memory') {
    return createMemoryRepository()
  }

  const hasSupabaseConfiguration =
    Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(
      process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )

  return hasSupabaseConfiguration
    ? createSupabaseRepository()
    : createMemoryRepository()
}

export const createWishlistApp = (repository?: WishlistRepository): Hono => {
  let activeRepository = repository
  const getRepository = (): WishlistRepository => {
    activeRepository ??= createDefaultRepository()
    return activeRepository
  }

  const app = new Hono()

  app.use('*', cors({ origin: process.env.ALLOWED_ORIGIN ?? '*' }))

  if (process.env.WISHLIST_STORAGE === 'memory') {
    app.get('/__test/pokemon/:name', (context) => {
      if (context.req.param('name') !== 'pikachu') {
        return context.json({ message: 'Not Found' }, 404)
      }

      return context.json({
        id: 900025,
        name: 'pikachu',
        sprites: { front_default: 'https://example.com/pikachu.png' },
        types: [{ type: { name: 'electric' } }],
      })
    })
  }

  app.get('/health', (context) => context.json({ status: 'ok' }))

  app.get('/wishlist', async (context) => {
    try {
      return context.json(await getRepository().list())
    } catch {
      return context.json({ error: 'Impossible de charger la wishlist' }, 500)
    }
  })

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

    try {
      const savedItem = await getRepository().insert(item)
      return context.json(savedItem, 201)
    } catch (error) {
      const repositoryError = error as RepositoryError

      if (repositoryError.code === '23505') {
        return context.json({ error: 'Pokémon déjà présent' }, 409)
      }

      if (repositoryError.code === '23514') {
        return context.json(
          { error: 'La wishlist est limitée à 6 Pokémon' },
          409,
        )
      }

      return context.json({ error: "Impossible d'ajouter le Pokémon" }, 500)
    }
  })

  app.delete('/wishlist/:id', async (context) => {
    const id = Number(context.req.param('id'))

    if (!Number.isInteger(id)) {
      return context.json({ error: 'Identifiant invalide' }, 400)
    }

    try {
      const removed = await getRepository().remove(id)

      if (!removed) {
        return context.json({ error: 'Pokémon introuvable' }, 404)
      }

      return context.body(null, 204)
    } catch {
      return context.json({ error: 'Impossible de supprimer le Pokémon' }, 500)
    }
  })

  return app
}

export const app = createWishlistApp()
