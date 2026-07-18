import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiArrowLeft, FiHeart, FiAward, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const MemoryMatrix = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    
    // Config states
    const [pointsMatrixLevelList, setPointsMatrixLevelList] = useState([5, 10, 15, 20, 25]);
    const [pointsMatrixMax, setPointsMatrixMax] = useState(50);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);
    const [matrixDifficulty, setMatrixDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'

    // Game state
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState(3); // 3x3, 4x4, etc.
    const [pattern, setPattern] = useState([]); // indices of active blocks
    const [selected, setSelected] = useState([]); // user selected indices
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState('idle'); // 'idle', 'flashing', 'playing', 'correct', 'wrong', 'gameover'
    const [totalPointsEarned, setTotalPointsEarned] = useState(0);

    // Animation & Toast states
    const [toastPoints, setToastPoints] = useState(null);
    const [isWrongTile, setIsWrongTile] = useState(null); // stores index of clicked wrong tile

    // Calculate grid columns dynamically
    const getGridClass = () => {
        if (gridSize === 3) return 'grid-cols-3 w-[270px] h-[270px]';
        if (gridSize === 4) return 'grid-cols-4 w-[320px] h-[320px]';
        if (gridSize === 5) return 'grid-cols-5 w-[350px] h-[350px]';
        return 'grid-cols-6 w-[380px] h-[380px]';
    };

    // Load configs
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const [levelListRes, maxRes, enabledRes, difficultyRes] = await Promise.all([
                    configService.getFreshConfig('points_matrix_level_list'),
                    configService.getConfig('points_matrix_max'),
                    configService.getFreshConfig('reward_game_enabled'),
                    configService.getFreshConfig('game_matrix_difficulty')
                ]);

                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }
                if (levelListRes.data && levelListRes.data.value) {
                    const parsed = levelListRes.data.value.split(',').map(s => parseInt(s.trim())).filter(val => !isNaN(val) && val > 0);
                    if (parsed.length > 0) setPointsMatrixLevelList(parsed);
                }
                if (maxRes.data && maxRes.data.value) {
                    const parsed = parseInt(maxRes.data.value);
                    if (!isNaN(parsed) && parsed > 0) setPointsMatrixMax(parsed);
                }
                if (difficultyRes.data && difficultyRes.data.value) {
                    setMatrixDifficulty(difficultyRes.data.value);
                }
            } catch (err) {
                console.error('Failed to load Matrix points config', err);
            }
        };
        loadConfigs();
    }, []);

    // Generate random pattern
    const startLevel = useCallback((lvl) => {
        // Determine grid size
        let size = 3;
        if (lvl >= 7) size = 6;
        else if (lvl >= 5) size = 5;
        else if (lvl >= 3) size = 4;
        setGridSize(size);

        // Determine number of blocks to flash (level + 2)
        const totalTiles = size * size;
        const patternCount = Math.min(totalTiles - 2, lvl + 2);

        // Pick unique indices
        const indices = [];
        while (indices.length < patternCount) {
            const rand = Math.floor(Math.random() * totalTiles);
            if (!indices.includes(rand)) {
                indices.push(rand);
            }
        }

        setPattern(indices);
        setSelected([]);
        setIsWrongTile(null);
        setGameState('flashing');

        // Allow flash to display before user interaction based on difficulty
        const duration = matrixDifficulty === 'easy' ? 2200 : matrixDifficulty === 'hard' ? 700 : 1300;
        setTimeout(() => {
            setGameState('playing');
        }, duration);
    }, [matrixDifficulty]);

    // Initialize Game
    const initGame = () => {
        setLevel(1);
        setLives(3);
        setTotalPointsEarned(0);
        startLevel(1);
    };

    useEffect(() => {
        initGame();
    }, [startLevel]);

    // Handle tile click
    const handleTileClick = async (index) => {
        if (gameState !== 'playing') return;

        // Correct Guess
        if (pattern.includes(index)) {
            if (selected.includes(index)) return; // already selected
            const newSelected = [...selected, index];
            setSelected(newSelected);

            // Level Cleared
            if (newSelected.length === pattern.length) {
                setGameState('correct');
                
                // Award points
                if (gameRewardEnabled && totalPointsEarned < pointsMatrixMax) {
                    const levelIndex = level - 1;
                    const baseLevelPoints = levelIndex < pointsMatrixLevelList.length 
                        ? pointsMatrixLevelList[levelIndex] 
                        : pointsMatrixLevelList[pointsMatrixLevelList.length - 1];

                    const earned = Math.min(baseLevelPoints, pointsMatrixMax - totalPointsEarned);
                    if (earned > 0) {
                        try {
                            const res = await authService.addPoints(earned, 'game');
                            if (res.data && res.data.success) {
                                if (updateUser) updateUser(res.data.user);
                                setTotalPointsEarned(prev => prev + earned);
                                setToastPoints(earned);
                                setTimeout(() => setToastPoints(null), 3000);
                            }
                        } catch (err) {
                            console.error('Failed to sync Matrix level points', err);
                        }
                    }
                }

                setTimeout(() => {
                    setLevel(prev => {
                        const nextLvl = prev + 1;
                        startLevel(nextLvl);
                        return nextLvl;
                    });
                }, 1200);
            }
        } 
        // Wrong Guess
        else {
            setGameState('wrong');
            setIsWrongTile(index);
            const remainingLives = lives - 1;
            setLives(remainingLives);

            if (remainingLives <= 0) {
                setTimeout(() => {
                    setGameState('gameover');
                }, 1200);
            } else {
                setTimeout(() => {
                    // Retry level
                    startLevel(level);
                }, 1500);
            }
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden font-sans">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] via-[#e8eeff] to-[#faf5ff] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#0284c7]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 left-[-5%] w-[40%] h-[40%] bg-[#818cf8]/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full h-full flex flex-col items-center justify-start px-4 md:px-8 pb-8 pt-[124px] overflow-y-auto z-10 relative">
                {/* Header Actions */}
                <div className="w-full max-w-xl flex justify-between items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                    >
                        <FiArrowLeft className="w-4 h-4" /> Exit Game
                    </button>

                    {/* Lives display */}
                    {gameState !== 'gameover' && (
                        <div className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-black text-slate-700">
                            <span>LIVES:</span>
                            <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                    <FiHeart 
                                        key={i} 
                                        className={`w-4 h-4 ${
                                            i < lives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-200'
                                        }`} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Card */}
                {gameState === 'gameover' ? (
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-10 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in mt-12">
                        <div className="p-4 bg-rose-50 rounded-full text-rose-500 animate-bounce">
                            <FiAward className="w-16 h-16" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 font-sans tracking-tight">GAME OVER</h2>
                        <p className="text-sm text-slate-500 font-bold max-w-sm">
                            You reached **Level {level}** and earned **+{totalPointsEarned}** points!
                        </p>
                        <button
                            onClick={initGame}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer mt-2 flex items-center gap-1.5"
                        >
                            <FiRefreshCw className="w-4 h-4" /> Play Again
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 shadow-2xl flex flex-col items-center gap-6 animate-fade-in">
                        {/* Game Status Header */}
                        <div className="flex justify-between items-center w-full max-w-[380px] border-b border-slate-100 pb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Lobby Level</span>
                                <span className="text-xl font-black text-indigo-700">LEVEL {level}</span>
                            </div>
                            <div className="text-right flex flex-col">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Points</span>
                                <span className="text-xl font-black text-emerald-600">+{totalPointsEarned} PTS</span>
                            </div>
                        </div>

                        {/* Instruction Label */}
                        <div className="text-center min-h-[36px]">
                            {gameState === 'flashing' && (
                                <p className="text-xs font-bold text-sky-600 uppercase tracking-widest animate-pulse">Memorize the pattern...</p>
                            )}
                            {gameState === 'playing' && (
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recreate the pattern!</p>
                            )}
                            {gameState === 'correct' && (
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><FiCheck className="w-4 h-4" /> Correct!</p>
                            )}
                            {gameState === 'wrong' && (
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1"><FiX className="w-4 h-4" /> Incorrect!</p>
                            )}
                        </div>

                        {/* Interactive Matrix Grid */}
                        <div className={`grid ${getGridClass()} gap-3 p-4 bg-slate-900 border-4 border-slate-800 rounded-[2rem] shadow-xl justify-center items-center relative overflow-hidden transition-all duration-350`}>
                            {[...Array(gridSize * gridSize)].map((_, index) => {
                                const isPattern = pattern.includes(index);
                                const isUserSelected = selected.includes(index);
                                const isFlashed = gameState === 'flashing' && isPattern;
                                const isCorrectReveal = (gameState === 'correct' || gameState === 'wrong') && isPattern;
                                const isWrong = isWrongTile === index;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleTileClick(index)}
                                        disabled={gameState !== 'playing'}
                                        className={`w-full aspect-square rounded-2xl transition-all duration-200 border cursor-pointer
                                            ${isFlashed 
                                                ? 'bg-sky-400 border-sky-300 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.5)]' 
                                                : isWrong
                                                    ? 'bg-rose-500 border-rose-400 animate-shake scale-95 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                                                    : isUserSelected || isCorrectReveal
                                                        ? 'bg-emerald-500 border-emerald-400 scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600 active:scale-95'
                                            }
                                        `}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Points Earned Toast */}
            {toastPoints && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Level Cleared!</p>
                        <p className="text-xs font-semibold">
                            +{toastPoints} points added to your score!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryMatrix;
