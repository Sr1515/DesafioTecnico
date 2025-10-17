import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs'; // Importante: 'of' é essencial
// Não é necessário 'switchMap' neste caso, mas 'of' é crucial.
import { AuthService } from './auth.service';

export interface Type {
  id: number;
  name: string;
}

export interface Generation {
  id: number;
  name: string;
}

export interface Pokemon {
  id: number;
  nome: string;
  imagem: string;
  tipos: Type[];
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
  tipos: Type[];
}

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private apiUrl = 'http://127.0.0.1:8000/api/pokemon/';
  private userPokemonUrl = 'http://127.0.0.1:8000/api/pokemon-usuario/';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    });
  }

  private mapToPokemon(data: any): Pokemon {
    const id = Number(data.id ?? data.codigo ?? data.url?.split('/').filter(Boolean).pop());

    let tipos: Type[] = [];

    if (Array.isArray(data.tipos) && data.tipos.length > 0) {
      tipos = data.tipos;
    } else if (Array.isArray(data.tipos_nomes) && data.tipos_nomes.length > 0) {
      tipos = data.tipos_nomes.map((name: string, index: number) => ({
        id: index + 1,
        name: name,
      }));
    }

    const nome = data.nome ?? data.name ?? `Pokemon ${id}`;
    const imagem =
      data.imagemUrl ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    return {
      id,
      nome,
      imagem,
      tipos,
    };
  }

  private getAllPokemonsForFilter(): Observable<Pokemon[]> {
    return this.http.get<{ results: any[] }>(`${this.apiUrl}?limit=2000`).pipe(
      map((data) => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getPokemonDetails(id: number): Observable<Pokemon | null> {
    return this.http.get<any>(`${this.apiUrl}${id}/`).pipe(
      map((data) => this.mapToPokemon(data)),
      catchError(() => of(null))
    );
  }

  getPokemons(
    offset = 0,
    limit = 20
  ): Observable<{ results: Pokemon[]; next: string | null; previous: string | null }> {
    return this.http.get<any>(`${this.apiUrl}?offset=${offset}&limit=${limit}`).pipe(
      map((data) => ({
        ...data,
        results: (data.results ?? []).map((p: any) => ({
          ...this.mapToPokemon(p),
        })),
      })),
      catchError(() => of({ results: [], next: null, previous: null }))
    );
  }

  getPokemonsByGenerationId(id: number): Observable<Pokemon[]> {
    if (id === 0) {
      return this.getAllPokemonsForFilter();
    }

    return this.http.get<{ results: any[] }>(`${this.apiUrl}filter-generation?id=${id}`).pipe(
      map((data) => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getPokemonsByTipoId(id: number): Observable<Pokemon[]> {
    if (id === 0) {
      return this.getAllPokemonsForFilter();
    }

    return this.http.get<{ results: any[] }>(`${this.apiUrl}filter-type?id=${id}`).pipe(
      map((data) => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getPokemonsByCombinedFilter(genId: number, typeId: number): Observable<Pokemon[]> {
    if (genId === 0 && typeId === 0) {
      return this.getAllPokemonsForFilter();
    }

    if (typeId === 0) {
      return this.getPokemonsByGenerationId(genId);
    }

    if (genId === 0) {
      return this.getPokemonsByTipoId(typeId);
    }

    const url = `${this.apiUrl}filter-combined?gen_id=${genId}&type_id=${typeId}`;

    return this.http.get<{ results: any[] }>(url).pipe(
      map((data) => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getTipos(): Observable<Type[]> {
    return this.http.get<{ tipos: Type[] }>(`${this.apiUrl}types`).pipe(
      map((data) => data.tipos ?? []),
      catchError(() => of([]))
    );
  }

  getGenerations(): Observable<Generation[]> {
    return this.http
      .get<{ generations: { id: number; name: string }[] }>(`${this.apiUrl}generations`)
      .pipe(
        map((data) => {
          const generations = (data.generations ?? []).map((g) => ({
            id: g.id,
            name: `Geração ${g.id}`,
          }));
          return [{ id: 0, name: 'Todas' }, ...generations];
        }),
        catchError(() => of([]))
      );
  }

  searchPokemonByName(name: string): Observable<Pokemon | null> {
    const safeName = name.toLowerCase().trim();
    if (!safeName) return of(null);

    return this.http.get<any>(`${this.apiUrl}search-name?name=${safeName}`).pipe(
      map((data) => this.mapToPokemon(data)),
      catchError(() => of(null))
    );
  }

  getUsersPokemon(
    userId: number,
    filter: 'favorito' | 'grupoBatalha'
  ): Observable<UserPokemonRecord[]> {
    const headers = this.getAuthHeaders();

    let params = new HttpParams()
      .set('idUsuario', userId.toString())
      .set(filter, 'true')
      .set('timestamp', new Date().getTime().toString());

    return this.http.get<UserPokemonRecord[]>(this.userPokemonUrl, { headers, params }).pipe(
      catchError((error) => {
        console.error(`Erro ao buscar Pokémon de usuário com filtro ${filter}:`, error);
        return of([]);
      })
    );
  }

  getUserPokemonRecord(pokemonCodigo: string): Observable<UserPokemonRecord | null> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('codigo', pokemonCodigo);

    return this.http.get<UserPokemonRecord[]>(`${this.userPokemonUrl}`, { headers, params }).pipe(
      map((records) => records.find((r) => r.codigo === pokemonCodigo) || null),
      catchError((error) => {
        console.error('Erro ao buscar registro do usuário:', error);
        return of(null);
      })
    );
  }

  toggleUserPokemonStatus(
    record: UserPokemonRecord | null,
    data: UserPokemonData,
    isEquipe: boolean
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    const field = isEquipe ? 'grupoBatalha' : 'favorito';
    const otherField = isEquipe ? 'favorito' : 'grupoBatalha';

    const currentStatus = record ? record[field as keyof UserPokemonRecord] : false;
    const newStatus = !currentStatus;

    const payload: Partial<UserPokemonRecord> = {
      codigo: data.codigo,
      nome: data.nome,
      imagemUrl: data.imagemUrl,
    };

    (payload as any)[field] = newStatus;

    if (record) {
      const otherStatus = record[otherField as keyof UserPokemonRecord];

      if (newStatus === false && otherStatus === false) {
        return this.http.delete(`${this.userPokemonUrl}${record.idPokemonUsuario}/`, { headers });
      } else {
        (payload as any)[otherField] = otherStatus;
        return this.http.patch(`${this.userPokemonUrl}${record.idPokemonUsuario}/`, payload, {
          headers,
        });
      }
    } else {
      const otherField = isEquipe ? 'favorito' : 'grupoBatalha';
      (payload as any)[otherField] = false;

      return this.http.post(this.userPokemonUrl, payload, { headers });
    }
  }
}
