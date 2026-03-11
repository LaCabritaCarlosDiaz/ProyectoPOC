import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Cell, Player, Difficulty, Winner, StatusModifier,
  WIN_COMBOS, BOARD_SIZE,
} from '../models/game.types';
import { PlayersService } from './players.service';

const EMPTY_BOARD = (): Cell[] => Array(BOARD_SIZE).fill(null);

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly playersService = inject(PlayersService);

  // ── Estado público ─────────────────────────────────────────────────────────
  readonly board = signal<Cell[]>(EMPTY_BOARD());
  readonly currentPlayer = signal<Player>('X');
  readonly gameOver = signal(false);
  readonly winner = signal<Winner>(null);
  readonly winningCells = signal<number[]>([]);
  readonly isMachineThinking = signal(false);
  readonly vsComputer = signal(true);
  readonly difficulty = signal<Difficulty>('hard');
  readonly scoreX = signal(0);
  readonly scoreO = signal(0);
  readonly scoreDraw = signal(0);
  readonly round = signal(1);

  /**
   * Señal que indica al componente que debe disparar el movimiento de la
   * máquina tras el retardo de UX. Se gestiona fuera del servicio para
   * mantener el servicio libre de efectos secundarios de tiempo.
   */
  readonly machineMovePending = signal(false);

  /**
   * Señal que controla si el usuario ha confirmado el resultado
   * de la partida (ganó, perdió o empató).
   */
  readonly resultConfirmed = signal(false);

  // ── Estado derivado ────────────────────────────────────────────────────────
  readonly statusModifier = computed((): StatusModifier => {
    const w = this.winner();
    if (w === 'draw') return 'draw';
    if (w) return this.vsComputer() && w === 'O' ? 'lose' : 'win';
    return 'playing';
  });

  readonly statusMessage = computed((): string => {
    if (this.isMachineThinking()) return '🤖 La máquina está pensando...';
    const w = this.winner();
    if (w === 'draw') return '¡Empate! Nadie gana esta vez 🤝';
    if (w) {
      return this.vsComputer()
        ? (w === 'X' ? '🎉 ¡Ganaste!' : '🤖 La máquina gana')
        : `🎉 ¡Jugador ${w} gana la ronda!`;
    }
    return this.vsComputer()
      ? 'Tu turno ❌'
      : `Turno del Jugador ${this.currentPlayer()} ${this.currentPlayer() === 'X' ? '❌' : '⭕'}`;
  });

  // ── API pública ────────────────────────────────────────────────────────────
  setMode(vsComputer: boolean): void {
    this.vsComputer.set(vsComputer);
    this.resetAll();
  }

  setDifficulty(d: Difficulty): void {
    this.difficulty.set(d);
    this.resetAll();
  }

  makeMove(index: number): void {
    if (this.board()[index] || this.gameOver() || this.isMachineThinking()) return;

    const newBoard = this.withMove([...this.board()], index, this.currentPlayer());
    this.board.set(newBoard);

    if (this.resolveBoard(newBoard, this.currentPlayer())) return;

    this.currentPlayer.set(this.currentPlayer() === 'X' ? 'O' : 'X');

    if (this.vsComputer()) {
      this.isMachineThinking.set(true);
      this.machineMovePending.set(true);
    }
  }

  /** Llamado por el componente después del retardo de UX */
  runMachineMove(): void {
    this.machineMovePending.set(false);
    this.executeMachineMove();
  }

  /**
   * Llamado cuando el usuario confirma un resultado (OK).
   * Inicia automáticamente la siguiente ronda.
   */
  confirmResult(): void {
    this.resultConfirmed.set(false);
    this.restartRound();
  }

  restartRound(): void {
    this.resetBoardState();
    this.round.update(r => r + 1);
  }

  resetAll(): void {
    this.resetBoardState();
    this.scoreX.set(0);
    this.scoreO.set(0);
    this.scoreDraw.set(0);
    this.round.set(1);
  }

  // ── Privado ────────────────────────────────────────────────────────────────
  private resetBoardState(): void {
    this.board.set(EMPTY_BOARD());
    this.currentPlayer.set('X');
    this.gameOver.set(false);
    this.winner.set(null);
    this.winningCells.set([]);
    this.isMachineThinking.set(false);
    this.machineMovePending.set(false);
  }

  private executeMachineMove(): void {
    const board = this.board();
    const idx = this.difficulty() === 'hard'
      ? this.bestMoveMinimax(board)
      : this.randomMove(board);

    this.isMachineThinking.set(false);
    if (idx === -1) return;

    const newBoard = this.withMove([...board], idx, 'O');
    this.board.set(newBoard);

    if (this.resolveBoard(newBoard, 'O')) return;
    this.currentPlayer.set('X');
  }

  private resolveBoard(board: Cell[], player: Player): boolean {
    const winCombo = this.findWinningCombo(board);
    if (winCombo) {
      this.winningCells.set(winCombo);
      this.winner.set(player);
      this.gameOver.set(true);
      this.resultConfirmed.set(true);
      if (player === 'X') this.scoreX.update(s => s + 1);
      else this.scoreO.update(s => s + 1);
      
      // Registrar resultado en PlayersService si es jugador humano
      if (this.vsComputer() && player === 'X') {
        this.playersService.recordGameResult('win', 'X');
      } else if (this.vsComputer() && player === 'O') {
        this.playersService.recordGameResult('loss', 'X');
      }
      return true;
    }
    if (board.every(c => c !== null)) {
      this.winner.set('draw');
      this.gameOver.set(true);
      this.resultConfirmed.set(true);
      this.scoreDraw.update(s => s + 1);
      
      // Registrar empate si es vs Computer
      if (this.vsComputer()) {
        this.playersService.recordGameResult('draw', 'X');
      }
      return true;
    }
    return false;
  }

  private withMove(board: Cell[], index: number, player: Player): Cell[] {
    board[index] = player;
    return board;
  }

  private randomMove(board: Cell[]): number {
    const empty = board.reduce<number[]>((acc, c, i) => (c === null ? [...acc, i] : acc), []);
    return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1;
  }

  private bestMoveMinimax(board: Cell[]): number {
    let bestScore = -Infinity;
    let bestIdx = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i] !== null) continue;
      board[i] = 'O';
      const score = this.minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  }

  private minimax(board: Cell[], depth: number, isMaximizing: boolean): number {
    const w = this.evaluateWinner(board);
    if (w === 'O') return 10 - depth;
    if (w === 'X') return depth - 10;
    if (board.every(c => c !== null)) return 0;

    const player: Cell = isMaximizing ? 'O' : 'X';
    const compare = isMaximizing ? Math.max : Math.min;
    let best = isMaximizing ? -Infinity : Infinity;

    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i] !== null) continue;
      board[i] = player;
      best = compare(best, this.minimax(board, depth + 1, !isMaximizing));
      board[i] = null;
    }
    return best;
  }

  private evaluateWinner(board: Cell[]): Player | null {
    for (const [a, b, c] of WIN_COMBOS) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as Player;
    }
    return null;
  }

  private findWinningCombo(board: Cell[]): [number, number, number] | null {
    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return combo;
    }
    return null;
  }
}
