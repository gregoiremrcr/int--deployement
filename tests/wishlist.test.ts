import { describe, expect, it } from 'vitest'
import type { Pokemon } from '../types/pokemon'
import { addPokemon } from '../utils/wishlist'

const pokemon = (id: number): Pokemon => ({
  id,
  name: `pokemon-${id}`,
  image: `https://example.com/${id}.png`,
  types: ['normal'],
})

describe('addPokemon', () => {
  it('adds a Pokemon to the wishlist', () => {
    const result = addPokemon([], pokemon(1))

    expect(result.status).toBe('added')
    expect(result.wishlist).toHaveLength(1)
    expect(result.wishlist[0]?.id).toBe(1)
  })

  it('rejects a duplicate', () => {
    const pikachu = pokemon(25)
    const result = addPokemon([pikachu], pikachu)

    expect(result.status).toBe('duplicate')
    expect(result.wishlist).toHaveLength(1)
  })

  it('rejects an addition when the wishlist contains 6 Pokemon', () => {
    const fullWishlist = Array.from({ length: 6 }, (_, index) =>
      pokemon(index + 1),
    )
    const result = addPokemon(fullWishlist, pokemon(999))

    expect(result.status).toBe('full')
    expect(result.wishlist).toHaveLength(6)
    expect(result.wishlist.some((item) => item.id === 999)).toBe(false)
  })
})
