
import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import Piece from './Piece';

interface ChessBoardProps {
  game: Chess;
  onMove: (move: string | { from: string; to: string; promotion?: string }) => void;
  highlightEnabled: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ game, onMove, highlightEnabled }) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  const handleSquareClick = (square: Square) => {
    // If a square is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const moveStr = validMoves.find(m => m.endsWith(square) || m === square);
      if (moveStr) {
        onMove({ from: selectedSquare, to: square, promotion: 'q' });
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Switch selection if clicking own piece
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          setValidMoves(game.moves({ square, verbose: true }).map(m => m.to));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // First click: select piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }).map(m => m.to));
      }
    }
  };

  const renderSquare = (i: number, j: number) => {
    const file = String.fromCharCode(97 + j);
    const rank = 8 - i;
    const square = `${file}${rank}` as Square;
    const isDark = (i + j) % 2 === 1;
    const piece = game.get(square);
    const isSelected = selectedSquare === square;
    const isValidTarget = validMoves.includes(square);
    const lastMove = game.history({ verbose: true }).pop();
    const isLastMoveOrigin = lastMove && lastMove.from === square;
    const isLastMoveTarget = lastMove && lastMove.to === square;

    return (
      <div
        key={square}
        onClick={() => handleSquareClick(square)}
        className={`
          relative w-full aspect-square flex items-center justify-center cursor-pointer
          ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
          ${highlightEnabled && isSelected ? 'bg-yellow-200' : ''}
          ${highlightEnabled && (isLastMoveOrigin || isLastMoveTarget) ? 'bg-yellow-100/60' : ''}
        `}
      >
        {piece && <Piece type={piece.type} color={piece.color} />}
        
        {/* Valid move indicator */}
        {highlightEnabled && isValidTarget && (
          <div className={`absolute w-1/3 h-1/3 rounded-full ${piece ? 'border-4 border-black/10' : 'bg-black/10'}`} />
        )}

        {/* Labels for beginners */}
        {j === 0 && <span className={`absolute top-0.5 left-0.5 text-[8px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{rank}</span>}
        {i === 7 && <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{file}</span>}
      </div>
    );
  };

  const rows = [];
  for (let i = 0; i < 8; i++) {
    const squares = [];
    for (let j = 0; j < 8; j++) {
      squares.push(renderSquare(i, j));
    }
    rows.push(<div key={i} className="flex w-full">{squares}</div>);
  }

  return (
    <div className="w-full max-w-[400px] border-4 border-[#312e2b] shadow-2xl rounded-sm overflow-hidden select-none">
      {rows}
    </div>
  );
};

export default ChessBoard;
