export interface Player {
  id: string;
  name: string;
  winsX: number;       // Partidas ganadas como X
  winsO: number;       // Partidas ganadas como O
  draws: number;       // Partidas empatadas
  losses: number;      // Partidas perdidas
  totalGames: number;
  score: number;       // winsX + winsO (principales)
  rating: number;      // (winsX + winsO + draws) - ranking score
}

export interface GameRecord {
  playerId: string;
  playerName: string;
  result: 'win' | 'loss' | 'draw';
  playerSymbol: 'X' | 'O';
  timestamp: number;
}
