import React, { useState, useEffect, useRef } from 'react';
import { FiRefreshCw, FiArrowLeft, FiClock, FiActivity, FiAward, FiPlay } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const THEMES = {
    sponsors: [
        { id: 1, name: 'Google', symbol: '💻', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 2, name: 'MuscleBlaze', symbol: '⚡', color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 3, name: 'Nike', symbol: '👟', color: 'text-red-500 bg-red-50 border-red-200' },
        { id: 4, name: 'Apple', symbol: '🍎', color: 'text-neutral-700 bg-neutral-100 border-neutral-300' },
        { id: 5, name: 'Tesla', symbol: '🚗', color: 'text-rose-600 bg-rose-50 border-rose-250' },
        { id: 6, name: 'Coca-Cola', symbol: '🥤', color: 'text-red-600 bg-red-50 border-red-200' },
        { id: 7, name: 'Starbucks', symbol: '☕', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 8, name: 'PlayStation', symbol: '🎮', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
    ],
    entertainment: [
        { id: 1, name: 'Console', symbol: '🎮', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 2, name: 'Target', symbol: '🎯', color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 3, name: 'Palette', symbol: '🎨', color: 'text-red-500 bg-red-50 border-red-200' },
        { id: 4, name: 'Clapper', symbol: '🎬', color: 'text-neutral-700 bg-neutral-100 border-neutral-300' },
        { id: 5, name: 'Headphones', symbol: '🎧', color: 'text-rose-600 bg-rose-50 border-rose-250' },
        { id: 6, name: 'Mic', symbol: '🎤', color: 'text-red-600 bg-red-50 border-red-200' },
        { id: 7, name: 'Ticket', symbol: '🎫', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 8, name: 'Bowling', symbol: '🎳', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
    ],
    animals: [
        { id: 1, name: 'Dog', symbol: '🐶', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 2, name: 'Cat', symbol: '🐱', color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 3, name: 'Mouse', symbol: '🐭', color: 'text-red-500 bg-red-50 border-red-200' },
        { id: 4, name: 'Fox', symbol: '🦊', color: 'text-neutral-700 bg-neutral-100 border-neutral-300' },
        { id: 5, name: 'Bear', symbol: '🐻', color: 'text-rose-600 bg-rose-50 border-rose-250' },
        { id: 6, name: 'Panda', symbol: '🐼', color: 'text-red-600 bg-red-50 border-red-200' },
        { id: 7, name: 'Lion', symbol: '🦁', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 8, name: 'Frog', symbol: '🐸', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
    ],
    food: [
        { id: 1, name: 'Apple', symbol: '🍎', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 2, name: 'Banana', symbol: '🍌', color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 3, name: 'Grapes', symbol: '🍇', color: 'text-red-500 bg-red-50 border-red-200' },
        { id: 4, name: 'Strawberry', symbol: '🍓', color: 'text-neutral-700 bg-neutral-100 border-neutral-300' },
        { id: 5, name: 'Pizza', symbol: '🍕', color: 'text-rose-600 bg-rose-50 border-rose-250' },
        { id: 6, name: 'Burger', symbol: '🍔', color: 'text-red-600 bg-red-50 border-red-200' },
        { id: 7, name: 'Fries', symbol: '🍟', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 8, name: 'Donut', symbol: '🍩', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
    ],
    nature: [
        { id: 1, name: 'Blossom', symbol: '🌸', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 2, name: 'Hibiscus', symbol: '🌺', color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 3, name: 'Sunflower', symbol: '🌻', color: 'text-red-500 bg-red-50 border-red-200' },
        { id: 4, name: 'Pine', symbol: '🌲', color: 'text-neutral-700 bg-neutral-100 border-neutral-300' },
        { id: 5, name: 'Clover', symbol: '🍀', color: 'text-rose-600 bg-rose-50 border-rose-250' },
        { id: 6, name: 'Maple', symbol: '🍁', color: 'text-red-600 bg-red-50 border-red-200' },
        { id: 7, name: 'Mushroom', symbol: '🍄', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 8, name: 'Wave', symbol: '🌊', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
    ]
};

const MemoryMatch = ({ onBack }) => {
    const { updateUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [moves, setMoves] = useState(0);
    const [isWin, setIsWin] = useState(false);

    const [isLose, setIsLose] = useState(false);

    // Timer states
    const [elapsedTime, setElapsedTime] = useState(45);
    const [timerActive, setTimerActive] = useState(false);
    const timerRef = useRef(null);

    // Reveal states
    const [revealsLeft, setRevealsLeft] = useState(3);
    const [isRevealing, setIsRevealing] = useState(false);

    // Theme Config state
    const [themeConfig, setThemeConfig] = useState({ type: 'sponsors' });

    // Points states
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [gamePointsEarned, setGamePointsEarned] = useState(null);
    const [gamePointsWin, setGamePointsWin] = useState(25);
    const [gamePointsSpeed, setGamePointsSpeed] = useState(15);
    const [gamePointsAccuracy, setGamePointsAccuracy] = useState(10);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);

    // Initialize game
    const initGame = (currentTheme = themeConfig) => {
        let cardSet = THEMES.sponsors;

        if (currentTheme.type === 'custom' && currentTheme.customImages && currentTheme.customImages.length === 8) {
            cardSet = currentTheme.customImages.map((url, i) => ({
                id: i + 1,
                name: `Custom ${i + 1}`,
                imageUrl: url,
                color: 'bg-white border-slate-200'
            }));
        } else if (THEMES[currentTheme.type]) {
            cardSet = THEMES[currentTheme.type];
        }

        // Double the sponsors list to make pairs
        const duplicateSponsors = [...cardSet, ...cardSet].map((sponsor, index) => ({
            ...sponsor,
            uniqueId: index,
            isFlipped: false,
            isMatched: false
        }));

        // Shuffle cards
        const shuffled = duplicateSponsors.sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setSelectedIndices([]);
        setMoves(0);
        setIsWin(false);
        setIsLose(false);
        setElapsedTime(45);
        setTimerActive(false);
        setRevealsLeft(3);
        setIsRevealing(false);
        setPointsAwarded(false);
        setGamePointsEarned(null);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    useEffect(() => {
        const fetchThemeAndPoints = async () => {
            try {
                const [themeRes, winRes, speedRes, accRes, enabledRes] = await Promise.all([
                    configService.getConfig('game_memory_match_theme'),
                    configService.getConfig('points_memory_win'),
                    configService.getConfig('points_memory_speed'),
                    configService.getConfig('points_memory_accuracy'),
                    configService.getFreshConfig('reward_game_enabled')
                ]);

                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }

                if (winRes.data && winRes.data.value) {
                    const val = parseInt(winRes.data.value);
                    if (!isNaN(val) && val > 0) setGamePointsWin(val);
                }
                if (speedRes.data && speedRes.data.value) {
                    const val = parseInt(speedRes.data.value);
                    if (!isNaN(val) && val > 0) setGamePointsSpeed(val);
                }
                if (accRes.data && accRes.data.value) {
                    const val = parseInt(accRes.data.value);
                    if (!isNaN(val) && val > 0) setGamePointsAccuracy(val);
                }

                if (themeRes.data && themeRes.data.value) {
                    const parsed = JSON.parse(themeRes.data.value);
                    setThemeConfig(parsed);
                    initGame(parsed);
                } else {
                    initGame({ type: 'sponsors' });
                }
            } catch (err) {
                console.error('Failed to load memory match theme or points config', err);
                initGame({ type: 'sponsors' });
            }
        };
        fetchThemeAndPoints();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Timer effect
    useEffect(() => {
        if (timerActive && !isWin && !isLose) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => {
                    if (prev <= 1) {
                        setIsLose(true);
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerActive, isWin, isLose]);

    const handleReveal = () => {
        if (revealsLeft <= 0 || isRevealing || isWin || isLose) return;

        if (!timerActive) {
            setTimerActive(true);
        }

        setIsRevealing(true);
        setRevealsLeft(prev => prev - 1);

        setTimeout(() => {
            setIsRevealing(false);
        }, 1200);
    };

    const handleCardClick = (index) => {
        if (isWin || isLose || isRevealing || cards[index].isMatched || cards[index].isFlipped || selectedIndices.length >= 2) return;

        // Start timer on first flip
        if (!timerActive) {
            setTimerActive(true);
        }

        // Flip card
        const updatedCards = [...cards];
        updatedCards[index].isFlipped = true;
        setCards(updatedCards);

        const newSelected = [...selectedIndices, index];
        setSelectedIndices(newSelected);

        // Check for match if 2 cards are selected
        if (newSelected.length === 2) {
            setMoves(prev => prev + 1);
            const [firstIdx, secondIdx] = newSelected;

            if (cards[firstIdx].id === cards[secondIdx].id) {
                // Match found
                setTimeout(() => {
                    setCards(prevCards => {
                        const nextCards = [...prevCards];
                        nextCards[firstIdx].isMatched = true;
                        nextCards[secondIdx].isMatched = true;

                        // Check win condition
                        const allMatched = nextCards.every(c => c.isMatched);
                        if (allMatched) {
                            setIsWin(true);
                            setTimerActive(false);
                        }
                        return nextCards;
                    });
                    setSelectedIndices([]);
                }, 400);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prevCards => {
                        const nextCards = [...prevCards];
                        nextCards[firstIdx].isFlipped = false;
                        nextCards[secondIdx].isFlipped = false;
                        return nextCards;
                    });
                    setSelectedIndices([]);
                }, 1000);
            }
        }
    };

    // Points sync effect on Win
    useEffect(() => {
        if (!isWin || pointsAwarded || !gameRewardEnabled) return;

        const awardPoints = async () => {
            setPointsAwarded(true);

            // Base reward
            let pts = gamePointsWin;
            let details = [];

            // Speed Bonus: 45 - elapsedTime = time spent. Speed bonus if time spent <= 40s (so elapsedTime >= 5)
            if (elapsedTime >= 5) {
                pts += gamePointsSpeed;
                details.push(`Speed Bonus (+${gamePointsSpeed})`);
            }
            // Accuracy Bonus
            if (moves <= 16) {
                pts += gamePointsAccuracy;
                details.push(`Accuracy Bonus (+${gamePointsAccuracy})`);
            }

            try {
                const res = await authService.addPoints(pts, 'game');
                if (res.data && res.data.success) {
                    if (updateUser) {
                        updateUser(res.data.user);
                    }
                    setGamePointsEarned({ amount: pts, breakdown: details.join(', ') || 'Base Game Completion' });
                }
            } catch (err) {
                console.error('Failed to sync Memory Match points', err);
                setPointsAwarded(false);
            }
        };

        awardPoints();
    }, [isWin, elapsedTime, moves, pointsAwarded, updateUser, gamePointsWin, gamePointsSpeed, gamePointsAccuracy, gameRewardEnabled]);

    // Inline flip card styles to avoid requiring external CSS files
    const cardContainerStyle = {
        perspective: '1000px'
    };

    const cardInnerStyle = (isFlipped) => ({
        width: '100%',
        height: '100%',
        transition: 'transform 0.6s',
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'none',
        position: 'relative'
    });

    const cardFaceStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px'
    };

    const cardBackStyle = {
        ...cardFaceStyle,
        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    };

    const cardFrontStyle = (colorClass) => ({
        ...cardFaceStyle,
        transform: 'rotateY(180deg)',
        backgroundColor: '#ffffff',
        borderWidth: '2px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    });

    // Formatting timer string
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-start bg-gradient-to-br from-[#ebf4ff] via-[#e0e7ff] to-[#f3e8ff] text-slate-800 px-6 pb-6 pt-[120px] overflow-y-auto font-sans animate-fade-in">
            {/* Top Bar */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors cursor-pointer text-xs font-bold bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                    <FiArrowLeft /> Exit Game
                </button>

                <button
                    onClick={initGame}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-xs font-bold bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                    <FiRefreshCw /> Reset Game
                </button>
            </div>

            {/* Header */}
            <div className="text-center mt-2 mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-650 bg-clip-text text-transparent">
                    Memory Match
                </h1>
                <p className="text-xs text-slate-500 mt-1">Flip cards to match the event sponsors and claim points!</p>
            </div>

            {/* Scoreboard Info */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-md mb-6 text-center">
                <div className="bg-white/80 border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                        <FiClock /> Timer
                    </span>
                    <p className="text-base font-bold mt-1 text-slate-850">
                        {formatTime(elapsedTime)}
                    </p>
                </div>
                <div className="bg-white/80 border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                        <FiActivity /> Moves
                    </span>
                    <p className="text-base font-bold mt-1 text-slate-850">
                        {moves}
                    </p>
                </div>
                <div className="bg-white/80 border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                        <FiAward /> Target
                    </span>
                    <p className="text-[10px] font-bold mt-1 text-blue-600 leading-tight">
                        &lt; 40s &amp; 16 moves
                    </p>
                </div>
                <button
                    onClick={handleReveal}
                    disabled={revealsLeft <= 0 || isWin || isLose || isRevealing}
                    className={`border rounded-xl p-2.5 shadow-md flex flex-col items-center justify-center transition-all ${revealsLeft > 0 && !isRevealing && !isWin && !isLose
                        ? 'bg-slate-900 border-slate-800 text-white cursor-pointer hover:bg-slate-800 active:scale-95'
                        : 'bg-slate-100 border-slate-200 text-slate-450 cursor-not-allowed'
                        }`}
                >
                    <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400">
                        Reveal
                    </span>
                    <p className="text-base font-bold mt-0.5">
                        {revealsLeft}
                    </p>
                </button>
            </div>

            {/* Main Game Layout Container (Relative for absolute positioning of desktop dialog) */}
            <div className="relative w-full max-w-[340px] md:max-w-[400px] aspect-square mb-6">

                {/* Card Match Grid (Stays centered, no position change) */}
                <div className="grid grid-cols-4 gap-3 w-full h-full bg-white/40 p-4 rounded-2xl border border-slate-200/60 shadow-xl">
                    {cards.map((card, idx) => {
                        const isFlipped = card.isFlipped || card.isMatched || isRevealing;
                        return (
                            <div
                                key={card.uniqueId}
                                style={cardContainerStyle}
                                className="w-full aspect-square relative select-none"
                                onClick={() => handleCardClick(idx)}
                            >
                                <div style={cardInnerStyle(isFlipped)}>
                                    {/* Card Back */}
                                    <div style={cardBackStyle} className="hover:scale-105 transition-transform duration-300">
                                        <div className="text-sm font-black opacity-80 font-mono">AD</div>
                                    </div>

                                    {/* Card Front */}
                                    <div
                                        style={cardFrontStyle(card.color)}
                                        className={`border border-slate-200 flex flex-col items-center justify-center rounded-xl p-1 overflow-hidden ${card.isMatched ? 'opacity-60 bg-green-50/20 border-green-200' : ''}`}
                                    >
                                        {card.imageUrl ? (
                                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <>
                                                <span className="text-2xl md:text-3xl filter drop-shadow">{card.symbol}</span>
                                                <span className="text-[7px] md:text-[8px] font-extrabold uppercase mt-1 text-slate-400 select-none tracking-wider">{card.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Status Dialog (Positioned absolute on the right, no layout impact) */}
                {(isWin || isLose) && (
                    <div className="absolute top-4 left-full ml-8 w-[280px] hidden lg:block animate-slide-up">
                        {isWin && (
                            <div className="w-full bg-white border border-emerald-100 rounded-2xl p-6 shadow-2xl text-center flex flex-col gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto shadow-inner">
                                    🎉
                                </div>
                                <div>
                                    <h3 className="text-md font-black text-slate-800">Victory! Game Completed</h3>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                                        You matched all pairs in {moves} moves &amp; {formatTime(45 - elapsedTime)}.
                                    </p>
                                </div>
                                <button
                                    onClick={initGame}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                                >
                                    Play Again
                                </button>
                            </div>
                        )}

                        {isLose && (
                            <div className="w-full bg-white border border-red-150 rounded-2xl p-6 shadow-2xl text-center flex flex-col gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl mx-auto shadow-inner">
                                    ⏰
                                </div>
                                <div>
                                    <h3 className="text-md font-black text-slate-800">Time's Up!</h3>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                                        You ran out of time. Try again!
                                    </p>
                                </div>
                                <button
                                    onClick={initGame}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Status Dialog (renders below on small screens) */}
            {(isWin || isLose) && (
                <div className="w-full max-w-sm block lg:hidden animate-slide-up mt-4 mb-6">
                    {isWin && (
                        <div className="w-full bg-white border border-emerald-100 rounded-2xl p-6 shadow-2xl text-center flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto shadow-inner">
                                🎉
                            </div>
                            <div>
                                <h3 className="text-md font-black text-slate-800">Victory! Game Completed</h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    You matched all pairs in {moves} moves &amp; {formatTime(45 - elapsedTime)}.
                                </p>
                            </div>
                            <button
                                onClick={initGame}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {isLose && (
                        <div className="w-full bg-white border border-red-150 rounded-2xl p-6 shadow-2xl text-center flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl mx-auto shadow-inner">
                                ⏰
                            </div>
                            <div>
                                <h3 className="text-md font-black text-slate-800">Time's Up!</h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    You ran out of time. Try again!
                                </p>
                            </div>
                            <button
                                onClick={initGame}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Points Award Toast */}
            {gamePointsEarned && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold">
                            +{gamePointsEarned.amount} points added! ({gamePointsEarned.breakdown})
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryMatch;
