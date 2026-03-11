import { Component, inject } from '@angular/core';
import { PlayersService } from '../../../../core/services/players.service';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  template: `
    <div class="leaderboard-container">
      <div class="leaderboard-header">
        <h2 class="leaderboard-title">🏆 Ranking de Jugadores</h2>
        <p class="leaderboard-subtitle">Desde que levantó la app</p>
      </div>

      <div class="rankings">
        <!-- Top 5 Mejores -->
        <div class="ranking-section top">
          <h3 class="ranking-title">⭐ Top 5 Mejores</h3>
          <div class="ranking-list">
            @if (players.topPlayers().length === 0) {
              <p class="empty-message">Sin jugadores aún</p>
            } @else {
              <div class="ranking-row header">
                <span class="rank">#</span>
                <span class="name">Jugador</span>
                <span class="stat">G+E</span>
                <span class="stat">PW</span>
              </div>
              @for (player of players.topPlayers(); track player.id; let i = $index) {
                <div class="ranking-row">
                  <span class="rank medal">{{ getMedal(i) }}</span>
                  <span class="name">{{ player.name }}</span>
                  <span class="stat rating">{{ player.rating }}</span>
                  <span class="stat wins">{{ player.score }}</span>
                </div>
              }
            }
          </div>
        </div>

        <!-- Top Peores -->
        <div class="ranking-section bottom">
          <h3 class="ranking-title">📉 Top Peores</h3>
          <div class="ranking-list">
            @if (players.worstPlayers().length === 0) {
              <p class="empty-message">Sin datos suficientes</p>
            } @else {
              <div class="ranking-row header">
                <span class="rank">#</span>
                <span class="name">Jugador</span>
                <span class="stat">Rating</span>
                <span class="stat">Perdidas</span>
              </div>
              @for (player of players.worstPlayers(); track player.id; let i = $index) {
                <div class="ranking-row">
                  <span class="rank">{{ i + 1 }}</span>
                  <span class="name">{{ player.name }}</span>
                  <span class="stat rating">{{ player.rating }}</span>
                  <span class="stat losses">{{ player.losses }}</span>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <div class="leaderboard-footer">
        <p class="stats-info">
          💡 Rating = (Ganadas × 2) + (Empatadas × 1) - (Perdidas × 0.5)
        </p>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 16px;
      border: 1px solid rgba(233, 69, 96, 0.1);
    }

    .leaderboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .leaderboard-title {
      font-size: clamp(1.5rem, 4vw, 1.8rem);
      font-weight: 800;
      color: #e94560;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 0 30px rgba(233, 69, 96, 0.3);
    }

    .leaderboard-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
      margin: 0;
    }

    .rankings {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .ranking-section {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      overflow: hidden;
    }

    .ranking-section.top {
      border-color: rgba(46, 213, 115, 0.2);
    }

    .ranking-section.bottom {
      border-color: rgba(233, 69, 96, 0.2);
    }

    .ranking-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .ranking-section.top .ranking-title {
      color: #2ed573;
    }

    .ranking-section.bottom .ranking-title {
      color: #e94560;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .ranking-row {
      display: grid;
      grid-template-columns: 40px 1fr 60px 60px;
      gap: 0.75rem;
      padding: 0.8rem;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.9rem;
    }

    .ranking-row.header {
      background: rgba(255, 255, 255, 0.05);
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      padding: 0.6rem 0.8rem;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ranking-row:last-child {
      border-bottom: none;
    }

    .rank {
      font-weight: 700;
      text-align: center;
    }

    .rank.medal {
      font-size: 1.2rem;
    }

    .name {
      color: #fff;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat {
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
    }

    .stat.rating {
      color: #ffa502;
    }

    .stat.wins {
      color: #2ed573;
    }

    .stat.losses {
      color: #e94560;
    }

    .empty-message {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      padding: 2rem 1rem;
      font-style: italic;
    }

    .leaderboard-footer {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stats-info {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .rankings {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .ranking-row {
        grid-template-columns: 30px 1fr 50px 50px;
        gap: 0.5rem;
        padding: 0.6rem;
        font-size: 0.85rem;
      }

      .ranking-row.header {
        padding: 0.5rem 0.6rem;
        font-size: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .leaderboard-container {
        padding: 1rem;
      }

      .ranking-row {
        grid-template-columns: 25px 1fr 40px 40px;
        gap: 0.3rem;
        padding: 0.5rem;
        font-size: 0.8rem;
      }

      .ranking-title {
        font-size: 1rem;
      }
    }
  `]
})
export class LeaderboardComponent {
  protected readonly players = inject(PlayersService);

  getMedal(index: number): string {
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    return medals[index] || '•';
  }
}
