import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { MdCameraAlt, MdSave, MdCheck, MdSelectAll, MdDeselect } from 'react-icons/md';

const STYLES = [
    { id: 'VIBRANT', name: 'Vibrant Cartoon', cat: 'Caricature' },
    { id: 'SKETCH', name: 'Sketch Artist', cat: 'Caricature' },
    { id: 'MODERN', name: 'Modern 3D', cat: 'Caricature' },
    { id: 'PHOTOREALISTIC', name: 'Photo-Realistic', cat: 'Caricature' },
    { id: 'BOBBLEHEAD', name: 'Bobblehead', cat: 'Caricature' },
    { id: 'WATERCOLOR', name: 'Watercolor Art', cat: 'Caricature' },

    { id: 'CREATOR', name: 'Creator Folk', cat: 'Persona Poster' },
    { id: 'INNOVATOR', name: 'Innovator Folk', cat: 'Persona Poster' },
    { id: 'LEADER', name: 'Leader Folk', cat: 'Persona Poster' },
    { id: 'DREAMER', name: 'Dreamer Folk', cat: 'Persona Poster' },
    { id: 'EXPLORER', name: 'Explorer Folk', cat: 'Persona Poster' },

    { id: 'GHIBLI', name: 'Ghibli', cat: 'Style Transfer' },
    { id: 'PIXAR', name: 'Pixar 3D', cat: 'Style Transfer' },
    { id: 'ANIME', name: 'Anime', cat: 'Style Transfer' },
    { id: 'PENCIL_SKETCH', name: 'Pencil Sketch', cat: 'Style Transfer' },
    { id: 'WATERCOLOR_ART', name: 'Watercolor', cat: 'Style Transfer' },
    { id: 'OIL_PAINTING', name: 'Oil Painting', cat: 'Style Transfer' },
    { id: 'COMIC_BOOK', name: 'Comic Book', cat: 'Style Transfer' },
    { id: 'CYBERPUNK', name: 'Cyberpunk', cat: 'Style Transfer' },
    { id: 'POP_ART', name: 'Pop Art', cat: 'Style Transfer' },
    { id: 'CLAYMATION', name: 'Claymation', cat: 'Style Transfer' },
    { id: 'PIXEL_ART', name: 'Pixel Art', cat: 'Style Transfer' },
    { id: 'VINTAGE_FILM', name: 'Vintage Film', cat: 'Style Transfer' },
    { id: 'ACTION_FIGURE', name: 'Action Figure', cat: 'Style Transfer' }
];

const AdminPhotoboothSettings = () => {
    const [enabledStyles, setEnabledStyles] = useState(
        STYLES.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const showStatus = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await configService.getConfig('photobooth_disabled_styles');
                if (res.data && res.data.value) {
                    const disabledList = JSON.parse(res.data.value);
                    const updated = { ...enabledStyles };
                    STYLES.forEach(s => {
                        updated[s.id] = !disabledList.includes(s.id);
                    });
                    setEnabledStyles(updated);
                }
            } catch (err) {
                console.error('Failed to load photobooth settings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const toggleStyle = (id) => {
        setEnabledStyles(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectAll = (status) => {
        const updated = {};
        STYLES.forEach(s => { updated[s.id] = status; });
        setEnabledStyles(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const disabledList = STYLES.filter(s => !enabledStyles[s.id]).map(s => s.id);
            await configService.setConfig('photobooth_disabled_styles', JSON.stringify(disabledList));
            showStatus('success', 'Photobooth styles settings saved successfully!');
        } catch (err) {
            console.error('Failed to save photobooth settings', err);
            showStatus('error', 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 font-medium">
                Loading Photobooth Settings...
            </div>
        );
    }

    const enabledCount = Object.values(enabledStyles).filter(Boolean).length;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <MdCameraAlt className="text-indigo-600" /> Photobooth Styles Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Select which of the 24 photo styles & filters attendees can access in the Photobooth ({enabledCount}/24 enabled).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSelectAll(true)}
                        className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                        <MdSelectAll /> Enable All
                    </button>
                    <button
                        onClick={() => handleSelectAll(false)}
                        className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                        <MdDeselect /> Disable All
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                        <MdSave /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {['Caricature', 'Persona Poster', 'Style Transfer'].map(category => {
                const categoryStyles = STYLES.filter(s => s.cat === category);
                return (
                    <div key={category} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
                            {category} Styles
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categoryStyles.map(style => {
                                const active = enabledStyles[style.id];
                                return (
                                    <div
                                        key={style.id}
                                        onClick={() => toggleStyle(style.id)}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                            active
                                                ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900 shadow-xs'
                                                : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold truncate">{style.name}</span>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold ${
                                            active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                                        }`}>
                                            {active && <MdCheck />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AdminPhotoboothSettings;
