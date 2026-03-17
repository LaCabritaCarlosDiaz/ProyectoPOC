import { Component, inject, signal } from '@angular/core';
import { PlayersService } from '../../../../core/services/players.service';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
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
