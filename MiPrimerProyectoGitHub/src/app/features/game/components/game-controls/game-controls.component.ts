import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-game-controls',
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.css'
})
export class GameControlsComponent {
  protected readonly game = inject(GameService);
}
