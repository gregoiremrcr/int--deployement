import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createWishlistApp } from '../../backend/app'
import type { WishlistItem } from '../../types/wishlist-item'

const testUrl = process.env.SUPABASE_TEST_URL
const testKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY
const hasTestDatabase = Boolean(testUrl && testKey)
const testPokemonIds = [
  900001, 900002, 900010, 900011, 900012, 900013, 900014, 900015, 900016,
]

const testPokemon = (id: number): WishlistItem => ({
  id,
  name: `integration-${id}`,
  image: `https://example.com/${id}.png`,
  types: ['normal'],
})

const describeIntegration = hasTestDatabase ? describe : describe.skip

describeIntegration('wishlist API avec une vraie base Supabase', () => {
  const supabase = createClient(
    testUrl ?? 'https://invalid-test-project.supabase.co',
    testKey ?? 'test-key',
  )
  const app = createWishlistApp()

  const cleanup = async (): Promise<void> => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .in('id', testPokemonIds)

    if (error) throw error
  }

  const post = async (item: WishlistItem): Promise<Response> =>
    app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })

  beforeAll(() => {
    process.env.SUPABASE_URL = testUrl
    process.env.SUPABASE_ANON_KEY = testKey
  })

  beforeEach(cleanup)
  afterAll(cleanup)

  it('exécute le CRUD sur Supabase', async () => {
    const item = testPokemon(900001)

    const createResponse = await post(item)
    expect(createResponse.status).toBe(201)
    expect(await createResponse.json()).toMatchObject(item)

    const listResponse = await app.request('/wishlist')
    expect(listResponse.status).toBe(200)
    expect(await listResponse.json()).toHaveLength(1)

    const deleteResponse = await app.request(`/wishlist/${item.id}`, {
      method: 'DELETE',
    })
    expect(deleteResponse.status).toBe(204)

    const emptyResponse = await app.request('/wishlist')
    expect(await emptyResponse.json()).toEqual([])
  })

  it('refuse un doublon avec le code 409', async () => {
    const item = testPokemon(900002)

    expect((await post(item)).status).toBe(201)
    const duplicateResponse = await post(item)

    expect(duplicateResponse.status).toBe(409)
    expect(await duplicateResponse.json()).toEqual({
      error: 'Pokémon déjà présent',
    })
  })

  it('refuse le septième Pokémon avec le code 409', async () => {
    for (let id = 900010; id < 900016; id += 1) {
      expect((await post(testPokemon(id))).status).toBe(201)
    }

    const seventhResponse = await post(testPokemon(900016))

    expect(seventhResponse.status).toBe(409)
    expect(await seventhResponse.json()).toEqual({
      error: 'La wishlist est limitée à 6 Pokémon',
    })
  })
})
