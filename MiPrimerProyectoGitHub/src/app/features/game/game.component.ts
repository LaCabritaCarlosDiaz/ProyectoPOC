import { Component, inject, effect } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { PlayersService } from '../../core/services/players.service';
import { MACHINE_DELAY_MS } from '../../core/models/game.types';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { GameScoreboardComponent } from './components/game-scoreboard/game-scoreboard.component';
import { GameControlsComponent } from './components/game-controls/game-controls.component';
import { ResultModalComponent } from './components/result-modal/result-modal.component';
import { PlayerFormComponent } from './components/player-form/player-form.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';

@Component({
  selector: 'app-game',
  imports: [GameBoardComponent, GameScoreboardComponent, GameControlsComponent, ResultModalComponent, PlayerFormComponent, LeaderboardComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  protected readonly game = inject(GameService);
  protected readonly players = inject(PlayersService);

  constructor() {
    // El retardo de UX para el turno de la máquina se gestiona aquí,
    // manteniendo el servicio libre de efectos secundarios de tiempo.
    effect(() => {
      if (this.game.machineMovePending()) {
        setTimeout(() => this.game.runMachineMove(), MACHINE_DELAY_MS);
      }
    });
  }
}
