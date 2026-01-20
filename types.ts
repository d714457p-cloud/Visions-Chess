
export enum GameMode {
  HUMAN_VS_AI = 'HUMAN_VS_AI',
  HUMAN_VS_HUMAN = 'HUMAN_VS_HUMAN',
  PRACTICE = 'PRACTICE'
}

export interface GameStats {
  playerName: string;
  opponent: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface MatchHistory {
  date: string;
  player: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  mode: GameMode;
}

export interface Settings {
  soundEnabled: boolean;
  moveHighlightEnabled: boolean;
  autoLevelUp: boolean;
  playerName: string;
}

export type View = 'MENU' | 'PLAY' | 'SCOREBOARD' | 'RULES' | 'SETTINGS' | 'SELECT_LEVEL' | 'CHOOSE_MODE';
