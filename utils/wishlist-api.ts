import type { Pokemon } from '../types/pokemon'
import type { WishlistItem } from '../types/wishlist-item'

const request = async <T>(
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, options)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? `API error ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const getWishlist = (baseUrl: string): Promise<WishlistItem[]> =>
  request<WishlistItem[]>(baseUrl, '/wishlist')

export const createWishlistItem = (
  baseUrl: string,
  pokemon: Pokemon,
): Promise<WishlistItem> =>
  request<WishlistItem>(baseUrl, '/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pokemon),
  })

export const deleteWishlistItem = (
  baseUrl: string,
  id: number,
): Promise<void> =>
  request<undefined>(baseUrl, `/wishlist/${id}`, { method: 'DELETE' })
