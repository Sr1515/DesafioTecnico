// src/app/pages/home/home.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necessário para [(ngModel)] nos filtros
import { finalize } from 'rxjs';

// ⚠️ AJUSTE ESTES CAMINHOS
import { PokemonService, Pokemon, Type, Generation } from '../../services/pokemon.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card';
import { NavbarComponent } from '../../shared/navbar/navbar';
// Importe o AuthService e Router se você tiver outras funcionalidades de usuário aqui (como checagem de status, etc.)

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PokemonCardComponent, 
    NavbarComponent
  ],
  templateUrl: './home.html', // Usaremos um arquivo HTML separado
  styleUrls: ['./home.css'] // Estilos específicos para a Home
})
export class HomeComponent implements OnInit {
  private pokemonService = inject(PokemonService);
  
  // --- Dados de Listagem ---
  pokemons: Pokemon[] = [];
  loading = false;
  
  // --- Dados de Paginação e API ---
  currentPage = 1;
  offset = 0;
  limit = 20; // Tamanho da página
  nextPage: string | null = null;
  prevPage: string | null = null;

  // --- Dados de Filtro ---
  types: Type[] = [];
  generations: Generation[] = [];
  
  selectedType: number = 0; // ID 0 representa 'Todas'
  selectedGeneration: number = 0; // ID 0 representa 'Todas'
  searchTerm: string = '';

  ngOnInit(): void {
    // Carrega os dados iniciais
    this.loadAllData();
  }

  /**
   * Carrega Pokémons e as opções de filtro.
   */
  loadAllData(): void {
    this.loadFilters();
    this.loadPokemons();
  }
  
  /**
   * Função principal para buscar Pokémons, respeitando filtros ou paginação.
   */
  loadPokemons(): void {
    this.loading = true;
    
    // 1. Prioridade: Busca por Nome
    if (this.searchTerm.trim()) {
      this.filterByName();
      return;
    }
    
    // 2. Prioridade: Busca Combinada por Tipo/Geração (sem paginação)
    if (this.selectedType !== 0 || this.selectedGeneration !== 0) {
      this.loadCombinedFilter();
      return;
    }
    
    // 3. Padrão: Paginação (apenas quando não há filtros ativos)
    this.pokemonService.getPokemons(this.offset, this.limit)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.pokemons = data.results;
          this.nextPage = data.next;
          this.prevPage = data.previous;
          // Se a API retornar a URL completa, você precisará parsear o offset/limit 
          // para atualizar this.currentPage corretamente se necessário.
        },
        error: (err) => console.error('Erro ao carregar Pokémons:', err)
      });
  }

  /**
   * Carrega os dados de Tipo e Geração para os dropdowns.
   */
  loadFilters(): void {
    this.pokemonService.getTipos().subscribe(types => {
      this.types = [{ id: 0, name: 'Todos' }, ...types];
    });

    this.pokemonService.getGenerations().subscribe(generations => {
      this.generations = generations; // O serviço já deve incluir a opção 'Todas'
    });
  }
  
  // --- Funções de Paginação ---

  next(): void {
    if (this.nextPage) {
      this.offset += this.limit;
      this.currentPage++;
      this.loadPokemons();
    }
  }

  previous(): void {
    if (this.prevPage && this.offset >= this.limit) {
      this.offset -= this.limit;
      this.currentPage--;
      this.loadPokemons();
    }
  }

  // --- Funções de Filtro ---

  filterByType(typeId: number): void {
    // Se um tipo foi selecionado, o filtro combinado é chamado
    this.loadCombinedFilter();
  }

  filterByGeneration(): void {
    // Se uma geração foi selecionada, o filtro combinado é chamado
    this.loadCombinedFilter();
  }

  loadCombinedFilter(): void {
    // Limpa o termo de busca por nome, se houver
    this.searchTerm = '';
    
    // Se ambos são 'Todos' (0), retorna à listagem paginada padrão
    if (this.selectedType === 0 && this.selectedGeneration === 0) {
      this.offset = 0; 
      this.currentPage = 1;
      this.loadPokemons();
      return;
    }
    
    this.loading = true;
    this.pokemonService.getPokemonsByCombinedFilter(this.selectedGeneration, this.selectedType)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (pokemons) => {
          this.pokemons = pokemons;
          // Desativa a paginação ao usar filtros combinados
          this.nextPage = null; 
          this.prevPage = null;
        },
        error: (err) => console.error('Erro ao buscar combinada:', err)
      });
  }

  filterByName(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      // Se a busca for limpa, reinicia os filtros e carrega a listagem padrão
      this.selectedType = 0;
      this.selectedGeneration = 0;
      this.offset = 0;
      this.currentPage = 1;
      this.loadPokemons();
      return;
    }

    this.loading = true;
    this.pokemonService.searchPokemonByName(term)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (pokemon) => {
          this.pokemons = pokemon ? [pokemon] : [];
          this.nextPage = null; 
          this.prevPage = null;
          this.selectedType = 0;
          this.selectedGeneration = 0;
        },
        error: (err) => console.error('Erro ao buscar por nome:', err)
      });
  }
}