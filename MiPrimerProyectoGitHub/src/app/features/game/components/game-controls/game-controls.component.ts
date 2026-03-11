import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-game-controls',
  template: `
    <!-- Selector de modo -->
    <div class="mode-selector">
      <button class="mode-btn" [class.active]="game.vsComputer()" (click)="game.setMode(true)">
        🤖 vs Máquina
      </button>
      <button class="mode-btn" [class.active]="!game.vsComputer()" (click)="game.setMode(false)">
        👥 2 Jugadores
      </button>
    </div>

    <!-- Selector de dificultad con transición suave -->
    <div class="difficulty-selector" [class.hidden]="!game.vsComputer()">
      <span class="diff-label">Dificultad:</span>
      <button class="diff-btn" [class.active]="game.difficulty() === 'easy'" (click)="game.setDifficulty('easy')">
        😊 Fácil
      </button>
      <button class="diff-btn" [class.active]="game.difficulty() === 'hard'" (click)="game.setDifficulty('hard')">
        😈 Difícil
      </button>
    </div>

    <!-- Botones de control -->
    <div class="controls">
      <button class="btn btn-restart" (click)="game.restartRound()">
        🔄 Nueva partida
      </button>
      <button class="btn btn-reset" (click)="game.resetAll()">
        🗑️ Reiniciar todo
      </button>
    </div>

    <p class="round-info">Ronda {{ game.round() }}</p>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      width: 100%;
    }

    .mode-selector {
      display: flex;
      gap: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 14px;
      padding: 4px;
      width: 100%;
    }

    .mode-btn {
      flex: 1;
      padding: 0.55rem 0.4rem;
      border: none;
      border-radius: 10px;
      font-size: clamp(0.75rem, 2.5vw, 0.88rem);
      font-weight: 700;
      cursor: pointer;
      background: transparent;
      color: rgba(255,255,255,0.5);
      transition: all 0.25s ease;
      white-space: normal;
      word-break: break-word;
    }

    .mode-btn.active {
      background: linear-gradient(135deg, #e94560, #c62a47);
      color: #fff;
      box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
    }

    /* Transición suave con max-height */
    .difficulty-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-height: 60px;
      overflow: hidden;
      opacity: 1;
      transition: max-height 0.35s ease, opacity 0.35s ease;
    }

    .difficulty-selector.hidden {
      max-height: 0;
      opacity: 0;
      pointer-events: none;
    }

    .diff-label {
      color: rgba(255,255,255,0.5);
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .diff-btn {
      padding: 0.35rem 0.75rem;
      border: 2px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      font-size: clamp(0.72rem, 2vw, 0.82rem);
      font-weight: 700;
      cursor: pointer;
      background: transparent;
      color: rgba(255,255,255,0.5);
      transition: all 0.2s ease;
      white-space: normal;
    }

    .diff-btn.active {
      border-color: #e94560;
      color: #e94560;
      background: rgba(233, 69, 96, 0.1);
    }

    .controls {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .btn {
      flex: 1;
      padding: 0.75rem 0.5rem;
      border: none;
      border-radius: 12px;
      font-size: clamp(0.78rem, 2.5vw, 0.9rem);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.5px;
    }

    .btn-restart {
      background: linear-gradient(135deg, #e94560, #c62a47);
      color: #fff;
    }

    .btn-restart:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(233, 69, 96, 0.4);
    }

    .btn-reset {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.15);
    }

    .btn-reset:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
      transform: translateY(-2px);
    }

    .round-info {
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
      margin: 0;
      text-align: center;
    }

    @media (max-width: 380px) {
      .controls { flex-direction: column; }
      .btn { width: 100%; }
    }

    @media (hover: none) {
      .btn-restart:hover,
      .btn-reset:hover {
        transform: none;
        box-shadow: none;
      }
    }
  `]
})
export class GameControlsComponent {
  protected readonly game = inject(GameService);
}
