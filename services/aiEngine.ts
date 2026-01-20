
import { Chess, Move } from 'chess.js';

// Basic piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
  p: 10, r: 50, n: 30, b: 33, q: 90, k: 900
};

// Piece-square tables to encourage central control and development
const POSITION_WEIGHTS: { [key: string]: number[][] } = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5],
    [1, 1, 2, 3, 3, 2, 1, 1],
    [0.5, 0.5, 1, 2.5, 2.5, 1, 0.5, 0.5],
    [0, 0, 0, 2, 2, 0, 0, 0],
    [0.5, -0.5, -1, 0, 0, -1, -0.5, 0.5],
    [0.5, 1, 1, -2, -2, 1, 1, 0.5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ]
};

const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        const posBonus = (piece.type === 'p' ? POSITION_WEIGHTS['p'][piece.color === 'w' ? 7 - i : i][j] : 0);
        totalEvaluation += (piece.color === 'w' ? (val + posBonus) : -(val + posBonus));
      }
    }
  }
  return totalEvaluation;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0) return -evaluateBoard(game);

  const moves = game.moves();
  if (isMaximizingPlayer) {
    let bestEval = -9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      alpha = Math.max(alpha, bestEval);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = 9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      beta = Math.min(beta, bestEval);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
};

export const getBestMove = (game: Chess, level: number): string | Move | null => {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Level 1: Mostly random
  if (level === 1 && Math.random() < 0.8) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Define depth based on level (simulated complexity)
  // High levels use minimax with alpha-beta pruning
  let depth = 1;
  if (level >= 8) depth = 3;
  else if (level >= 4) depth = 2;

  // If level is low, introduce some "mistakes"
  const mistakeProbability = Math.max(0, (10 - level) / 15);
  if (Math.random() < mistakeProbability) {
     return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestValue = -9999;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -10000, 10000, false);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
};
