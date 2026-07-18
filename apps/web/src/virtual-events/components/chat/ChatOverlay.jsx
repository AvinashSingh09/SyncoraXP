import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiSend, FiVideo, FiFileText, FiSmile, FiCornerUpLeft, FiCopy, FiCheck, FiEdit2 } from 'react-icons/fi';
import { TbArrowForwardUpDouble } from 'react-icons/tb';
import { MdChat, MdGroup } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import { chatService, configService } from '../../services/api';
import socket from '../../services/socket';
import EmojiPicker from 'emoji-picker-react';
import { BOOTH_ADMINS } from '../../config/boothAdmins';
import { useNavigate } from 'react-router-dom';

const ChatOverlay = ({ onClose, initialRoomName, initialUser }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isBoothAdmin = user && BOOTH_ADMINS[user.email?.toLowerCase().trim()];
    const [rooms, setRooms] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('Chats'); // Default to Chats tab as shown in mockup
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [reactingToMessageId, setReactingToMessageId] = useState(null);
    const [showEmojiPickerForMsg, setShowEmojiPickerForMsg] = useState(null);
    const [viewingReactionsForMsg, setViewingReactionsForMsg] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
     const [editingMsg, setEditingMsg] = useState(null);
     const [copiedMessageId, setCopiedMessageId] = useState(null);
     const [typingUsers, setTypingUsers] = useState({}); // roomName -> Array of { userId, userName }
     const [isMeTyping, setIsMeTyping] = useState(false);
     const typingTimeoutRef = useRef(null);
     const messagesEndRef = useRef(null);
     const inputRef = useRef(null);
     const overlayRef = useRef(null);

    const [loungePoints, setLoungePoints] = useState([]);
    const [unlockedRooms, setUnlockedRooms] = useState(() => {
        if (!user) return {};
        const myId = user._id || user.id;
        try {
            const stored = sessionStorage.getItem(`unlocked_rooms_${myId}`);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    });

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [pendingRoom, setPendingRoom] = useState(null);
    const [enteredPassword, setEnteredPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const isRoomPasswordProtected = (roomName) => {
        const matchedPoint = loungePoints.find(p => p.text === roomName);
        return !!(matchedPoint && matchedPoint.password && matchedPoint.password.trim() !== '');
    };

    const handleSelectRoom = (room) => {
        if (!room) {
            setSelectedRoom(null);
            return;
        }

        // Direct messages are not password-protected
        if (room.isDirect || /^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/.test(room.name)) {
            setSelectedRoom(room);
            return;
        }

        const matchedPoint = loungePoints.find(p => p.text === room.name);
        if (matchedPoint && matchedPoint.password && matchedPoint.password.trim() !== '') {
            if (unlockedRooms[room.name]) {
                setSelectedRoom(room);
            } else {
                setPendingRoom(room);
                setEnteredPassword('');
                setPasswordError('');
                setPasswordModalOpen(true);
            }
        } else {
            setSelectedRoom(room);
        }
    };

    const handleUnlockRoom = (e) => {
        if (e) e.preventDefault();
        if (!pendingRoom) return;

        const matchedPoint = loungePoints.find(p => p.text === pendingRoom.name);
        if (matchedPoint && matchedPoint.password) {
            if (enteredPassword === matchedPoint.password) {
                const updated = { ...unlockedRooms, [pendingRoom.name]: true };
                setUnlockedRooms(updated);
                if (user) {
                    const myId = user._id || user.id;
                    try {
                        sessionStorage.setItem(`unlocked_rooms_${myId}`, JSON.stringify(updated));
                    } catch (err) {}
                }
                setSelectedRoom(pendingRoom);
                setPasswordModalOpen(false);
                setPendingRoom(null);
                setEnteredPassword('');
                setPasswordError('');
            } else {
                setPasswordError('Incorrect password. Please try again.');
            }
        } else {
            setSelectedRoom(pendingRoom);
            setPasswordModalOpen(false);
            setPendingRoom(null);
        }
    };

     useEffect(() => {
         const handleKeyDown = (e) => {
             if (e.key === 'Escape') {
                 if (selectedRoom) {
                     setSelectedRoom(null);
                 } else {
                     onClose();
                 }
             }
         };
         window.addEventListener('keydown', handleKeyDown);
         return () => {
             window.removeEventListener('keydown', handleKeyDown);
         };
     }, [selectedRoom, onClose]);

     const handleBackdropClick = (e) => {
         if (e.target === overlayRef.current) {
             onClose();
         }
     };

     const handleAddReaction = async (messageId, emoji) => {
         try {
             await chatService.reactToMessage(messageId, emoji);
             setReactingToMessageId(null);
         } catch (err) {
             console.error('Failed to add reaction', err);
         }
     };

    const handleEditMessage = async (e) => {
        if (e) e.preventDefault();
        if (!editingMsg || !newMessageText.trim()) return;
        try {
            await chatService.editMessage(editingMsg._id, newMessageText.trim());
            setEditingMsg(null);
            setNewMessageText('');
            inputRef.current?.focus();
        } catch (err) {
            console.error('Failed to edit message', err);
        }
    };

    const [forwardingMsg, setForwardingMsg] = useState(null);

    const handleForwardMessage = async (targetRoom) => {
        if (!forwardingMsg || !targetRoom) return;
        try {
            await chatService.forwardMessage(targetRoom, forwardingMsg.text);
            setForwardingMsg(null);
        } catch (err) {
            console.error('Failed to forward message', err);
        }
    };
    const [unreadCounts, setUnreadCounts] = useState({});

    const getLastViewedTime = (roomName) => {
        if (!user) return null;
        const myId = user._id || user.id;
        try {
            const stored = localStorage.getItem(`last_viewed_${myId}`);
            if (stored) {
                const viewedObj = JSON.parse(stored);
                return viewedObj[roomName];
            }
        } catch (e) { }
        return null;
    };

    const handleCopy = async (msg) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(msg.text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = msg.text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            setCopiedMessageId(msg._id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // Load rooms and users
    const loadData = async () => {
        try {
            // Get Lounge layout tables directly
            const loungeRes = await configService.getConfig('lounge_layout');
            let loungeRoomNames = [];
            let pointsData = [];
            if (loungeRes.data && loungeRes.data.value) {
                try {
                    const parsed = JSON.parse(loungeRes.data.value);
                    if (parsed.points && Array.isArray(parsed.points)) {
                        loungeRoomNames = parsed.points.map(p => p.text);
                        pointsData = parsed.points;
                    }
                } catch (e) {
                    console.error('Failed to parse lounge layout config', e);
                }
            }
            setLoungePoints(pointsData);

            // Get message metadata from backend
            const roomsRes = await chatService.getRooms();
            const backendRooms = roomsRes.data || [];

            // Map only Lounge rooms, merging backend message metadata
            const finalRooms = loungeRoomNames.map(name => {
                const matched = backendRooms.find(r => r.name === name);
                return {
                    name,
                    lastMessage: matched ? matched.lastMessage : 'No messages yet',
                    time: matched && matched.time ? matched.time : null,
                    sender: matched ? matched.sender : ''
                };
            });

            finalRooms.sort((a, b) => {
                if (a.time && b.time) return new Date(b.time) - new Date(a.time);
                if (a.time) return -1;
                if (b.time) return 1;
                return a.name.localeCompare(b.name);
            });

            setRooms(finalRooms);
        } catch (err) {
            console.error('Failed to load chat rooms from backend', err);
        }

        try {
            if (isBoothAdmin) {
                const historyRes = await chatService.getHistory();
                if (historyRes.data) {
                    setUsersList(historyRes.data);
                }
            } else {
                const usersRes = await chatService.getUsers();
                if (usersRes.data) {
                    const validUsers = usersRes.data.filter(u => u.firstName && u.lastName);
                    setUsersList(validUsers);
                }
            }
        } catch (err) {
            console.error('Failed to load users from backend', err);
        }
    };

    // Fetch messages for selected room
    const loadMessages = async () => {
        if (!selectedRoom) return;
        try {
            const response = await chatService.getMessages(selectedRoom.name);
            if (response.data) {
                setMessages(response.data);
            }
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Load unread counts from local storage
    useEffect(() => {
        if (user) {
            const myId = user._id || user.id;
            try {
                const stored = localStorage.getItem(`unread_counts_${myId}`);
                if (stored) {
                    setUnreadCounts(JSON.parse(stored));
                }
            } catch (e) { }
        }
    }, [user]);

    // Listen to global new messages to update unread badge
    useEffect(() => {
        if (!user) return;
        const myId = user._id || user.id;

        const handleGlobalMessage = (msg) => {
            const isMe = msg.sender === myId ||
                msg.senderName?.toLowerCase() === `${user?.firstName} ${user?.lastName}`.toLowerCase().trim();
            if (isMe) return;

            loadData();
        };

        const handleUnreadUpdate = () => {
            try {
                const stored = localStorage.getItem(`unread_counts_${myId}`);
                if (stored) {
                    setUnreadCounts(JSON.parse(stored));
                }
            } catch (e) { }
        };

        window.addEventListener('unread-counts-updated', handleUnreadUpdate);
        socket.on('global-new-message', handleGlobalMessage);

        return () => {
            socket.off('global-new-message', handleGlobalMessage);
            window.removeEventListener('unread-counts-updated', handleUnreadUpdate);
        };
    }, [selectedRoom, user]);

    // Handle global typing states
    useEffect(() => {
        const handleUserTyping = (data) => {
            setTypingUsers(prev => {
                const roomTyping = prev[data.room] || [];
                let updated;
                if (data.isTyping) {
                    if (roomTyping.some(u => u.userId === data.userId)) return prev;
                    updated = [...roomTyping, { userId: data.userId, userName: data.userName }];
                } else {
                    updated = roomTyping.filter(u => u.userId !== data.userId);
                }
                return { ...prev, [data.room]: updated };
            });
        };

        socket.on('user-typing', handleUserTyping);
        return () => {
            socket.off('user-typing', handleUserTyping);
        };
    }, []);

    // Update last viewed time and clear unread counts
    useEffect(() => {
        if (selectedRoom && user) {
            const myId = user._id || user.id;

            // Set active chat room globally for DashboardLayout
            sessionStorage.setItem('activeChatRoom', selectedRoom.name);

            try {
                const storedViewed = localStorage.getItem(`last_viewed_${myId}`);
                let viewedObj = {};
                if (storedViewed) {
                    viewedObj = JSON.parse(storedViewed);
                }
                viewedObj[selectedRoom.name] = new Date().toISOString();
                localStorage.setItem(`last_viewed_${myId}`, JSON.stringify(viewedObj));
            } catch (e) { }

            setUnreadCounts(prev => {
                if (!prev[selectedRoom.name]) return prev;
                const newCounts = { ...prev, [selectedRoom.name]: 0 };
                localStorage.setItem(`unread_counts_${myId}`, JSON.stringify(newCounts));
                return newCounts;
            });
        }

        return () => {
            sessionStorage.removeItem('activeChatRoom');
        };
    }, [selectedRoom, user]);

    useEffect(() => {
        if (!selectedRoom) return;

        inputRef.current?.focus();
        loadMessages();

        // Join room over WebSockets
        socket.emit('join-room', selectedRoom.name);
        socket.emit('mark-as-seen', { roomName: selectedRoom.name });

        const handleNewMessage = (msg) => {
            if (msg.room === selectedRoom.name) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                const myId = user?._id || user?.id;
                if (msg.sender !== myId && msg.senderName?.toLowerCase() !== `${user?.firstName} ${user?.lastName}`.toLowerCase().trim()) {
                    socket.emit('mark-as-seen', { roomName: selectedRoom.name });
                }
            }
        };

        const handleChatCleared = () => {
            setMessages([]);
            loadData();
        };

        const handleReaction = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
            }
        };

        const handleEdited = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, edited: true } : m));
            }
        };

        const handleMessagesSeenUpdate = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => 
                    data.messageIds.includes(m._id) 
                        ? { ...m, seen: true, seenAt: data.seenAt, delivered: true, deliveredAt: data.deliveredAt } 
                        : m
                ));
            }
        };

        const handleMessagesDeliveredUpdate = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => 
                    data.messageIds.includes(m._id) 
                        ? { ...m, delivered: true, deliveredAt: data.deliveredAt } 
                        : m
                ));
            }
        };

        const handleGroupMessagesSeenUpdate = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => {
                    if (data.messageIds.includes(m._id)) {
                        const updatedSeenBy = [...(m.seenBy || [])];
                        if (!updatedSeenBy.some(s => s.user === data.userId)) {
                            updatedSeenBy.push({ user: data.userId, seenAt: data.seenAt });
                        }
                        const updatedDeliveredTo = [...(m.deliveredTo || [])];
                        if (!updatedDeliveredTo.some(d => d.user === data.userId)) {
                            updatedDeliveredTo.push({ user: data.userId, deliveredAt: data.deliveredAt });
                        }
                        return { ...m, seenBy: updatedSeenBy, deliveredTo: updatedDeliveredTo };
                    }
                    return m;
                }));
            }
        };

        const handleGroupMessagesDeliveredUpdate = (data) => {
            if (data.room === selectedRoom.name) {
                setMessages(prev => prev.map(m => {
                    if (data.messageIds.includes(m._id)) {
                        const updatedDeliveredTo = [...(m.deliveredTo || [])];
                        if (!updatedDeliveredTo.some(d => d.user === data.userId)) {
                            updatedDeliveredTo.push({ user: data.userId, deliveredAt: data.deliveredAt });
                        }
                        return { ...m, deliveredTo: updatedDeliveredTo };
                    }
                    return m;
                }));
            }
        };

        socket.on('new-message', handleNewMessage);
        socket.on('chat-cleared', handleChatCleared);
        socket.on('message-reaction', handleReaction);
        socket.on('message-edited', handleEdited);
        socket.on('messages-seen-update', handleMessagesSeenUpdate);
        socket.on('messages-delivered-update', handleMessagesDeliveredUpdate);
        socket.on('group-messages-seen-update', handleGroupMessagesSeenUpdate);
        socket.on('group-messages-delivered-update', handleGroupMessagesDeliveredUpdate);

        return () => {
            socket.emit('leave-room', selectedRoom.name);
            socket.off('new-message', handleNewMessage);
            socket.off('chat-cleared', handleChatCleared);
            socket.off('message-reaction', handleReaction);
            socket.off('message-edited', handleEdited);
            socket.off('messages-seen-update', handleMessagesSeenUpdate);
            socket.off('messages-delivered-update', handleMessagesDeliveredUpdate);
            socket.off('group-messages-seen-update', handleGroupMessagesSeenUpdate);
            socket.off('group-messages-delivered-update', handleGroupMessagesDeliveredUpdate);
        };
    }, [selectedRoom, user]);

    // Set default selected room on rooms load if none selected, or handle initial chat intent
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Prevent periodic overwrites when `rooms` or `usersList` updates
        if (hasInitialized.current) return;

        // Wait until user list is loaded before resolving initial selection
        if ((initialRoomName || initialUser) && usersList.length === 0) {
            return;
        }

        // If we want a direct user chat
        if (initialUser && usersList.length > 0) {
            selectDirectUser(initialUser);
            setActiveTab('Chats');
            hasInitialized.current = true;
            return;
        }

        // If we want a room name (group or direct from notification)
        if (initialRoomName && (rooms.length > 0 || usersList.length > 0)) {
            const foundGroup = rooms.find(r => r.name === initialRoomName);
            if (foundGroup) {
                handleSelectRoom(foundGroup);
                setActiveTab('Groups');
                hasInitialized.current = true;
                return;
            }

            const myId = user?._id || user?.id;
            const foundUser = usersList.find(u => {
                const uId = u._id || u.id;
                const directRoomId = [myId, uId].sort().join('-');
                return directRoomId === initialRoomName;
            });

            if (foundUser) {
                selectDirectUser(foundUser);
                setActiveTab('Chats');
                hasInitialized.current = true;
                return;
            }

            // Check if initialRoomName matches a user by name (e.g. "Information Desk" matches "Info Desk")
            const foundUserByName = usersList.find(u => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                const target = initialRoomName.toLowerCase();
                return fullName.includes(target) || target.includes(fullName) ||
                       (fullName.includes('info desk') && target.includes('information desk')) ||
                       (fullName.includes('information desk') && target.includes('info desk'));
            });

            if (foundUserByName) {
                selectDirectUser(foundUserByName);
                setActiveTab('Chats');
                hasInitialized.current = true;
                return;
            }

            // If it's a custom room (like a Booth Chat) not in the predefined Lounge list
            if (!foundUser && !foundGroup && !initialRoomName.includes('-') && !isBoothAdmin) {
                // Check if it's a Booth Chat and we can map it to an admin
                const adminEmail = Object.keys(BOOTH_ADMINS).find(email => BOOTH_ADMINS[email].roomName === initialRoomName);
                if (adminEmail) {
                    const adminUser = usersList.find(u => u.email === adminEmail);
                    if (adminUser) {
                        selectDirectUser(adminUser);
                        setActiveTab('Chats');
                        hasInitialized.current = true;
                        return;
                    }
                }

                // If it's still an unmapped group chat (e.g. Lounge Table), we don't render it since Groups tab is removed.
                // We'll just ignore it or fallback.
            }
        }

        // Default to first user if booth admin, else first group room
        if (!initialRoomName && !initialUser && !selectedRoom) {
            if (isBoothAdmin) {
                if (usersList.length > 0) {
                    // Try to find a user we have history with, otherwise just show empty state
                    // We can just leave it unselected so they see "Select a chat"
                    hasInitialized.current = true;
                } else {
                    hasInitialized.current = true;
                }
            } else if (rooms.length > 0) {
                const safeRoom = rooms.find(r => !isRoomPasswordProtected(r.name) || unlockedRooms[r.name]);
                if (safeRoom) {
                    setSelectedRoom(safeRoom);
                } else {
                    setSelectedRoom(null);
                }
                hasInitialized.current = true;
            }
        } else {
            hasInitialized.current = true;
        }
    }, [rooms, usersList, initialRoomName, initialUser, user]);

    // Listen to changes in props for subsequent opens if overlay remained mounted
    const prevInitialRoom = useRef(initialRoomName);
    const prevInitialUser = useRef(initialUser);

    useEffect(() => {
        if (initialRoomName !== prevInitialRoom.current || initialUser !== prevInitialUser.current) {
            hasInitialized.current = false;
            prevInitialRoom.current = initialRoomName;
            prevInitialUser.current = initialUser;
        }
    }, [initialRoomName, initialUser]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [messages, replyingTo, editingMsg]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageText.trim() || !selectedRoom) return;

        const text = newMessageText.trim();
        setNewMessageText('');

        setIsMeTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing', { roomName: selectedRoom.name, isTyping: false });

        try {
            const replyData = replyingTo ? { text: replyingTo.text, senderName: replyingTo.senderName } : undefined;
            await chatService.sendMessage(selectedRoom.name, text, replyData);
            setReplyingTo(null);
            // Rely on Socket.io event listener to append messages, preventing duplicate previews.
        } catch (err) {
            console.error('Failed to send message to backend', err);
        }
    };

    const handleInputChange = (e) => {
        setNewMessageText(e.target.value);

        if (!selectedRoom) return;

        if (!isMeTyping) {
            setIsMeTyping(true);
            socket.emit('typing', { roomName: selectedRoom.name, isTyping: true });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsMeTyping(false);
            socket.emit('typing', { roomName: selectedRoom.name, isTyping: false });
        }, 2000);
    };

    const getInitials = (name) => {
        if (!name) return '';
        const words = name.split(' ');
        return words.map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    // Filter items based on searchQuery and activeTab
    const getFilteredItems = () => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'Groups') {
            return rooms.filter(room => room.name.toLowerCase().includes(query));
        } else {
            // Chats / Direct users list
            return usersList.filter(u =>
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
            );
        }
    };

    // Group messages by date
    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const dateStr = formatDate(msg.createdAt);
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(msg);
        });
        return groups;
    };

    const selectDirectUser = (otherUser) => {
        const myId = user?._id || user?.id;
        const otherUserId = otherUser?._id || otherUser?.id;
        const roomName = [myId, otherUserId].sort().join('-');
        setSelectedRoom({
            name: roomName,
            isDirect: true,
            user: otherUser
        });
    };

    const getTheme = () => {
        // Check if MuscleBlaze theme should be applied
        const isMBAdmin = isBoothAdmin && isBoothAdmin.boothId === 10;
        const isChattingWithMB = selectedRoom && selectedRoom.user && selectedRoom.user.firstName === 'MuscleBlaze';

        if (isMBAdmin || isChattingWithMB) {
            return {
                primary: 'bg-red-600',
                bubble: 'bg-red-600',
                bubbleOther: 'bg-red-100',
                button: 'bg-red-600 hover:bg-red-700',
                border: 'border-red-500/20',
                text: 'text-red-600',
                borderHighlight: 'border-red-600',
                avatarMe: 'bg-red-500',
                avatarOther: 'bg-gray-800' // Black/dark gray for MB style
            };
        }

        // Default Blue Theme
        return {
            primary: 'bg-[#1e70e9]',
            bubble: 'bg-blue-600',
            bubbleOther: 'bg-[#a4bafd]',
            button: 'bg-[#1e70e9] hover:bg-blue-600',
            border: 'border-blue-500/20',
            text: 'text-blue-600',
            borderHighlight: 'border-blue-600',
            avatarMe: 'bg-[#1e70e9]',
            avatarOther: 'bg-purple-600'
        };
    };

    const theme = getTheme();

    const getGroupsUnreadCount = () => {
        let count = 0;
        rooms.forEach(room => {
            const isSelected = selectedRoom?.name === room.name;
            if (isSelected) return;

            const lastViewedTime = getLastViewedTime(room.name);
            const lastMsgTime = room.time ? new Date(room.time) : null;
            const lastMsgFromOthers = room.sender && room.sender !== `${user?.firstName} ${user?.lastName}`;
            const hasUnread = (unreadCounts[room.name] > 0) ||
                (lastMsgFromOthers && lastMsgTime && (!lastViewedTime || new Date(lastViewedTime) < lastMsgTime));
            if (hasUnread) {
                count += unreadCounts[room.name] || 1;
            }
        });
        return count;
    };

    const getChatsUnreadCount = () => {
        let count = 0;
        usersList.forEach(u => {
            const myId = user?._id || user?.id;
            const directRoomId = [myId, u._id || u.id].sort().join('-');
            const isSelected = selectedRoom?.name === directRoomId;
            if (isSelected) return;

            const lastViewedTime = getLastViewedTime(directRoomId);
            const lastMsgTime = u.lastMessageTime ? new Date(u.lastMessageTime) : null;
            const lastMsgFromOthers = u.lastMessageSender && u.lastMessageSender !== myId;
            const hasUnread = (unreadCounts[directRoomId] > 0) ||
                (lastMsgFromOthers && lastMsgTime && (!lastViewedTime || new Date(lastViewedTime) < lastMsgTime));
            if (hasUnread) {
                count += unreadCounts[directRoomId] || 1;
            }
        });
        return count;
    };

    const unreadChatsTotal = getChatsUnreadCount();
    const unreadGroupsTotal = getGroupsUnreadCount();

    const getMessageStatus = (msg) => {
        const isDirect = selectedRoom?.isDirect || (selectedRoom?.name && /^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/.test(selectedRoom.name));
        if (isDirect) {
            if (msg.seen) return 'seen';
            if (msg.delivered) return 'delivered';
            return 'sent';
        } else {
            if (msg.seenBy && msg.seenBy.length > 0) return 'seen';
            if (msg.deliveredTo && msg.deliveredTo.length > 0) return 'delivered';
            return 'sent';
        }
    };

    const isOnlyEmojis = (str) => {
        if (!str || !str.trim()) return false;
        const cleanStr = str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\s]/gu, '');
        return cleanStr.length === 0;
    };

    const filteredItems = getFilteredItems();
    const groupedMessages = groupMessagesByDate(messages);
    const participants = Array.from(new Set(messages.map(m => m.senderName))).filter(Boolean);

     return (
         <div 
             ref={overlayRef}
             onClick={handleBackdropClick}
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none"
         >
            {/* Split Layout */}
            <div className="flex gap-3 w-full max-w-7xl h-[85vh] justify-center items-stretch relative">

                {/* Left Card: Sidebar */}
                <div className="w-80 bg-white rounded-2xl shadow-2xl flex flex-col border border-neutral-200/50 overflow-hidden">
                    {/* User Profile Header */}
                    <div className={`${theme.primary} px-5 py-4 flex items-center justify-between text-white border-b ${theme.border}`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm shrink-0`}>
                                {getInitials(`${user?.firstName} ${user?.lastName}`)}
                            </div>
                            <span className="font-bold text-sm truncate">{user?.firstName} {user?.lastName}</span>
                        </div>
                        {isBoothAdmin ? (
                            <button
                                onClick={() => { logout(); navigate('/virtual-events-platform/app/login'); }}
                                className="text-white font-bold text-xs cursor-pointer px-3 py-1.5 bg-red-500 rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                            >
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white font-bold text-xl cursor-pointer p-1"
                                title="Close Chat"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-200 text-sm font-bold text-gray-500 bg-white">
                        <button
                            onClick={() => setActiveTab('Chats')}
                            className={`flex-1 py-3.5 flex items-center justify-center gap-2 relative transition-colors ${activeTab === 'Chats' ? theme.text : 'hover:text-gray-700'}`}
                        >
                            <MdChat className="text-lg" />
                            <span>Chats</span>
                            {unreadChatsTotal > 0 && (
                                <span className={`min-w-[16px] h-[16px] rounded-full ${theme.primary} text-white text-[8px] font-bold flex items-center justify-center px-1 shadow-sm`}>
                                    {unreadChatsTotal}
                                </span>
                            )}
                            {activeTab === 'Chats' && (
                                <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${theme.primary}`} />
                            )}
                        </button>
                        {!isBoothAdmin && (
                            <button
                                onClick={() => setActiveTab('Groups')}
                                className={`flex-1 py-3.5 flex items-center justify-center gap-2 relative transition-colors ${activeTab === 'Groups' ? theme.text : 'hover:text-gray-700'}`}
                            >
                                <MdGroup className="text-lg" />
                                <span>Groups</span>
                                {unreadGroupsTotal > 0 && (
                                    <span className={`min-w-[16px] h-[16px] rounded-full ${theme.primary} text-white text-[8px] font-bold flex items-center justify-center px-1 shadow-sm`}>
                                        {unreadGroupsTotal}
                                    </span>
                                )}
                                {activeTab === 'Groups' && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${theme.primary}`} />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="p-3 relative bg-white border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#f0f4f9] text-xs text-gray-800 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-400 border border-transparent focus:border-blue-100"
                        />
                        <FiSearch className="absolute left-7 top-[22px] text-gray-400 w-4 h-4" />
                    </div>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        {filteredItems.length === 0 ? (
                            <div className="text-center text-gray-400 text-xs py-8">
                                No active users found
                            </div>
                        ) : (                            // Render based on activeTab
                            filteredItems.map((item) => {
                                if (activeTab === 'Groups') {
                                    const isSelected = selectedRoom?.name === item.name;
                                    const lastViewedTime = getLastViewedTime(item.name);
                                    const lastMsgTime = item.time ? new Date(item.time) : null;
                                    const lastMsgFromOthers = item.sender && item.sender !== `${user?.firstName} ${user?.lastName}`;
                                    const hasUnread = !isSelected && ((unreadCounts[item.name] > 0) ||
                                        (lastMsgFromOthers && lastMsgTime && (!lastViewedTime || new Date(lastViewedTime) < lastMsgTime)));
                                    const displayCount = unreadCounts[item.name] || (hasUnread ? 1 : 0);
                                    const initials = getInitials(item.name);

                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleSelectRoom(item)}
                                            className={`w-full text-left px-5 py-4 flex items-center gap-3 border-b border-gray-100 transition-colors ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner relative`}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className={`text-xs font-bold truncate ${hasUnread ? 'text-gray-900 font-extrabold' : 'text-gray-800'}`}>{item.name}</h4>
                                                    {item.time && (
                                                        <span className={`text-[9px] shrink-0 font-medium ${hasUnread ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
                                                            {formatTime(item.time)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    {typingUsers[item.name] && typingUsers[item.name].length > 0 ? (
                                                        <span className="text-[10px] text-emerald-500 font-bold animate-pulse">typing...</span>
                                                    ) : (
                                                        <p className={`text-[10px] truncate ${hasUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                            {item.lastMessage}
                                                        </p>
                                                    )}
                                                    {hasUnread && (
                                                        <span className="min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shrink-0 ml-2 shadow-sm">
                                                            {displayCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                } else {
                                    const u = item;
                                    const fullName = `${u.firstName} ${u.lastName}`;
                                    const initials = getInitials(fullName);
                                    const myId = user?._id || user?.id;
                                    const directRoomId = [myId, u._id || u.id].sort().join('-');
                                    const isSelected = selectedRoom?.name === directRoomId;
                                    const lastViewedTime = getLastViewedTime(directRoomId);
                                    const lastMsgTime = u.lastMessageTime ? new Date(u.lastMessageTime) : null;
                                    const lastMsgFromOthers = u.lastMessageSender && u.lastMessageSender !== myId;
                                    const hasUnread = !isSelected && ((unreadCounts[directRoomId] > 0) ||
                                        (lastMsgFromOthers && lastMsgTime && (!lastViewedTime || new Date(lastViewedTime) < lastMsgTime)));
                                    const displayCount = unreadCounts[directRoomId] || (hasUnread ? 1 : 0);

                                    return (
                                        <button
                                            key={u._id}
                                            onClick={() => selectDirectUser(u)}
                                            className={`w-full text-left px-5 py-4 flex items-center gap-3 border-b border-gray-100 transition-colors ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner relative`}>
                                                {initials}
                                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className={`text-xs font-bold truncate ${hasUnread ? 'text-gray-900 font-extrabold' : 'text-gray-800'}`}>{fullName}</h4>
                                                    {u.lastMessageTime && (
                                                        <span className={`text-[9px] shrink-0 font-medium ${hasUnread ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
                                                            {formatTime(u.lastMessageTime)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    {typingUsers[directRoomId] && typingUsers[directRoomId].length > 0 ? (
                                                        <span className="text-[10px] text-emerald-500 font-bold animate-pulse">typing...</span>
                                                    ) : (
                                                        <p className={`text-[10px] truncate ${hasUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                            {u.designation || 'Attendee'} {u.company ? `at ${u.company}` : ''}
                                                        </p>
                                                    )}
                                                    {hasUnread && (
                                                        <span className="min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shrink-0 ml-2 shadow-sm">
                                                            {displayCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }
                            })
                        )}
                    </div>
                </div>

                {/* Right Card: Conversation Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-2xl flex flex-col border border-neutral-200/50 overflow-hidden relative">
                    {/* Floating top close button - hidden when details panel is active to shift control */}
                    {!showDetails && !isBoothAdmin && selectedRoom && (
                        <button
                            onClick={() => setSelectedRoom(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 font-bold text-2xl z-20"
                            title="Close Conversation"
                        >
                            ✕
                        </button>
                    )}

                    {selectedRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className={`${theme.primary} text-white px-6 py-4 flex items-center justify-between shadow-md z-10`}>
                                <div
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-95"
                                >
                                    {/* Dynamic Stacked Avatars */}
                                    {participants.length > 0 ? (
                                        <div className="flex -space-x-2 shrink-0">
                                            {participants.slice(0, 2).map((pName, idx) => (
                                                <div
                                                    key={pName}
                                                    className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-sm text-white ${idx === 0 ? theme.primary : 'bg-pink-500'
                                                        }`}
                                                >
                                                    {getInitials(pName)}
                                                </div>
                                            ))}
                                            {participants.length > 2 && (
                                                <div className="w-10 h-10 rounded-full bg-slate-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                    +{participants.length - 2}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-400 border border-white flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                            {getInitials(selectedRoom.name)}
                                        </div>
                                    )}
                                    <h3 className="font-bold text-sm truncate">
                                        {selectedRoom.isDirect ? `Chat with ${selectedRoom.user.firstName} ${selectedRoom.user.lastName}` : selectedRoom.name}
                                    </h3>
                                </div>

                            </div>


                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f5f7fb]">
                                {Object.keys(groupedMessages).length === 0 ? (
                                    <div className="text-center text-gray-400 text-xs py-16 font-semibold">
                                        No messages. Type a message below to start chatting!
                                    </div>
                                ) : (
                                    Object.keys(groupedMessages).map((date) => (
                                        <div key={date} className="space-y-4">
                                            {/* Date Separator */}
                                            <div className="flex justify-center">
                                                <span className="bg-[#e4ebf5] text-[#556987] text-[10px] font-bold px-3 py-1 rounded shadow-sm border border-neutral-200/20">
                                                    {date}
                                                </span>
                                            </div>
                                            {/* Messages on that Date */}
                                            {groupedMessages[date].map((msg) => {
                                                const isMe = msg.sender === user?.id ||
                                                    msg.sender === user?._id ||
                                                    msg.sender === 'me' ||
                                                    msg.senderName?.toLowerCase() === `${user?.firstName} ${user?.lastName}`.toLowerCase().trim();
                                                const justEmojis = isOnlyEmojis(msg.text);
                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex flex-col max-w-[70%] ${justEmojis ? 'mb-5' : ''} ${isMe ? 'ml-auto items-end' : 'items-start'}`}
                                                        onMouseEnter={() => setHoveredMessageId(msg._id)}
                                                        onMouseLeave={() => setHoveredMessageId(null)}
                                                    >
                                                        <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                                                            {msg.senderName}
                                                        </span>
                                                        <div className={`relative flex items-center ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <div className={justEmojis 
                                                                ? `p-1 text-4xl relative leading-none select-text`
                                                                : `p-4 rounded-2xl shadow-sm text-xs font-semibold relative leading-relaxed tracking-wide ${isMe
                                                                    ? `${theme.bubble} text-white rounded-tr-none`
                                                                    : `${theme.bubbleOther} text-gray-800 rounded-tl-none`
                                                                    }`
                                                            }>
                                                                {msg.replyTo && (
                                                                    <div className={`mb-2 p-2 rounded flex flex-col border-l-[3px] ${isMe ? 'bg-white/20 border-white text-white' : 'bg-white/50 border-gray-600 text-gray-700'} `}>
                                                                        <span className="font-bold text-[10px] mb-0.5 opacity-90">{msg.replyTo.senderName}</span>
                                                                        <span className="text-[10px] truncate opacity-90">{msg.replyTo.text}</span>
                                                                    </div>
                                                                )}
                                                                {msg.forwarded && (
                                                                    <span className={`text-[8px] italic font-medium flex items-center gap-0.5 ${isMe ? 'text-blue-200' : 'text-gray-500'} mb-1`}>
                                                                        <TbArrowForwardUpDouble className="w-2.5 h-2.5" /> Forwarded
                                                                    </span>
                                                                )}
                                                                <p className={justEmojis ? "whitespace-pre-wrap leading-none" : "pr-12 whitespace-pre-wrap"}>{msg.text}</p>
                                                                {msg.edited && (
                                                                    <span className={`text-[8px] italic font-medium ${isMe && !justEmojis ? 'text-blue-200' : 'text-gray-500'} mt-0.5 block`}>edited</span>
                                                                )}
                                                                <span className={justEmojis 
                                                                    ? `absolute -bottom-4 right-0 text-[8px] font-bold flex items-center gap-1.5 text-gray-500 whitespace-nowrap`
                                                                    : `absolute bottom-1 right-2.5 text-[8px] font-bold flex items-center gap-1.5 ${isMe ? 'text-blue-200' : 'text-gray-500'}`
                                                                }>
                                                                    <span>{formatTime(msg.createdAt)}</span>
                                                                    {isMe && (
                                                                        <span className="text-[10px] leading-none select-none font-bold">
                                                                            {getMessageStatus(msg) === 'seen' && <span className="text-sky-300 font-extrabold" title="Seen">✓✓</span>}
                                                                            {getMessageStatus(msg) === 'delivered' && <span className="text-gray-300 font-extrabold" title="Delivered">✓✓</span>}
                                                                            {getMessageStatus(msg) === 'sent' && <span className="text-gray-300 font-extrabold" title="Sent">✓</span>}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {msg.reactions && msg.reactions.length > 0 && (
                                                                    <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 bg-white shadow-sm border border-gray-200 rounded-full px-1.5 py-0.5 z-10`}>
                                                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                                                                            const count = msg.reactions.filter(r => r.emoji === emoji).length;
                                                                            const myReaction = msg.reactions.some(r => r.emoji === emoji && r.userId === (user?._id || user?.id));
                                                                            return (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => setViewingReactionsForMsg(msg)}
                                                                                    className={`flex items-center gap-0.5 text-[10px] cursor-pointer hover:scale-110 transition-transform ${myReaction ? 'bg-blue-50 rounded px-1' : ''}`}
                                                                                >
                                                                                    <span>{emoji}</span>
                                                                                    {count > 1 && <span className="font-bold text-gray-500">{count}</span>}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {reactingToMessageId === msg._id ? (
                                                                <div className={`flex items-center gap-1 bg-white shadow-md rounded-lg p-1 border border-gray-100 z-20 shrink-0 ${isMe ? 'mr-2' : 'ml-2'}`}>
                                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                        <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)} className="p-1 hover:scale-125 transition-transform text-lg cursor-pointer">
                                                                            {emoji}
                                                                        </button>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => setShowEmojiPickerForMsg(showEmojiPickerForMsg === msg._id ? null : msg._id)}
                                                                        className="p-1 w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 font-bold transition-colors cursor-pointer"
                                                                    >
                                                                        <span className="text-lg leading-none">+</span>
                                                                    </button>
                                                                    <button onClick={() => { setReactingToMessageId(null); setShowEmojiPickerForMsg(null); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 cursor-pointer">✕</button>
                                                                </div>
                                                            ) : (
                                                                hoveredMessageId === msg._id && (
                                                                    <div className={`flex items-center gap-1 bg-white shadow-md rounded-lg p-1 border border-gray-100 z-10 shrink-0 ${isMe ? 'mr-2' : 'ml-2'}`}>
                                                                        <button onClick={() => setReactingToMessageId(msg._id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title="React">
                                                                            <FiSmile className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title="Reply">
                                                                            <FiCornerUpLeft className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        {isMe && (
                                                                            <button onClick={() => { setEditingMsg(msg); setNewMessageText(msg.text); inputRef.current?.focus(); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-amber-500 transition-colors cursor-pointer" title="Edit">
                                                                                <FiEdit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => setForwardingMsg(msg)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer" title="Forward">
                                                                            <TbArrowForwardUpDouble className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button onClick={() => handleCopy(msg)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title="Copy Text">
                                                                            {copiedMessageId === msg._id ? <FiCheck className="w-3.5 h-3.5 text-green-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                {typingUsers[selectedRoom.name] && typingUsers[selectedRoom.name].length > 0 && (
                                    <div className="flex flex-col items-start space-y-1 mb-2 animate-fade-in">
                                        <span className="text-[9px] font-bold text-gray-400 ml-4">
                                            {selectedRoom.isDirect 
                                                ? 'typing...' 
                                                : `${typingUsers[selectedRoom.name].map(u => u.userName).join(', ')} typing...`
                                            }
                                        </span>
                                        <div className="flex items-center gap-1 bg-[#e4ebf5] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm max-w-[80px] ml-4">
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {editingMsg ? (
                                <div className="px-5 py-3 bg-amber-50 border-t border-amber-200 flex justify-between items-center text-xs text-gray-600 relative">
                                    <div className="flex-1 min-w-0 pr-4 border-l-2 border-amber-400 pl-3">
                                        <span className="font-bold block text-amber-600 mb-1">Editing message</span>
                                        <p className="truncate text-gray-500">{editingMsg.text}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingMsg(null); setNewMessageText(''); }}
                                        className="text-gray-400 hover:text-gray-600 p-2 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : replyingTo && (
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-600 relative">
                                    <div className={`flex-1 min-w-0 pr-4 border-l-2 ${theme.borderHighlight} pl-3`}>
                                        <span className={`font-bold block ${theme.text} mb-1`}>Replying to {replyingTo.senderName}</span>
                                        <p className="truncate text-gray-500">{replyingTo.text}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyingTo(null)}
                                        className="text-gray-400 hover:text-gray-600 p-2 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Input Footer */}
                            <form onSubmit={editingMsg ? handleEditMessage : handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3 items-center relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiSmile className="w-5 h-5" />
                                </button>

                                {showEmojiPicker && (
                                    <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-lg overflow-hidden">
                                        <EmojiPicker
                                            onEmojiClick={(emojiData) => {
                                                setNewMessageText(prev => prev + emojiData.emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            width={300}
                                            height={400}
                                        />
                                    </div>
                                )}

                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={editingMsg ? 'Edit message...' : 'Enter message ...'}
                                    value={newMessageText}
                                    onChange={handleInputChange}
                                    className={`flex-1 text-xs text-gray-800 rounded-full py-3 px-5 focus:outline-none focus:ring-1 border border-transparent transition-colors ${editingMsg ? 'bg-amber-50 focus:ring-amber-400 focus:border-amber-100' : 'bg-[#f0f4f9] focus:ring-blue-400 focus:border-blue-100'}`}
                                />
                                <button
                                    type="submit"
                                    className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md transition-colors cursor-pointer shrink-0 ${editingMsg ? 'bg-amber-500 hover:bg-amber-600' : theme.button}`}
                                >
                                    {editingMsg ? <FiCheck className="w-4 h-4" /> : <FiSend className="w-4 h-4" />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <MdGroup className="text-5xl text-neutral-300 animate-pulse" />
                            <p className="text-sm font-semibold">Select a chat or group to start chatting</p>
                        </div>
                    )}
                </div>

                {/* Right Card: Room Details */}
                {showDetails && selectedRoom && (
                    <div className="w-80 bg-white rounded-2xl shadow-2xl flex flex-col border border-neutral-200/50 overflow-hidden relative">
                        {/* Close details button */}
                        <button
                            onClick={() => setShowDetails(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 font-bold text-2xl z-20 cursor-pointer"
                            title="Close Details"
                        >
                            ✕
                        </button>

                        <div className="p-6 flex flex-col items-center border-b border-gray-100 mt-6 shrink-0">
                            {/* Dynamic Stacked avatars */}
                            {participants.length > 0 ? (
                                <div className="flex -space-x-3 mb-4 scale-110">
                                    {participants.slice(0, 2).map((pName, idx) => (
                                        <div
                                            key={pName}
                                            className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm ${idx === 0 ? theme.primary : 'bg-pink-500'
                                                }`}
                                        >
                                            {getInitials(pName)}
                                        </div>
                                    ))}
                                    {participants.length > 2 && (
                                        <div className="w-10 h-10 rounded-full bg-slate-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                            +{participants.length - 2}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-400 border border-white flex items-center justify-center text-xs font-bold text-white shadow-sm mb-4">
                                    {getInitials(selectedRoom.name)}
                                </div>
                            )}
                            <h3 className="font-bold text-sm text-center text-gray-800 leading-snug max-w-[220px]">
                                {selectedRoom.isDirect ? `Chat with ${selectedRoom.user.firstName} ${selectedRoom.user.lastName}` : selectedRoom.name}
                            </h3>
                        </div>

                        {/* Participant list: Unique list of message senders in room */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Participants</h4>
                            <div className="space-y-4">
                                {Array.from(new Set(messages.map(m => m.senderName)))
                                    .filter(Boolean)
                                    .map(name => {
                                        const initials = getInitials(name);
                                        return (
                                            <div key={name} className="flex items-center gap-3 px-2 py-1">
                                                <div className={`w-8 h-8 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner`}>
                                                    {initials}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700 truncate">{name}</span>
                                            </div>
                                        );
                                    })}
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-400 text-xs italic py-4">
                                        No participants yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reaction Details Modal */}
                {viewingReactionsForMsg && (
                    <div className="absolute inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setViewingReactionsForMsg(null)}>
                        <div className="bg-[#1e1e1e] rounded-2xl w-full max-w-[320px] overflow-hidden flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                                <h3 className="text-white font-bold">{viewingReactionsForMsg.reactions.length} reaction{viewingReactionsForMsg.reactions.length !== 1 && 's'}</h3>
                            </div>

                            <div className="p-3 border-b border-gray-700/30 flex gap-2 overflow-x-auto">
                                <div className="bg-gray-800 rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer shrink-0">
                                    <span className="text-white font-bold text-xs">All</span>
                                    <span className="text-gray-400 font-bold text-xs">{viewingReactionsForMsg.reactions.length}</span>
                                </div>
                                {Array.from(new Set(viewingReactionsForMsg.reactions.map(r => r.emoji))).map(emoji => (
                                    <div key={emoji} className="bg-green-900/30 border border-green-800/50 rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer shrink-0">
                                        <span className="text-sm">{emoji}</span>
                                        <span className="text-green-500 font-bold text-xs">{viewingReactionsForMsg.reactions.filter(r => r.emoji === emoji).length}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                {viewingReactionsForMsg.reactions.map((r, i) => {
                                    const isMyReaction = r.userId === (user?._id || user?.id);
                                    const initials = getInitials(r.userName);
                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center p-3 rounded-xl transition-colors group ${isMyReaction ? 'cursor-pointer hover:bg-gray-800/80' : ''}`}
                                            onClick={() => {
                                                if (isMyReaction) {
                                                    handleAddReaction(viewingReactionsForMsg._id, r.emoji);
                                                    setViewingReactionsForMsg(prev => {
                                                        const newReactions = prev.reactions.filter(x => x.userId !== r.userId || x.emoji !== r.emoji);
                                                        if (newReactions.length === 0) return null;
                                                        return { ...prev, reactions: newReactions };
                                                    });
                                                }
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shrink-0 mr-3 overflow-hidden">
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate">{isMyReaction ? 'You' : r.userName}</h4>
                                                {isMyReaction && <p className="text-[10px] text-gray-400 group-hover:text-red-400 transition-colors uppercase tracking-wider font-bold mt-0.5">Click to remove</p>}
                                            </div>
                                            <div className="text-xl ml-2">{r.emoji}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Emoji Picker Modal for Quick Reactions */}
                {showEmojiPickerForMsg && (
                    <div className="absolute inset-0 bg-black/10 z-[70] flex items-center justify-center p-4" onClick={() => setShowEmojiPickerForMsg(null)}>
                        <div onClick={e => e.stopPropagation()} className="shadow-2xl rounded-xl overflow-hidden bg-white">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    handleAddReaction(showEmojiPickerForMsg, emojiData.emoji);
                                    setShowEmojiPickerForMsg(null);
                                    setReactingToMessageId(null);
                                }}
                                width={320}
                                height={400}
                            />
                        </div>
                    </div>
                )}

                {/* Forward Message Modal */}
                {forwardingMsg && (
                    <div className="absolute inset-0 bg-black/40 z-[80] flex items-center justify-center p-4" onClick={() => setForwardingMsg(null)}>
                        <div className="bg-[#1e1e1e] rounded-2xl w-full max-w-[340px] overflow-hidden shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-700/50 shrink-0">
                                <h3 className="text-white font-bold text-sm">Forward Message</h3>
                                <p className="text-gray-400 text-[10px] mt-1 truncate italic">"{forwardingMsg.text}"</p>
                            </div>

                            <div className="overflow-y-auto flex-1">
                                {rooms.length > 0 && (
                                    <div>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-4 pt-4 pb-2">Groups</p>
                                        {rooms.map(room => (
                                            <button
                                                key={room.name}
                                                onClick={() => handleForwardMessage(room.name)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors cursor-pointer"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">{getInitials(room.name)}</div>
                                                <span className="text-white text-xs font-semibold truncate">{room.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {usersList.length > 0 && (
                                    <div>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-4 pt-4 pb-2">Direct Messages</p>
                                        {usersList.map(u => {
                                            const myId = user?._id || user?.id;
                                            const uId = u._id || u.id;
                                            if (uId === myId) return null;
                                            const directRoomId = [myId, uId].sort().join('-');
                                            const fullName = `${u.firstName} ${u.lastName}`;
                                            return (
                                                <button
                                                    key={uId}
                                                    onClick={() => handleForwardMessage(directRoomId)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors cursor-pointer"
                                                >
                                                    <div className={`w-9 h-9 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-xs shrink-0 relative`}>
                                                        {getInitials(fullName)}
                                                        <span className={`absolute bottom-0 right-0 w-2 h-2 border border-gray-900 rounded-full ${u.status === 'online' ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                                                    </div>
                                                    <span className="text-white text-xs font-semibold truncate">{fullName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 shrink-0 border-t border-gray-700/30">
                                <button onClick={() => setForwardingMsg(null)} className="w-full py-2 text-gray-400 text-xs hover:text-white transition-colors cursor-pointer">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Password Entry Modal */}
            {passwordModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-150 overflow-hidden relative">
                        {/* Header */}
                        <div className={`${theme.primary} text-white px-6 py-4 flex items-center justify-between shadow-md`}>
                            <h3 className="font-extrabold text-sm tracking-wider uppercase flex items-center gap-2">
                                🔒 Password Required
                            </h3>
                            <button
                                onClick={() => {
                                    setPasswordModalOpen(false);
                                    setPendingRoom(null);
                                    setEnteredPassword('');
                                    setPasswordError('');
                                }}
                                className="text-white hover:text-gray-200 font-bold text-xl cursor-pointer p-0.5"
                                title="Cancel"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleUnlockRoom} className="p-6 flex flex-col gap-4">
                            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                                Entering <strong>{pendingRoom?.name}</strong> requires a password. Please enter the password below to access the discussion.
                            </p>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                    Room Password
                                </label>
                                <input
                                    type="password"
                                    value={enteredPassword}
                                    onChange={(e) => setEnteredPassword(e.target.value)}
                                    placeholder="Enter room password..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    autoFocus
                                    required
                                />
                            </div>

                            {passwordError && (
                                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                    ⚠️ {passwordError}
                                </p>
                            )}

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasswordModalOpen(false);
                                        setPendingRoom(null);
                                        setEnteredPassword('');
                                        setPasswordError('');
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 ${theme.primary} hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md`}
                                >
                                    Unlock Chat
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ChatOverlay;
