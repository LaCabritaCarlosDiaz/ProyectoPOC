import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LeaderboardSyncService } from './leaderboard-sync.service';
import { PlayersService } from './players.service';
import { Player } from '../models/player.types';

describe('PlayersService', () => {
  let service: PlayersService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  const syncServiceMock = {
    getTopPlayers: vi.fn().mockResolvedValue([]),
    findPlayerByName: vi.fn().mockResolvedValue(null),
    saveOrUpdatePlayer: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    history.replaceState({}, '', '/');

    TestBed.configureTestingModule({
      providers: [
        PlayersService,
        { provide: LeaderboardSyncService, useValue: syncServiceMock },
      ],
    });

    service = TestBed.inject(PlayersService);
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('ordena topPlayers y worstPlayers correctamente', () => {
    const players = new Map<string, Player>([
      ['1', { id: '1', name: 'P1', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 5, score: 0, rating: 70 }],
      ['2', { id: '2', name: 'P2', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 5, score: 0, rating: 50 }],
      ['3', { id: '3', name: 'P3', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 5, score: 0, rating: 90 }],
      ['4', { id: '4', name: 'P4', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 5, score: 0, rating: 20 }],
      ['5', { id: '5', name: 'P5', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 2, score: 0, rating: 10 }],
      ['6', { id: '6', name: 'P6', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 7, score: 0, rating: 10 }],
    ]);
    service.players.set(players);

    expect(service.topPlayers().map((p) => p.id)).toEqual(['3', '1', '2', '4', '5']);
    expect(service.worstPlayers().map((p) => p.id)).toEqual(['6']);
  });

  it('crea jugador con nombre normalizado y evita duplicados', () => {
    const created = service.setCurrentPlayer('  Carlos   Diaz  ');
    const duplicated = service.setCurrentPlayer('Carlos Diaz');

    expect(created).toBe(true);
    expect(service.currentPlayer()?.name).toBe('Carlos Diaz');
    expect(duplicated).toBe(false);
    expect(service.players().size).toBe(1);
  });

  it('setCurrentPlayer retorna false para nombre vacio', () => {
    const created = service.setCurrentPlayer('   ');
    expect(created).toBe(false);
  });

  it('actualiza estadisticas y rating al registrar victoria', () => {
    service.setCurrentPlayer('Ana');

    service.recordGameResult('win', 'X');

    const current = service.currentPlayer();
    expect(current).not.toBeNull();
    expect(current?.winsX).toBe(1);
    expect(current?.winsO).toBe(0);
    expect(current?.draws).toBe(0);
    expect(current?.losses).toBe(0);
    expect(current?.totalGames).toBe(1);
    expect(current?.score).toBe(1);
    expect(current?.rating).toBe(1);
    expect(service.gameHistory()).toHaveLength(1);
    expect(syncServiceMock.saveOrUpdatePlayer).toHaveBeenCalledTimes(1);
  });

  it('registra victoria como O, derrota y empate', () => {
    service.setCurrentPlayer('Ana');

    service.recordGameResult('win', 'O');
    service.recordGameResult('loss', 'X');
    service.recordGameResult('draw', 'X');

    const current = service.currentPlayer();
    expect(current?.winsO).toBe(1);
    expect(current?.losses).toBe(1);
    expect(current?.draws).toBe(1);
    expect(current?.totalGames).toBe(3);
    expect(service.gameHistory()).toHaveLength(3);
  });

  it('no hace cambios si no hay currentPlayer al registrar resultado', () => {
    service.recordGameResult('win', 'X');

    expect(service.gameHistory()).toHaveLength(0);
    expect(syncServiceMock.saveOrUpdatePlayer).not.toHaveBeenCalled();
  });

  it('no registra resultado si currentPlayerId apunta a jugador inexistente', () => {
    service.currentPlayerId.set('ghost');
    service.recordGameResult('win', 'X');

    expect(service.gameHistory()).toHaveLength(0);
    expect(syncServiceMock.saveOrUpdatePlayer).not.toHaveBeenCalled();
  });

  it('isNameTakenAsync usa cache cuando esta vigente', async () => {
    (service as any).nameCheckCache.set('ana', true);
    (service as any).cacheTimestamp = Date.now();

    const taken = await service.isNameTakenAsync('Ana');

    expect(taken).toBe(true);
    expect(syncServiceMock.findPlayerByName).not.toHaveBeenCalled();
  });

  it('isNameTakenAsync consulta firebase y cachea resultado', async () => {
    syncServiceMock.findPlayerByName.mockResolvedValueOnce({ id: 'x' } as Player);
    (service as any).cacheTimestamp = 0;

    const taken = await service.isNameTakenAsync('  Ana  ');

    expect(taken).toBe(true);
    expect(syncServiceMock.findPlayerByName).toHaveBeenCalledWith('  Ana  ');
    expect((service as any).nameCheckCache.get('ana')).toBe(true);
  });

  it('isNameTakenAsync retorna false cuando firebase falla', async () => {
    syncServiceMock.findPlayerByName.mockRejectedValueOnce(new Error('boom'));

    const taken = await service.isNameTakenAsync('ErrorName');

    expect(taken).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('isNameTakenAsync retorna true si ya existe localmente', async () => {
    service.setCurrentPlayer('Local Name');

    const taken = await service.isNameTakenAsync('Local Name');

    expect(taken).toBe(true);
    expect(syncServiceMock.findPlayerByName).not.toHaveBeenCalled();
  });

  it('isNameTakenAsync cae por timeout de 3 segundos', async () => {
    vi.useFakeTimers();
    syncServiceMock.findPlayerByName.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    const promise = service.isNameTakenAsync('slow name');
    await vi.advanceTimersByTimeAsync(3000);
    const taken = await promise;

    expect(taken).toBe(false);
  });

  it('createShareUrl serializa jugadores y decodeSharePayload los recupera', () => {
    const players = new Map<string, Player>([
      ['1', { id: '1', name: 'Uno', winsX: 1, winsO: 0, draws: 0, losses: 0, totalGames: 1, score: 1, rating: 1 }],
      ['2', { id: '2', name: 'Dos', winsX: 0, winsO: 1, draws: 0, losses: 0, totalGames: 1, score: 1, rating: 1 }],
    ]);
    service.players.set(players);

    const shareUrl = service.createShareUrl();
    const lbParam = new URL(shareUrl).searchParams.get('lb');
    const decoded = (service as any).decodeSharePayload(lbParam);

    expect(shareUrl).toContain('lb=');
    expect(decoded.v).toBe(1);
    expect(decoded.players).toHaveLength(2);
  });

  it('createShareUrl retorna cadena vacia cuando window no existe', () => {
    vi.stubGlobal('window', undefined);

    expect(service.createShareUrl()).toBe('');
    vi.unstubAllGlobals();
  });

  it('loadFromShareUrl aplica ranking compartido valido', () => {
    const payload = {
      v: 1,
      players: [
        { id: 'p1', name: 'Shared A', winsX: 1, winsO: 0, draws: 0, losses: 0, totalGames: 1, score: 1, rating: 10 },
      ],
    };
    const encoded = (service as any).encodeSharePayload(payload);
    history.replaceState({}, '', `/?lb=${encoded}`);

    (service as any).loadFromShareUrl();

    expect(service.sharedLeaderboardLoaded()).toBe(true);
    expect(service.players().size).toBe(1);
    expect(service.currentPlayerId()).toBeNull();
  });

  it('loadFromShareUrl ignora payload invalido sin romper', () => {
    history.replaceState({}, '', '/?lb=invalid_base64');

    (service as any).loadFromShareUrl();

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('loadFromShareUrl ignora payload con version incorrecta o jugadores invalidos', () => {
    const wrongVersion = (service as any).encodeSharePayload({ v: 99, players: [] });
    history.replaceState({}, '', `/?lb=${wrongVersion}`);
    (service as any).loadFromShareUrl();
    expect(service.sharedLeaderboardLoaded()).toBe(false);

    const invalidPlayers = (service as any).encodeSharePayload({
      v: 1,
      players: [{ id: 123, name: 'bad' }],
    });
    history.replaceState({}, '', `/?lb=${invalidPlayers}`);
    (service as any).loadFromShareUrl();
    expect(service.sharedLeaderboardLoaded()).toBe(false);
  });

  it('loadFromShareUrl retorna si window no existe', () => {
    vi.stubGlobal('window', undefined);
    expect(() => (service as any).loadFromShareUrl()).not.toThrow();
    vi.unstubAllGlobals();
  });

  it('loadFromLocalStorage hace fallback a top snapshot cuando json es invalido', () => {
    localStorage.setItem('tic-tac-toe-top-snapshot', JSON.stringify({
      updatedAt: Date.now(),
      players: [{ id: 'fb', name: 'Fallback', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 0, score: 0, rating: 5 }],
    }));
    localStorage.setItem('tic-tac-toe-players', '{invalid-json');

    (service as any).loadFromLocalStorage();

    expect(service.players().has('fb')).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('loadFromLocalStorage cubre merge sin duplicados y gameHistory por defecto', () => {
    const existing = new Map<string, Player>([
      ['same', { id: 'same', name: 'Existing', winsX: 0, winsO: 0, draws: 0, losses: 0, totalGames: 0, score: 0, rating: 1 }],
    ]);
    service.players.set(existing);

    localStorage.setItem('tic-tac-toe-players', JSON.stringify({
      players: [
        ['same', { id: 'same', name: 'Local', winsX: 1, winsO: 0, draws: 0, losses: 0, totalGames: 1, score: 1, rating: 1 }],
      ],
    }));

    (service as any).loadFromLocalStorage();

    expect(service.players().get('same')?.name).toBe('Existing');
    expect(service.gameHistory()).toEqual([]);
  });

  it('loadTopSnapshotFallback ignora formato no valido', () => {
    localStorage.setItem('tic-tac-toe-top-snapshot', JSON.stringify({ updatedAt: Date.now(), players: 'oops' }));

    (service as any).loadTopSnapshotFallback();

    expect(service.players().size).toBe(0);
  });

  it('loadTopSnapshotFallback ignora players no sanitizables', () => {
    localStorage.setItem('tic-tac-toe-top-snapshot', JSON.stringify({
      updatedAt: Date.now(),
      players: [{ id: 1, name: 'bad' }],
    }));

    (service as any).loadTopSnapshotFallback();

    expect(service.players().size).toBe(0);
  });

  it('sanitizeSharedPlayer y safeNumber manejan valores no validos', () => {
    const sanitizedNull = (service as any).sanitizeSharedPlayer(null);
    const sanitizedInvalid = (service as any).sanitizeSharedPlayer({ id: 1, name: 'X' });
    const sanitizedValid = (service as any).sanitizeSharedPlayer({
      id: 'ok',
      name: '  Nombre   Largo ',
      winsX: 'NaN',
      winsO: 1,
      draws: Infinity,
      losses: 0,
      totalGames: 1,
      score: 1,
      rating: 2,
    });

    expect(sanitizedNull).toBeNull();
    expect(sanitizedInvalid).toBeNull();
    expect(sanitizedValid.name).toBe('Nombre Largo');
    expect(sanitizedValid.winsX).toBe(0);
    expect(sanitizedValid.draws).toBe(0);
  });

  it('clearAllData limpia estado en memoria y localStorage', () => {
    service.setCurrentPlayer('ToDelete');
    localStorage.setItem('tic-tac-toe-top-snapshot', JSON.stringify({ updatedAt: Date.now(), players: [] }));

    service.clearAllData();

    expect(service.players().size).toBe(0);
    expect(service.currentPlayerId()).toBeNull();
    expect(service.gameHistory()).toHaveLength(0);
    expect(localStorage.getItem('tic-tac-toe-players')).toBeNull();
    expect(localStorage.getItem('tic-tac-toe-top-snapshot')).toBeNull();
  });

  it('loadFromFirestore llena players cuando firebase responde datos', async () => {
    syncServiceMock.getTopPlayers.mockResolvedValueOnce([
      { id: 'firebase-1', name: 'Fb', winsX: 1, winsO: 0, draws: 0, losses: 0, totalGames: 1, score: 1, rating: 1 },
    ]);

    await (service as any).loadFromFirestore();

    expect(service.players().has('firebase-1')).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('loadFromFirestore propaga error y registra log', async () => {
    syncServiceMock.getTopPlayers.mockRejectedValueOnce(new Error('firebase down'));

    await expect((service as any).loadFromFirestore()).rejects.toThrow('firebase down');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});