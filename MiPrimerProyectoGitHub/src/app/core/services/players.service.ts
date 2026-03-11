import { Injectable, signal, computed } from '@angular/core';
import { Player, GameRecord } from '../models/player.types';

const STORAGE_KEY = 'tic-tac-toe-players';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  readonly players = signal<Map<string, Player>>(new Map());
  readonly currentPlayerId = signal<string | null>(null);
  readonly gameHistory = signal<GameRecord[]>([]);

  readonly currentPlayer = computed(() => {
    const id = this.currentPlayerId();
    return id ? this.players().get(id) : null;
  });

  readonly topPlayers = computed(() => {
    const allPlayers = Array.from(this.players().values());
    return allPlayers
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  });

  readonly worstPlayers = computed(() => {
    const topIds = new Set(this.topPlayers().map(p => p.id));
    const allPlayers = Array.from(this.players().values());
    return allPlayers
      .filter(p => p.totalGames >= 3 && !topIds.has(p.id))
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 5);
  });

  constructor() {
    this.loadFromLocalStorage();
  }

  setCurrentPlayer(name: string): boolean {
    const normalizedName = this.normalizeName(name);
    if (!normalizedName) return false;
    if (this.isNameTaken(normalizedName)) return false;

    const id = this.generatePlayerId();
    const newPlayer: Player = {
      id,
      name: normalizedName,
      winsX: 0,
      winsO: 0,
      draws: 0,
      losses: 0,
      totalGames: 0,
      score: 0,
      rating: 0,
    };
    const map = new Map(this.players());
    map.set(id, newPlayer);
    this.players.set(map);

    this.currentPlayerId.set(id);
    this.saveToLocalStorage();
    return true;
  }

  isNameTaken(name: string): boolean {
    return Boolean(this.findPlayerByName(name));
  }

  recordGameResult(result: 'win' | 'loss' | 'draw', playerSymbol: 'X' | 'O'): void {
    const playerId = this.currentPlayerId();
    if (!playerId) return;

    const map = new Map(this.players());
    const player = map.get(playerId);
    if (!player) return;

    // Actualizar estadísticas
    player.totalGames++;
    if (result === 'win') {
      if (playerSymbol === 'X') player.winsX++;
      else player.winsO++;
    } else if (result === 'loss') {
      player.losses++;
    } else {
      player.draws++;
    }

    // Recalcular puntuación
    player.score = player.winsX + player.winsO;
    player.rating = player.score + player.draws - Math.floor(player.losses / 2);

    map.set(playerId, player);
    this.players.set(map);

    // Registrar en historial
    const history = this.gameHistory();
    history.push({
      playerId,
      playerName: player.name,
      result,
      playerSymbol,
      timestamp: Date.now(),
    });
    this.gameHistory.set(history);

    this.saveToLocalStorage();
  }

  private findPlayerByName(name: string): string | undefined {
    const normalizedTarget = this.normalizeName(name);
    for (const [id, player] of this.players()) {
      if (this.normalizeName(player.name) === normalizedTarget) {
        return id;
      }
    }
    return undefined;
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private generatePlayerId(): string {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private saveToLocalStorage(): void {
    // currentPlayerId NO se persiste: cada nueva visita/pestaña es un jugador nuevo
    const data = {
      players: Array.from(this.players().entries()),
      gameHistory: this.gameHistory(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private loadFromLocalStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      this.players.set(new Map(parsed.players));
      // currentPlayerId siempre arranca en null → el form siempre pide el nombre
      this.gameHistory.set(parsed.gameHistory || []);
    } catch (e) {
      console.error('Error loading players from localStorage', e);
    }
  }

  clearAllData(): void {
    this.players.set(new Map());
    this.currentPlayerId.set(null);
    this.gameHistory.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
