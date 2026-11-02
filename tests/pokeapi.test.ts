import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemon } from '../utils/pokeapi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchPokemon', () => {
  it('transforme une réponse 200 en Pokémon', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 25,
          name: 'pikachu',
          sprites: { front_default: 'pikachu.png' },
          types: [{ type: { name: 'electric' } }],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPokemon(' Pikachu ')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon/pikachu',
    )
    expect(result).toEqual({
      id: 25,
      name: 'pikachu',
      image: 'pikachu.png',
      types: ['electric'],
    })
  })

  it('signale un Pokémon introuvable avec une réponse 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPokemon('unknown-pokemon')).rejects.toThrow(
      'Pokémon introuvable (404)',
    )
  })
})
