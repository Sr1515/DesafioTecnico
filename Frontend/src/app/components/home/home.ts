import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card';
import { CommonModule } from '@angular/common';
import { PokemonService, Type, Pokemon } from '../../services/pokemon.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PokemonCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  pokemons: Pokemon[] = [];
  types: Type[] = [];
  selectedType: string = 'Todos';
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
    this.loadPokemons();
  }

  loadTypes() {
    this.pokemonService.getTipos().subscribe({
      next: (tipos) => {
        this.types = [{ id: 0, name: 'Todos' }, ...tipos];
      },
      error: (err) => console.error('Erro ao carregar tipos:', err)
    });
  }

  loadPokemons() {
    this.loading = true;
    this.pokemonService.getPokemons(this.offset, this.limit).subscribe({
      next: (data) => {
        this.nextPage = data.next;
        this.prevPage = data.previous;

        this.pokemons = data.results.map((p: any) => {
          const id = p.url.split('/').filter(Boolean).pop();
          return {
            id,
            nome: p.name,
            imagem: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        });
      },
      error: (err) => console.error('Erro ao carregar pokémons:', err),
      complete: () => (this.loading = false)
    });
  }

  filterByType(type: Type) {
    this.selectedType = type.name;

    if (type.id === 0) {
      this.loadPokemons();
    } else {
      this.loading = true;
      this.pokemonService.getPokemonsByTipoId(type.id).subscribe({
        next: (data) => (this.pokemons = data),
        error: (err) => console.error('Erro ao filtrar por tipo:', err),
        complete: () => (this.loading = false)
      });
    }
  }

  next() {
    if (this.nextPage) {
      this.offset += this.limit;
      this.currentPage++;
      this.loadPokemons();
    }
  }

  previous() {
    if (this.prevPage && this.offset >= this.limit) {
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
