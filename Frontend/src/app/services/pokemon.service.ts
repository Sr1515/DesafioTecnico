// pokemon.service.ts (Versão FINAL com remoção total da PokeAPI direta)

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
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
  tipos: string[]; 
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

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private apiUrl = 'http://127.0.0.1:8000/api/pokemon/';
  private userPokemonUrl = 'http://127.0.0.1:8000/api/pokemon-usuario/'; 

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}` 
    });
  }

  private mapToPokemon(data: any): Pokemon {
    const id = Number(data.id || data.codigo || data.url?.split('/').filter(Boolean).pop());
    let tipos: string[] = [];

    if (data.tipos && Array.isArray(data.tipos)) {
        tipos = data.tipos; 
    } else if (data.tipos_nomes && Array.isArray(data.tipos_nomes)) {
        tipos = data.tipos_nomes;
    }
    
    const nome = data.nome || data.name || `Pokemon ${id}`;

    return {
      id,
      nome: nome,
      imagem: data.imagemUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      tipos: tipos
    };
  }

  getPokemonDetails(id: number): Observable<Pokemon | null> {
    return this.http.get<any>(`${this.apiUrl}${id}/`).pipe(
      map(data => this.mapToPokemon(data)),
      catchError(() => of(null))
    );
  }

  getPokemons(offset = 0, limit = 20): Observable<{ results: Pokemon[], next: string | null, previous: string | null }> {
    return this.http.get<any>(`${this.apiUrl}?offset=${offset}&limit=${limit}`).pipe(
      map(data => ({
        ...data,
        results: (data.results ?? []).map((p: any) => ({
             ...this.mapToPokemon(p),
             tipos: [] 
        }))
      })),
      catchError(() => of({ results: [], next: null, previous: null }))
    );
  }
  
  getPokemonsByGenerationId(id: number): Observable<Pokemon[]> {
    if (id === 0) {
      return of([]);
    }
    
    return this.http.get<{ results: any[] }>(`${this.apiUrl}filter-generation?id=${id}`).pipe(
      map(data => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getPokemonsByTipoId(id: number): Observable<Pokemon[]> {
    if (id === 0) {
      return of([]);
    }
    
    return this.http.get<{ results: any[] }>(`${this.apiUrl}filter-type?id=${id}`).pipe(
      map(data => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getPokemonsByCombinedFilter(genId: number, typeId: number): Observable<Pokemon[]> {
    const url = `${this.apiUrl}filter-combined?gen_id=${genId}&type_id=${typeId}`;
    
    return this.http.get<{ results: any[] }>(url).pipe(
      map(data => (data.results ?? []).map((p) => this.mapToPokemon(p))),
      catchError(() => of([]))
    );
  }

  getTipos(): Observable<Type[]> {
    return this.http.get<{ tipos: Type[] }>(`${this.apiUrl}types`).pipe(
      map(data => data.tipos ?? []),
      catchError(() => of([]))
    );
  }

  getGenerations(): Observable<Generation[]> {
    return this.http.get<{ generations: { id: number; name: string }[] }>(`${this.apiUrl}generations`).pipe(
      map(data => {
        const generations = (data.generations ?? []).map(g => ({
          id: g.id, 
          name: `Geração ${g.id}`
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
      map(data => this.mapToPokemon(data)),
      catchError(() => of(null))
    );
  }

  getUserPokemonRecord(pokemonCodigo: string): Observable<UserPokemonRecord | null> {
    const headers = this.getAuthHeaders();
    
    // Filtra todos os registros do usuário e busca pelo 'codigo'
    return this.http.get<UserPokemonRecord[]>(`${this.userPokemonUrl}?codigo=${pokemonCodigo}`, { headers }).pipe(
      map(records => records.find(r => r.codigo === pokemonCodigo) || null),
      catchError(error => {
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
    const currentStatus = record ? record[field as keyof UserPokemonRecord] : false;
    const newStatus = !currentStatus; 

    const payload: Partial<UserPokemonRecord> = {
        codigo: data.codigo,
        nome: data.nome,
        imagemUrl: data.imagemUrl,
    };

    (payload as any)[field] = newStatus;


    if (record) {
      
      const otherField = isEquipe ? 'favorito' : 'grupoBatalha';
      const otherStatus = record[otherField as keyof UserPokemonRecord];
      
      if (newStatus === false && otherStatus === false) {
         return this.http.delete(`${this.userPokemonUrl}${record.idPokemonUsuario}/`, { headers });
      } else {
         return this.http.patch(`${this.userPokemonUrl}${record.idPokemonUsuario}/`, payload, { headers });
      }
      
    } else {
      
      const otherField = isEquipe ? 'favorito' : 'grupoBatalha';
      (payload as any)[otherField] = false; 
      
      return this.http.post(this.userPokemonUrl, payload, { headers });
    }
  }

}