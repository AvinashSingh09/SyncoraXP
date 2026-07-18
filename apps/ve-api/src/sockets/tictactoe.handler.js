const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function calculateWinner(squares) {
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
}

module.exports = (io, socket, { ticTacToeGames }) => {
    socket.on('tictactoe:create', ({ username }) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = {
            roomCode,
            players: [{ socketId: socket.id, symbol: 'X', username: username || 'Player 1' }],
            board: Array(9).fill(null),
            isXNext: true,
            scores: { x: 0, o: 0, ties: 0 },
            status: 'waiting'
        };
        ticTacToeGames.set(roomCode, game);
        socket.join(roomCode);
        socket.emit('tictactoe:state', game);
        console.log(`Game created. Code: ${roomCode} by ${socket.id}`);
    });

    socket.on('tictactoe:join', ({ roomCode, username }) => {
        const game = ticTacToeGames.get(roomCode);
        if (!game) {
            socket.emit('tictactoe:error', 'Game room not found.');
            return;
        }
        if (game.players.length >= 2) {
            socket.emit('tictactoe:error', 'Room is full.');
            return;
        }
        game.players.push({ socketId: socket.id, symbol: 'O', username: username || 'Player 2' });
        game.status = 'playing';
        socket.join(roomCode);
        io.to(roomCode).emit('tictactoe:state', game);
        console.log(`Game ${roomCode} joined by ${socket.id}`);
    });

    socket.on('tictactoe:move', ({ roomCode, index }) => {
        const game = ticTacToeGames.get(roomCode);
        if (!game || game.status !== 'playing') return;

        const player = game.players.find(p => p.socketId === socket.id);
        if (!player) return;

        const currentSymbol = game.isXNext ? 'X' : 'O';
        if (player.symbol !== currentSymbol) return;

        if (game.board[index] !== null) return;

        game.board[index] = currentSymbol;
        const result = calculateWinner(game.board);

        if (result) {
            game.status = 'ended';
            if (result.winner === 'Tie') {
                game.scores.ties++;
            } else {
                game.scores[result.winner.toLowerCase()]++;
            }
            game.winningPattern = result.pattern;
        } else {
            game.isXNext = !game.isXNext;
        }

        io.to(roomCode).emit('tictactoe:state', game);
    });

    socket.on('tictactoe:reset', ({ roomCode }) => {
        const game = ticTacToeGames.get(roomCode);
        if (!game) return;

        game.board = Array(9).fill(null);
        game.isXNext = true;
        game.status = 'playing';
        game.winningPattern = undefined;
        io.to(roomCode).emit('tictactoe:state', game);
    });

    socket.on('tictactoe:leave', ({ roomCode }) => {
        if (!roomCode) return;
        socket.to(roomCode).emit('tictactoe:opponent-disconnected');
        ticTacToeGames.delete(roomCode);
        socket.leave(roomCode);
        console.log(`Game ${roomCode} closed by user leaving.`);
    });
};
