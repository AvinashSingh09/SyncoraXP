import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCpu, FiArrowLeft, FiGlobe, FiPlus, FiLogIn } from 'react-icons/fi';
import socket from '../../../services/socket';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

const TicTacToe = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [gameMode, setGameMode] = useState('bot'); // 'bot', 'local', or 'online'
    const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
    const [statusMessage, setStatusMessage] = useState("Your turn (X)");

    // Online Mode states
    const [joinCode, setJoinCode] = useState('');
    const [onlineGameState, setOnlineGameState] = useState(null);
    const [onlineError, setOnlineError] = useState('');
    const [mySymbol, setMySymbol] = useState(null);
    const [nickName, setNickName] = useState('');
    const [gamePointsEarned, setGamePointsEarned] = useState(null);
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [gameWinPoints, setGameWinPoints] = useState(30);
    const [gameTiePoints, setGameTiePoints] = useState(10);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);

    useEffect(() => {
        const fetchGamePoints = async () => {
            try {
                const [winRes, tieRes, enabledRes, legacyWinRes, legacyTieRes] = await Promise.all([
                    configService.getConfig('points_tictactoe_win'),
                    configService.getConfig('points_tictactoe_tie'),
                    configService.getFreshConfig('reward_game_enabled'),
                    configService.getConfig('points_game_win'),
                    configService.getConfig('points_game_tie')
                ]);
                
                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }

                const winValRaw = (winRes.data && winRes.data.value) || (legacyWinRes.data && legacyWinRes.data.value);
                if (winValRaw) {
                    const winVal = parseInt(winValRaw);
                    if (!isNaN(winVal) && winVal > 0) setGameWinPoints(winVal);
                }

                const tieValRaw = (tieRes.data && tieRes.data.value) || (legacyTieRes.data && legacyTieRes.data.value);
                if (tieValRaw) {
                    const tieVal = parseInt(tieValRaw);
                    if (!isNaN(tieVal) && tieVal > 0) setGameTiePoints(tieVal);
                }
            } catch (err) {
                console.error('Failed to fetch game points config', err);
            }
        };
        fetchGamePoints();
    }, []);

    useEffect(() => {
        if (user) {
            setNickName(user.username || user.email?.split('@')[0] || 'Player');
        }
    }, [user]);

    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const calculateWinner = (squares) => {
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], pattern };
            }
        }
        if (squares.every(sq => sq !== null)) {
            return { winner: 'Tie', pattern: [] };
        }
        return null;
    };

    const gameResult = gameMode === 'online' && onlineGameState
        ? (calculateWinner(onlineGameState.board))
        : calculateWinner(board);

    useEffect(() => {
        if (!gameResult || !gameRewardEnabled) {
            setPointsAwarded(false);
            return;
        }
        if (gameMode === 'local' || pointsAwarded) return;

        const awardPoints = async () => {
            let pts = 0;
            let type = null;

            if (gameResult.winner === 'Tie') {
                pts = gameTiePoints;
                type = 'tie';
            } else if (gameResult.winner === 'X' && gameMode === 'bot') {
                pts = gameWinPoints;
                type = 'win';
            } else if (gameMode === 'online') {
                if (gameResult.winner === mySymbol) {
                    pts = gameWinPoints;
                    type = 'win';
                }
            }

            if (pts > 0) {
                setPointsAwarded(true);
                try {
                    const res = await authService.addPoints(pts, 'game');
                    if (res.data && res.data.success) {
                        if (updateUser) {
                            updateUser(res.data.user);
                        }
                        setGamePointsEarned({ amount: pts, type });
                        setTimeout(() => setGamePointsEarned(null), 4000);
                    }
                } catch (err) {
                    console.error('Failed to award game points', err);
                    setPointsAwarded(false);
                }
            }
        };

        awardPoints();
    }, [gameResult, gameMode, mySymbol, pointsAwarded, updateUser, gameWinPoints, gameTiePoints, gameRewardEnabled]);

    // Update status message for offline modes
    useEffect(() => {
        if (gameMode === 'online') return;
        if (gameResult) {
            if (gameResult.winner === 'Tie') {
                setStatusMessage("It's a tie!");
                setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
            } else {
                setStatusMessage(`Winner: ${gameResult.winner}!`);
                setScores(prev => ({
                    ...prev,
                    [gameResult.winner.toLowerCase()]: prev[gameResult.winner.toLowerCase()] + 1
                }));
            }
        } else {
            if (gameMode === 'bot') {
                setStatusMessage(isXNext ? "Your turn (X)" : "CPU is thinking...");
            } else {
                setStatusMessage(`Player ${isXNext ? 'X' : 'O'}'s turn`);
            }
        }
    }, [board, isXNext, gameMode]);

    // Bot move logic
    useEffect(() => {
        if (gameMode === 'bot' && !isXNext && !gameResult) {
            const timer = setTimeout(() => {
                makeBotMove();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, gameMode, board]);

    // Socket listeners for online mode
    useEffect(() => {
        if (gameMode !== 'online') return;

        const handleStateUpdate = (state) => {
            setOnlineGameState(state);
            setOnlineError('');

            const me = state.players.find(p => p.socketId === socket.id);
            if (me) {
                setMySymbol(me.symbol);
            }
        };

        const handleError = (msg) => {
            setOnlineError(msg);
        };

        const handleOpponentDisconnect = () => {
            setOnlineError('Opponent disconnected. Room closed.');
            setOnlineGameState(null);
            setMySymbol(null);
        };

        socket.on('tictactoe:state', handleStateUpdate);
        socket.on('tictactoe:error', handleError);
        socket.on('tictactoe:opponent-disconnected', handleOpponentDisconnect);

        return () => {
            socket.off('tictactoe:state', handleStateUpdate);
            socket.off('tictactoe:error', handleError);
            socket.off('tictactoe:opponent-disconnected', handleOpponentDisconnect);
        };
    }, [gameMode]);

    const makeBotMove = () => {
        const availableMoves = board
            .map((val, idx) => (val === null ? idx : null))
            .filter(val => val !== null);

        if (availableMoves.length === 0) return;

        // 1. Try to win
        for (let move of availableMoves) {
            const boardCopy = [...board];
            boardCopy[move] = 'O';
            if (calculateWinner(boardCopy)?.winner === 'O') {
                executeMove(move, 'O');
                return;
            }
        }

        // 2. Try to block player X from winning
        for (let move of availableMoves) {
            const boardCopy = [...board];
            boardCopy[move] = 'X';
            if (calculateWinner(boardCopy)?.winner === 'X') {
                executeMove(move, 'O');
                return;
            }
        }

        // 3. Take center if available
        if (availableMoves.includes(4)) {
            executeMove(4, 'O');
            return;
        }

        // 4. Random move
        const randomIdx = Math.floor(Math.random() * availableMoves.length);
        executeMove(availableMoves[randomIdx], 'O');
    };

    const executeMove = (index, symbol) => {
        setBoard(prev => {
            const nextBoard = [...prev];
            nextBoard[index] = symbol;
            return nextBoard;
        });
        setIsXNext(symbol !== 'X');
    };

    const handleSquareClick = (index) => {
        if (gameMode === 'online') {
            if (!onlineGameState || onlineGameState.status !== 'playing') return;
            const currentSymbol = onlineGameState.isXNext ? 'X' : 'O';
            if (mySymbol !== currentSymbol) return; // Not my turn
            if (onlineGameState.board[index] !== null) return;

            socket.emit('tictactoe:move', { roomCode: onlineGameState.roomCode, index });
            return;
        }

        if (board[index] || gameResult) return;
        if (gameMode === 'bot' && !isXNext) return; // Wait for bot move

        executeMove(index, isXNext ? 'X' : 'O');
    };

    const handleReset = () => {
        if (gameMode === 'online') {
            if (onlineGameState) {
                socket.emit('tictactoe:reset', { roomCode: onlineGameState.roomCode });
            }
            return;
        }
        setBoard(Array(9).fill(null));
        setIsXNext(true);
    };

    const handleCreateRoom = () => {
        setOnlineError('');
        socket.emit('tictactoe:create', { username: nickName });
    };

    const handleJoinRoom = () => {
        if (!joinCode) return;
        setOnlineError('');
        socket.emit('tictactoe:join', { roomCode: joinCode.trim().toUpperCase(), username: nickName });
    };

    const handleLeaveOnlineGame = () => {
        if (onlineGameState) {
            socket.emit('tictactoe:leave', { roomCode: onlineGameState.roomCode });
        }
        setOnlineGameState(null);
        setMySymbol(null);
        setJoinCode('');
    };

    const handleModeChange = (mode) => {
        if (gameMode === 'online') {
            handleLeaveOnlineGame();
        }
        setGameMode(mode);
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setScores({ x: 0, o: 0, ties: 0 });
        setOnlineError('');
    };

    const handleBackToArena = () => {
        if (gameMode === 'online') {
            handleLeaveOnlineGame();
        }
        onBack();
    };

    const winningPattern = gameResult?.pattern || [];

    // Get current grid to display
    const currentBoard = gameMode === 'online' && onlineGameState
        ? onlineGameState.board
        : board;

    // Build the status text for online mode
    const getOnlineStatus = () => {
        if (!onlineGameState) return '';
        if (onlineGameState.status === 'waiting') {
            return 'Waiting for Player 2 to join...';
        }
        if (onlineGameState.status === 'ended') {
            const res = calculateWinner(onlineGameState.board);
            if (res?.winner === 'Tie') {
                return "It's a tie!";
            }
            return `Winner: ${res?.winner === mySymbol ? 'You' : 'Opponent'} (${res?.winner})!`;
        }
        const currentSymbol = onlineGameState.isXNext ? 'X' : 'O';
        return mySymbol === currentSymbol ? `Your turn (${mySymbol})` : "Opponent's turn...";
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-start bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 text-slate-800 px-6 pb-20 pt-[124px] overflow-y-auto font-sans z-10">
            {/* Main background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ebf4ff] via-[#e0e7ff] to-[#f3e8ff] z-0"></div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

            {/* Blur Circles */}
            <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#F472B6]/15 rounded-full blur-[120px] z-0"></div>
            <div className="absolute top-10 left-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/10 rounded-full blur-[100px] z-0"></div>
            <div className="absolute bottom-10 right-[-5%] w-[35%] h-[35%] bg-[#F43F5E]/10 rounded-full blur-[90px] z-0"></div>

            {/* Floating Sparkles and Stars */}
            <svg className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                {/* Blue Sparkle */}
                <path d="M180 160 L182 165 L187 167 L182 169 L180 174 L178 169 L173 167 L178 165 Z" fill="#60A5FA" />
                {/* Orange Sparkle */}
                <path d="M340 230 L341 234 L345 235 L341 236 L340 240 L339 236 L335 235 L339 234 Z" fill="#FDBA74" />
                {/* Pink Sparkle */}
                <path d="M680 180 L681 184 L685 185 L681 186 L680 190 L679 186 L675 185 L679 184 Z" fill="#F9A8D4" />
                {/* Small dots */}
                <circle cx="220" cy="280" r="2" fill="#93C5FD" />
                <circle cx="620" cy="140" r="2.5" fill="#FCA5A5" />
            </svg>

            {/* Top Bar */}
            <div className="w-full max-w-xl flex items-center justify-between mb-4 z-10">
                <button
                    onClick={handleBackToArena}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-900 transition-colors cursor-pointer text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow"
                >
                    <FiArrowLeft className="text-indigo-650 w-4 h-4" /> Exit Game
                </button>
            </div>

            {/* Header */}
            <div className="text-center mt-2 mb-6 z-10">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-650 bg-clip-text text-transparent">
                    Tic-Tac-Toe
                </h1>
                <p className="text-xs text-slate-550 mt-1.5 font-semibold">Play X and O in the Virtual Event Arena</p>
            </div>

            {/* Game Options & Modes */}
            <div className="flex gap-2 mb-6 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm z-10">
                <button
                    onClick={() => handleModeChange('bot')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${gameMode === 'bot'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
                        }`}
                >
                    <FiCpu className="w-4 h-4" /> Vs CPU
                </button>
                <button
                    onClick={() => handleModeChange('online')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${gameMode === 'online'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
                        }`}
                >
                    <FiGlobe className="w-4 h-4" /> Play Online
                </button>
            </div>

            {/* Online mode - Lobby setup */}
            {gameMode === 'online' && !onlineGameState && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-6 animate-slide-up z-10">
                    <h3 className="text-base font-black text-slate-850 text-center">Multiplayer Lobby</h3>

                    {onlineError && (
                        <div className="bg-red-50 text-red-600 border border-red-150 p-3 rounded-xl text-xs font-bold text-center">
                            {onlineError}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Nickname</label>
                        <input
                            type="text"
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                            placeholder="Enter your nickname"
                            className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-extrabold transition-all"
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                        <button
                            onClick={handleCreateRoom}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-xl shadow-md hover:shadow-lg text-xs transition-all cursor-pointer active:scale-98"
                        >
                            <FiPlus className="w-4 h-4" /> Create Online Room
                        </button>

                        <div className="flex items-center justify-center gap-3 text-xs font-black text-slate-350 my-1">
                            <span className="h-[1px] bg-slate-100 w-full"></span>
                            <span>OR</span>
                            <span className="h-[1px] bg-slate-100 w-full"></span>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="6-CHAR CODE"
                                className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs uppercase text-center font-black tracking-widest focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            />
                            <button
                                onClick={handleJoinRoom}
                                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 rounded-xl shadow-md text-xs transition-colors cursor-pointer"
                            >
                                <FiLogIn /> Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active game view */}
            {((gameMode !== 'online') || (gameMode === 'online' && onlineGameState)) && (
                <div className="flex flex-col items-center z-10 w-full max-w-md">
                    {/* Room Info */}
                    {gameMode === 'online' && onlineGameState && (
                        <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm mb-5 text-xs font-bold flex gap-4 items-center">
                            <span className="text-slate-500">Room: <span className="text-blue-600 tracking-wider font-extrabold uppercase">{onlineGameState.roomCode}</span></span>
                            <span className="h-3 w-[1px] bg-slate-200"></span>
                            <span className="text-slate-500">You are: <span className="text-indigo-650 font-extrabold">{mySymbol}</span></span>
                        </div>
                    )}

                    {/* Scoreboard */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-5 text-center">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm min-w-0 flex flex-col items-center justify-center">
                            <span
                                className="text-[10px] uppercase font-black tracking-wider text-blue-600 block w-full truncate mb-1"
                                title={gameMode === 'online' && onlineGameState ? (onlineGameState.players.find(p => p.symbol === 'X')?.username || 'Player X') : 'Player (X)'}
                            >
                                {gameMode === 'online' && onlineGameState
                                    ? (onlineGameState.players.find(p => p.symbol === 'X')?.username || 'Player X')
                                    : 'Player (X)'}
                            </span>
                            <p className="text-2xl font-black text-slate-850">
                                {gameMode === 'online' && onlineGameState ? onlineGameState.scores.x : scores.x}
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Ties</span>
                            <p className="text-2xl font-black text-slate-800">
                                {gameMode === 'online' && onlineGameState ? onlineGameState.scores.ties : scores.ties}
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm min-w-0 flex flex-col items-center justify-center">
                            <span
                                className="text-[10px] uppercase font-black tracking-wider text-indigo-600 block w-full truncate mb-1"
                                title={gameMode === 'online' && onlineGameState ? (onlineGameState.players.find(p => p.symbol === 'O')?.username || 'Player O') : 'CPU (O)'}
                            >
                                {gameMode === 'online' && onlineGameState
                                    ? (onlineGameState.players.find(p => p.symbol === 'O')?.username || 'Player O')
                                    : 'CPU (O)'}
                            </span>
                            <p className="text-2xl font-black text-slate-850">
                                {gameMode === 'online' && onlineGameState ? onlineGameState.scores.o : scores.o}
                            </p>
                        </div>
                    </div>

                    {/* Status Message */}
                    <p className="text-xs font-black tracking-wider uppercase text-slate-600 mb-6 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
                        {gameMode === 'online' ? getOnlineStatus() : statusMessage}
                    </p>

                    {/* Tic-Tac-Toe Grid */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] aspect-square bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl relative mb-6">
                        {currentBoard.map((value, idx) => {
                            const isWinningSquare = winningPattern.includes(idx);
                            const onlineTurnSymbol = onlineGameState?.isXNext ? 'X' : 'O';
                            const isMyTurnOnline = gameMode === 'online' && mySymbol === onlineTurnSymbol && onlineGameState?.status === 'playing';
                            const isDisable = gameMode === 'online'
                                ? (!!value || onlineGameState?.status !== 'playing' || !isMyTurnOnline)
                                : (!!value || !!gameResult || (gameMode === 'bot' && !isXNext));

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSquareClick(idx)}
                                    disabled={isDisable}
                                    className={`w-full aspect-square flex items-center justify-center text-4xl font-black rounded-2xl border border-slate-800/80 transition-all select-none cursor-pointer
                                        ${value === null
                                            ? 'bg-slate-800/40 hover:bg-slate-800 text-transparent hover:scale-[1.02] active:scale-95'
                                            : 'bg-slate-800/80 shadow-inner'
                                        }
                                        ${isWinningSquare ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse' : ''}
                                        ${value === 'X' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}
                                        ${value === 'O' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]' : ''}
                                    `}
                                >
                                    {value}
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            disabled={gameMode === 'online' && onlineGameState?.status === 'waiting'}
                            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-black px-6 py-3 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                            <FiRefreshCw /> Reset Board
                        </button>

                        {gameMode === 'online' && (
                            <button
                                onClick={handleLeaveOnlineGame}
                                className="flex items-center gap-1.5 border border-red-250 bg-red-50 hover:bg-red-100 text-red-655 text-xs font-bold px-6 py-3 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                Leave Room
                            </button>
                        )}
                    </div>
                </div>
            )}

            {gamePointsEarned && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold">
                            +{gamePointsEarned.amount} points added for a {gamePointsEarned.type}!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicTacToe;
