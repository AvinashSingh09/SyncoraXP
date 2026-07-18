module.exports = (io, socket, { activeSockets, onlineUsers }) => {
    socket.on('user-online', (userId) => {
        if (userId) {
            activeSockets.set(socket.id, userId);
            onlineUsers.add(userId.toString());
            io.emit('user-status-change', { userId, status: 'online' });
            console.log(`User ${userId} online. Total online: ${onlineUsers.size}`);
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
};
