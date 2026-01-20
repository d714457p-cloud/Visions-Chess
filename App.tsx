
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { GameMode, View, Settings, GameStats, MatchHistory } from './types';
import { AI_LEVELS } from './constants';
import { storageService } from './services/storageService';
import { getBestMove } from './services/aiEngine';
import ChessBoard from './components/ChessBoard';
import AdBanner from './components/AdBanner';
import { 
  Play, Users, BookOpen, BarChart3, Settings as SettingsIcon, 
  ChevronLeft, RotateCcw, Trophy, Award, History, Info, Volume2, VolumeX, Eye, EyeOff, Trash2,
  ExternalLink, LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<View | 'SPLASH'>('SPLASH');
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<GameMode>(GameMode.HUMAN_VS_AI);
  const [aiLevel, setAiLevel] = useState(1);
  const [settings, setSettings] = useState<Settings>(storageService.getSettings());
  const [stats, setStats] = useState<GameStats[]>(storageService.getStats());
  const [history, setHistory] = useState<MatchHistory[]>(storageService.getHistory());
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(storageService.getMaxUnlockedLevel());
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [undoUsed, setUndoUsed] = useState(false);

  // Splash screen effect
  useEffect(() => {
    if (view === 'SPLASH') {
      const timer = setTimeout(() => {
        setView('MENU');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Initialize data
  useEffect(() => {
    const savedSettings = storageService.getSettings();
    setSettings(savedSettings);
    setMaxUnlockedLevel(storageService.getMaxUnlockedLevel());
  }, []);

  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'gameover') => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'move') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'check') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  }, [settings.soundEnabled]);

  const makeMove = useCallback((move: any) => {
    try {
      const isCapture = game.get(move.to) !== null;
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        
        if (game.isCheck()) playSound('check');
        else if (isCapture) playSound('capture');
        else playSound('move');

        checkGameOver();
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game, playSound]);

  const checkGameOver = useCallback(() => {
    if (game.isGameOver()) {
      playSound('gameover');
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      const isDraw = game.isDraw();
      const result = isDraw ? 'Draw' : (winner === 'White' ? 'Win' : 'Loss');
      
      if (mode !== GameMode.PRACTICE) {
        const opponentName = mode === GameMode.HUMAN_VS_AI ? `Vision ${aiLevel}` : 'Human';
        storageService.updateStats(settings.playerName, opponentName, result as any);
        storageService.addHistory({
          date: new Date().toLocaleDateString(),
          player: settings.playerName,
          opponent: opponentName,
          result: result as any,
          mode
        });
        
        if (result === 'Win' && mode === GameMode.HUMAN_VS_AI && settings.autoLevelUp) {
          const newMax = storageService.unlockNextLevel(aiLevel);
          setMaxUnlockedLevel(newMax);
        }

        setStats(storageService.getStats());
        setHistory(storageService.getHistory());
      }
      setShowGameOver(true);
    }
  }, [game, mode, aiLevel, settings.playerName, settings.autoLevelUp, playSound]);

  useEffect(() => {
    if (mode === GameMode.HUMAN_VS_AI && game.turn() === 'b' && !game.isGameOver()) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestMove(game, aiLevel);
        if (bestMove) {
          makeMove(bestMove);
        }
        setIsAiThinking(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [game.fen(), mode, aiLevel, makeMove]);

  const handleReset = () => {
    setGame(new Chess());
    setShowGameOver(false);
    setUndoUsed(false);
  };

  const handleUndo = () => {
    if (game.isGameOver()) return;
    if (mode === GameMode.PRACTICE || !undoUsed) {
      game.undo();
      if (mode === GameMode.HUMAN_VS_AI) game.undo();
      setGame(new Chess(game.fen()));
      if (mode !== GameMode.PRACTICE) setUndoUsed(true);
      playSound('move');
    }
  };

  const renderSplash = () => (
    <div className="flex flex-col items-center justify-center h-full bg-white animate-pulse">
      <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl mb-6">
        <Play className="w-24 h-24 text-white fill-current" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tighter">VISION'S CHESS</h1>
      <div className="mt-8 text-slate-400 text-sm font-medium tracking-widest uppercase">Loading Grandmaster...</div>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 space-y-4 bg-slate-50">
      <div className="mb-10 flex flex-col items-center">
        <div className="bg-white p-5 rounded-[32px] shadow-xl mb-4 border border-slate-100">
          <Play className="w-16 h-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Vision’s Chess</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Simple. Clean. Professional.</p>
      </div>

      <button onClick={() => setView('CHOOSE_MODE')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">
        <Play className="mr-3 w-6 h-6 fill-current" /> Play Game
      </button>
      
      <div className="grid grid-cols-2 gap-4 w-full">
        <button onClick={() => setView('SCOREBOARD')} className="bg-white text-slate-700 py-4 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm border border-slate-200 active:scale-95 transition-all">
          <BarChart3 className="mb-1 w-6 h-6 text-indigo-500" /> Stats
        </button>
        <button onClick={() => setView('RULES')} className="bg-white text-slate-700 py-4 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm border border-slate-200 active:scale-95 transition-all">
          <BookOpen className="mb-1 w-6 h-6 text-indigo-500" /> Rules
        </button>
      </div>

      <button onClick={() => setView('SETTINGS')} className="w-full bg-white text-slate-700 py-5 rounded-2xl flex items-center justify-center font-bold shadow-sm border border-slate-200 active:scale-95 transition-all">
        <SettingsIcon className="mr-3 w-6 h-6 text-slate-400" /> Settings
      </button>
      
      <button onClick={() => window.location.reload()} className="w-full text-slate-400 py-2 font-bold text-xs uppercase tracking-widest flex items-center justify-center mt-4">
        <LogOut className="w-3 h-3 mr-2" /> Exit Game
      </button>
    </div>
  );

  const renderChooseMode = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 flex items-center bg-white border-b">
        <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-black flex-1 text-center pr-8 text-slate-800">Choose Mode</h2>
      </div>
      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
        <div onClick={() => { setMode(GameMode.HUMAN_VS_AI); setView('SELECT_LEVEL'); }} className="group p-6 bg-white rounded-[32px] border border-slate-100 hover:border-indigo-500 shadow-sm cursor-pointer transition-all flex items-center">
          <div className="p-4 bg-indigo-50 rounded-2xl mr-5 group-hover:scale-110 transition-transform"><Trophy className="text-indigo-600 w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-xl text-slate-800">Human vs AI</h3>
            <p className="text-sm text-slate-400">Play against Vision AI</p>
          </div>
        </div>
        <div onClick={() => { setMode(GameMode.HUMAN_VS_HUMAN); handleReset(); setView('PLAY'); }} className="group p-6 bg-white rounded-[32px] border border-slate-100 hover:border-indigo-500 shadow-sm cursor-pointer transition-all flex items-center">
          <div className="p-4 bg-blue-50 rounded-2xl mr-5 group-hover:scale-110 transition-transform"><Users className="text-blue-600 w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-xl text-slate-800">Human vs Human</h3>
            <p className="text-sm text-slate-400">Face off locally with a friend</p>
          </div>
        </div>
        <div onClick={() => { setMode(GameMode.PRACTICE); handleReset(); setView('PLAY'); }} className="group p-6 bg-white rounded-[32px] border border-slate-100 hover:border-indigo-500 shadow-sm cursor-pointer transition-all flex items-center">
          <div className="p-4 bg-green-50 rounded-2xl mr-5 group-hover:scale-110 transition-transform"><BookOpen className="text-green-600 w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-xl text-slate-800">Practice Mode</h3>
            <p className="text-sm text-slate-400">Unlimited undo, no stakes</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSelectLevel = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 flex items-center bg-white border-b">
        <button onClick={() => setView('CHOOSE_MODE')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-black flex-1 text-center pr-8 text-slate-800">Select Difficulty</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {AI_LEVELS.map((level) => {
          const isLocked = level.level > maxUnlockedLevel;
          return (
            <div 
              key={level.level}
              onClick={() => { if (!isLocked) { setAiLevel(level.level); handleReset(); setView('PLAY'); } }}
              className={`p-5 rounded-[24px] border transition-all ${isLocked ? 'bg-slate-100 border-slate-100 opacity-50 cursor-not-allowed' : 'bg-white border-slate-100 active:border-indigo-500 hover:shadow-md cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mr-4 ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white'}`}>
                    {level.level}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">{level.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{level.description}</p>
                  </div>
                </div>
                {isLocked ? <div className="text-slate-400"><SettingsIcon className="w-5 h-5 opacity-30" /></div> : (aiLevel === level.level && <div className="text-indigo-600"><Award className="w-6 h-6" /></div>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPlay = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white z-10">
        <button onClick={() => setView('CHOOSE_MODE')} className="p-2 hover:bg-slate-50 rounded-full"><ChevronLeft className="w-6 h-6"/></button>
        <div className="text-center">
          <div className="font-black text-slate-800 text-lg">
            {mode === GameMode.HUMAN_VS_AI ? `Vision ${aiLevel}` : 
             mode === GameMode.HUMAN_VS_HUMAN ? "Human Match" : "Practice"}
          </div>
          <div className="text-[10px] text-indigo-600 uppercase tracking-[0.2em] font-black">
            {game.turn() === 'w' ? "White Move" : "Black Move"}
          </div>
        </div>
        <button onClick={handleReset} className="p-2 hover:bg-slate-50 rounded-full"><RotateCcw className="w-6 h-6 text-slate-400"/></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/30">
        {/* Opponent Info */}
        <div className="w-full max-w-[400px] flex items-center mb-4 px-2">
          <div className={`w-12 h-12 rounded-2xl ${game.turn() === 'b' ? 'bg-indigo-600 scale-110' : 'bg-slate-200'} transition-all mr-3 flex items-center justify-center text-white shadow-sm`}>
             <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
             <div className="font-black text-slate-800">
                {mode === GameMode.HUMAN_VS_AI ? `Vision ${aiLevel}` : (mode === GameMode.PRACTICE ? 'Practice AI' : 'Black Player')}
             </div>
             {isAiThinking && <div className="text-[10px] font-black text-indigo-600 animate-pulse tracking-widest uppercase">Analyzing Position...</div>}
          </div>
        </div>

        <div className="relative group">
          <ChessBoard 
            game={game} 
            onMove={makeMove} 
            highlightEnabled={settings.moveHighlightEnabled} 
          />
          {isAiThinking && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
        </div>

        {/* Player Info */}
        <div className="w-full max-w-[400px] flex items-center mt-4 px-2">
          <div className={`w-12 h-12 rounded-2xl ${game.turn() === 'w' ? 'bg-indigo-600 scale-110' : 'bg-slate-200'} transition-all mr-3 flex items-center justify-center text-white shadow-sm`}>
             <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
             <div className="font-black text-slate-800">
                {settings.playerName || 'You'}
             </div>
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">White Pieces</div>
          </div>
          <button 
            disabled={(undoUsed && mode !== GameMode.PRACTICE) || isAiThinking}
            onClick={handleUndo}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all border ${undoUsed && mode !== GameMode.PRACTICE ? 'opacity-20 border-slate-200' : 'bg-white border-slate-100 text-indigo-600 active:scale-90'}`}
          >
            Undo {mode !== GameMode.PRACTICE && "(1)"}
          </button>
        </div>
      </div>

      {showGameOver && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-8 z-[60] backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-yellow-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Game Over</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              {game.isCheckmate() ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} is victorious.` : 
               game.isDraw() ? "The match ended in a Draw." : "Stalemate!"}
            </p>
            <div className="space-y-4">
              <button onClick={handleReset} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                New Match
              </button>
              <button onClick={() => setView('MENU')} className="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold active:scale-95 transition-all">
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 flex items-center bg-white border-b">
        <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-black flex-1 text-center pr-8 text-slate-800">Scoreboard</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Match Statistics</h3>
          </div>
          <div className="space-y-4">
            {stats.length > 0 ? stats.map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex justify-between items-center group transition-all hover:shadow-md">
                <div>
                  <div className="font-black text-slate-800 text-lg">{s.opponent}</div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-green-500 uppercase">Wins</div>
                      <div className="font-bold text-slate-700">{s.wins}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-red-500 uppercase">Losses</div>
                      <div className="font-bold text-slate-700">{s.losses}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase">Draws</div>
                      <div className="font-bold text-slate-700">{s.draws}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 font-black text-xl">
                   {Math.round((s.wins / (s.wins + s.losses + s.draws)) * 100) || 0}%
                </div>
              </div>
            )) : (
              <div className="text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No stats recorded yet</p>
              </div>
            )}
          </div>
        </section>

        {history.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recent History</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center text-sm">
                  <div className={`w-2 h-10 rounded-full mr-4 ${h.result === 'Win' ? 'bg-green-500' : h.result === 'Loss' ? 'bg-red-500' : 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <div className="font-black text-slate-800">{h.opponent}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{h.date} • {h.mode.split('_').pop()}</div>
                  </div>
                  <div className={`font-black text-xs uppercase tracking-widest ${h.result === 'Win' ? 'text-green-600' : h.result === 'Loss' ? 'text-red-600' : 'text-slate-500'}`}>
                    {h.result}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 flex items-center bg-white border-b">
        <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-black flex-1 text-center pr-8 text-slate-800">Chess Rules</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-700">
        <section>
          <div className="bg-indigo-600 text-white p-6 rounded-[32px] shadow-lg mb-6">
            <h3 className="text-xl font-black mb-2">The Objective</h3>
            <p className="text-sm opacity-90 leading-relaxed font-medium">The goal of Chess is to trap the opponent's King in a position where it cannot escape capture. This is called <span className="font-black underline underline-offset-4">Checkmate</span>.</p>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-[0.2em] border-b pb-4">Special Rules</h3>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black mr-4 shrink-0 text-lg">1</div>
              <div>
                <h4 className="font-black text-slate-800 mb-1">Castling</h4>
                <p className="text-sm text-slate-500 leading-relaxed">A move involving your King and Rook. It's the only time you can move two pieces at once!</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black mr-4 shrink-0 text-lg">2</div>
              <div>
                <h4 className="font-black text-slate-800 mb-1">En Passant</h4>
                <p className="text-sm text-slate-500 leading-relaxed">A special pawn capture that occurs when an opponent's pawn jumps two squares and lands next to yours.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black mr-4 shrink-0 text-lg">3</div>
              <div>
                <h4 className="font-black text-slate-800 mb-1">Promotion</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Reach the other side of the board with a pawn to transform it into a powerful Queen.</p>
              </div>
            </div>
          </div>
        </section>
        
        <div className="text-center p-4">
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mastering Chess takes time. Keep practicing!</p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 flex items-center bg-white border-b">
        <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-black flex-1 text-center pr-8 text-slate-800">Settings</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">User Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Player Identifier</label>
              <input 
                type="text" 
                value={settings.playerName}
                onChange={(e) => {
                  const s = { ...settings, playerName: e.target.value };
                  setSettings(s);
                  storageService.saveSettings(s);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 focus:ring-4 ring-indigo-50 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Experience</h3>
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4">
                      {settings.soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-600"/> : <VolumeX className="w-6 h-6 text-slate-300"/>}
                   </div>
                   <div className="font-black text-slate-700">Audio Feedback</div>
                </div>
                <button 
                  onClick={() => {
                    const s = { ...settings, soundEnabled: !settings.soundEnabled };
                    setSettings(s);
                    storageService.saveSettings(s);
                  }}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4">
                      {settings.moveHighlightEnabled ? <Eye className="w-6 h-6 text-indigo-600"/> : <EyeOff className="w-6 h-6 text-slate-300"/>}
                   </div>
                   <div className="font-black text-slate-700">Show Hints</div>
                </div>
                <button 
                   onClick={() => {
                    const s = { ...settings, moveHighlightEnabled: !settings.moveHighlightEnabled };
                    setSettings(s);
                    storageService.saveSettings(s);
                  }}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.moveHighlightEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${settings.moveHighlightEnabled ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4">
                      <Trophy className="w-6 h-6 text-indigo-600"/>
                   </div>
                   <div className="font-black text-slate-700">Auto Unlock</div>
                </div>
                <button 
                   onClick={() => {
                    const s = { ...settings, autoLevelUp: !settings.autoLevelUp };
                    setSettings(s);
                    storageService.saveSettings(s);
                  }}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.autoLevelUp ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${settings.autoLevelUp ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </section>

        <button 
          onClick={() => {
            if (confirm('Permanently clear all match records?')) {
              storageService.resetStats();
              setStats([]);
              setHistory([]);
            }
          }}
          className="w-full p-5 text-red-600 font-black border-2 border-red-50 bg-red-50/10 rounded-[28px] flex items-center justify-center active:scale-95 transition-all"
        >
          <Trash2 className="w-6 h-6 mr-3" /> Clear Data
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white select-none touch-none">
      <div className="flex-1 overflow-hidden relative">
        {view === 'SPLASH' && renderSplash()}
        {view === 'MENU' && renderMenu()}
        {view === 'CHOOSE_MODE' && renderChooseMode()}
        {view === 'SELECT_LEVEL' && renderSelectLevel()}
        {view === 'PLAY' && renderPlay()}
        {view === 'SCOREBOARD' && renderStats()}
        {view === 'RULES' && renderRules()}
        {view === 'SETTINGS' && renderSettings()}
      </div>
      <AdBanner />
    </div>
  );
};

export default App;
