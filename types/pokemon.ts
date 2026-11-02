export interface Pokemon {
  id: number
  name: string
  image: string
  types: string[]
}

export interface PokemonApiResponse {
  id: number
  name: string
  sprites: {
    front_default: string | null
  }
  types: Array<{
    type: {
      name: string
    }
  }>
}
