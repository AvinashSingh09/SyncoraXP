import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiRefreshCw, FiArrowLeft, FiAward, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const DEFAULT_SCRAMBLE_WORDS = [
    'KEYNOTE', 'SPONSOR', 'WEBINAR', 'LOUNGE', 'AUDITORIUM', 
    'NETWORKING', 'EXPO', 'ATTENDEE', 'CHAT', 'LOBBY', 'VIRTUAL'
];

const WordScramble = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const [wordsList, setWordsList] = useState(DEFAULT_SCRAMBLE_WORDS);
    const [originalWord, setOriginalWord] = useState('');
    const [scrambledLetters, setScrambledLetters] = useState([]); // Array of { id, char, used }
    const [guessLetters, setGuessLetters] = useState([]); // Array of { id, char }
    const [playedWords, setPlayedWords] = useState([]);
    const [poolCompleted, setPoolCompleted] = useState(false);
    const [solvedCount, setSolvedCount] = useState(0);

    // Timer states
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef(null);
    const [scrambleTimerDuration, setScrambleTimerDuration] = useState(30);

    // Points configs
    const [pointsScrambleWin, setPointsScrambleWin] = useState(15);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);
    
    // UI states
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [gamePointsEarned, setGamePointsEarned] = useState(null);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

    // Helper to scramble a string
    const scramble = (str) => {
        const arr = str.split('');
        // Ensure the scrambled version is not exactly equal to the original
        while (true) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            if (arr.join('') !== str || str.length <= 1) {
                break;
            }
        }
        return arr.map((char, index) => ({
            id: index,
            char,
            used: false
        }));
    };

    // Load next word or initialize pool
    const resetPool = useCallback((list = wordsList) => {
        if (list.length === 0) return;
        const randomWord = list[Math.floor(Math.random() * list.length)];
        setOriginalWord(randomWord);
        setScrambledLetters(scramble(randomWord));
        setGuessLetters([]);
        setPointsAwarded(false);
        setGamePointsEarned(null);
        setPlayedWords([randomWord]);
        setPoolCompleted(false);
        setMessage(null);
        setSolvedCount(0);
        setTimeLeft(scrambleTimerDuration);
    }, [wordsList, scrambleTimerDuration]);

    const nextWord = useCallback(() => {
        const unplayed = wordsList.filter(w => !playedWords.includes(w));
        if (unplayed.length === 0) {
            setPoolCompleted(true);
            return;
        }
        const randomWord = unplayed[Math.floor(Math.random() * unplayed.length)];
        setOriginalWord(randomWord);
        setScrambledLetters(scramble(randomWord));
        setGuessLetters([]);
        setPointsAwarded(false);
        setGamePointsEarned(null);
        setPlayedWords(prev => [...prev, randomWord]);
        setMessage(null);
        setTimeLeft(scrambleTimerDuration);
    }, [wordsList, playedWords, scrambleTimerDuration]);

    // Timer Effect
    useEffect(() => {
        if (poolCompleted || !originalWord || message?.type === 'success') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        setTimeLeft(scrambleTimerDuration);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setMessage({ type: 'error', text: `Time's up! Correct word: ${originalWord}` });
                    setTimeout(() => {
                        nextWord();
                    }, 2200);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [originalWord, poolCompleted, message?.type, nextWord, scrambleTimerDuration]);

    // Reset current guess
    const clearCurrentGuess = () => {
        setGuessLetters([]);
        setScrambledLetters(prev => prev.map(item => ({ ...item, used: false })));
        setMessage(null);
    };

    // Fetch config on mount
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const [wordsRes, pointsRes, enabledRes, timerRes, legacyRes] = await Promise.all([
                    configService.getFreshConfig('scramble_words'),
                    configService.getConfig('points_scramble_win'),
                    configService.getFreshConfig('reward_game_enabled'),
                    configService.getFreshConfig('game_scramble_timer'),
                    configService.getConfig('points_game_win')
                ]);

                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }

                if (timerRes.data && timerRes.data.value) {
                    const parsed = parseInt(timerRes.data.value);
                    if (!isNaN(parsed) && parsed > 0) setScrambleTimerDuration(parsed);
                }

                const pointsValRaw = (pointsRes.data && pointsRes.data.value) || (legacyRes.data && legacyRes.data.value);
                if (pointsValRaw) {
                    const parsed = parseInt(pointsValRaw);
                    if (!isNaN(parsed) && parsed > 0) setPointsScrambleWin(parsed);
                }

                if (wordsRes.data && wordsRes.data.value) {
                    const parsed = JSON.parse(wordsRes.data.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setWordsList(parsed);
                        resetPool(parsed);
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to load Word Scramble configurations', err);
            }
            // Fallback
            setWordsList(DEFAULT_SCRAMBLE_WORDS);
            resetPool(DEFAULT_SCRAMBLE_WORDS);
        };
        loadConfigs();
    }, []);

    // Letter interactions
    const handleSelectLetter = (item) => {
        if (item.used || message?.type === 'success') return;
        
        // Add to guess list
        setGuessLetters(prev => [...prev, { id: item.id, char: item.char }]);
        
        // Mark as used
        setScrambledLetters(prev => prev.map(letter => {
            if (letter.id === item.id) {
                return { ...letter, used: true };
            }
            return letter;
        }));
        setMessage(null);
    };

    const handleDeselectLetter = (guessItem) => {
        if (message?.type === 'success') return;

        // Remove from guess list
        setGuessLetters(prev => prev.filter(item => item.id !== guessItem.id));
        
        // Mark as unused in scrambled letters
        setScrambledLetters(prev => prev.map(letter => {
            if (letter.id === guessItem.id) {
                return { ...letter, used: false };
            }
            return letter;
        }));
        setMessage(null);
    };

    // Check guess
    const checkAnswer = async () => {
        const fullGuess = guessLetters.map(item => item.char).join('');
        if (fullGuess.length < originalWord.length) {
            setMessage({ type: 'error', text: 'Word not complete!' });
            return;
        }

        if (fullGuess === originalWord) {
            setMessage({ type: 'success', text: 'Correct! Well done!' });
            setSolvedCount(prev => prev + 1);
            
            if (gameRewardEnabled && !pointsAwarded) {
                setPointsAwarded(true);
                try {
                    const res = await authService.addPoints(pointsScrambleWin, 'game');
                    if (res.data && res.data.success) {
                        if (updateUser) {
                            updateUser(res.data.user);
                        }
                        setGamePointsEarned({ amount: pointsScrambleWin });
                        setTimeout(() => setGamePointsEarned(null), 4000);
                    }
                } catch (err) {
                    console.error('Failed to award scramble points', err);
                    setPointsAwarded(false);
                }
            }
            
            // Auto advance
            setTimeout(() => {
                nextWord();
            }, 1800);
        } else {
            setMessage({ type: 'error', text: 'Wrong guess! Try again.' });
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden font-sans">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ebf4ff] via-[#e8eeff] to-[#f5f3ff] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#a78bfa]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 left-[-5%] w-[40%] h-[40%] bg-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full h-full flex flex-col items-center justify-start px-4 md:px-8 pb-8 pt-[124px] overflow-y-auto z-10 relative">
                {/* Header Actions */}
                <div className="w-full max-w-2xl flex justify-between items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                    >
                        <FiArrowLeft className="w-4 h-4" /> Exit Game
                    </button>

                    {!poolCompleted && (
                        <div className="flex gap-2">
                            <button
                                onClick={clearCurrentGuess}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                            >
                                Clear Guess
                            </button>
                            <button
                                onClick={nextWord}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-350 rounded-xl font-bold text-xs text-slate-800 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                            >
                                Skip Word
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Card */}
                {poolCompleted ? (
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-10 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in mt-12">
                        <div className="p-4 bg-purple-50 rounded-full text-purple-600 animate-bounce">
                            <FiAward className="w-16 h-16" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800">Scramble Champion!</h2>
                        <p className="text-sm text-slate-500 font-medium max-w-sm">
                            Excellent work! You played through all <strong>{wordsList.length}</strong> words.
                        </p>
                        <div className="bg-indigo-600 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-sm">
                            Solved: {solvedCount} / {wordsList.length}
                        </div>
                        <button
                            onClick={() => resetPool()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                        >
                            Play Again (Restart Pool)
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 md:p-10 shadow-2xl flex flex-col items-center gap-8 animate-fade-in">
                        {/* Word index indicator */}
                        <div className="bg-slate-100 border border-slate-200 text-slate-550 rounded-full px-3.5 py-1 text-[11px] font-bold">
                            Word {playedWords.indexOf(originalWord) + 1} / {wordsList.length}
                        </div>

                        {/* Timer Display */}
                        <div className="w-full flex flex-col items-center gap-1.5 -mt-2">
                            <div className="flex justify-between items-center w-full max-w-md px-1 text-[11px] font-bold text-slate-550">
                                <span>⏳ Time Left</span>
                                <span className={timeLeft <= 10 ? 'text-red-500 font-extrabold animate-pulse' : ''}>{timeLeft}s</span>
                            </div>
                            <div className="w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                    className={`h-full transition-all duration-1000 rounded-full ${
                                        timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${(timeLeft / scrambleTimerDuration) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Title & Instructions */}
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-850">WORD SCRAMBLE</h2>
                            <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">Unscramble the event keyword</p>
                        </div>

                        {/* Answer Slots Display */}
                        <div className="flex flex-wrap gap-2.5 justify-center py-4 border-y border-slate-100 w-full min-h-[76px]">
                            {originalWord.split('').map((_, index) => {
                                const guestItem = guessLetters[index];
                                return (
                                    <button
                                        key={index}
                                        onClick={() => guestItem && handleDeselectLetter(guestItem)}
                                        className={`w-11 h-11 md:w-12 md:h-12 border rounded-2xl flex items-center justify-center font-black text-lg transition-all
                                            ${guestItem 
                                                ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-250 text-indigo-750 cursor-pointer shadow-sm hover:scale-95 active:scale-90' 
                                                : 'bg-slate-50/50 border-slate-200 border-dashed text-transparent pointer-events-none'
                                            }
                                        `}
                                    >
                                        {guestItem ? guestItem.char : ''}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Scrambled Pool */}
                        <div className="flex flex-col items-center gap-3.5 w-full">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Available Letters</span>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {scrambledLetters.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelectLetter(item)}
                                        disabled={item.used}
                                        className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl font-black text-lg shadow border flex items-center justify-center transition-all
                                            ${item.used 
                                                ? 'bg-slate-100 border-slate-200 text-slate-300 pointer-events-none opacity-40 shadow-none' 
                                                : 'bg-white border-slate-250 text-slate-700 hover:border-indigo-400 hover:text-indigo-650 hover:scale-105 active:scale-95 cursor-pointer shadow-md'
                                            }
                                        `}
                                    >
                                        {item.char}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons & Status Message */}
                        <div className="flex flex-col items-center gap-4 w-full mt-4">
                            {message && (
                                <div className={`flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl border animate-fade-in ${
                                    message.type === 'success' 
                                        ? 'bg-green-50 border-green-200 text-green-700' 
                                        : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                    {message.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            {message?.type !== 'success' && (
                                <button
                                    onClick={checkAnswer}
                                    disabled={guessLetters.length < originalWord.length}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-10 py-3.5 rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    Submit Answer
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Points Award Toast Overlay */}
            {gamePointsEarned && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold">
                            +{gamePointsEarned.amount} points added for solving Word Scramble!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WordScramble;
