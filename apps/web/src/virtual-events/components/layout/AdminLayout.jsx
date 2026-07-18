import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { MdHome, MdStorefront, MdEventSeat, MdMeetingRoom, MdGroup, MdPeople, MdVideogameAsset, MdAssignment, MdPerson, MdSettings, MdGames } from 'react-icons/md';
import { chatService } from '../../services/api';

const AdminLayout = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        // Hardcode password 'admin'
        if (password === 'admin') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    const handleClearChats = async () => {
        if (window.confirm('Are you sure you want to clear ALL chat messages? This action cannot be undone.')) {
            try {
                await chatService.clearHistory();
                alert('All chats cleared successfully!');
            } catch (err) {
                console.error(err);
                alert('Failed to clear chats');
            }
        }
    };

    const navTabs = [
        { name: 'Lobby', path: 'lobby', icon: MdHome },
        { name: 'Expo Hall', path: 'expo-hall', icon: MdStorefront },
        { name: 'Auditorium', path: 'auditorium', icon: MdEventSeat },
        { name: 'Lounge', path: 'lounge', icon: MdMeetingRoom },
        { name: 'Round Tables', path: 'round-tables', icon: MdGroup },
        { name: 'Meeting Room', path: 'meeting-room', icon: MdPeople },
        { name: 'Points Settings', path: 'games', icon: MdVideogameAsset },
        { name: 'Survey', path: 'survey', icon: MdAssignment },
        { name: 'Users', path: 'users', icon: MdPerson },
        { name: 'Reg Settings', path: 'reg-settings', icon: MdSettings },
        { name: 'Game Settings', path: 'game-settings', icon: MdGames },
    ];

    if (!isAuthenticated) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f4f8] p-6 font-sans">
                <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-xl max-w-md w-full space-y-6 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-blue-50 text-[#295ce8] rounded-full flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                        <FiLock className="w-7 h-7" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Admin Console Gate</h2>
                        <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                            Please enter the administrative password to manage the event workspace.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                Admin Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all font-semibold shadow-sm text-center tracking-widest"
                                placeholder="••••••••"
                                required
                            />
                            {error && (
                                <p className="text-xs text-rose-500 font-extrabold text-center mt-2">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                type="submit"
                                className="w-full bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider shadow-blue-200"
                            >
                                Unlock Console
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/virtual-events-platform/app/dashboard')}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider border border-gray-200/50"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-gray-800 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-20 flex-shrink-0">
                {/* Logo Area */}
                <div className="flex items-center gap-2 text-[#295ce8]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                    </svg>
                    <span className="text-xl font-bold tracking-wide text-gray-800">Virtual<span className="text-[#295ce8] font-extrabold">Event</span> <span className="text-xs text-blue-600 ml-2 font-bold bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">ADMIN</span></span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleClearChats}
                        className="flex items-center gap-2 border-2 border-red-500 hover:bg-red-50 text-red-500 font-bold px-5 py-1.5 rounded text-sm transition-colors cursor-pointer"
                    >
                        Clear All Chats
                    </button>
                    {/* Back to Dashboard Button */}
                    <button
                        onClick={() => navigate('/virtual-events-platform/app/dashboard')}
                        className="flex items-center gap-2 border-2 border-[#295ce8] hover:bg-blue-50 text-[#295ce8] font-bold px-5 py-1.5 rounded text-sm transition-colors cursor-pointer"
                    >
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="h-20 bg-white border-b border-gray-200 flex items-end justify-center gap-8 px-8 z-10 shadow-sm overflow-x-auto hide-scrollbar select-none flex-shrink-0">
                {navTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <NavLink
                            key={tab.name}
                            to={tab.path}
                            className={({ isActive }) => `flex flex-col items-center gap-1.5 pb-2 min-w-[70px] transition-all relative cursor-pointer ${isActive ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className="w-6 h-6" />
                                    <span className="text-xs whitespace-nowrap">{tab.name}</span>
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#295ce8] rounded-t-sm" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start bg-[#f0f4f8]">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
