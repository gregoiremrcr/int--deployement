import type { WishlistItem } from '../types/wishlist-item'

export const WISHLIST_STORAGE_KEY = 'pokemon-wishlist'

type WishlistStorage = Pick<Storage, 'getItem' | 'setItem'>

export const saveWishlist = (
  wishlist: WishlistItem[],
  storage: WishlistStorage,
): void => {
  storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
}

export const loadWishlist = (storage: WishlistStorage): WishlistItem[] => {
  const savedWishlist = storage.getItem(WISHLIST_STORAGE_KEY)

  if (!savedWishlist) {
    return []
  }

  try {
    const parsedWishlist: unknown = JSON.parse(savedWishlist)
    return Array.isArray(parsedWishlist)
      ? (parsedWishlist as WishlistItem[])
      : []
  } catch {
    return []
  }
}
