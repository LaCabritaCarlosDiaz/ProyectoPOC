import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { GameService } from './game.service';
import { PlayersService } from './players.service';

describe('GameService', () => {
  let service: GameService;
  const playersServiceMock = {
    recordGameResult: vi.fn(),
  };

  beforeEach(() => {
    playersServiceMock.recordGameResult.mockReset();

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: PlayersService, useValue: playersServiceMock },
      ],
    });

    service = TestBed.inject(GameService);
  });

  it('inicia con estado base esperado', () => {
    expect(service.board()).toHaveLength(9);
    expect(service.currentPlayer()).toBe('X');
    expect(service.gameOver()).toBe(false);
    expect(service.winner()).toBeNull();
    expect(service.round()).toBe(1);
  });

  it('al mover X en modo vs computadora activa turno de maquina', () => {
    service.makeMove(0);

    expect(service.board()[0]).toBe('X');
    expect(service.currentPlayer()).toBe('O');
    expect(service.isMachineThinking()).toBe(true);
    expect(service.machineMovePending()).toBe(true);
  });

  it('resuelve victoria de X y registra resultado para jugador humano', () => {
    service.board.set(['X', 'X', null, null, null, null, null, null, null]);
    service.currentPlayer.set('X');

    service.makeMove(2);

    expect(service.winner()).toBe('X');
    expect(service.gameOver()).toBe(true);
    expect(service.scoreX()).toBe(1);
    expect(service.winningCells()).toEqual([0, 1, 2]);
    expect(playersServiceMock.recordGameResult).toHaveBeenCalledWith('win', 'X');
  });

  it('resuelve empate y registra resultado', () => {
    service.board.set(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null]);
    service.currentPlayer.set('X');

    service.makeMove(8);

    expect(service.winner()).toBe('draw');
    expect(service.gameOver()).toBe(true);
    expect(service.scoreDraw()).toBe(1);
    expect(playersServiceMock.recordGameResult).toHaveBeenCalledWith('draw', 'X');
  });

  it('ignora movimiento en celda ocupada, juego terminado o maquina pensando', () => {
    service.board.set(['X', null, null, null, null, null, null, null, null]);
    service.makeMove(0);
    expect(service.board()[0]).toBe('X');

    service.gameOver.set(true);
    service.makeMove(1);
    expect(service.board()[1]).toBeNull();

    service.gameOver.set(false);
    service.isMachineThinking.set(true);
    service.makeMove(1);
    expect(service.board()[1]).toBeNull();
  });

  it('setMode y setDifficulty reinician marcador y ronda', () => {
    service.scoreX.set(3);
    service.scoreO.set(2);
    service.scoreDraw.set(1);
    service.round.set(7);

    service.setMode(false);
    expect(service.vsComputer()).toBe(false);
    expect(service.scoreX()).toBe(0);
    expect(service.scoreO()).toBe(0);
    expect(service.scoreDraw()).toBe(0);
    expect(service.round()).toBe(1);

    service.scoreX.set(1);
    service.round.set(3);
    service.setDifficulty('easy');
    expect(service.difficulty()).toBe('easy');
    expect(service.scoreX()).toBe(0);
    expect(service.round()).toBe(1);
  });

  it('confirmResult reinicia tablero y avanza ronda', () => {
    service.board.set(['X', 'X', 'X', null, null, null, null, null, null]);
    service.winner.set('X');
    service.gameOver.set(true);
    service.resultConfirmed.set(true);
    service.round.set(2);

    service.confirmResult();

    expect(service.resultConfirmed()).toBe(false);
    expect(service.gameOver()).toBe(false);
    expect(service.winner()).toBeNull();
    expect(service.board().every((c) => c === null)).toBe(true);
    expect(service.round()).toBe(3);
  });

  it('runMachineMove ejecuta movimiento aleatorio en easy', () => {
    service.setDifficulty('easy');
    service.board.set(['X', null, null, null, null, null, null, null, null]);
    service.currentPlayer.set('O');
    service.isMachineThinking.set(true);
    service.machineMovePending.set(true);
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    service.runMachineMove();

    expect(service.machineMovePending()).toBe(false);
    expect(service.isMachineThinking()).toBe(false);
    expect(service.board()[1]).toBe('O');
    expect(service.currentPlayer()).toBe('X');
    mathSpy.mockRestore();
  });

  it('runMachineMove con hard usa minimax para bloquear/ganar', () => {
    service.setDifficulty('hard');
    service.board.set(['O', 'O', null, 'X', 'X', null, null, null, null]);
    service.currentPlayer.set('O');
    service.isMachineThinking.set(true);
    service.machineMovePending.set(true);

    service.runMachineMove();

    expect(service.board()[2]).toBe('O');
    expect(service.winner()).toBe('O');
    expect(service.gameOver()).toBe(true);
    expect(playersServiceMock.recordGameResult).toHaveBeenCalledWith('loss', 'X');
  });

  it('runMachineMove no altera tablero si no hay espacios', () => {
    const fullBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as const;
    service.setDifficulty('easy');
    service.board.set([...fullBoard]);
    service.isMachineThinking.set(true);
    service.machineMovePending.set(true);

    service.runMachineMove();

    expect(service.board()).toEqual([...fullBoard]);
    expect(service.isMachineThinking()).toBe(false);
  });

  it('statusMessage y statusModifier reflejan estado de juego', () => {
    service.isMachineThinking.set(true);
    expect(service.statusMessage()).toContain('La máquina está pensando');

    service.isMachineThinking.set(false);
    service.vsComputer.set(false);
    service.currentPlayer.set('O');
    expect(service.statusModifier()).toBe('playing');
    expect(service.statusMessage()).toContain('Turno del Jugador O');

    service.winner.set('X');
    expect(service.statusModifier()).toBe('win');
    expect(service.statusMessage()).toContain('Jugador X gana la ronda');

    service.vsComputer.set(true);
    service.winner.set('O');
    expect(service.statusModifier()).toBe('lose');
    expect(service.statusMessage()).toContain('La máquina gana');

    service.winner.set('draw');
    expect(service.statusModifier()).toBe('draw');
    expect(service.statusMessage()).toContain('Empate');
  });

  it('en modo jugador vs jugador no registra resultados en PlayersService', () => {
    service.setMode(false);
    service.board.set(['X', 'X', null, null, null, null, null, null, null]);
    service.currentPlayer.set('X');

    service.makeMove(2);

    expect(service.winner()).toBe('X');
    expect(playersServiceMock.recordGameResult).not.toHaveBeenCalled();
  });
});