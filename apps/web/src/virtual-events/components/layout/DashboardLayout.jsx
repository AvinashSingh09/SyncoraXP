import React, { useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiMessageSquare, FiSettings, FiLogOut, FiInbox, FiTrash2, FiDownload, FiEye, FiX } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import { MdHome, MdStorefront, MdEventSeat, MdMeetingRoom, MdGroup, MdPeople, MdVideogameAsset, MdAssignment } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import ChatOverlay from '../chat/ChatOverlay';
import { chatService, configService, authService } from '../../services/api';
import socket from '../../services/socket';
import { BOOTH_ADMINS } from '../../config/boothAdmins';
import UserDashboardModal from '../UserDashboardModal';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isBoothAdmin = user && BOOTH_ADMINS[user.email?.toLowerCase().trim()];
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showChat, setShowChat] = useState(isBoothAdmin);
    const [requestedRoomName, setRequestedRoomName] = useState(null);
    const [requestedUser, setRequestedUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [showAttendees, setShowAttendees] = useState(false);
    const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [showUserDashboard, setShowUserDashboard] = useState(false);
    const [layoutConfigs, setLayoutConfigs] = useState({});
    const [showBagModal, setShowBagModal] = useState(false);
    const [bagItems, setBagItems] = useState(() => {
        try {
            const saved = localStorage.getItem('my_bag');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    React.useEffect(() => {
        const syncBag = () => {
            try {
                const saved = localStorage.getItem('my_bag');
                setBagItems(saved ? JSON.parse(saved) : []);
            } catch (e) {
                console.error(e);
            }
        };
        window.addEventListener('storage', syncBag);
        return () => window.removeEventListener('storage', syncBag);
    }, []);

    const getDownloadUrl = (url) => {
        if (!url) return '';
        if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
            return url.replace('/image/upload/', '/image/upload/fl_attachment/');
        }
        return url;
    };

    const handleDownloadAll = () => {
        const docs = bagItems.filter(item => item.type === 'document');
        docs.forEach((doc, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = getDownloadUrl(doc.url);
                link.setAttribute('download', doc.title || 'document');
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 300);
        });
    };

    const fetchLayoutConfigs = async () => {
        try {
            const keys = [
                'lobby_layout',
                'expo_hall_entrance',
                'auditorium_layout',
                'hall_a_layout',
                'hall_b_layout',
                'hall_c_layout'
            ];
            const response = await configService.getConfigsBulk(keys);
            if (response.data && response.data.success && response.data.configs) {
                const fetched = {};
                Object.keys(response.data.configs).forEach(key => {
                    const value = response.data.configs[key];
                    if (value) {
                        try {
                            const parsed = JSON.parse(value);
                            fetched[key] = parsed;

                            // Preload bgImage
                            if (parsed.bgImage) {
                                const img = new Image();
                                img.src = parsed.bgImage;
                            }
                        } catch (e) {
                            fetched[key] = value;
                            try {
                                const parsedVal = JSON.parse(value);
                                if (parsedVal && parsedVal.bgImage) {
                                    const img = new Image();
                                    img.src = parsedVal.bgImage;
                                }
                            } catch (pe) {
                                if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
                                    const img = new Image();
                                    img.src = value;
                                }
                            }
                        }
                    }
                });
                setLayoutConfigs(fetched);
            }
        } catch (err) {
            console.error('Failed to prefetch layout configs in bulk', err);
        }
    };

    React.useEffect(() => {
        fetchLayoutConfigs();
    }, []);

    const fetchLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
            const res = await authService.getLeaderboard();
            if (res.data && res.data.success) {
                setLeaderboardData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load leaderboard', err);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const seenMessageIds = useRef(new Set());
    React.useEffect(() => {
        if (showLeaderboard) {
            fetchLeaderboard();
        }
    }, [showLeaderboard]);

    // WebSocket listener for new messages to display as notifications
    React.useEffect(() => {
        if (!user) return;

        const loadExistingMessageIds = async () => {
            try {
                // Get lounge layout tables
                const loungeRes = await configService.getConfig('lounge_layout');
                let loungeRoomNames = [];
                if (loungeRes.data && loungeRes.data.value) {
                    try {
                        const parsed = JSON.parse(loungeRes.data.value);
                        if (parsed.points && Array.isArray(parsed.points)) {
                            loungeRoomNames = parsed.points.map(p => p.text);
                        }
                    } catch (e) { }
                }

                // Fetch messages for each lounge room and populate seenMessageIds
                for (const roomName of loungeRoomNames) {
                    try {
                        const res = await chatService.getMessages(roomName);
                        if (res.data && Array.isArray(res.data)) {
                            res.data.forEach(msg => {
                                seenMessageIds.current.add(msg._id);
                            });
                        }
                    } catch (err) { }
                }
            } catch (err) {
                console.error('Error loading initial messages', err);
            }
        };

        loadExistingMessageIds();

        const handleGlobalNewMessage = (msg) => {
            const isMe = msg.sender === user.id ||
                msg.sender === user._id ||
                msg.senderName?.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase().trim();

            const isDirectMessage = msg.room && msg.room.includes('-');
            let isForMe = true;
            if (isDirectMessage) {
                const myIdStr = (user.id || user._id).toString();
                isForMe = msg.room.includes(myIdStr);
            }

            if (!isMe && isForMe && !seenMessageIds.current.has(msg._id)) {
                seenMessageIds.current.add(msg._id);
                setNotifications(prev => {
                    if (prev.some(n => n.id === msg._id)) return prev;
                    return [{
                        id: msg._id,
                        senderName: msg.senderName,
                        text: isDirectMessage ? `${msg.senderName} sent you a Message` : `${msg.senderName} posted in ${msg.room}`,
                        roomName: msg.room,
                        createdAt: msg.createdAt,
                        read: false
                    }, ...prev];
                });

                // Update global unread counts for ChatOverlay if the room is not currently active
                try {
                    const activeRoom = sessionStorage.getItem('activeChatRoom');
                    if (activeRoom !== msg.room) {
                        const myIdStr = (user.id || user._id).toString();
                        const stored = localStorage.getItem(`unread_counts_${myIdStr}`);
                        let unreadCounts = stored ? JSON.parse(stored) : {};
                        unreadCounts[msg.room] = (unreadCounts[msg.room] || 0) + 1;
                        localStorage.setItem(`unread_counts_${myIdStr}`, JSON.stringify(unreadCounts));
                        window.dispatchEvent(new CustomEvent('unread-counts-updated'));
                    }
                } catch (e) {
                    console.error('Failed to update unread counts in localStorage', e);
                }
            }
        };

        socket.on('global-new-message', handleGlobalNewMessage);

        return () => {
            socket.off('global-new-message', handleGlobalNewMessage);
        };
    }, [user]);

    React.useEffect(() => {
        const handleOpenChat = (e) => {
            setShowChat(true);
            if (e.detail) {
                setRequestedRoomName(e.detail.roomName || null);
                setRequestedUser(e.detail.user || null);
            }
        };
        window.addEventListener('open-chat', handleOpenChat);

        // Handle redirected login for booth admins
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
        }

        // Auto-open chat if directed from login
        const autoOpen = sessionStorage.getItem('autoOpenChat');
        if (autoOpen) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: autoOpen } }));
            }, 800); // slightly longer delay to ensure booth mounts first
            sessionStorage.removeItem('autoOpenChat');
        }

        return () => window.removeEventListener('open-chat', handleOpenChat);
    }, [navigate]);

    // Fetch users for attendees list
    React.useEffect(() => {
        if (!user) return;
        const fetchUsers = async () => {
            try {
                const usersRes = await chatService.getUsers();
                if (usersRes.data) {
                    const validUsers = usersRes.data.filter(u => u.firstName && u.lastName && u.status === 'online');
                    setUsersList(validUsers);
                }
            } catch (err) {
                console.error('Failed to load users for attendees list', err);
            }
        };
        fetchUsers();
        const interval = setInterval(fetchUsers, 10000);

        const handleStatusChange = () => {
            fetchUsers();
        };
        socket.on('user-status-change', handleStatusChange);

        return () => {
            clearInterval(interval);
            socket.off('user-status-change', handleStatusChange);
        };
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/virtual-events-platform/app/login');
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    const navTabs = [
        { name: 'Lobby', path: '/virtual-events-platform/app/dashboard/lobby', icon: MdHome },
        { name: 'Expo Hall', path: '/virtual-events-platform/app/dashboard/expo-hall', icon: MdStorefront },
        { name: 'Auditorium', path: '/virtual-events-platform/app/dashboard/auditorium', icon: MdEventSeat },
        { name: 'Lounge', path: '/virtual-events-platform/app/dashboard/lounge', icon: MdMeetingRoom },
        { name: 'Round Tables', path: '/virtual-events-platform/app/dashboard/round-tables', icon: MdGroup },
        { name: 'Meeting Room', path: '/virtual-events-platform/app/dashboard/meeting-room', icon: MdPeople },
        { name: 'Engage', path: '/virtual-events-platform/app/dashboard/games', icon: MdVideogameAsset },
        { name: 'Survey', path: '/virtual-events-platform/app/dashboard/survey', icon: MdAssignment },
    ];

    return (
        <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans relative">
            {/* Floating Top Navigation Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[97%] max-w-[1500px] h-[88px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_12px_48px_rgba(41,92,232,0.10),0_2px_8px_rgba(0,0,0,0.06)] border border-blue-100/60 flex items-center justify-between px-8 z-50">
                {/* Logo Area */}
                <div className="flex items-center gap-3 text-[#295ce8] shrink-0">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#295ce8] to-[#6366f1] shadow-lg shadow-blue-200">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                            <path d="M12 3L3 7.5L12 12L21 7.5L12 3Z" />
                            <path d="M3 12L12 16.5L21 12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
                            <path d="M3 16.5L12 21L21 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
                        </svg>
                        <span className="absolute -top-1.5 -right-1.5 text-[10px]">✨</span>
                    </div>
                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-[17px] font-black text-gray-900 tracking-tight">Virtual<span className="text-[#295ce8]">Event</span></span>
                        <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">Platform</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-3 shrink-0 rounded-full" />

                {/* Main Navigation */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-3">
                        {/* Left edge spacer */}
                        <div className="w-4 shrink-0" />
                        {navTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <NavLink
                                    key={tab.name}
                                    to={tab.path}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center justify-center min-w-[82px] h-[56px] gap-1.5 px-2 transition-all duration-200 rounded-2xl shrink-0 group outline-none focus:outline-none ${isActive
                                            ? 'bg-[#eef2ff] text-[#295ce8]'
                                            : 'text-gray-400 hover:text-[#295ce8] hover:bg-[#f0f5ff]'
                                        }`
                                    }
                                >
                                    <Icon className="w-[20px] h-[20px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                    <span className="text-[10.5px] font-bold whitespace-nowrap">{tab.name}</span>
                                </NavLink>
                            );
                        })}
                        {/* Right edge spacer */}
                        <div className="w-4 shrink-0" />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-3 shrink-0 rounded-full" />

                {/* Right Side Icons */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                    {/* Notification Center */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                                setShowAttendees(false);
                                if (!showNotifications) {
                                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                }
                            }}
                            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#295ce8] transition-all duration-200 hover:shadow-sm cursor-pointer border border-transparent hover:border-blue-100"
                        >
                            <FiBell className="w-[22px] h-[22px]" />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[9px] font-extrabold rounded-full border-2 border-white flex items-center justify-center shadow">{notifications.filter(n => !n.read).length}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto py-2">
                                <div className="px-4 py-2 border-b border-gray-100 mb-1 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-700">Notifications</span>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => setNotifications([])}
                                            className="text-[10px] text-blue-500 hover:underline font-bold"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => {
                                                n.read = true;
                                                setShowNotifications(false);
                                                window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: n.roomName } }));
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 transition-colors cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#1e70e9] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                                                {n.senderName ? n.senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'SS'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800">{n.senderName}</p>
                                                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{n.text || 'sent you a Message'}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setShowChat(!showChat);
                            if (!showChat) {
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }
                        }}
                        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#295ce8] transition-all duration-200 hover:shadow-sm cursor-pointer border border-transparent hover:border-blue-100"
                    >
                        <FiMessageSquare className="w-[22px] h-[22px]" />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#295ce8] rounded-full border-2 border-white shadow"></span>
                        )}
                    </button>

                    {/* My Bag Icon */}
                    <button
                        onClick={() => {
                            setShowBagModal(true);
                            setShowProfileMenu(false);
                            setShowNotifications(false);
                            setShowAttendees(false);
                        }}
                        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#295ce8] transition-all duration-200 hover:shadow-sm cursor-pointer border border-transparent hover:border-blue-100"
                        title="My Bag"
                    >
                        <FiInbox className="w-[22px] h-[22px]" />
                        {bagItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full border-2 border-white flex items-center justify-center shadow">
                                {bagItems.length}
                            </span>
                        )}
                    </button>

                    {/* Points Badge */}
                    <button
                        onClick={() => {
                            setShowLeaderboard(true);
                            setShowProfileMenu(false);
                            setShowNotifications(false);
                            setShowAttendees(false);
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full text-[12px] font-black shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-200 transition-all cursor-pointer select-none"
                        title="View Event Leaderboard"
                    >
                        🏆 <span className="font-black">{user?.points || 0}</span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                                setShowAttendees(false);
                            }}
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-[#295ce8] to-[#6366f1] text-white font-black text-sm relative shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all ring-2 ring-white hover:ring-blue-100"
                        >
                            {getInitials(user?.firstName, user?.lastName)}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] border-2 border-white rounded-full shadow-sm"></span>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100 z-50">
                                <div className="px-4 py-2 border-b border-gray-100 mb-2 flex flex-col gap-1.5">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <div
                                        onClick={() => { setShowProfileMenu(false); setShowUserDashboard(true); }}
                                        className="self-start flex flex-col gap-1 w-full cursor-pointer hover:opacity-90 transition-opacity"
                                        title="Click to view full Dashboard"
                                    >
                                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black border border-amber-200">
                                            🏆 {user?.points || 0} Total Points
                                        </div>
                                        <p className="text-[9px] text-gray-500 font-bold tracking-tight pl-0.5">
                                            🏢 {user?.boothPoints || 0} Expo | 🎮 {user?.gamePoints || 0} Games
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowProfileMenu(false); setShowUserDashboard(true); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-100 mb-1 cursor-pointer"
                                >
                                    <span className="text-gray-400">🧭</span> My Dashboard
                                </button>
                                <button
                                    onClick={() => { setShowProfileMenu(false); setShowLeaderboard(true); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-100 mb-1 cursor-pointer"
                                >
                                    <FaTrophy className="text-amber-500" /> Event Leaderboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <FiLogOut /> Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowAttendees(!showAttendees);
                                setShowNotifications(false);
                                setShowProfileMenu(false);
                            }}
                            className="bg-gradient-to-r from-[#295ce8] to-[#6366f1] hover:from-[#1e4fd4] hover:to-[#4f52d9] text-white font-bold px-5 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 cursor-pointer shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-300/60 tracking-wide"
                        >
                            <MdPeople className="w-[20px] h-[20px]" />
                            <span className="hidden sm:inline font-bold">Attendees Live</span>
                            <span className="bg-white/20 border border-white/30 text-white w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black backdrop-blur-sm">
                                {usersList.filter(u => u.status === 'online').length}
                            </span>
                        </button>

                        {showAttendees && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl py-2 border border-gray-100 z-50 overflow-hidden">
                                <div className="px-3 pb-2 border-b border-gray-100 mb-2">
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-[10px] text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search attendees..."
                                            value={attendeeSearchQuery}
                                            onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                                            className="w-full bg-[#f0f4f9] text-xs text-gray-800 rounded-full py-2 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-400 border border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {usersList.filter(u => u.status === 'online' && `${u.firstName} ${u.lastName}`.toLowerCase().includes(attendeeSearchQuery.toLowerCase())).length === 0 ? (
                                        <div className="text-center text-gray-400 text-xs py-4 font-semibold">No attendees found</div>
                                    ) : (
                                        usersList.filter(u => u.status === 'online' && `${u.firstName} ${u.lastName}`.toLowerCase().includes(attendeeSearchQuery.toLowerCase())).map(u => (
                                            <button
                                                key={u._id}
                                                onClick={() => {
                                                    setShowAttendees(false);
                                                    window.dispatchEvent(new CustomEvent('open-chat', { detail: { user: u } }));
                                                }}
                                                className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 shadow-inner relative">
                                                    {getInitials(u.firstName, u.lastName)}
                                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white rounded-full ${u.status === 'online' ? 'bg-[#10b981]' : 'bg-gray-400'}`}></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{u.firstName} {u.lastName}</p>
                                                    <p className="text-[10px] text-gray-500 truncate font-semibold">{u.designation || 'Attendee'} {u.company ? `at ${u.company}` : ''}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Main Content Area */}
            <div className="flex-1 relative bg-gray-50 pt-[112px]">
                <Outlet context={{ layoutConfigs, refreshLayoutConfigs: fetchLayoutConfigs }} />
            </div>

            {showChat && (
                <ChatOverlay
                    onClose={() => {
                        if (!isBoothAdmin) {
                            setShowChat(false);
                        }
                        setRequestedRoomName(null);
                        setRequestedUser(null);
                    }}
                    initialRoomName={requestedRoomName}
                    initialUser={requestedUser}
                />
            )}

            {showLeaderboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
                    <div className="bg-white/90 border border-white/40 shadow-2xl rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-fade-in relative">
                        {/* Gold Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-4 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-2.5">
                                <FaTrophy className="w-5 h-5 text-yellow-100 animate-pulse" />
                                <span className="font-extrabold text-sm tracking-wider uppercase">Event Leaderboard</span>
                            </div>
                            <button
                                onClick={() => setShowLeaderboard(false)}
                                className="text-white hover:text-amber-100 font-bold text-xl cursor-pointer p-0.5"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                            {loadingLeaderboard ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-xs gap-3">
                                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-bold">Loading standings...</span>
                                </div>
                            ) : leaderboardData.length === 0 ? (
                                <div className="text-center text-gray-400 text-xs py-12 italic font-semibold">
                                    No data available yet. Start visiting booths!
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {leaderboardData.map((player, index) => {
                                        const rank = index + 1;
                                        const isMe = (player._id || player.id) === (user?._id || user?.id);
                                        let rankBadge = rank;
                                        if (rank === 1) rankBadge = '🥇';
                                        if (rank === 2) rankBadge = '🥈';
                                        if (rank === 3) rankBadge = '🥉';

                                        return (
                                            <div
                                                key={player._id || player.id || index}
                                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isMe
                                                    ? 'bg-amber-50/90 border-amber-300 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                                                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black w-8 text-center">{rankBadge}</span>
                                                    <div className="w-9 h-9 rounded-full bg-[#3b60f6] text-white font-bold flex items-center justify-center text-xs shadow-inner">
                                                        {getInitials(player.firstName, player.lastName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                            {player.firstName} {player.lastName}
                                                            {isMe && <span className="bg-amber-200 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans">You</span>}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-semibold">{player.company || 'Attendee'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-amber-600">{player.points || 0} pts</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showUserDashboard && (
                <UserDashboardModal
                    user={user}
                    onClose={() => setShowUserDashboard(false)}
                />
            )}

            {/* My Bag Modal */}
            {showBagModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowBagModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-3xl h-[75vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up border border-gray-100 z-10">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl">💼</span>
                                <h2 className="text-xl font-black text-gray-800 tracking-tight">My Saved Resources</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                {bagItems.some(item => item.type === 'document') && (
                                    <button
                                        onClick={handleDownloadAll}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                        title="Download all saved PDF documents"
                                    >
                                        <FiDownload className="w-3.5 h-3.5" />
                                        Download All Docs
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowBagModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                            {bagItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-550 py-12 text-center">
                                    <span className="text-5xl mb-3">📁</span>
                                    <p className="text-sm font-bold text-gray-700">Your bag is empty</p>
                                    <p className="text-xs text-gray-450 mt-1">Visit booths in the Expo Hall and save resources to access them here!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {bagItems.map(item => (
                                        <div key={`${item.id}-${item.type}`} className="bg-white p-4.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4 hover:shadow transition-all">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[10px] ${item.type === 'video'
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {item.type === 'video' ? 'VIDEO' : 'PDF'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-800 truncate" title={item.title}>
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-blue-600 tracking-wide uppercase mt-0.5">
                                                        📍 Booth: {item.boothId}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Open/View */}
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                                                    title={item.type === 'video' ? "Play Video" : "View Document"}
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </a>

                                                {/* Download (for Docs) */}
                                                {item.type === 'document' && (
                                                    <a
                                                        href={getDownloadUrl(item.url)}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                                                        title="Download"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </a>
                                                )}

                                                {/* Remove */}
                                                <button
                                                    onClick={() => {
                                                        const updated = bagItems.filter(i => !(i.id === item.id && i.type === item.type));
                                                        setBagItems(updated);
                                                        localStorage.setItem('my_bag', JSON.stringify(updated));
                                                        window.dispatchEvent(new Event('storage'));
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                                    title="Remove"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
