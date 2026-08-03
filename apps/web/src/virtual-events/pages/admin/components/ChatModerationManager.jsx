import React, { useState, useEffect } from 'react';
import { chatService } from '../../../services/api';
import socket from '../../../services/socket';
import { FiTrash2, FiVolumeX, FiVolume2, FiMessageCircle } from 'react-icons/fi';

const roomName = 'Auditorium';

const ChatModerationManager = () => {
    const [messages, setMessages] = useState([]);
    const [mutedUsers, setMutedUsers] = useState(new Set()); // senderId → muted

    useEffect(() => {
        chatService.getMessages(roomName)
            .then(res => { if (res.data) setMessages(res.data.slice(-200)); })
            .catch(err => console.error('Failed to load chat messages', err));

        socket.emit('join-room', roomName);

        const onNew = (msg) => {
            if (msg.room !== roomName) return;
            setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        };
        const onDeleted = ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        };

        socket.on('new-message', onNew);
        socket.on('message-deleted', onDeleted);
        return () => {
            socket.emit('leave-room', roomName);
            socket.off('new-message', onNew);
            socket.off('message-deleted', onDeleted);
        };
    }, []);

    const handleDelete = async (messageId) => {
        try {
            await chatService.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    const toggleMute = (senderId) => {
        setMutedUsers(prev => {
            const next = new Set(prev);
            next.has(senderId) ? next.delete(senderId) : next.add(senderId);
            return next;
        });
    };

    const visibleMessages = messages.filter(m => !mutedUsers.has(m.senderId));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Live Chat — Auditorium</h3>
                <div className="flex items-center gap-3">
                    {mutedUsers.size > 0 && (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {mutedUsers.size} user{mutedUsers.size > 1 ? 's' : ''} muted
                        </span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">{visibleMessages.length} messages</span>
                </div>
            </div>

            {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-gray-400">
                    <FiMessageCircle className="w-8 h-8 opacity-40" />
                    <p className="text-xs font-semibold">No messages yet</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                    {visibleMessages.map(msg => {
                        const isMuted = mutedUsers.has(msg.senderId);
                        return (
                            <div key={msg._id} className="group bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm hover:border-gray-300 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {(msg.senderName?.[0] || '?').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[11px] font-bold text-gray-800">{msg.senderName || 'Unknown'}</span>
                                        <span className="text-[9px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMuted && (
                                            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">muted</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed break-words">{msg.text}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => toggleMute(msg.senderId)}
                                        title={isMuted ? 'Unmute user' : 'Mute user (hide their messages)'}
                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isMuted ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {isMuted ? <FiVolume2 className="w-3.5 h-3.5" /> : <FiVolumeX className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(msg._id)}
                                        title="Delete message for everyone"
                                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-[10px] text-gray-400">
                Deleting a message removes it for all attendees in real time. Muting hides a user's messages from this view only.
            </p>
        </div>
    );
};

export default ChatModerationManager;
