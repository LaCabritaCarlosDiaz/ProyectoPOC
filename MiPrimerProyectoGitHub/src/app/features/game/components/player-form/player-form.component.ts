import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlayersService } from '../../../../core/services/players.service';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-player-form',
  imports: [FormsModule],
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.css'
})
export class PlayerFormComponent {
  protected readonly playersService = inject(PlayersService);
  protected readonly gameService = inject(GameService);
  protected playerName = signal('');
  protected errorMessage = signal('');
  protected isValidating = signal(false);

  onNameChange(value: string): void {
    this.playerName.set(value);
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    const name = this.playerName().trim();
    if (!name) return;

    this.isValidating.set(true);

    // Chequear simultáneamente local y Firebase
    const isTaken = await this.playersService.isNameTakenAsync(name);
    if (isTaken) {
      this.errorMessage.set('Ese nombre ya existe, usa uno diferente.');
      this.isValidating.set(false);
      return;
    }

    const created = this.playersService.setCurrentPlayer(name);
    this.isValidating.set(false);

    if (!created) {
      this.errorMessage.set('No se pudo crear el jugador. Intenta con otro nombre.');
    }
  }
}
