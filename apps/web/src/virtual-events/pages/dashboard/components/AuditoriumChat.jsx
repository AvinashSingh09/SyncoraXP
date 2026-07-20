import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageCircle, FiSmile } from 'react-icons/fi';
import { chatService } from '../../../services/api';
import socket from '../../../services/socket';
import { useAuth } from '../../../hooks/useAuth';
import EmojiPicker from 'emoji-picker-react';

const AuditoriumChat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const roomName = 'Auditorium';
    const MAX_MESSAGES = 100;

    useEffect(() => {
        // Fetch existing messages
        const fetchMessages = async () => {
            try {
                const res = await chatService.getMessages(roomName);
                if (res.data) {
                    // Limit initial load to last MAX_MESSAGES
                    setMessages(res.data.slice(-MAX_MESSAGES));
                }
            } catch (err) {
                console.error('Failed to fetch auditorium messages:', err);
            }
        };

        fetchMessages();

        // Join room and listen for new messages
        socket.emit('join-room', roomName);

        const handleReceiveMessage = (msg) => {
            if (msg.room === roomName) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    const newMessages = [...prev, msg];
                    return newMessages.slice(-MAX_MESSAGES);
                });
            }
        };

        socket.on('new-message', handleReceiveMessage);

        return () => {
            socket.emit('leave-room', roomName);
            socket.off('new-message', handleReceiveMessage);
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Auto-focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageText.trim() || isSending) return;

        const textToSend = newMessageText.trim();
        setNewMessageText(''); // Optimistic clear
        setIsSending(true);
        setShowEmojiPicker(false);

        try {
            const res = await chatService.sendMessage(roomName, textToSend);
            if (res.data) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === res.data._id)) return prev;
                    const newMessages = [...prev, res.data];
                    return newMessages.slice(-MAX_MESSAGES);
                });
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            // Apply a 2-second rate limit cooldown
            setTimeout(() => {
                setIsSending(false);
            }, 2000);
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
    };

    const isOnlyEmojis = (text) => {
        if (!text || !text.trim()) return false;
        const cleanStr = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\s]/gu, '');
        return cleanStr.length === 0;
    };

    return (
        <div className="w-full max-h-full bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 flex flex-col overflow-hidden mb-2 animate-fade-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-transparent">
                <h3 className="font-extrabold text-blue-800 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Chat
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold">Join the conversation</p>
            </div>

            {/* Chat Messages Feed */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3 min-h-[100px]">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center gap-3 opacity-80 py-6">
                        <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-1">
                            <FiMessageCircle className="w-8 h-8 text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-600 tracking-wide">No messages yet</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1">Be the first to say hello!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
                        const emojiOnly = isOnlyEmojis(msg.text);
                        
                        return (
                            <div key={msg._id || idx} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!emojiOnly && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 shadow-sm ${isMine ? 'bg-[#3b60f6]' : 'bg-gray-400'}`}>
                                        {getInitials(msg.senderName?.split(' ')[0], msg.senderName?.split(' ')[1])}
                                    </div>
                                )}
                                <div className={`flex flex-col max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>
                                    {!isMine && (
                                        <span className="text-[9px] text-gray-500 font-bold mb-0.5 px-1">{msg.senderName}</span>
                                    )}
                                    {emojiOnly ? (
                                        <div className="text-4xl py-1">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <div className={`px-3 py-2 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm ${isMine ? 'bg-[#3b60f6] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                    <span className="text-[8px] text-gray-400 font-semibold mt-1 px-1">
                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2 relative">
                {showEmojiPicker && (
                    <div className="absolute bottom-16 right-4 z-50 shadow-2xl rounded-lg overflow-hidden">
                        <EmojiPicker
                            onEmojiClick={(emojiData) => {
                                setNewMessageText(prev => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                            }}
                            width={280}
                            height={320}
                        />
                    </div>
                )}
                {/* Quick Emoji Bar */}
                <div className="flex gap-2.5 px-1 py-0.5 justify-start border-b border-gray-50 pb-1.5">
                    {['😀', '👍', '❤️', '🔥', '👏', '😂', '😮'].map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewMessageText(prev => prev + emoji)}
                            className="text-sm hover:scale-125 transition-all cursor-pointer"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer shrink-0"
                    >
                        <FiSmile className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1 flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder={isSending ? "Wait a moment..." : "Type a message..."}
                            disabled={isSending}
                            className="w-full bg-[#f0f4f9] text-xs text-gray-800 rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#3b60f6]/50 border border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!newMessageText.trim() || isSending}
                            className="absolute right-1 w-8 h-8 flex items-center justify-center bg-[#3b60f6] hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors cursor-pointer shadow-md"
                        >
                            <FiSend className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuditoriumChat;
