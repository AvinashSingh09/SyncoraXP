import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import socket from '../../services/socket';
import { FiUsers, FiUserCheck, FiSearch, FiMapPin, FiMail, FiBriefcase } from 'react-icons/fi';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalRegistered: 0, totalOnline: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');



    const fetchUsers = async () => {
        try {
            const res = await authService.getUsersStats();
            if (res.data && res.data.success) {
                setUsers(res.data.data.users);
                setStats({
                    totalRegistered: res.data.data.totalRegistered,
                    totalOnline: res.data.data.totalOnline
                });
            }
        } catch (err) {
            console.error('Failed to fetch user statistics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        const handleStatusChange = ({ userId, status }) => {
            setUsers(prev => {
                return prev.map(u => {
                    const uId = u._id || u.id;
                    if (uId && uId.toString() === userId.toString()) {
                        return { ...u, status };
                    }
                    return u;
                });
            });
        };

        const handleNewUserRegister = () => {
            fetchUsers();
        };

        socket.on('user-status-change', handleStatusChange);
        socket.on('new-user-registered', handleNewUserRegister); // optional event if triggered on signup

        return () => {
            socket.off('user-status-change', handleStatusChange);
            socket.off('new-user-registered', handleNewUserRegister);
        };
    }, []);

    // Recalculate stats whenever users list updates
    useEffect(() => {
        if (users.length > 0) {
            const online = users.filter(u => u.status === 'online').length;
            setStats({
                totalRegistered: users.length,
                totalOnline: online
            });
        }
    }, [users]);

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.firstName?.toLowerCase().includes(query) ||
            user.lastName?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.company?.toLowerCase().includes(query) ||
            user.designation?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10 animate-fade-in text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FiUsers className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">User Management</h2>
                        <p className="text-xs text-gray-500">Monitor registered attendees and live presence status</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-semibold">Loading user presence statistics...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Total Users */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-blue-700 tracking-wide uppercase">Total Registered</span>
                                <h3 className="text-3xl font-extrabold text-blue-900">{stats.totalRegistered}</h3>
                                <span className="text-[10px] text-blue-500 font-semibold">Attendees in database</span>
                            </div>
                            <div className="p-4 bg-white/80 rounded-full text-blue-600 shadow-sm">
                                <FiUsers className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Online Users */}
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Live Online</span>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <h3 className="text-3xl font-extrabold text-emerald-900">{stats.totalOnline}</h3>
                                <span className="text-[10px] text-emerald-500 font-semibold">Currently connected via sockets</span>
                            </div>
                            <div className="p-4 bg-white/80 rounded-full text-emerald-600 shadow-sm">
                                <FiUserCheck className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Search by name, email, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800"
                            />
                            <FiSearch className="absolute left-3.5 top-[13px] text-gray-400 w-4 h-4" />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                        <th className="py-4.5 px-6">User</th>
                                        <th className="py-4.5 px-6">Professional Profile</th>
                                        <th className="py-4.5 px-6">Location</th>
                                        <th className="py-4.5 px-6">Status</th>
                                        <th className="py-4.5 px-6">Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center text-gray-400 py-12 italic">
                                                No registered users found matching query.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user._id || user.id} className="hover:bg-gray-50/50 transition-colors">
                                                {/* User Info */}
                                                <td className="py-4 px-6 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-inner">
                                                        {getInitials(user.firstName, user.lastName)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-gray-800 truncate">
                                                            {user.firstName} {user.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                                                            <FiMail className="w-3 h-3" /> {user.email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Profile */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700">{user.designation}</span>
                                                        <span className="text-[10px] text-gray-450 flex items-center gap-1 font-semibold">
                                                            <FiBriefcase className="w-3.5 h-3.5 text-gray-400" /> {user.company}
                                                        </span>
                                                        {user.customFields && Object.keys(user.customFields).length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                                                                {Object.entries(user.customFields).map(([key, val]) => {
                                                                    if (val === undefined || val === null || val === '') return null;
                                                                    // Clean up key label
                                                                    const label = key
                                                                        .replace(/^custom_/, '')
                                                                        .replace(/_[0-9]+$/, '')
                                                                        .replace(/_/g, ' ');
                                                                    return (
                                                                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 capitalize" title={`${label}: ${val}`}>
                                                                            {label}: {val}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Location */}
                                                <td className="py-4 px-6 text-gray-500 font-semibold">
                                                    <div className="flex items-center gap-1">
                                                        <FiMapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                        <span>{user.city}, {user.country}</span>
                                                    </div>
                                                </td>

                                                {/* Online Status */}
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                        user.status === 'online'
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-400'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            user.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                                                        }`} />
                                                        {user.status === 'online' ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>

                                                {/* Registered On */}
                                                <td className="py-4 px-6 text-gray-550 font-bold">
                                                    {formatDate(user.createdAt)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Form Settings deleted */}
        </div>
    );
};

export default AdminUsers;
