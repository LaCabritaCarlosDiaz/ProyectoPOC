import { Component, inject, signal } from '@angular/core';
import { PlayersService } from '../../../../core/services/players.service';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  template: `
    <div class="leaderboard-container">
      <div class="leaderboard-header">
        <h2 class="leaderboard-title">🏆 Ranking de Jugadores</h2>
        <p class="leaderboard-subtitle">Estadísticas acumuladas en esta app</p>
        <div class="header-actions">
          <button class="share-btn" (click)="copyShareUrl()" [disabled]="players.players().size === 0">
            Compartir ranking
          </button>
          @if (players.sharedLeaderboardLoaded()) {
            <span class="shared-pill">Vista compartida</span>
          }
        </div>
        @if (shareMessage()) {
          <p class="share-message">{{ shareMessage() }}</p>
        }
      </div>

      <div class="rankings">

        <!-- Top 5 Mejores -->
        <div class="ranking-section top">
          <h3 class="ranking-title">⭐ Top 5 Mejores</h3>
          @if (players.topPlayers().length === 0) {
            <p class="empty-message">Sin jugadores aún</p>
          } @else {
            <div class="ranking-list">
              @for (player of players.topPlayers(); track player.id; let i = $index) {
                <div class="ranking-row" [class.first]="i === 0">
                  <span class="medal">{{ getMedal(i) }}</span>
                  <span class="pname">{{ player.name }}</span>
                  <span class="badge wins">{{ player.score }}V</span>
                  <span class="badge draws">{{ player.draws }}E</span>
                  <span class="badge losses">{{ player.losses }}D</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Top Peores -->
        <div class="ranking-section bottom">
          <h3 class="ranking-title">📉 Top Peores</h3>
          @if (players.worstPlayers().length === 0) {
            <p class="empty-message">Mínimo 3 partidas para aparecer</p>
          } @else {
            <div class="ranking-list">
              @for (player of players.worstPlayers(); track player.id; let i = $index) {
                <div class="ranking-row" [class.first]="i === 0">
                  <span class="medal">{{ i + 1 }}</span>
                  <span class="pname">{{ player.name }}</span>
                  <span class="badge wins">{{ player.score }}V</span>
                  <span class="badge draws">{{ player.draws }}E</span>
                  <span class="badge losses">{{ player.losses }}D</span>
                </div>
              }
            </div>
          }
        </div>

      </div>

      <div class="leaderboard-footer">
        <p class="stats-info">🟢 V = Victorias &nbsp;|&nbsp; 🟡 E = Empates &nbsp;|&nbsp; 🔴 D = Derrotas</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }

    .leaderboard-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 16px;
      border: 1px solid rgba(233, 69, 96, 0.1);
    }

    .leaderboard-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .leaderboard-title {
      font-size: clamp(1.3rem, 4vw, 1.8rem);
      font-weight: 800;
      color: #e94560;
      margin: 0 0 0.4rem 0;
    }

    .leaderboard-subtitle {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.85rem;
      margin: 0;
    }

    .header-actions {
      margin-top: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .share-btn {
      border: 1px solid rgba(233, 69, 96, 0.5);
      background: rgba(233, 69, 96, 0.12);
      color: #ffd6dd;
      font-weight: 700;
      font-size: 0.78rem;
      letter-spacing: 0.4px;
      border-radius: 999px;
      padding: 0.4rem 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .share-btn:hover:not(:disabled) {
      background: rgba(233, 69, 96, 0.2);
      transform: translateY(-1px);
    }

    .share-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .shared-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.35rem 0.7rem;
      background: rgba(46, 213, 115, 0.13);
      border: 1px solid rgba(46, 213, 115, 0.35);
      color: #90f4ba;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .share-message {
      margin: 0.5rem 0 0;
      color: rgba(255, 255, 255, 0.72);
      font-size: 0.8rem;
      min-height: 1.2rem;
    }

    /* PC: 2 columnas; móvil: 1 columna cuando no caben */
    .rankings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .ranking-section {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.25rem;
      box-sizing: border-box;
    }

    .ranking-section.top   { border-color: rgba(46, 213, 115, 0.25); }
    .ranking-section.bottom { border-color: rgba(233, 69, 96, 0.25); }

    .ranking-title {
      font-size: clamp(0.95rem, 2.5vw, 1.1rem);
      font-weight: 700;
      margin: 0 0 0.85rem 0;
      padding-bottom: 0.6rem;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .ranking-section.top .ranking-title    { color: #2ed573; }
    .ranking-section.bottom .ranking-title { color: #e94560; }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    /* Fila: medalla | nombre (flexible) | badges de stats */
    .ranking-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.5rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
    }

    .ranking-row.first {
      background: rgba(255, 255, 255, 0.08);
    }

    .medal {
      flex: 0 0 1.8rem;
      text-align: center;
      font-size: 1.1rem;
      line-height: 1;
    }

    /* El nombre se expande y permite wrap */
    .pname {
      flex: 1 1 0;
      min-width: 0;
      color: #fff;
      font-weight: 600;
      font-size: clamp(0.8rem, 2.5vw, 0.95rem);
      word-break: break-word;
      overflow-wrap: anywhere;
      line-height: 1.3;
    }

    .ranking-row.first .pname {
      font-size: clamp(0.85rem, 2.8vw, 1rem);
    }

    .badge {
      flex: 0 0 auto;
      font-size: clamp(0.68rem, 1.8vw, 0.78rem);
      font-weight: 700;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
      white-space: nowrap;
    }

    .badge.wins   { background: rgba(46, 213, 115, 0.15); color: #2ed573; }
    .badge.draws  { background: rgba(255, 165, 2, 0.15);  color: #ffa502; }
    .badge.losses { background: rgba(233, 69, 96, 0.15);  color: #e94560; }

    .empty-message {
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      padding: 1.5rem 0;
      font-style: italic;
      font-size: 0.9rem;
    }

    .leaderboard-footer {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .stats-info {
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.8rem;
      margin: 0;
    }

    @media (max-width: 600px) {
      .leaderboard-container { padding: 1rem 0.75rem; }
      .rankings { grid-template-columns: 1fr; gap: 1rem; }
      .ranking-section { padding: 1rem; }
    }
  `]
})
export class LeaderboardComponent {
  protected readonly players = inject(PlayersService);
  protected readonly shareMessage = signal('');

  getMedal(index: number): string {
    return ['🥇', '🥈', '🥉', '4', '5'][index] ?? '•';
  }

  async copyShareUrl(): Promise<void> {
    const shareUrl = this.players.createShareUrl();
    if (!shareUrl) {
      this.shareMessage.set('No se pudo generar el enlace.');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof window !== 'undefined') {
        window.prompt('Copia este enlace para compartir el ranking:', shareUrl);
      }

      this.shareMessage.set('Enlace copiado. Compartelo y veran este mismo ranking.');
    } catch {
      this.shareMessage.set('No se pudo copiar automaticamente. Usa este enlace en el navegador.');
    }

    setTimeout(() => this.shareMessage.set(''), 3000);
  }
}
