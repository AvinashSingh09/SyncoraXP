const registerUserHandlers = require('./user.handler');
const registerTicTacToeHandlers = require('./tictactoe.handler');
const registerVideoHandlers = require('./video.handler');

const activeSockets = new Map(); // socket.id -> userId
const onlineUsers = new Set(); // userId

// Tic-Tac-Toe Multiplayer Store
const ticTacToeGames = new Map();

module.exports = (io, app) => {
    app.set('onlineUsers', onlineUsers);

    io.on('connection', (socket) => {
        console.log('User connected via Socket:', socket.id);

        registerUserHandlers(io, socket, { activeSockets, onlineUsers });
        registerTicTacToeHandlers(io, socket, { ticTacToeGames, activeSockets, onlineUsers });
        registerVideoHandlers(io, socket, { activeSockets, onlineUsers });

        socket.on('join-room', (roomName) => {
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            // Handle User Disconnect
            const userId = activeSockets.get(socket.id);
            if (userId) {
                activeSockets.delete(socket.id);
                const stillOnline = Array.from(activeSockets.values()).some(id => id.toString() === userId.toString());
                if (!stillOnline) {
                    onlineUsers.delete(userId.toString());
                    io.emit('user-status-change', { userId, status: 'offline' });
                    console.log(`User ${userId} offline. Total online: ${onlineUsers.size}`);
                }
            }

            // Clean up or notify in active Tic-Tac-Toe games
            for (const [roomCode, game] of ticTacToeGames.entries()) {
                const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
                if (playerIndex !== -1) {
                    // Inform other players
                    socket.to(roomCode).emit('tictactoe:opponent-disconnected');
                    ticTacToeGames.delete(roomCode);
                    console.log(`Game ${roomCode} closed due to disconnect.`);
                }
            }
        });
    });
};
