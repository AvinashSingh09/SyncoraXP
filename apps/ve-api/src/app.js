require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const configRoutes = require('./routes/config.routes');
const sessionRoutes = require('./routes/session.routes');
const chatRoutes = require('./routes/chat.routes');
const qnaRoutes = require('./routes/qna.routes');
const pollRoutes = require('./routes/poll.routes');
const quizRoutes = require('./routes/quiz.routes');
const leadRoutes = require('./routes/lead.routes');
const meetingRoutes = require('./routes/meeting.routes');
const surveyRoutes = require('./routes/survey.routes');
const translateRoutes = require('./routes/translate.routes');
const photoboothRoutes = require('./routes/photobooth.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const registerVideoHandlers = require('./sockets/video.handler');

const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

const activeSockets = new Map(); // socket.id -> userId
const onlineUsers = new Set(); // userId
app.set('onlineUsers', onlineUsers);
app.set('activeSockets', activeSockets);

// Helpers for WhatsApp-style delivered & seen tracking
async function markOfflineMessagesAsDelivered(userId, io) {
    try {
        const Message = require('./models/message.model');
        const myIdStr = userId.toString();
        const now = new Date();

        // 1. Direct Chats: Messages to this user that are not delivered yet
        const directMsgs = await Message.find({
            room: { $regex: new RegExp(`^(${myIdStr}-[0-9a-fA-F]{24}|[0-9a-fA-F]{24}-${myIdStr})$`) },
            sender: { $ne: userId },
            delivered: false
        });
        if (directMsgs.length > 0) {
            const messageIds = directMsgs.map(m => m._id);
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $set: { delivered: true, deliveredAt: now } }
            );
            // Group by room to notify senders
            const rooms = Array.from(new Set(directMsgs.map(m => m.room)));
            for (const r of rooms) {
                const rMsgs = directMsgs.filter(m => m.room === r).map(m => m._id);
                io.to(r).emit('messages-delivered-update', {
                    room: r,
                    messageIds: rMsgs,
                    deliveredAt: now
                });
            }
        }

        // 2. Group Chats: Group messages where this user is not in deliveredTo
        const groupMsgs = await Message.find({
            room: { $not: { $regex: /^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/ } },
            sender: { $ne: userId },
            'deliveredTo.user': { $ne: userId }
        }).sort({ createdAt: -1 }).limit(100);

        if (groupMsgs.length > 0) {
            const messageIds = groupMsgs.map(m => m._id);
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { deliveredTo: { user: userId, deliveredAt: now } } }
            );
            const rooms = Array.from(new Set(groupMsgs.map(m => m.room)));
            for (const r of rooms) {
                const rMsgs = groupMsgs.filter(m => m.room === r).map(m => m._id);
                io.to(r).emit('group-messages-delivered-update', {
                    room: r,
                    messageIds: rMsgs,
                    userId,
                    deliveredAt: now
                });
            }
        }
    } catch (e) {
        console.error('Error marking offline messages as delivered:', e);
    }
}

async function markMessagesAsSeen(roomName, userId, io) {
    try {
        const Message = require('./models/message.model');
        const now = new Date();

        if (/^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/.test(roomName)) {
            // Direct Chat: Mark messages sent by the other user as seen & delivered
            const query = {
                room: roomName,
                sender: { $ne: userId },
                $or: [
                    { seen: false },
                    { delivered: false }
                ]
            };
            const messagesToUpdate = await Message.find(query);
            if (messagesToUpdate.length > 0) {
                const messageIds = messagesToUpdate.map(m => m._id);
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    {
                        $set: {
                            delivered: true,
                            deliveredAt: now,
                            seen: true,
                            seenAt: now
                        }
                    }
                );
                io.to(roomName).emit('messages-seen-update', {
                    room: roomName,
                    messageIds,
                    seenAt: now,
                    deliveredAt: now
                });
            }
        } else {
            // Group Chat: Add user to deliveredTo and seenBy arrays
            const messagesToUpdate = await Message.find({
                room: roomName,
                sender: { $ne: userId },
                $or: [
                    { 'deliveredTo.user': { $ne: userId } },
                    { 'seenBy.user': { $ne: userId } }
                ]
            });

            if (messagesToUpdate.length > 0) {
                const messageIds = messagesToUpdate.map(m => m._id);
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    {
                        $addToSet: {
                            deliveredTo: { user: userId, deliveredAt: now },
                            seenBy: { user: userId, seenAt: now }
                        }
                    }
                );
                io.to(roomName).emit('group-messages-seen-update', {
                    room: roomName,
                    messageIds,
                    userId,
                    seenAt: now,
                    deliveredAt: now
                });
            }
        }
    } catch (e) {
        console.error('Error marking messages as seen:', e);
    }
}

// Tic-Tac-Toe Multiplayer Store
const ticTacToeGames = new Map();

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

io.on('connection', (socket) => {
    console.log('User connected via Socket:', socket.id);

    registerVideoHandlers(io, socket, { activeSockets, onlineUsers });

    socket.on('user-online', (userId) => {
        if (userId) {
            activeSockets.set(socket.id, userId);
            onlineUsers.add(userId.toString());
            io.emit('user-status-change', { userId, status: 'online' });
            console.log(`User ${userId} online. Total online: ${onlineUsers.size}`);
            
            // Mark all pending messages as delivered
            markOfflineMessagesAsDelivered(userId, io);
        }
    });

    socket.on('user-offline', (userId) => {
        if (userId) {
            activeSockets.delete(socket.id);
            const stillOnline = Array.from(activeSockets.values()).some(id => id.toString() === userId.toString());
            if (!stillOnline) {
                onlineUsers.delete(userId.toString());
                io.emit('user-status-change', { userId, status: 'offline' });
                console.log(`User ${userId} explicitly logged out. Total online: ${onlineUsers.size}`);
            }
        }
    });

    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
        
        const userId = activeSockets.get(socket.id);
        if (userId) {
            markMessagesAsSeen(roomName, userId, io);
        }
    });

    socket.on('leave-room', (roomName) => {
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on('auditorium-reaction', ({ emoji }) => {
        socket.to('auditorium').emit('auditorium-reaction', { emoji });
    });

    socket.on('mark-as-seen', ({ roomName }) => {
        const userId = activeSockets.get(socket.id);
        if (userId && roomName) {
            markMessagesAsSeen(roomName, userId, io);
        }
    });

    socket.on('typing', ({ roomName, isTyping }) => {
        const userId = activeSockets.get(socket.id);
        if (userId && roomName) {
            const User = require('./models/user.model');
            User.findById(userId).then(user => {
                if (user) {
                    socket.to(roomName).emit('user-typing', {
                        room: roomName,
                        userId,
                        userName: `${user.firstName} ${user.lastName}`,
                        isTyping
                    });
                }
            }).catch(err => console.error(err));
        }
    });

    // Multiplayer Tic-Tac-Toe Events
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/temp_uploads', express.static(path.join(__dirname, '../temp_uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/qna', qnaRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/photobooth', photoboothRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

module.exports = server;
