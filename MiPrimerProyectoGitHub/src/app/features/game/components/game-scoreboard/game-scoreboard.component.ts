import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-game-scoreboard',
  templateUrl: './game-scoreboard.component.html',
  styleUrl: './game-scoreboard.component.css'
})
export class GameScoreboardComponent {
  protected readonly game = inject(GameService);
}
