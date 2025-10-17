export interface Type {
  id: number;
  descricao: string;
}
export interface Generation {
  id: number;
  name: string;
}

export interface Pokemon {
  id: number;
  nome: string;
  imagem: string;
}
export interface UserPokemonRecord {
  idPokemonUsuario: number;
  codigo: string;
  grupoBatalha: boolean;
  favorito: boolean;
  nome: string;
  imagemUrl: string;
}
export interface UserPokemonData {
  codigo: string;
  nome: string;
  imagemUrl: string;
  grupoBatalha?: boolean;
  favorito?: boolean;
}

export interface JwtPayload {
  user_id: number;
}
