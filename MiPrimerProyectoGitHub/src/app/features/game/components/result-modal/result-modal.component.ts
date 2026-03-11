import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-result-modal',
  template: `
    @if (game.gameOver() && game.resultConfirmed()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 class="modal-title" [class]="'status-' + game.statusModifier()">
            {{ getTitleEmoji() }} {{ getTitleText() }}
          </h2>
          
          <p class="modal-message">
            {{ game.statusMessage() }}
          </p>

          <button class="modal-btn" (click)="closeModal()">
            🎮 Siguiente ronda
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeInOverlay 0.3s ease;
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; backdrop-filter: blur(0px); }
      to   { opacity: 1; backdrop-filter: blur(2px); }
    }

    .modal-content {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 20px;
      padding: 2rem 1.5rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      border: 2px solid rgba(233, 69, 96, 0.3);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .modal-title {
      font-size: clamp(1.3rem, 5vw, 1.8rem);
      font-weight: 800;
      margin: 0 0 0.75rem 0;
      letter-spacing: 1px;
    }

    .modal-title.status-win {
      color: #2ed573;
      text-shadow: 0 0 30px rgba(46, 213, 115, 0.6);
    }

    .modal-title.status-lose {
      color: #e94560;
      text-shadow: 0 0 30px rgba(233, 69, 96, 0.6);
    }

    .modal-title.status-draw {
      color: #ffa502;
      text-shadow: 0 0 30px rgba(255, 165, 2, 0.6);
    }

    .modal-message {
      color: rgba(255, 255, 255, 0.85);
      font-size: clamp(0.95rem, 3vw, 1.1rem);
      margin: 1rem 0 1.75rem 0;
      line-height: 1.6;
    }

    .modal-btn {
      background: linear-gradient(135deg, #e94560, #c62a47);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 0.9rem 1.5rem;
      font-size: clamp(0.9rem, 2.5vw, 1.05rem);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s ease;
      letter-spacing: 0.5px;
      width: 100%;
      box-sizing: border-box;
    }

    .modal-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(233, 69, 96, 0.5);
    }

    @media (hover: none) {
      .modal-btn:hover {
        transform: none;
        box-shadow: none;
      }
    }

    @media (max-width: 380px) {
      .modal-content {
        padding: 1.5rem 1rem;
      }

      .modal-title {
        font-size: 1.4rem;
      }
    }
  `]
})
export class ResultModalComponent {
  protected readonly game = inject(GameService);

  getTitleEmoji(): string {
    const modifier = this.game.statusModifier();
    if (modifier === 'win') return '🎉';
    if (modifier === 'lose') return '🤖';
    return '🤝';
  }

  getTitleText(): string {
    const modifier = this.game.statusModifier();
    if (modifier === 'win') return '¡Ganaste!';
    if (modifier === 'lose') return 'Derrota';
    return 'Empate';
  }

  closeModal(): void {
    this.game.confirmResult();
  }
}
