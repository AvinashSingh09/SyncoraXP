const chatService = require('../services/chat.service');
const User = require('../models/user.model');
const Message = require('../models/message.model');

// Seed on startup/require
chatService.seedMockMessages();

exports.getRooms = async (req, res) => {
    try {
        const roomsData = await chatService.getRoomsData();
        res.json(roomsData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await chatService.getMessagesForRoom(room);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { room, text, replyTo, forwarded } = req.body;
        const senderId = req.user.id;

        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const message = new Message({
            sender: senderId,
            senderName: `${user.firstName} ${user.lastName}`,
            room,
            text,
            ...(replyTo && { replyTo }),
            ...(forwarded && { forwarded: true })
        });

        const io = req.app.get('io');
        const activeSockets = req.app.get('activeSockets');
        const onlineUsers = req.app.get('onlineUsers') || new Set();
        const now = new Date();

        if (/^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/.test(room)) {
            // Direct Chat
            const ids = room.split('-');
            const recipientId = ids.find(id => id !== senderId.toString());

            if (recipientId) {
                // Check if recipient is active in the room
                const roomSockets = io ? io.sockets.adapter.rooms.get(room) : null;
                let recipientInRoom = false;

                if (roomSockets && activeSockets) {
                    for (const socketId of roomSockets) {
                        const uId = activeSockets.get(socketId);
                        if (uId && uId.toString() === recipientId.toString()) {
                            recipientInRoom = true;
                            break;
                        }
                    }
                }

                if (recipientInRoom) {
                    message.delivered = true;
                    message.deliveredAt = now;
                    message.seen = true;
                    message.seenAt = now;
                } else if (onlineUsers.has(recipientId.toString())) {
                    message.delivered = true;
                    message.deliveredAt = now;
                }
            }
        } else {
            // Group Chat
            const roomSockets = io ? io.sockets.adapter.rooms.get(room) : null;
            const activeRoomUsers = new Set();
            if (roomSockets && activeSockets) {
                for (const socketId of roomSockets) {
                    const uId = activeSockets.get(socketId);
                    if (uId && uId.toString() !== senderId.toString()) {
                        activeRoomUsers.add(uId.toString());
                    }
                }
            }

            const deliveredTo = [];
            const seenBy = [];
            for (const uId of onlineUsers) {
                if (uId !== senderId.toString()) {
                    if (activeRoomUsers.has(uId)) {
                        deliveredTo.push({ user: uId, deliveredAt: now });
                        seenBy.push({ user: uId, seenAt: now });
                    } else {
                        deliveredTo.push({ user: uId, deliveredAt: now });
                    }
                }
            }
            message.deliveredTo = deliveredTo;
            message.seenBy = seenBy;
        }

        await message.save();

        if (io) {
            io.to(room).emit('new-message', message);
            io.emit('global-new-message', message);
        }

        res.status(201).json(message);
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Error saving message', error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const onlineUsers = req.app.get('onlineUsers') || new Set();
        const usersWithStatus = await chatService.getUsersWithStatus(req.user.id, onlineUsers);
        res.json(usersWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.clearChat = async (req, res) => {
    try {
        const { room } = req.query;
        await chatService.clearChatMessages(room);

        const io = req.app.get('io');
        if (io) {
            if (room) {
                io.to(room).emit('chat-cleared');
            } else {
                io.emit('chat-cleared');
            }
        }

        res.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing chat', error: error.message });
    }
};

exports.editMessage = async (req, res) => {
    try {
        const { messageId, text } = req.body;
        const senderId = req.user.id;

        const message = await chatService.updateMessage(messageId, senderId, text);

        const io = req.app.get('io');
        if (io) {
            io.emit('message-edited', {
                messageId: message._id,
                room: message.room,
                text: message.text,
                edited: true
            });
        }

        res.json(message);
    } catch (error) {
        if (error.message === 'Message not found') return res.status(404).json({ message: 'Message not found' });
        if (error.message === 'Not your message') return res.status(403).json({ message: 'Not your message' });
        res.status(500).json({ message: 'Error editing message', error: error.message });
    }
};

exports.addReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const senderId = req.user.id;

        const message = await chatService.toggleReaction(messageId, senderId, emoji);

        const io = req.app.get('io');
        if (io) {
            io.emit('message-reaction', {
                messageId: message._id,
                room: message.room,
                reactions: message.reactions
            });
        }

        res.json(message);
    } catch (error) {
        if (error.message === 'Message not found') return res.status(404).json({ message: 'Message not found' });
        res.status(500).json({ message: 'Error adding reaction', error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const onlineUsers = req.app.get('onlineUsers') || new Set();
        const history = await chatService.getChatHistoryForUser(req.user.id, onlineUsers);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat history', error: error.message });
    }
};

exports.clearHistory = async (req, res) => {
    try {
        await chatService.clearChatMessages(null);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('chat-cleared');
        }
        
        res.json({ message: 'All chats cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing chats', error: error.message });
    }
};
