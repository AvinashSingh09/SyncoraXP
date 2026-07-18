const { Server } = require('socket.io');
const registerVideoHandlers = require('./sockets/video.handler');

function registerSockets(fastify) {
  const io = new Server(fastify.server, { cors: { origin: true, methods: ['GET', 'POST'], credentials: true } });
  const state = fastify.veState;
  state.set('io', io);
  const activeSockets = state.get('activeSockets');
  const onlineUsers = state.get('onlineUsers');
  app.addHook('onClose', async () => { await new Promise((resolve) => io.close(resolve)); });
  const games = new Map();
  const winner = (board) => {
    for (const [a, b, c] of [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]) if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], pattern: [a, b, c] };
    return board.every(Boolean) ? { winner: 'Tie', pattern: [] } : null;
  };

  io.on('connection', (socket) => {
    registerVideoHandlers(io, socket, { activeSockets, onlineUsers });
    socket.on('user-online', (userId) => {
      if (!userId) return;
      activeSockets.set(socket.id, userId);
      onlineUsers.add(String(userId));
      io.emit('user-status-change', { userId, status: 'online' });
    });
    socket.on('user-offline', (userId) => {
      activeSockets.delete(socket.id);
      if (userId && ![...activeSockets.values()].some((id) => String(id) === String(userId))) { onlineUsers.delete(String(userId)); io.emit('user-status-change', { userId, status: 'offline' }); }
    });
    socket.on('join-room', (room) => socket.join(room));
    socket.on('leave-room', (room) => socket.leave(room));
    socket.on('auditorium-reaction', ({ emoji }) => socket.to('auditorium').emit('auditorium-reaction', { emoji }));
    socket.on('tictactoe:create', ({ username }) => {
      const roomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const game = { roomCode, players: [{ socketId: socket.id, symbol: 'X', username: username || 'Player 1' }], board: Array(9).fill(null), isXNext: true, scores: { x: 0, o: 0, ties: 0 }, status: 'waiting' };
      games.set(roomCode, game); socket.join(roomCode); socket.emit('tictactoe:state', game);
    });
    socket.on('tictactoe:join', ({ roomCode, username }) => {
      const game = games.get(roomCode);
      if (!game) return socket.emit('tictactoe:error', 'Game room not found.');
      if (game.players.length >= 2) return socket.emit('tictactoe:error', 'Room is full.');
      game.players.push({ socketId: socket.id, symbol: 'O', username: username || 'Player 2' }); game.status = 'playing'; socket.join(roomCode); io.to(roomCode).emit('tictactoe:state', game);
    });
    socket.on('tictactoe:move', ({ roomCode, index }) => {
      const game = games.get(roomCode); const player = game?.players.find((item) => item.socketId === socket.id);
      if (!game || game.status !== 'playing' || !player || player.symbol !== (game.isXNext ? 'X' : 'O') || game.board[index] !== null) return;
      game.board[index] = player.symbol; const result = winner(game.board);
      if (result) { game.status = 'ended'; game.scores[result.winner === 'Tie' ? 'ties' : result.winner.toLowerCase()]++; game.winningPattern = result.pattern; } else game.isXNext = !game.isXNext;
      io.to(roomCode).emit('tictactoe:state', game);
    });
    socket.on('tictactoe:reset', ({ roomCode }) => { const game = games.get(roomCode); if (game) { game.board = Array(9).fill(null); game.isXNext = true; game.status = 'playing'; delete game.winningPattern; io.to(roomCode).emit('tictactoe:state', game); } });
    socket.on('tictactoe:leave', ({ roomCode }) => { if (roomCode) { socket.to(roomCode).emit('tictactoe:opponent-disconnected'); games.delete(roomCode); socket.leave(roomCode); } });
    socket.on('disconnect', () => {
      const userId = activeSockets.get(socket.id); activeSockets.delete(socket.id);
      if (userId && ![...activeSockets.values()].some((id) => String(id) === String(userId))) { onlineUsers.delete(String(userId)); io.emit('user-status-change', { userId, status: 'offline' }); }
      for (const [roomCode, game] of games) if (game.players.some((player) => player.socketId === socket.id)) { socket.to(roomCode).emit('tictactoe:opponent-disconnected'); games.delete(roomCode); }
    });
  });
}

module.exports = { registerSockets };
