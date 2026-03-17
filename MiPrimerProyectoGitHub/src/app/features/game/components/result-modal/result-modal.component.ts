import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-result-modal',
  templateUrl: './result-modal.component.html',
  styleUrl: './result-modal.component.css'
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
