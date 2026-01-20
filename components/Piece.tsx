
import React from 'react';

interface PieceProps {
  type: string;
  color: 'w' | 'b';
}

const Piece: React.FC<PieceProps> = ({ type, color }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#2A2A2A';
  const stroke = isWhite ? '#2A2A2A' : '#FFFFFF';

  const getPiecePath = () => {
    switch (type.toLowerCase()) {
      case 'p': // Pawn
        return <path d="M12 20s-4-1-4-4c0-2 1-3 1-3s-1-1-1-2c0-1 1-2 2-2s2 1 2 2c0 1-1 2-1 2s1 1 1 3c0 3-4 4-4 4z" />;
      case 'r': // Rook
        return <path d="M7 20h10v-3l-1-1V9l1-1V4H7v4l1 1v7l-1 1v3z" strokeLinejoin="round" />;
      case 'n': // Knight
        return <path d="M8 20l1-2 2-1s2-2 2-4V9l-1-2-3 1-1 3 2 1-1 3s-1 1-1 3l1 2z" />;
      case 'b': // Bishop
        return <path d="M12 4s-3 2-3 6c0 2 1 3 1 3s-1 1-1 2c0 1 1 2 3 2s3-1 3-2c0-1-1-2-1-2s1-1 1-3c0-4-3-6-3-6z M12 3v2 M11 5h2" />;
      case 'q': // Queen
        return <path d="M12 4l-4 3v10h8V7l-4-3z M8 4l1 2 M16 4l-1 2 M12 2l1 2 M12 2l-1 2" strokeLinejoin="round" />;
      case 'k': // King
        return <path d="M12 4V2 M10 4h4 M12 4s-3 2-3 4c0 2 1 3 1 3s-2 2-2 6h8c0-4-2-6-2-6s1-1 1-3c0-2-3-4-3-4z" strokeLinejoin="round" />;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] drop-shadow-md transition-transform active:scale-125 duration-150" style={{ pointerEvents: 'none' }}>
      <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {getPiecePath()}
      </g>
    </svg>
  );
};

export default Piece;
