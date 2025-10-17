import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  Pokemon,
  PokemonService,
  UserPokemonData,
  UserPokemonRecord,
} from '../../services/pokemon.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './pokemon-card.html',
  styleUrls: ['./pokemon-card.css'],
})
export class PokemonCardComponent implements OnInit {
  @Input() pokemon!: Pokemon;

  private userRecord: UserPokemonRecord | null = null;
  public isInTeam: boolean = false;
  public isFavorite: boolean = false;
  public actionLoading: boolean = false;

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    this.checkPokemonStatus();
  }

  checkPokemonStatus(): void {
    if (!this.pokemon || !this.pokemon.id) return;

    this.pokemonService.getUserPokemonRecord(this.pokemon.id.toString()).subscribe({
      next: (record) => {
        this.userRecord = record;
        if (record) {
          this.isInTeam = record.grupoBatalha;
          this.isFavorite = record.favorito;
        } else {
          this.isInTeam = false;
          this.isFavorite = false;
        }
      },
      error: (err) => console.error('Erro ao verificar status do Pokémon:', err),
    });
  }

  private getPokemonDataForAction(): UserPokemonData {
    return {
      codigo: this.pokemon.id.toString(),
      nome: this.pokemon.nome,
      imagemUrl: this.pokemon.imagem,
      tipos: this.pokemon.tipos,
    };
  }

  public toggleTeam(): void {
    if (this.actionLoading) return;
    this.actionLoading = true;

    const data = this.getPokemonDataForAction();

    this.pokemonService
      .toggleUserPokemonStatus(this.userRecord, data, true)
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (response) => {
          this.checkPokemonStatus();
        },
        error: (err) => {
          if (err.status == 403) {
            alert(err.error.erro);
          } else {
            alert(`Erro ao alternar equipe. Status: ${err.status}`);
          }
        },
      });
  }

  public toggleFavorite(): void {
    if (this.actionLoading) return;
    this.actionLoading = true;

    const data = this.getPokemonDataForAction();

    this.pokemonService
      .toggleUserPokemonStatus(this.userRecord, data, false)
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (response) => {
          this.checkPokemonStatus();
        },
        error: (err) => alert(`Erro ao alternar favoritos. Status: ${err.status}`),
      });
  }
}
