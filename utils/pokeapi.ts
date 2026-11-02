import type { Pokemon, PokemonApiResponse } from '../types/pokemon'

const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon'

export const fetchPokemon = async (query: string): Promise<Pokemon> => {
  const response = await fetch(
    `${POKEAPI_URL}/${encodeURIComponent(query.trim().toLowerCase())}`,
  )

  if (!response.ok) {
    throw new Error(`Pokémon introuvable (${response.status})`)
  }

  const data = (await response.json()) as PokemonApiResponse

  return {
    id: data.id,
    name: data.name,
    image: data.sprites.front_default ?? '',
    types: data.types.map(({ type }) => type.name),
  }
}
