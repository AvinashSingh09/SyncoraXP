import React, { useState, useEffect, useRef } from 'react';
import { FiArrowLeft, FiPlay, FiRefreshCw, FiAward } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const GRID_SIZE = 20;
const SPEED_DECREMENT = 5;

const Snake = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const canvasRef = useRef(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        return parseInt(localStorage.getItem('snake_highscore') || '0');
    });

    const [snake, setSnake] = useState([
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ]);
    const [food, setFood] = useState({ x: 5, y: 5 });
    const [direction, setDirection] = useState('UP');
    
    const [difficulty, setDifficulty] = useState('medium');
    const [speed, setSpeed] = useState(145);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [toastPoints, setToastPoints] = useState(null);
    const [pointsSnakeMax, setPointsSnakeMax] = useState(20);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);

    // Keep direction ref to avoid race conditions during fast key presses
    const directionRef = useRef('UP');
    directionRef.current = direction;

    const getSpeedSettings = (diff = difficulty) => {
        switch (diff) {
            case 'easy':
                return { start: 200, min: 100 };
            case 'hard':
                return { start: 90, min: 45 };
            case 'medium':
            default:
                return { start: 145, min: 65 };
        }
    };

    // Generate random food position not on snake body
    const generateFood = (currentSnake) => {
        while (true) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            const onSnake = currentSnake.some(segment => segment.x === x && segment.y === y);
            if (!onSnake) {
                return { x, y };
            }
        }
    };

    // Initialize Game
    const initGame = () => {
        const initialSnake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        setSnake(initialSnake);
        setFood(generateFood(initialSnake));
        setDirection('UP');
        directionRef.current = 'UP';
        setScore(0);
        
        const settings = getSpeedSettings();
        setSpeed(settings.start);
        
        setGameOver(false);
        setIsPlaying(true);
        setPointsEarned(0);
    };

    // Fetch difficulty and points max on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [diffRes, maxRes, enabledRes, legacyRes] = await Promise.all([
                    configService.getFreshConfig('game_snake_difficulty'),
                    configService.getConfig('points_snake_max'),
                    configService.getFreshConfig('reward_game_enabled'),
                    configService.getConfig('points_game_win')
                ]);

                if (diffRes.data && diffRes.data.value) {
                    setDifficulty(diffRes.data.value);
                    const settings = getSpeedSettings(diffRes.data.value);
                    setSpeed(settings.start);
                }

                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }

                const maxValRaw = (maxRes.data && maxRes.data.value) || (legacyRes.data && legacyRes.data.value);
                if (maxValRaw) {
                    const parsed = parseInt(maxValRaw);
                    if (!isNaN(parsed) && parsed > 0) setPointsSnakeMax(parsed);
                }
            } catch (err) {
                console.error('Failed to load snake configs', err);
            }
        };
        fetchConfig();
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isPlaying || gameOver) return;
            
            const currentDir = directionRef.current;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (currentDir !== 'DOWN') setDirection('UP');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (currentDir !== 'UP') setDirection('DOWN');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (currentDir !== 'RIGHT') setDirection('LEFT');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (currentDir !== 'LEFT') setDirection('RIGHT');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver]);

    // Game loop
    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const moveSnake = () => {
            setSnake(prevSnake => {
                const head = { ...prevSnake[0] };
                const currentDir = directionRef.current;

                switch (currentDir) {
                    case 'UP': head.y -= 1; break;
                    case 'DOWN': head.y += 1; break;
                    case 'LEFT': head.x -= 1; break;
                    case 'RIGHT': head.x += 1; break;
                    default: break;
                }

                // Wall Collision
                if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                    handleGameOver();
                    return prevSnake;
                }

                // Self Collision
                const selfCollision = prevSnake.some(segment => segment.x === head.x && segment.y === head.y);
                if (selfCollision) {
                    handleGameOver();
                    return prevSnake;
                }

                const newSnake = [head, ...prevSnake];

                // Check Food Collision
                if (head.x === food.x && head.y === food.y) {
                    const newScore = score + 10;
                    setScore(newScore);
                    setFood(generateFood(newSnake));
                    
                    // Increase speed slightly
                    const settings = getSpeedSettings();
                    setSpeed(prev => Math.max(settings.min, prev - SPEED_DECREMENT));
                } else {
                    newSnake.pop(); // Remove tail
                }

                return newSnake;
            });
        };

        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, food, score, speed]);

    // Handle Game Over
    const handleGameOver = async () => {
        setGameOver(true);
        setIsPlaying(false);

        // Update High Score
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snake_highscore', score.toString());
        }

        // Award points based on performance (points per food = pointsSnakeMax / 10, capped at pointsSnakeMax)
        const pointsPerFood = Math.max(1, Math.floor(pointsSnakeMax / 10));
        const earned = Math.min(pointsSnakeMax, Math.floor(score / 10) * pointsPerFood);
        if (earned > 0 && gameRewardEnabled) {
            setPointsEarned(earned);
            try {
                const res = await authService.addPoints(earned, 'game');
                if (res.data && res.data.success) {
                    if (updateUser) updateUser(res.data.user);
                    setToastPoints(earned);
                    setTimeout(() => setToastPoints(null), 4000);
                }
            } catch (err) {
                console.error('Failed to sync Snake points', err);
            }
        }
    };

    // Draw grid & canvas elements
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#0f172a'; // slate 900
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid details (soft lines)
        ctx.strokeStyle = '#1e293b'; // slate 800
        ctx.lineWidth = 0.5;
        const cellW = canvas.width / GRID_SIZE;
        const cellH = canvas.height / GRID_SIZE;

        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellW, 0);
            ctx.lineTo(i * cellW, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellH);
            ctx.lineTo(canvas.width, i * cellH);
            ctx.stroke();
        }

        // Draw Food (neon glow)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e'; // rose-500
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc((food.x * cellW) + cellW / 2, (food.y * cellH) + cellH / 2, cellW / 2.5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Snake (neon green glow)
        ctx.shadowColor = '#10b981'; // emerald-500
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            ctx.fillStyle = isHead ? '#34d399' : '#059669'; // lighter green for head
            ctx.fillRect(segment.x * cellW + 1, segment.y * cellH + 1, cellW - 2, cellH - 2);

            // Draw eyes on head
            if (isHead) {
                ctx.fillStyle = '#0f172a';
                ctx.shadowBlur = 0; // Disable shadow for eyes
                const eyeSize = 2.5;
                const currentDir = directionRef.current;
                
                if (currentDir === 'UP' || currentDir === 'DOWN') {
                    ctx.fillRect(segment.x * cellW + 6, segment.y * cellH + (currentDir === 'UP' ? 6 : 16), eyeSize, eyeSize);
                    ctx.fillRect(segment.x * cellW + 16, segment.y * cellH + (currentDir === 'UP' ? 6 : 16), eyeSize, eyeSize);
                } else {
                    ctx.fillRect(segment.x * cellW + (currentDir === 'LEFT' ? 6 : 16), segment.y * cellH + 6, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * cellW + (currentDir === 'LEFT' ? 6 : 16), segment.y * cellH + 16, eyeSize, eyeSize);
                }
                ctx.shadowBlur = 10; // re-enable glow for rest
            }
        });
        ctx.shadowBlur = 0; // reset
    }, [snake, food]);

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden font-sans">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#f0fdf4] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#10B981]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full h-full flex flex-col items-center justify-start px-4 md:px-8 pb-8 pt-[124px] overflow-y-auto z-10 relative">
                {/* Header Actions */}
                <div className="w-full max-w-5xl flex justify-between items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all"
                    >
                        <FiArrowLeft className="w-4 h-4" /> Exit Game
                    </button>
                    <div className="flex gap-3">
                        <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm uppercase tracking-wide">
                            Difficulty: <span className="text-emerald-700 font-extrabold">{difficulty}</span>
                        </div>
                        <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                            Score: <span className="text-emerald-600 font-extrabold">{score}</span>
                        </div>
                        <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                            High Score: <span className="text-purple-600 font-extrabold">{highScore}</span>
                        </div>
                    </div>
                </div>

                {/* Main Card Grid */}
                <div className="w-full max-w-5xl bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-8">
                    
                    {/* Game Canvas Area */}
                    <div className="relative border-4 border-slate-800 rounded-[1.5rem] overflow-hidden bg-slate-900 shadow-xl shrink-0">
                        <canvas 
                            ref={canvasRef} 
                            width={480} 
                            height={480} 
                            className="block w-[480px] h-[480px] max-w-full aspect-square"
                        />

                        {/* Start / Game Over Overlay */}
                        {(!isPlaying || gameOver) && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
                                {gameOver ? (
                                    <>
                                        <h3 className="text-2xl font-black text-rose-500 animate-pulse">GAME OVER</h3>
                                        <p className="text-xs text-slate-400 font-semibold">Your Score: {score}</p>
                                        {pointsEarned > 0 && (
                                            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                                🎉 Earned +{pointsEarned} Points!
                                            </p>
                                        )}
                                        <button
                                            onClick={initGame}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-md shadow-rose-900/30 cursor-pointer"
                                        >
                                            <FiRefreshCw className="w-4 h-4" /> Try Again
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                            🐍
                                        </div>
                                        <h3 className="text-xl font-bold text-white tracking-wide">Retro Snake Game</h3>
                                        <p className="text-[10px] text-slate-400 max-w-[200px]">
                                            Use W-A-S-D or Arrow Keys to navigate. Eat food and avoid crashing!
                                        </p>
                                        <button
                                            onClick={initGame}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
                                        >
                                            <FiPlay className="w-4 h-4 fill-white" /> Start Game
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Left/Right Side Info Panel / On-screen D-Pad */}
                    <div className="flex flex-col items-center md:items-start gap-6 w-full flex-1">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Snake Arena</h2>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                                Navigate the snake to eat the pink glowing dots. Every food increases snake length and speed. 
                            </p>
                        </div>

                        {/* On-screen D-Pad Controller for Mobile/Mouse players */}
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-100/50 p-4 rounded-3xl border border-slate-200/50 shadow-inner w-full max-w-[200px] mx-auto md:mx-0">
                            <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 mb-2">On-Screen Controls</span>
                            {/* Up */}
                            <button 
                                onClick={() => { if (isPlaying && directionRef.current !== 'DOWN') setDirection('UP'); }}
                                className="w-10 h-10 bg-white border border-slate-250 rounded-xl active:scale-95 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                            >
                                ▲
                            </button>
                            {/* Left & Right Row */}
                            <div className="flex gap-8 justify-between w-full px-2">
                                <button 
                                    onClick={() => { if (isPlaying && directionRef.current !== 'RIGHT') setDirection('LEFT'); }}
                                    className="w-10 h-10 bg-white border border-slate-250 rounded-xl active:scale-95 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                                >
                                    ◀
                                </button>
                                <button 
                                    onClick={() => { if (isPlaying && directionRef.current !== 'LEFT') setDirection('RIGHT'); }}
                                    className="w-10 h-10 bg-white border border-slate-250 rounded-xl active:scale-95 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                                >
                                    ▶
                                </button>
                            </div>
                            {/* Down */}
                            <button 
                                onClick={() => { if (isPlaying && directionRef.current !== 'UP') setDirection('DOWN'); }}
                                className="w-10 h-10 bg-white border border-slate-250 rounded-xl active:scale-95 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points Award Toast Overlay */}
            {toastPoints && (
                <div className="fixed bottom-6 right-6 z-[999] animate-bounce">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-450">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <FiAward className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                            <p className="text-xs text-emerald-50 opacity-90">
                                +{toastPoints} points added to your score!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Snake;
