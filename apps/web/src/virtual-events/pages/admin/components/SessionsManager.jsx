import React, { useState, useEffect } from 'react';
import { sessionService } from '../../../services/api';
import { FiPlusCircle, FiClock, FiTrash2, FiCheckCircle } from 'react-icons/fi';

const SessionsManager = () => {
    const [sessions, setSessions] = useState([]);
    const [sessionTopic, setSessionTopic] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [sessionVideoUrl, setSessionVideoUrl] = useState('');
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionStatus, setSessionStatus] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await sessionService.getSessions();
                if (response.data && response.data.data) {
                    setSessions(response.data.data);
                }
            } catch (err) {
                console.error('Failed to load sessions', err);
            }
        };
        fetchSessions();
    }, []);

    const handleAddSession = async (e) => {
        e.preventDefault();
        setSessionLoading(true);
        setSessionStatus('');
        try {
            const response = await sessionService.createSession({
                topic: sessionTopic,
                time: sessionTime,
                videoUrl: sessionVideoUrl
            });
            if (response.data && response.data.success) {
                setSessions(prev => [...prev, response.data.data]);
                setSessionTopic('');
                setSessionTime('');
                setSessionVideoUrl('');
                setSessionStatus('Session added successfully!');
                setTimeout(() => setSessionStatus(''), 4000);
            }
        } catch (err) {
            console.error('Failed to add session', err);
            setSessionStatus('Error adding session. Please check input.');
        } finally {
            setSessionLoading(false);
        }
    };

    const handleDeleteSession = async (id) => {
        try {
            const response = await sessionService.deleteSession(id);
            if (response.data && response.data.success) {
                setSessions(prev => prev.filter(s => s._id !== id));
            }
        } catch (err) {
            console.error('Failed to delete session', err);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Add Session Form */}
            <form onSubmit={handleAddSession} className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiPlusCircle className="text-[#295ce8]" /> Add New Session
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-500 mb-1.5">Topic</label>
                        <input 
                            type="text"
                            value={sessionTopic}
                            onChange={(e) => setSessionTopic(e.target.value)}
                            placeholder="e.g. Intro to React"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-500 mb-1.5">Time</label>
                        <input 
                            type="text"
                            value={sessionTime}
                            onChange={(e) => setSessionTime(e.target.value)}
                            placeholder="e.g. 10:00 AM - 11:00 AM"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1.5">Video URL</label>
                    <input 
                        type="text"
                        value={sessionVideoUrl}
                        onChange={(e) => setSessionVideoUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                        required
                    />
                </div>

                {sessionStatus && (
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${sessionStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{sessionStatus}</span>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={sessionLoading}
                    className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer self-end"
                >
                    <FiPlusCircle /> Add Session
                </button>
            </form>

            {/* Sessions List */}
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiClock className="text-purple-600" /> Existing Sessions
                </h2>
                {sessions.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No sessions scheduled yet.</p>
                ) : (
                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {sessions.map(session => (
                            <div key={session._id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center gap-4 hover:border-gray-300 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-bold text-gray-800">{session.topic}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <FiClock className="w-3.5 h-3.5 text-gray-400" /> {session.time}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteSession(session._id)}
                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors cursor-pointer"
                                    title="Delete Session"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionsManager;
