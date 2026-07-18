const Message = require('../models/message.model');
const User = require('../models/user.model');
const Config = require('../models/config.model');

exports.seedMockMessages = async () => {
    try {
        const count = await Message.countDocuments();
        if (count === 0) {
            const defaultUser = await User.findOne() || { _id: new require('mongoose').Types.ObjectId() };
            const mockMessages = [
                {
                    sender: defaultUser._id,
                    senderName: 'Shubhajeet Singh',
                    room: 'What is your biggest obstacle to reach your goals?',
                    text: 'Hi',
                    createdAt: new Date('2021-12-01T00:26:00Z')
                },
                {
                    sender: defaultUser._id,
                    senderName: 'Sreehari Sukumaran',
                    room: 'What is your biggest obstacle to reach your goals?',
                    text: 'my opinion is',
                    createdAt: new Date('2021-12-17T15:12:00Z')
                },
                {
                    sender: defaultUser._id,
                    senderName: 'Adithya M B',
                    room: 'What is your biggest obstacle to reach your goals?',
                    text: 'jytfuguh',
                    createdAt: new Date('2021-12-18T12:54:00Z')
                },
                {
                    sender: defaultUser._id,
                    senderName: 'Sreehari Sukumaran',
                    room: 'What is your biggest obstacle to reach your goals?',
                    text: 'very true',
                    createdAt: new Date('2021-12-24T17:30:00Z')
                },
                {
                    sender: defaultUser._id,
                    senderName: 'System',
                    room: 'India will become a superpower',
                    text: 'Hello',
                    createdAt: new Date('2026-06-18T07:43:00Z')
                }
            ];
            await Message.insertMany(mockMessages);
            console.log('Chat database seeded successfully');
        }
    } catch (err) {
        console.error('Error seeding chat database', err);
    }
};

exports.getRoomsData = async () => {
    const config = await Config.findOne({ key: 'lounge_layout' });
    let rooms = [];
    if (config && config.value) {
        try {
            const parsed = JSON.parse(config.value);
            if (parsed.points && Array.isArray(parsed.points)) {
                rooms = parsed.points.map(p => p.text);
            }
        } catch (e) {
            console.error('Failed to parse lounge layout config value', e);
        }
    }

    if (rooms.length === 0) {
        rooms = [
            'Lounge Discussion Table 1',
            'Lounge Discussion Table 2'
        ];
    }

    const roomsData = [];
    for (const roomName of rooms) {
        const lastMsg = await Message.findOne({ room: roomName }).sort({ createdAt: -1 });
        roomsData.push({
            name: roomName,
            lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
            time: lastMsg ? lastMsg.createdAt : new Date(),
            sender: lastMsg ? lastMsg.senderName : ''
        });
    }
    return roomsData;
};

exports.getMessagesForRoom = async (room) => {
    return await Message.find({ room }).sort({ createdAt: 1 });
};

exports.createMessage = async (senderId, room, text, replyTo, forwarded) => {
    const user = await User.findById(senderId);
    if (!user) throw new Error('User not found');

    const message = new Message({
        sender: senderId,
        senderName: `${user.firstName} ${user.lastName}`,
        room,
        text,
        ...(replyTo && { replyTo }),
        ...(forwarded && { forwarded: true })
    });
    return await message.save();
};

exports.getUsersWithStatus = async (currentUserId, onlineUsers) => {
    const users = await User.find({ _id: { $ne: currentUserId } }, 'firstName lastName designation company email');
    const myId = currentUserId.toString();

    const usersWithStatus = await Promise.all(users.map(async user => {
        const isOnline = onlineUsers.has(user._id.toString());
        const directRoomId = [myId, user._id.toString()].sort().join('-');
        const lastMsg = await Message.findOne({ room: directRoomId }).sort({ createdAt: -1 });

        return {
            ...user.toObject(),
            status: isOnline ? 'online' : 'offline',
            lastMessageTime: lastMsg ? lastMsg.createdAt : null,
            lastMessageSender: lastMsg ? lastMsg.sender.toString() : null
        };
    }));

    usersWithStatus.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return 0;
    });

    return usersWithStatus;
};

exports.clearChatMessages = async (room) => {
    if (room) {
        await Message.deleteMany({ room });
    } else {
        await Message.deleteMany({});
    }
};

exports.updateMessage = async (messageId, senderId, text) => {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');
    if (message.sender.toString() !== senderId.toString()) throw new Error('Not your message');

    message.text = text;
    message.edited = true;
    return await message.save();
};

exports.toggleReaction = async (messageId, senderId, emoji) => {
    const user = await User.findById(senderId);
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');

    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === senderId.toString());

    if (existingReactionIndex > -1) {
        const existingEmoji = message.reactions[existingReactionIndex].emoji;
        if (existingEmoji === emoji) {
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            message.reactions[existingReactionIndex].emoji = emoji;
        }
    } else {
        message.reactions.push({
            emoji,
            userId: senderId,
            userName: `${user.firstName} ${user.lastName}`
        });
    }

    return await message.save();
};

exports.getChatHistoryForUser = async (userId, onlineUsers) => {
    const messages = await Message.find({ room: { $regex: userId } }).sort({ createdAt: -1 });
    const historyMap = new Map();
    
    for (const msg of messages) {
        if (msg.room.includes('-')) {
            if (!historyMap.has(msg.room)) {
                const ids = msg.room.split('-');
                const otherUserId = ids.find(id => id !== userId);
                
                if (otherUserId) {
                    const otherUser = await User.findById(otherUserId, 'firstName lastName designation company email');
                    if (otherUser) {
                        historyMap.set(msg.room, {
                            ...otherUser.toObject(),
                            lastMessage: msg.text,
                            time: msg.createdAt,
                            status: onlineUsers.has(otherUserId.toString()) ? 'online' : 'offline',
                            roomName: msg.room
                        });
                    }
                }
            }
        }
    }
    
    return Array.from(historyMap.values());
};
