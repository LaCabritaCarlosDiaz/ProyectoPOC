import { Injectable, signal, computed } from '@angular/core';
import { Player, GameRecord } from '../models/player.types';

const STORAGE_KEY = 'tic-tac-toe-players';
const SHARE_PARAM_KEY = 'lb';
const SHARE_VERSION = 1;

interface LeaderboardSharePayload {
  v: number;
  players: Player[];
}

@Injectable({ providedIn: 'root' })
export class PlayersService {
  readonly players = signal<Map<string, Player>>(new Map());
  readonly currentPlayerId = signal<string | null>(null);
  readonly gameHistory = signal<GameRecord[]>([]);
  readonly sharedLeaderboardLoaded = signal(false);

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
    this.loadFromShareUrl();
  }

  createShareUrl(): string {
    if (typeof window === 'undefined') return '';

    const shareablePlayers = Array.from(this.players().values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 30);

    const payload: LeaderboardSharePayload = {
      v: SHARE_VERSION,
      players: shareablePlayers,
    };

    const encoded = this.encodeSharePayload(payload);
    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_PARAM_KEY, encoded);
    return url.toString();
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

  private loadFromShareUrl(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const encodedPayload = url.searchParams.get(SHARE_PARAM_KEY);
    if (!encodedPayload) return;

    try {
      const payload = this.decodeSharePayload(encodedPayload);
      if (!payload || payload.v !== SHARE_VERSION || !Array.isArray(payload.players)) return;

      const sharedPlayers = new Map<string, Player>();
      for (const raw of payload.players) {
        const player = this.sanitizeSharedPlayer(raw);
        if (player) {
          sharedPlayers.set(player.id, player);
        }
      }

      if (sharedPlayers.size === 0) return;

      // El ranking compartido prevalece para mostrar el mismo top entre usuarios.
      this.players.set(sharedPlayers);
      this.currentPlayerId.set(null);
      this.gameHistory.set([]);
      this.sharedLeaderboardLoaded.set(true);
    } catch (e) {
      console.error('Error loading shared leaderboard from URL', e);
    }
  }

  private sanitizeSharedPlayer(raw: unknown): Player | null {
    if (!raw || typeof raw !== 'object') return null;

    const candidate = raw as Partial<Player>;
    if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return null;

    const winsX = this.safeNumber(candidate.winsX);
    const winsO = this.safeNumber(candidate.winsO);
    const draws = this.safeNumber(candidate.draws);
    const losses = this.safeNumber(candidate.losses);
    const totalGames = this.safeNumber(candidate.totalGames);
    const score = this.safeNumber(candidate.score);
    const rating = this.safeNumber(candidate.rating);

    return {
      id: candidate.id,
      name: this.normalizeName(candidate.name),
      winsX,
      winsO,
      draws,
      losses,
      totalGames,
      score,
      rating,
    };
  }

  private safeNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private encodeSharePayload(payload: LeaderboardSharePayload): string {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private decodeSharePayload(encodedPayload: string): LeaderboardSharePayload | null {
    const base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as LeaderboardSharePayload;
  }

  clearAllData(): void {
    this.players.set(new Map());
    this.currentPlayerId.set(null);
    this.gameHistory.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
