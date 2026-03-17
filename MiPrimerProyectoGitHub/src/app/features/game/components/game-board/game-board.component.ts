import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css'
})
export class GameBoardComponent {
  protected readonly game = inject(GameService);
}
