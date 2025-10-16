import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-card.html',
  styleUrls: ['./pokemon-card.css']
})
export class PokemonCardComponent {
  @Input() pokemon: any;
}
