export type Cell = 'X' | 'O' | null;
export type Player = 'X' | 'O';
export type Difficulty = 'easy' | 'hard';
export type Winner = Player | 'draw' | null;
export type StatusModifier = 'playing' | 'win' | 'lose' | 'draw';

export const WIN_COMBOS: readonly [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const MACHINE_DELAY_MS = 500;
export const BOARD_SIZE = 9;
