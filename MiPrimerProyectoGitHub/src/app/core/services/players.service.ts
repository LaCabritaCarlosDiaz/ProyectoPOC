import { Injectable, signal, computed, inject } from '@angular/core';
import { Player, GameRecord } from '../models/player.types';
import { LeaderboardSyncService } from './leaderboard-sync.service';

const STORAGE_KEY = 'tic-tac-toe-players';
const TOP_STORAGE_KEY = 'tic-tac-toe-top-snapshot';
const SHARE_PARAM_KEY = 'lb';
const SHARE_VERSION = 1;

interface LeaderboardSharePayload {
  v: number;
  players: Player[];
}

interface TopSnapshotPayload {
  updatedAt: number;
  players: Player[];
}

@Injectable({ providedIn: 'root' })
export class PlayersService {
  readonly players = signal<Map<string, Player>>(new Map());
  readonly currentPlayerId = signal<string | null>(null);
  readonly gameHistory = signal<GameRecord[]>([]);
  readonly sharedLeaderboardLoaded = signal(false);
  private readonly syncService = inject(LeaderboardSyncService);
  
  // Caché de búsquedas para evitar llamadas repetidas a Firebase
  private nameCheckCache = new Map<string, boolean>();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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

  private firebaseLoaded = signal(false);

  constructor() {
    this.loadFromShareUrl();
    // Cargar desde Firestore primero (es la fuente de verdad global)
    // Si falla, fallback a localStorage
    this.initializeDataLoading();
  }

  private async initializeDataLoading(): Promise<void> {
    try {
      await this.loadFromFirestore();
    } catch (e) {
      console.error('Firebase loading failed, falling back to localStorage', e);
      this.loadFromLocalStorage();
    }
    
    if (this.players().size === 0) {
      this.loadFromLocalStorage();
    }
    
    this.firebaseLoaded.set(true);
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

  async isNameTakenAsync(name: string): Promise<boolean> {
    const localFound = this.findPlayerByName(name);
    if (localFound) return true;

    const normalizedName = this.normalizeName(name);
    const cacheKey = normalizedName.toLowerCase();
    
    // Revisar caché
    const now = Date.now();
    if (this.cacheTimestamp + this.CACHE_TTL > now && this.nameCheckCache.has(cacheKey)) {
      return this.nameCheckCache.get(cacheKey)!;
    }

    // Si el caché expiró, limpiar
    if (this.cacheTimestamp + this.CACHE_TTL <= now) {
      this.nameCheckCache.clear();
      this.cacheTimestamp = now;
    }

    try {
      // Timeout de 3 segundos para Firebase (evita esperas largas)
      const firebasePromise = this.syncService.findPlayerByName(name);
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000)
      );

      const result = await Promise.race([firebasePromise, timeoutPromise]);
      const isTaken = Boolean(result);
      
      // Guardar en caché
      this.nameCheckCache.set(cacheKey, isTaken);
      return isTaken;
    } catch (e) {
      console.error('Error checking name in Firestore', e);
      // Si hay error, asumir que está disponible para no bloquear al usuario
      return false;
    }
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
    
    // Guardar en Firestore también
    this.syncService.saveOrUpdatePlayer(player).catch(e => 
      console.error('Failed to save player to Firestore', e)
    );
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
    this.saveTopSnapshot();
  }

  private loadFromLocalStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      this.loadTopSnapshotFallback();
      return;
    }

    try {
      const parsed = JSON.parse(data);
      const localMap = new Map<string, Player>(parsed.players || []);
      
      // Fusionar: Firebase es base, añadir locales que no están en Firebase
      const current = new Map(this.players());
      for (const [id, localPlayer] of localMap) {
        if (!current.has(id)) {
          current.set(id, localPlayer);
        }
      }
      
      this.players.set(current);
      this.gameHistory.set(parsed.gameHistory || []);

      if (current.size === 0) {
        this.loadTopSnapshotFallback();
      }
    } catch (e) {
      console.error('Error loading players from localStorage', e);
      this.loadTopSnapshotFallback();
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
      this.saveToLocalStorage();
    } catch (e) {
      console.error('Error loading shared leaderboard from URL', e);
    }
  }

  private saveTopSnapshot(): void {
    const snapshot: TopSnapshotPayload = {
      updatedAt: Date.now(),
      players: this.getTopSnapshotPlayers(),
    };
    localStorage.setItem(TOP_STORAGE_KEY, JSON.stringify(snapshot));
  }

  private loadTopSnapshotFallback(): void {
    const raw = localStorage.getItem(TOP_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as TopSnapshotPayload;
      if (!Array.isArray(parsed.players)) return;

      const snapshotPlayers = new Map<string, Player>();
      for (const rawPlayer of parsed.players) {
        const player = this.sanitizeSharedPlayer(rawPlayer);
        if (player) {
          snapshotPlayers.set(player.id, player);
        }
      }

      if (snapshotPlayers.size > 0) {
        this.players.set(snapshotPlayers);
      }
    } catch (e) {
      console.error('Error loading top snapshot from localStorage', e);
    }
  }

  private getTopSnapshotPlayers(): Player[] {
    return Array.from(this.players().values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 30);
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
    localStorage.removeItem(TOP_STORAGE_KEY);
  }

  private async loadFromFirestore(): Promise<void> {
    try {
      const topFromFirebase = await this.syncService.getTopPlayers(30);
      if (topFromFirebase.length === 0) return;

      // Firebase es la fuente de verdad: reemplazar todos los datos con lo que viene de Firebase
      const firebaseMap = new Map<string, Player>();
      for (const fbPlayer of topFromFirebase) {
        firebaseMap.set(fbPlayer.id, fbPlayer);
      }
      
      this.players.set(firebaseMap);
      this.gameHistory.set([]);
      
      console.log('Loaded top players from Firestore:', topFromFirebase.length);
    } catch (e) {
      console.error('Error loading top from Firestore', e);
      throw e;
    }
  }
}
