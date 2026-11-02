import type { Pokemon } from './pokemon'

export interface WishlistItem extends Pokemon {
  addedAt?: string
}
