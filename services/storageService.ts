
import { GameStats, MatchHistory, Settings } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const KEYS = {
  STATS: 'vchess_stats',
  HISTORY: 'vchess_history',
  SETTINGS: 'vchess_settings',
  MAX_LEVEL: 'vchess_max_level'
};

export const storageService = {
  getStats: (): GameStats[] => {
    const data = localStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : [];
  },

  saveStats: (stats: GameStats[]) => {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  updateStats: (playerName: string, opponent: string, result: 'Win' | 'Loss' | 'Draw') => {
    const stats = storageService.getStats();
    const existingIndex = stats.findIndex(s => s.playerName === playerName && s.opponent === opponent);
    
    if (existingIndex > -1) {
      if (result === 'Win') stats[existingIndex].wins++;
      else if (result === 'Loss') stats[existingIndex].losses++;
      else stats[existingIndex].draws++;
    } else {
      stats.push({
        playerName,
        opponent,
        wins: result === 'Win' ? 1 : 0,
        losses: result === 'Loss' ? 1 : 0,
        draws: result === 'Draw' ? 1 : 0
      });
    }
    storageService.saveStats(stats);
  },

  getHistory: (): MatchHistory[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  addHistory: (entry: MatchHistory) => {
    const history = storageService.getHistory();
    history.unshift(entry);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
  },

  getSettings: (): Settings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },

  saveSettings: (settings: Settings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getMaxUnlockedLevel: (): number => {
    const data = localStorage.getItem(KEYS.MAX_LEVEL);
    return data ? parseInt(data, 10) : 1;
  },

  unlockNextLevel: (currentLevel: number) => {
    const max = storageService.getMaxUnlockedLevel();
    if (currentLevel >= max && max < 10) {
      localStorage.setItem(KEYS.MAX_LEVEL, (max + 1).toString());
      return max + 1;
    }
    return max;
  },

  resetStats: () => {
    localStorage.removeItem(KEYS.STATS);
    localStorage.removeItem(KEYS.HISTORY);
  }
};
