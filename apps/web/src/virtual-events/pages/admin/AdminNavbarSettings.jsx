import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { MdMenu, MdCheck, MdSave, MdHome, MdStorefront, MdEventSeat, MdMeetingRoom, MdGroup, MdPeople, MdVideogameAsset, MdAssignment } from 'react-icons/md';

const ALL_NAVBAR_ITEMS = [
    { key: 'lobby', name: 'Lobby', defaultPath: '/virtual-events-platform/app/dashboard/lobby', icon: MdHome, description: 'Main Lobby area' },
    { key: 'expo-hall', name: 'Expo Hall', defaultPath: '/virtual-events-platform/app/dashboard/expo-hall', icon: MdStorefront, description: 'Exhibition hall with stalls' },
    { key: 'auditorium', name: 'Auditorium', defaultPath: '/virtual-events-platform/app/dashboard/auditorium', icon: MdEventSeat, description: 'Live keynote & video stream' },
    { key: 'lounge', name: 'Lounge', defaultPath: '/virtual-events-platform/app/dashboard/lounge', icon: MdMeetingRoom, description: 'Networking & discussions' },
    { key: 'round-tables', name: 'Round Tables', defaultPath: '/virtual-events-platform/app/dashboard/round-tables', icon: MdGroup, description: 'Small group interactive tables' },
    { key: 'meeting-room', name: 'Meeting Room', defaultPath: '/virtual-events-platform/app/dashboard/meeting-room', icon: MdPeople, description: 'Private video meetings' },
    { key: 'games', name: 'Engage', defaultPath: '/virtual-events-platform/app/dashboard/games', icon: MdVideogameAsset, description: 'Gamification & leaderboard' },
    { key: 'survey', name: 'Survey', defaultPath: '/virtual-events-platform/app/dashboard/survey', icon: MdAssignment, description: 'Feedback & event survey' }
];

const DEFAULT_NAVBAR_CONFIG = {
    lobby: true,
    'expo-hall': true,
    auditorium: true,
    lounge: true,
    'round-tables': true,
    'meeting-room': true,
    games: true,
    survey: true
};

const AdminNavbarSettings = () => {
    const [navConfig, setNavConfig] = useState(DEFAULT_NAVBAR_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        const fetchNavConfig = async () => {
            try {
                const res = await configService.getConfig('navbar_settings');
                if (res.data && res.data.value) {
                    const parsed = JSON.parse(res.data.value);
                    setNavConfig({ ...DEFAULT_NAVBAR_CONFIG, ...parsed });
                }
            } catch (err) {
                console.error('Failed to load navbar settings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNavConfig();
    }, []);

    const toggleItem = (key) => {
        setNavConfig(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatusMessage(null);
        try {
            await configService.setConfig('navbar_settings', JSON.stringify(navConfig));
            setStatusMessage({ type: 'success', text: 'Navbar menu customization saved successfully! Changes are reflected on the main website.' });
            setTimeout(() => setStatusMessage(null), 5000);
        } catch (err) {
            console.error('Failed to save navbar settings', err);
            setStatusMessage({ type: 'error', text: 'Failed to save navbar menu settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 font-sans">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#295ce8] flex items-center justify-center font-bold">
                            <MdMenu className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Navbar Menu Customization</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed pl-11">
                        Control which navigation items appear on the attendee website. Uncheck items to hide them from attendees.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-[#295ce8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-200 cursor-pointer disabled:opacity-50 shrink-0"
                >
                    <MdSave className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Navbar Settings'}</span>
                </button>
            </div>

            {/* Status Alert */}
            {statusMessage && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                    statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    <MdCheck className="w-4 h-4 shrink-0" />
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_NAVBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isEnabled = navConfig[item.key] !== false;

                    return (
                        <div
                            key={item.key}
                            onClick={() => toggleItem(item.key)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                                isEnabled 
                                    ? 'bg-white border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300' 
                                    : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
                            }`}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${
                                    isEnabled ? 'bg-blue-50 text-[#295ce8]' : 'bg-gray-200 text-gray-400'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className={`text-sm font-bold truncate ${isEnabled ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                                        {item.name}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                                isEnabled ? 'bg-[#295ce8]' : 'bg-gray-300'
                            }`}>
                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
                                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminNavbarSettings;
