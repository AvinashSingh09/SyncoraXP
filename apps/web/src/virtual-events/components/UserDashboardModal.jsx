import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckCircle, FiCompass, FiAward, FiPlay, FiUser } from 'react-icons/fi';
import { configService } from '../services/api';

const UserDashboardModal = ({ user, onClose }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('quests'); // 'quests', 'badges', 'profile'
    const [booths, setBooths] = useState([]);
    const [loadingBooths, setLoadingBooths] = useState(false);

    useEffect(() => {
        const fetchBooths = async () => {
            setLoadingBooths(true);
            try {
                const halls = ['a', 'b', 'c'];
                const configs = await Promise.all(
                    halls.map(h => configService.getConfig(`hall_${h}_layout`))
                );

                const list = [];
                configs.forEach((res, index) => {
                    if (res.data && res.data.value) {
                        try {
                            const config = JSON.parse(res.data.value);
                            if (config.points) {
                                config.points.forEach(pt => {
                                    if (pt.targetPage && pt.targetPage.includes('/booth/')) {
                                        const match = pt.targetPage.match(/\/booth\/(\w+)/);
                                        const id = match ? `booth_${match[1]}` : pt.id;
                                        // Avoid duplicate booths in listing
                                        if (!list.some(b => b.id === id)) {
                                            list.push({
                                                id,
                                                name: pt.text || `Booth ${match ? match[1] : pt.id}`,
                                                targetPage: pt.targetPage,
                                                hall: halls[index].toUpperCase()
                                            });
                                        }
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                });
                setBooths(list);
            } catch (err) {
                console.error('Failed to load booths for checklist', err);
            } finally {
                setLoadingBooths(false);
            }
        };

        fetchBooths();
    }, []);

    // Achievements calculation
    const badges = [
        {
            id: 'first_step',
            name: 'First Step',
            desc: 'Earn your first event points',
            icon: '🧭',
            unlocked: (user?.points || 0) > 0
        },
        {
            id: 'explorer',
            name: 'Expo Explorer',
            desc: 'Visit your first exhibitor booth',
            icon: '🏢',
            unlocked: (user?.boothPoints || 0) > 0
        },
        {
            id: 'gamer',
            name: 'Arcade Gamer',
            desc: 'Play a game and earn points',
            icon: '🎮',
            unlocked: (user?.gamePoints || 0) > 0
        },
        {
            id: 'centurion',
            name: 'Centurion',
            desc: 'Reach 100 total points',
            icon: '💯',
            unlocked: (user?.points || 0) >= 100
        },
        {
            id: 'arcade_master',
            name: 'Arcade Master',
            desc: 'Earn 60+ points from games',
            icon: '🏆',
            unlocked: (user?.gamePoints || 0) >= 60
        },
        {
            id: 'expo_vip',
            name: 'Expo VIP',
            desc: 'Earn 150+ points from booth visits',
            icon: '👑',
            unlocked: (user?.boothPoints || 0) >= 150
        }
    ];

    const unlockedCount = badges.filter(b => b.unlocked).length;
    const progressPercent = booths.length > 0 
        ? Math.round(((user?.visitedBooths?.length || 0) / booths.length) * 100) 
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
            <div className="bg-white/95 border border-white/40 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in relative">
                {/* Header Profile Section */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-850 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-800 hover:text-slate-900 bg-white/70 hover:bg-white/90 shadow-md p-2 rounded-full transition-all cursor-pointer z-50"
                        title="Close"
                    >
                        <FiX className="w-4.5 h-4.5" />
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 text-white font-black flex items-center justify-center text-xl shadow-inner relative shrink-0">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-indigo-750 rounded-full"></span>
                        </div>

                        {/* Name Info */}
                        <div className="flex-1 text-center md:text-left min-w-0">
                            <h2 className="text-xl font-black truncate">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-xs text-indigo-200 font-semibold truncate">{user?.email}</p>
                            <p className="text-[10px] bg-white/10 border border-white/20 px-2 py-0.5 rounded-full inline-block mt-2 font-bold uppercase tracking-wider">
                                {user?.designation || 'Attendee'} {user?.company ? `@ ${user.company}` : ''}
                            </p>
                        </div>

                        {/* Point Stats */}
                        <div className="flex items-center gap-6 bg-white/10 border border-white/10 p-4 rounded-xl shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] text-indigo-200 uppercase font-black tracking-wider">Total Score</p>
                                <p className="text-2xl font-black text-yellow-300">{user?.points || 0} pts</p>
                            </div>
                            <div className="w-[1px] h-10 bg-white/20"></div>
                            <div className="text-xs space-y-1">
                                <p className="font-semibold text-gray-100">🏢 Expo: <span className="font-black text-yellow-100">{user?.boothPoints || 0}</span></p>
                                <p className="font-semibold text-gray-100">🎮 Games: <span className="font-black text-yellow-100">{user?.gamePoints || 0}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-white px-6">
                    <button
                        onClick={() => setActiveTab('quests')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'quests'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <FiCompass className="w-4 h-4" /> Expo Quest ({progressPercent}%)
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'badges'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <FiAward className="w-4 h-4" /> Achievements ({unlockedCount}/{badges.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 py-4 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'profile'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <FiUser className="w-4 h-4" /> My Profile
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {activeTab === 'quests' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Expo Hall Checklist</h3>
                                <p className="text-[11px] text-gray-400 font-semibold mb-3">
                                    Visit all exhibitor booths in Hall A, B, and C to learn about products and earn Expo points!
                                </p>
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2.5">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                    <span>{user?.visitedBooths?.length || 0} Booths Visited</span>
                                    <span>{booths.length} Total Booths</span>
                                </div>
                            </div>

                            {loadingBooths ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-xs gap-3">
                                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Scanning expo halls...</span>
                                </div>
                            ) : booths.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-150 text-gray-400 text-xs font-semibold italic">
                                    No booths configured yet. Check back soon!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {booths.map(booth => {
                                        const visited = user?.visitedBooths?.includes(booth.id);
                                        return (
                                            <div
                                                key={booth.id}
                                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                    visited 
                                                        ? 'bg-green-50/55 border-green-200' 
                                                        : 'bg-white border-gray-150 shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {visited ? (
                                                        <FiCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0"></div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-black truncate ${visited ? 'text-green-800' : 'text-gray-700'}`}>
                                                            {booth.name}
                                                        </p>
                                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">
                                                            Hall {booth.hall}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!visited && (
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            navigate(booth.targetPage);
                                                        }}
                                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <FiPlay className="w-3 h-3" /> Visit
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {badges.map(badge => (
                                <div
                                    key={badge.id}
                                    className={`flex flex-col items-center text-center p-5 rounded-2xl border transition-all ${
                                        badge.unlocked 
                                            ? 'bg-white border-blue-200 shadow-md ring-2 ring-blue-100/50' 
                                            : 'bg-white/60 border-gray-150 opacity-60'
                                    }`}
                                >
                                    <div className={`text-3xl mb-3 ${badge.unlocked ? '' : 'filter grayscale'}`}>
                                        {badge.icon}
                                    </div>
                                    <h4 className={`text-xs font-black ${badge.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                                        {badge.name}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-1.5 leading-relaxed">
                                        {badge.desc}
                                    </p>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase mt-3 inline-block ${
                                        badge.unlocked 
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {badge.unlocked ? 'Unlocked' : 'Locked'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-sm flex flex-col gap-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-2">Registration Details</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <p className="text-[10px] text-gray-450 font-bold uppercase">First Name</p>
                                        <p className="font-semibold text-gray-800 mt-0.5">{user?.firstName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-450 font-bold uppercase">Last Name</p>
                                        <p className="font-semibold text-gray-800 mt-0.5">{user?.lastName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-450 font-bold uppercase">Email Address</p>
                                        <p className="font-semibold text-gray-850 mt-0.5">{user?.email || 'N/A'}</p>
                                    </div>
                                    {user?.mobileNumber && (
                                        <div>
                                            <p className="text-[10px] text-gray-450 font-bold uppercase">Mobile Number</p>
                                            <p className="font-semibold text-gray-800 mt-0.5">{user.mobileNumber}</p>
                                        </div>
                                    )}
                                    {user?.country && (
                                        <div>
                                            <p className="text-[10px] text-gray-450 font-bold uppercase">Country</p>
                                            <p className="font-semibold text-gray-800 mt-0.5">{user.country}</p>
                                        </div>
                                    )}
                                    {user?.state && (
                                        <div>
                                            <p className="text-[10px] text-gray-450 font-bold uppercase">State</p>
                                            <p className="font-semibold text-gray-800 mt-0.5">{user.state}</p>
                                        </div>
                                    )}
                                    {user?.city && (
                                        <div>
                                            <p className="text-[10px] text-gray-450 font-bold uppercase">City</p>
                                            <p className="font-semibold text-gray-800 mt-0.5">{user.city}</p>
                                        </div>
                                    )}
                                    {user?.utmSource && (
                                        <div>
                                            <p className="text-[10px] text-gray-450 font-bold uppercase">UTM Source</p>
                                            <p className="font-semibold text-gray-800 mt-0.5">{user.utmSource}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {user?.customFields && Object.keys(user.customFields).length > 0 && (
                                <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-sm flex flex-col gap-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-2">Custom Field Responses</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        {Object.entries(user.customFields).map(([key, val]) => {
                                            if (val === undefined || val === null || val === '') return null;
                                            const label = key
                                                .replace(/^custom_/, '')
                                                .replace(/_[0-9]+$/, '')
                                                .replace(/_/g, ' ');
                                            return (
                                                <div key={key}>
                                                    <p className="text-[10px] text-gray-455 font-bold uppercase capitalize">{label}</p>
                                                    <p className="font-semibold text-gray-800 mt-0.5">{val}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboardModal;
