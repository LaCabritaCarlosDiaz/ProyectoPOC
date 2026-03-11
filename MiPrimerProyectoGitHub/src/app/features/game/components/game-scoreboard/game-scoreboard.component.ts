import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-game-scoreboard',
  template: `
    <div class="scoreboard">
      <div class="score-box"
           [class.active]="game.currentPlayer() === 'X' && !game.gameOver() && !game.isMachineThinking()">
        <span class="player-label">{{ game.vsComputer() ? 'Tú ❌' : 'Jugador X' }}</span>
        <span class="score-value">{{ game.scoreX() }}</span>
      </div>
      <div class="score-box draws">
        <span class="player-label">Empates</span>
        <span class="score-value">{{ game.scoreDraw() }}</span>
      </div>
      <div class="score-box"
           [class.active]="game.currentPlayer() === 'O' && !game.gameOver() && !game.isMachineThinking()">
        <span class="player-label">{{ game.vsComputer() ? 'Máquina ⭕' : 'Jugador O' }}</span>
        <span class="score-value">{{ game.scoreO() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .scoreboard {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .score-box {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 0.6rem 0.4rem;
      text-align: center;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .score-box.active {
      border-color: #e94560;
      background: rgba(233, 69, 96, 0.15);
      box-shadow: 0 0 15px rgba(233, 69, 96, 0.3);
    }

    .score-box.draws { border-color: rgba(255,255,255,0.2); }

    .player-label {
      color: rgba(255,255,255,0.6);
      font-size: clamp(0.58rem, 1.8vw, 0.72rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .score-value {
      color: #fff;
      font-size: clamp(1.3rem, 4vw, 1.8rem);
      font-weight: 800;
      line-height: 1;
    }
  `]
})
export class GameScoreboardComponent {
  protected readonly game = inject(GameService);
}
