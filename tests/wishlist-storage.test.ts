import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WishlistItem } from '../types/wishlist-item'
import {
  loadWishlist,
  saveWishlist,
  WISHLIST_STORAGE_KEY,
} from '../utils/wishlist-storage'

const pikachu: WishlistItem = {
  id: 25,
  name: 'pikachu',
  image: 'pikachu.png',
  types: ['electric'],
}

const createStorageMock = () => {
  const values = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  }
}

describe('wishlist localStorage', () => {
  let storage: ReturnType<typeof createStorageMock>

  beforeEach(() => {
    storage = createStorageMock()
  })

  it('sauvegarde la wishlist en JSON', () => {
    saveWishlist([pikachu], storage)

    expect(storage.setItem).toHaveBeenCalledWith(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([pikachu]),
    )
  })

  it('lit la wishlist sauvegardée', () => {
    saveWishlist([pikachu], storage)

    expect(loadWishlist(storage)).toEqual([pikachu])
  })

  it('retourne une liste vide si le stockage est vide', () => {
    expect(loadWishlist(storage)).toEqual([])
  })

  it('ne plante pas avec un JSON corrompu', () => {
    storage.setItem(WISHLIST_STORAGE_KEY, '{ json invalide')

    expect(() => loadWishlist(storage)).not.toThrow()
    expect(loadWishlist(storage)).toEqual([])
  })
})
