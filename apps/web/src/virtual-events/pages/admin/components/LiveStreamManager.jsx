import React, { useState, useEffect } from 'react';
import { configService } from '../../../services/api';
import { FiCheckCircle, FiSave } from 'react-icons/fi';

const LiveStreamManager = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await configService.getConfig('auditorium_video');
                if (response.data && response.data.value) {
                    setVideoUrl(response.data.value);
                }
            } catch (err) {
                console.error('Failed to load config', err);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        try {
            await configService.setConfig('auditorium_video', videoUrl);
            setStatus('Successfully updated Auditorium video link!');
            setTimeout(() => setStatus(''), 4000);
        } catch (err) {
            console.error('Failed to update config', err);
            setStatus('Error updating link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Auditorium Live Video URL
                </label>
                <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=nE5U0tS-1Yg"
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                    required
                />
                <span className="text-sm text-gray-400 mt-1.5 block">
                    Accepts standard YouTube links, share links, or direct embed URLs.
                </span>
            </div>

            {status && (
                <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${status.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    <FiCheckCircle className="flex-shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
                <FiSave />
                <span>{loading ? 'Saving Changes...' : 'Update Live Screen'}</span>
            </button>
        </form>
    );
};

export default LiveStreamManager;
