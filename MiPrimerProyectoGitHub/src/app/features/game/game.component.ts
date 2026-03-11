import { Component, inject, effect } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { MACHINE_DELAY_MS } from '../../core/models/game.types';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { GameScoreboardComponent } from './components/game-scoreboard/game-scoreboard.component';
import { GameControlsComponent } from './components/game-controls/game-controls.component';
import { ResultModalComponent } from './components/result-modal/result-modal.component';

@Component({
  selector: 'app-game',
  imports: [GameBoardComponent, GameScoreboardComponent, GameControlsComponent, ResultModalComponent],
  template: `
    <div class="game-container">
      <h1 class="title">Tic-Tac-Toe</h1>

      <div class="layout">
        <!-- Panel izquierdo: tablero -->
        <div class="panel-board">
          <app-game-board />
        </div>

        <!-- Panel derecho: controles, marcador y estado -->
        <div class="panel-controls">
          <app-game-controls />
          <app-game-scoreboard />

          <!-- Mensaje de estado del juego -->
          <div [class]="'status-message status-' + game.statusModifier()"
               role="status"
               aria-live="polite">
            {{ game.statusMessage() }}
          </div>
        </div>
      </div>
    </div>

    <app-result-modal />
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 1rem;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    /* Fade-in al cargar la app */
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      max-width: 900px;
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .title {
      color: #e94560;
      font-size: clamp(1.5rem, 5vw, 2.2rem);
      font-weight: 800;
      margin: 0;
      letter-spacing: clamp(2px, 1vw, 4px);
      text-transform: uppercase;
      text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
    }

    /* Layout: columna en móvil, dos columnas en PC */
    .layout {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      align-items: center;
    }

    .panel-board {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      min-height: auto;
    }

    .panel-controls {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      min-width: 0;
    }

    /* ── Mensaje de estado ── */
    .status-message {
      font-size: clamp(0.85rem, 2.8vw, 1.05rem);
      font-weight: 700;
      padding: 0.65rem 1rem;
      border-radius: 12px;
      text-align: center;
      min-height: 2.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }

    .status-playing {
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.8);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .status-win {
      background: rgba(46, 213, 115, 0.2);
      color: #2ed573;
      border: 1px solid #2ed573;
      box-shadow: 0 0 20px rgba(46, 213, 115, 0.3);
    }

    .status-lose {
      background: rgba(233, 69, 96, 0.2);
      color: #e94560;
      border: 1px solid #e94560;
      box-shadow: 0 0 20px rgba(233, 69, 96, 0.3);
    }

    .status-draw {
      background: rgba(255, 165, 2, 0.2);
      color: #ffa502;
      border: 1px solid #ffa502;
      box-shadow: 0 0 20px rgba(255, 165, 2, 0.3);
    }

    /* PC: dos columnas lado a lado */
    @media (min-width: 700px) {
      :host { padding: 1.5rem; }

      .game-container { gap: 1.2rem; max-width: 860px; }

      .layout {
        flex-direction: row;
        align-items: stretch;
        justify-content: center;
        gap: 2rem;
      }

      .panel-board {
        flex: 0 0 auto;
        max-width: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .panel-controls {
        flex: 1;
        min-width: 0;
        justify-content: flex-start;
      }
    }

    /* Pantallas muy pequeñas (<380px) */
    @media (max-width: 380px) {
      :host { padding: 0.75rem 0.5rem; }
      .game-container { gap: 0.75rem; }
    }
  `]
})
export class GameComponent {
  protected readonly game = inject(GameService);

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
