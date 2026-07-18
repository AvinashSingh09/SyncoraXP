import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiArrowLeft, FiAward } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const HANGMAN_WORDS = [
    'REACT', 'JAVASCRIPT', 'MONGODB', 'NODEJS', 'EXPRESS', 
    'TAILWIND', 'SOCKET', 'GEMINI', 'VIRTUAL', 'EVENT', 
    'LOBBY', 'EXPO', 'AUDITORIUM', 'LOUNGE', 'WEBSOCKET'
];

const Hangman = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const [wordsList, setWordsList] = useState(HANGMAN_WORDS);
    const [word, setWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState(new Set());
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [gamePointsEarned, setGamePointsEarned] = useState(null);
    const [gameWinPoints, setGameWinPoints] = useState(20);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);

    const [playedWords, setPlayedWords] = useState([]);
    const [poolCompleted, setPoolCompleted] = useState(false);

    // Initialize/Reset Game Pool
    const resetPool = (list = wordsList) => {
        if (list.length === 0) return;
        const randomWord = list[Math.floor(Math.random() * list.length)];
        setWord(randomWord);
        setGuessedLetters(new Set());
        setPointsAwarded(false);
        setGamePointsEarned(null);
        setPlayedWords([randomWord]);
        setPoolCompleted(false);
    };

    // Load next word
    const nextWord = () => {
        const unplayed = wordsList.filter(w => !playedWords.includes(w));
        if (unplayed.length === 0) {
            setPoolCompleted(true);
            return;
        }
        const randomWord = unplayed[Math.floor(Math.random() * unplayed.length)];
        setWord(randomWord);
        setGuessedLetters(new Set());
        setPointsAwarded(false);
        setGamePointsEarned(null);
        setPlayedWords(prev => [...prev, randomWord]);
    };

    // Reset current word guesses
    const resetCurrentWord = () => {
        setGuessedLetters(new Set());
        setPointsAwarded(false);
        setGamePointsEarned(null);
    };

    useEffect(() => {
        const loadCustomWordsAndPoints = async () => {
            try {
                // Fetch points config
                const [hangPointsRes, legacyPointsRes, enabledRes] = await Promise.all([
                    configService.getConfig('points_hangman_win'),
                    configService.getConfig('points_game_win'),
                    configService.getFreshConfig('reward_game_enabled')
                ]);
                
                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }

                const pointsValRaw = (hangPointsRes.data && hangPointsRes.data.value) || (legacyPointsRes.data && legacyPointsRes.data.value);
                if (pointsValRaw) {
                    const parsed = parseInt(pointsValRaw);
                    if (!isNaN(parsed) && parsed > 0) setGameWinPoints(parsed);
                }

                const res = await configService.getFreshConfig('hangman_words');
                if (res.data && res.data.value) {
                    const parsed = JSON.parse(res.data.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setWordsList(parsed);
                        resetPool(parsed);
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to load custom Hangman words or points config', err);
            }
            // Fallback
            setWordsList(HANGMAN_WORDS);
            resetPool(HANGMAN_WORDS);
        };
        loadCustomWordsAndPoints();
    }, []);

    const guessedLettersArr = Array.from(guessedLetters);
    const wrongGuesses = guessedLettersArr.filter(letter => !word.includes(letter));
    const wrongCount = wrongGuesses.length;
    const maxWrong = 6;

    const isWon = word && word.split('').every(letter => guessedLetters.has(letter));
    const isLost = wrongCount >= maxWrong;

    // Handle Letter Guess
    const handleGuess = (letter) => {
        if (isWon || isLost || guessedLetters.has(letter)) return;
        setGuessedLetters(prev => {
            const next = new Set(prev);
            next.add(letter);
            return next;
        });
    };

    // Keyboard configuration
    const keyboardRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    // Points sync effect on Win
    useEffect(() => {
        if (!isWon || pointsAwarded || !gameRewardEnabled) return;

        const awardPoints = async () => {
            setPointsAwarded(true);
            try {
                const res = await authService.addPoints(gameWinPoints, 'game');
                if (res.data && res.data.success) {
                    if (updateUser) {
                        updateUser(res.data.user);
                    }
                    setGamePointsEarned({ amount: gameWinPoints });
                    setTimeout(() => setGamePointsEarned(null), 4000);
                }
            } catch (err) {
                console.error('Failed to sync Hangman points', err);
                setPointsAwarded(false);
            }
        };
        awardPoints();
    }, [isWon, pointsAwarded, updateUser, gameWinPoints, gameRewardEnabled]);

    // Render Hangman parts based on mistakes
    const renderHangmanSVG = () => {
        return (
            <svg viewBox="0 0 200 220" fill="none" className="w-48 h-48 md:w-56 md:h-56 stroke-slate-700 stroke-[4] stroke-linecap-round stroke-linejoin-round">
                {/* Gallows base & stand */}
                <line x1="20" y1="200" x2="140" y2="200" className="stroke-slate-800 stroke-[6]" />
                <line x1="50" y1="200" x2="50" y2="20" className="stroke-slate-850 stroke-[6]" />
                <line x1="50" y1="20" x2="130" y2="20" className="stroke-slate-850 stroke-[5]" />
                <line x1="130" y1="20" x2="130" y2="50" className="stroke-slate-850 stroke-[4]" />
                {/* Diagonal brace */}
                <line x1="50" y1="50" x2="80" y2="20" className="stroke-slate-800 stroke-[4]" />

                {/* Head */}
                {wrongCount > 0 && <circle cx="130" cy="65" r="15" className="fill-none stroke-blue-600 stroke-[4]" />}
                
                {/* Body */}
                {wrongCount > 1 && <line x1="130" y1="80" x2="130" y2="140" className="stroke-blue-600 stroke-[4]" />}
                
                {/* Left Arm */}
                {wrongCount > 2 && <line x1="130" y1="95" x2="105" y2="115" className="stroke-blue-600 stroke-[4]" />}
                
                {/* Right Arm */}
                {wrongCount > 3 && <line x1="130" y1="95" x2="155" y2="115" className="stroke-blue-600 stroke-[4]" />}
                
                {/* Left Leg */}
                {wrongCount > 4 && <line x1="130" y1="140" x2="110" y2="185" className="stroke-blue-600 stroke-[4]" />}
                
                {/* Right Leg */}
                {wrongCount > 5 && <line x1="130" y1="140" x2="150" y2="185" className="stroke-blue-600 stroke-[4]" />}
            </svg>
        );
    };

    const hasNextWord = playedWords.length < wordsList.length;

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden font-sans">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#eef2ff] via-[#e0e7ff] to-[#fae8ff] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#F472B6]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 left-[-5%] w-[40%] h-[40%] bg-[#3B82F6]/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full h-full flex flex-col items-center justify-start px-4 md:px-8 pb-8 pt-[124px] overflow-y-auto z-10 relative">
                {/* Header Actions */}
                <div className="w-full max-w-4xl flex justify-between items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all"
                    >
                        <FiArrowLeft className="w-4 h-4" /> Exit Game
                    </button>

                    {!poolCompleted && (
                        <div className="flex gap-2">
                            <button
                                onClick={resetCurrentWord}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all"
                                title="Reset guesses for current word"
                            >
                                <FiRefreshCw className="w-3.5 h-3.5" /> Reset Word
                            </button>
                            <button
                                onClick={() => resetPool()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-350 rounded-xl font-bold text-xs text-slate-800 shadow-sm hover:shadow transition-all"
                                title="Reset entire game progress"
                            >
                                Restart Pool
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Card */}
                {poolCompleted ? (
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-10 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in">
                        <div className="p-4 bg-purple-50 rounded-full text-purple-600 animate-bounce">
                            <FiAward className="w-16 h-16" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800">All Words Solved!</h2>
                        <p className="text-sm text-slate-500 font-medium max-w-sm">
                            Superb! You played through all <strong>{wordsList.length}</strong> words in the config pool.
                        </p>
                        <button
                            onClick={() => resetPool()}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                        >
                            Play Again (Restart Pool)
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        
                        {/* Left: Graphic and Wrong Guesses */}
                        <div className="flex flex-col items-center gap-4 bg-white/50 p-6 rounded-3xl border border-slate-100 shadow-inner w-full md:w-auto relative">
                            {/* Pool Progress Indicator */}
                            <div className="absolute top-3 left-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                Word {playedWords.indexOf(word) + 1} / {wordsList.length}
                            </div>
                            
                            <div className="relative mt-4">
                                {renderHangmanSVG()}
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incorrect Guesses</p>
                                <p className="text-sm font-black text-rose-500 mt-1">
                                    {wrongCount} / {maxWrong}
                                </p>
                            </div>
                        </div>

                        {/* Right: Word display and Keyboard */}
                        <div className="flex-1 flex flex-col items-center md:items-start gap-8 w-full">
                            
                            {/* Word Display */}
                            <div className="flex flex-col items-center md:items-start gap-2">
                                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Guess the word</span>
                                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                                    {word.split('').map((letter, index) => {
                                        const isRevealed = guessedLetters.has(letter);
                                        return (
                                            <div 
                                                key={index} 
                                                className={`w-10 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all select-none ${
                                                    isRevealed 
                                                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md scale-105' 
                                                        : 'border-b-4 border-slate-700 bg-slate-200/40 shadow-sm'
                                                }`}
                                            >
                                                {isRevealed ? letter : '\u00A0'}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Interactive Message / Results overlay */}
                            {isWon && (
                                <div className="w-full bg-emerald-50 border border-emerald-250 p-4 rounded-2xl flex flex-col items-center md:items-start gap-1.5 animate-fade-in shadow-sm">
                                    <p className="text-emerald-700 font-extrabold text-sm flex items-center gap-1.5">
                                        🎉 Victory! You correctly guessed the word!
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium">You've earned +20 game points!</p>
                                    <button
                                        onClick={hasNextWord ? nextWord : () => setPoolCompleted(true)}
                                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors cursor-pointer"
                                    >
                                        {hasNextWord ? 'Play Next Word' : 'Finish Pool'}
                                    </button>
                                </div>
                            )}

                            {isLost && (
                                <div className="w-full bg-rose-50 border border-rose-250 p-4 rounded-2xl flex flex-col items-center md:items-start gap-1.5 animate-fade-in shadow-sm">
                                    <p className="text-rose-700 font-extrabold text-sm">
                                        💀 Game Over! The word was <span className="underline">{word}</span>.
                                    </p>
                                    <p className="text-xs text-rose-600 font-medium">Better luck next time!</p>
                                    <button
                                        onClick={hasNextWord ? nextWord : () => setPoolCompleted(true)}
                                        className="mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors cursor-pointer"
                                    >
                                        {hasNextWord ? 'Try Next Word' : 'Finish Pool'}
                                    </button>
                                </div>
                            )}

                            {/* Keyboard */}
                            {!isWon && !isLost && (
                                <div className="w-full flex flex-col gap-2 mt-2">
                                    {keyboardRows.map((row, rIdx) => (
                                        <div key={rIdx} className="flex justify-center md:justify-start gap-1.5">
                                            {row.map((letter) => {
                                                const isGuessed = guessedLetters.has(letter);
                                                const isCorrect = isGuessed && word.includes(letter);
                                                return (
                                                    <button
                                                        key={letter}
                                                        onClick={() => handleGuess(letter)}
                                                        disabled={isGuessed}
                                                        className={`w-8 h-10 md:w-10 md:h-12 text-xs md:text-sm font-bold rounded-xl transition-all shadow-sm ${
                                                            isGuessed
                                                                ? isCorrect
                                                                    ? 'bg-blue-600 text-white cursor-not-allowed'
                                                                    : 'bg-rose-500 text-white cursor-not-allowed'
                                                                : 'bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-700 cursor-pointer'
                                                        }`}
                                                    >
                                                        {letter}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Points Award Toast Overlay */}
            {gamePointsEarned && (
                <div className="fixed bottom-6 right-6 z-[999] animate-bounce">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-450">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <FiAward className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                            <p className="text-xs text-emerald-50 opacity-90">
                                +{gamePointsEarned.amount} points added for a win!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hangman;
