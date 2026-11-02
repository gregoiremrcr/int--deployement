import type { Pokemon } from '../types/pokemon'
import type { WishlistItem } from '../types/wishlist-item'

export const MAX_WISHLIST_SIZE = 6

export type AddPokemonStatus = 'added' | 'duplicate' | 'full'

export interface AddPokemonResult {
  wishlist: WishlistItem[]
  status: AddPokemonStatus
}

export const addPokemon = (
  wishlist: WishlistItem[],
  pokemon: Pokemon,
): AddPokemonResult => {
  if (wishlist.some((item) => item.id === pokemon.id)) {
    return { wishlist, status: 'duplicate' }
  }

  if (wishlist.length >= MAX_WISHLIST_SIZE) {
    return { wishlist, status: 'full' }
  }

  return {
    wishlist: [...wishlist, { ...pokemon, addedAt: new Date().toISOString() }],
    status: 'added',
  }
}
