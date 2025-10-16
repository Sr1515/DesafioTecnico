import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { PokemonService, Type, Pokemon, Generation } from '../../services/pokemon.service';
import { finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PokemonCardComponent, FormsModule], 
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  pokemons: Pokemon[] = [];
  types: Type[] = [];
  generations: Generation[] = []; 
  
  // Propriedades de filtro
  selectedType: number = 0; // ID 0 para 'Todos'
  selectedGeneration: number = 0; // ID 0 para 'Todas'
  searchTerm: string = '';
  
  offset = 0;
  limit = 20;
  currentPage = 1;
  nextPage: string | null = null;
  prevPage: string | null = null;
  loading = false;

  constructor(
    private pokemonService: PokemonService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    this.loadGenerations(); 
    this.loadPokemons();
  }
  
  loadGenerations() {
    this.pokemonService.getGenerations().subscribe({
      next: (gens) => (this.generations = gens),
      error: (err) => console.error('Erro ao carregar gerações:', err)
    });
  }

  loadTypes() {
    this.pokemonService.getTipos().subscribe({
      next: (tipos) => {
        this.types = [{ id: 0, name: 'Todos' }, ...tipos];
      },
      error: (err) => console.error('Erro ao carregar tipos:', err)
    });
  }
  
  private loadPokemonDetails(pokemons: Pokemon[]): Observable<Pokemon[]> {
    const requests = pokemons
      .filter(p => p.tipos.length === 0) 
      .map(p => 
        this.pokemonService.getPokemonDetails(p.id).pipe(
          map(details => details || p) 
        )
      );

    if (requests.length === 0) {
      return of(pokemons);
    }
    
    // Combina todas as requisições de detalhe
    return forkJoin(requests).pipe(
      map(detailedPokemons => {
        // Mapeia os detalhes de volta para a lista principal, mantendo a ordem
        const detailedMap = new Map(detailedPokemons.map(p => [p.id, p]));
        return pokemons.map(p => detailedMap.get(p.id) || p);
      })
    );
  }

  // Método centralizado de filtragem
  loadPokemons() {
    // 1. Prioriza a Busca por Nome
    if (this.searchTerm.trim()) {
        this.filterByName();
        return;
    }
    
    this.loading = true;
    
    let pokemonObservable: Observable<Pokemon[]>;
    let needsDetailLoad = false;
    
    // 2. Prioriza a FILTRAGEM COMBINADA (Geração E Tipo)
    if (this.selectedGeneration !== 0 && this.selectedType !== 0) {
        pokemonObservable = this.pokemonService.getPokemonsByCombinedFilter(this.selectedGeneration, this.selectedType);
        needsDetailLoad = true; // Precisa carregar detalhes para os tipos
    } 
    // 3. Filtragem Simples por Geração
    else if (this.selectedGeneration !== 0) {
       pokemonObservable = this.pokemonService.getPokemonsByGenerationId(this.selectedGeneration);
       needsDetailLoad = true; // Precisa carregar detalhes para os tipos
    } 
    // 4. Filtragem Simples por Tipo
    else if (this.selectedType !== 0) {
      pokemonObservable = this.pokemonService.getPokemonsByTipoId(this.selectedType);
      needsDetailLoad = true; // Precisa carregar detalhes para os tipos
    } 
    // 5. Listagem Padrão Paginada
    else {
      pokemonObservable = this.pokemonService.getPokemons(this.offset, this.limit).pipe(
        map(data => {
            this.nextPage = data.next;
            this.prevPage = data.previous;
            return data.results;
        })
      );
      needsDetailLoad = true; // Definitivamente precisa carregar detalhes aqui
    }

    pokemonObservable.pipe(
        // Se precisar de detalhes, encadeia a chamada de detalhes
        switchMap(pokemons => needsDetailLoad ? this.loadPokemonDetails(pokemons) : of(pokemons)),
        finalize(() => this.loading = false)
    ).subscribe({
      next: (pokemons) => {
        this.pokemons = pokemons;
        
        // Se estiver em modo de filtro, desabilita a paginação
        if (this.selectedType !== 0 || this.selectedGeneration !== 0) {
            this.nextPage = null;
            this.prevPage = null;
        }
      },
      error: (err) => console.error('Erro ao carregar/filtrar pokémons:', err)
    });
  }
  
  // CORRIGIDO: Não limpa selectedGeneration, permitindo combinação
  filterByType(typeId: number) {
    this.selectedType = typeId;
    this.searchTerm = '';
    this.offset = 0;
    this.currentPage = 1;
    this.loadPokemons();
  }

  // CORRIGIDO: Não limpa selectedType, permitindo combinação
  filterByGeneration() {
    this.searchTerm = ''; 
    this.offset = 0;
    this.currentPage = 1;
    this.loadPokemons();
  }
  
  // Função para buscar por nome (CORRETO: Limpa os dropdowns)
  filterByName() {
    const term = this.searchTerm.trim();
    
    this.selectedType = 0; 
    this.selectedGeneration = 0;
    this.offset = 0;
    this.currentPage = 1;
    
    if (!term) {
      this.loadPokemons();
      return;
    }
    
    this.loading = true;
    this.pokemonService.searchPokemonByName(term).subscribe({
      next: (pokemon) => {
        this.pokemons = pokemon ? [pokemon] : [];
        this.nextPage = null;
        this.prevPage = null;
      },
      error: (err) => console.error('Erro ao buscar por nome:', err),
      complete: () => (this.loading = false)
    });
  }

  // Paginação: só funciona no modo de listagem padrão (sem filtros ativos)
  next() {
    if (this.nextPage && this.selectedType === 0 && this.selectedGeneration === 0 && !this.searchTerm.trim()) {
      this.offset += this.limit;
      this.currentPage++;
      this.loadPokemons();
    }
  }

  previous() {
    if (this.prevPage && this.offset >= this.limit && this.selectedType === 0 && this.selectedGeneration === 0 && !this.searchTerm.trim()) {
      this.offset -= this.limit;
      this.currentPage--;
      this.loadPokemons();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}