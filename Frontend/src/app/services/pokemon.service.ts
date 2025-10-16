import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

export interface Type {
  id: number;
  name: string;
}

export interface Pokemon {
  id: number;
  nome: string;
  imagem: string;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private apiUrl = 'http://127.0.0.1:8000/api/pokemon/';

  constructor(private http: HttpClient) {}

  // Lista todos os tipos com ID
  getTipos(): Observable<Type[]> {
    return this.http.get<{ tipos: Type[] }>(`${this.apiUrl}types`).pipe(
      map(data => data.tipos ?? []),
      catchError(() => of([]))
    );
  }

  // Lista todos os Pokémons de um tipo pelo ID
  getPokemonsByTipoId(id: number): Observable<Pokemon[]> {
    const url = `https://pokeapi.co/api/v2/type/${id}/`;
    return this.http.get<{ pokemon: { pokemon: { name: string; url: string } }[] }>(url).pipe(
      map(data =>
        (data.pokemon ?? []).map((p) => {
          const id = Number(p.pokemon.url.split('/').filter(Boolean).pop());
          return {
            id,
            nome: p.pokemon.name,
            imagem: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        })
      ),
      catchError(() => of([]))
    );
  }

  // Lista Pokémons paginados (opcional)
  getPokemons(offset = 0, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}?offset=${offset}&limit=${limit}`);
  }
}
