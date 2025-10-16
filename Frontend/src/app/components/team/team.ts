// src/app/pages/team/team.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { PokemonService, Pokemon } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card';
import { NavbarComponent } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, RouterLink, PokemonCardComponent,  NavbarComponent],
  templateUrl: './team.html',
  styleUrls: ['../home/home.css'] 
})
export class TeamComponent implements OnInit {
  private pokemonService = inject(PokemonService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pokemons: Pokemon[] = [];
  loading = false;
  currentUserId: number | undefined; 

  ngOnInit(): void {
    const user = this.authService.getLoggedInUser(); 
    this.currentUserId = user?.id; 

    if (this.currentUserId) {
        this.loadUserPokemons();
    } else {
        console.error('ID do usuário não encontrado. Redirecionando...');
    }
  }

  loadUserPokemons(): void {
    this.loading = true;
    
    this.pokemonService.getUsersPokemon(this.currentUserId!, 'grupoBatalha')
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (userRecords) => {
          // Mapeia os registros de usuário para a interface Pokemon
          this.pokemons = userRecords.map(record => ({
            id: Number(record.codigo), 
            nome: record.nome,
            imagem: record.imagemUrl,
            tipos: [] 
          }));
        },
        error: (err) => console.error('Erro ao carregar equipe:', err)
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('', { replaceUrl: true });
  }
}