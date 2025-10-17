import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { PokemonService } from '../../services/pokemon.service';
import { Generation, Pokemon, Type } from '../../types/types';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, PokemonCardComponent, NavbarComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  private pokemonService = inject(PokemonService);

  pokemons: Pokemon[] = [];
  loading = false;

  currentPage = 1;
  offset = 0;
  limit = 20;
  nextPage: string | null = null;
  prevPage: string | null = null;

  types: Type[] = [];
  generations: Generation[] = [];

  selectedType: number = 0;
  selectedGeneration: number = 0;
  searchTerm: string = '';

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadFilters();
    this.loadPokemons();
  }

  loadPokemons(): void {
    this.loading = true;

    if (this.searchTerm.trim() || this.selectedType !== 0 || this.selectedGeneration !== 0) {
      this.loading = false;
      return;
    }

    this.pokemonService
      .getPokemons(this.offset, this.limit)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.pokemons = data.results;
          this.nextPage = data.next;
          this.prevPage = data.previous;
        },
        error: (err) => console.error('Erro ao carregar Pokémons:', err),
      });
  }

  loadFilters(): void {
    this.pokemonService.getTipos().subscribe((types) => {
      this.types = [{ id: 0, name: 'Todos' }, ...types];
    });

    this.pokemonService.getGenerations().subscribe((generations) => {
      this.generations = generations;
    });
  }

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

  filterByType(typeId: number): void {
    this.loadCombinedFilter();
  }

  filterByGeneration(): void {
    this.loadCombinedFilter();
  }

  loadCombinedFilter(): void {
    this.searchTerm = '';

    if (this.selectedType === 0 && this.selectedGeneration === 0) {
      this.offset = 0;
      this.currentPage = 1;
      this.loadPokemons();
      return;
    }

    this.loading = true;
    this.pokemonService
      .getPokemonsByCombinedFilter(this.selectedGeneration, this.selectedType)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pokemons) => {
          this.pokemons = pokemons;
          this.nextPage = null;
          this.prevPage = null;
        },
        error: (err) => console.error('Erro ao buscar combinada:', err),
      });
  }

  filterByName(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.selectedType = 0;
      this.selectedGeneration = 0;
      this.offset = 0;
      this.currentPage = 1;
      this.loadPokemons();
      return;
    }

    this.selectedType = 0;
    this.selectedGeneration = 0;

    this.loading = true;
    this.pokemonService
      .searchPokemonByName(term)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pokemon) => {
          this.pokemons = pokemon ? [pokemon] : [];
          this.nextPage = null;
          this.prevPage = null;
        },
        error: (err) => console.error('Erro ao buscar por nome:', err),
      });
  }
}
