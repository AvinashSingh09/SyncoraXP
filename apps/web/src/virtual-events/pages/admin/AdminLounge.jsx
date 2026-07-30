import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { 
    FiCheckCircle, 
    FiSave, 
    FiTrash2, 
    FiMapPin, 
    FiSettings,
    FiImage,
    FiPlus
} from 'react-icons/fi';

const AdminLounge = () => {
    // Lounge Configuration States
    const [loungeBgImage, setLoungeBgImage] = useState('/virtual-events-assets/lounge-bg.png?v=2');
    const [loungePoints, setLoungePoints] = useState([]);
    const [loungePosters, setLoungePosters] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState(null);
    const [selectedPosterId, setSelectedPosterId] = useState(null);
    const [loungeLoading, setLoungeLoading] = useState(false);
    const [loungeStatus, setLoungeStatus] = useState('');

    useEffect(() => {
        const fetchLoungeLayout = async () => {
            try {
                const response = await configService.getConfig('lounge_layout');
                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setLoungeBgImage(config.bgImage);
                    if (config.points) setLoungePoints(config.points);
                    if (config.posters) setLoungePosters(config.posters);
                }
            } catch (err) {
                console.error('Failed to load lounge layout', err);
            }
        };
        fetchLoungeLayout();
    }, []);

    const handleLoungeSave = async (e) => {
        e.preventDefault();
        setLoungeLoading(true);
        setLoungeStatus('');
        try {
            const loungeConfig = JSON.stringify({
                bgImage: loungeBgImage,
                points: loungePoints,
                posters: loungePosters
            });
            await configService.setConfig('lounge_layout', loungeConfig);
            setLoungeStatus('Lounge settings saved successfully!');
            setTimeout(() => setLoungeStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save lounge settings', err);
            setLoungeStatus('Error saving lounge settings.');
        } finally {
            setLoungeLoading(false);
        }
    };

    const handleLoungeImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLoungeLoading(true);
            setLoungeStatus('Uploading image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLoungeBgImage(response.data.url);
                    setLoungeStatus('Image uploaded successfully!');
                    setTimeout(() => setLoungeStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLoungeStatus('Image upload failed. Try again.');
            } finally {
                setLoungeLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePosterImageUpload = async (e, posterId) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLoungeLoading(true);
            setLoungeStatus('Uploading poster image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLoungePosters(prev => prev.map(p => p.id === posterId ? { ...p, imageUrl: response.data.url } : p));
                    setLoungeStatus('Poster uploaded successfully!');
                    setTimeout(() => setLoungeStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLoungeStatus('Poster upload failed. Try again.');
            } finally {
                setLoungeLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLoungePreviewClick = (e) => {
        // Prevent click if we clicked on an existing point or poster
        if (e.target.closest('.interactive-element') || e.target.closest('.absolute.z-10')) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const clickX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
        const clickY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

        const newPoint = {
            id: 'point_' + Date.now(),
            left: clickX,
            top: clickY,
            text: 'New Discussion Point'
        };

        setLoungePoints(prev => [...prev, newPoint]);
        setSelectedPointId(newPoint.id);
        setSelectedPosterId(null);
    };

    const addPoster = () => {
        const newPoster = {
            id: 'poster_' + Date.now(),
            left: 10,
            top: 10,
            width: 15,
            height: 25,
            imageUrl: ''
        };
        setLoungePosters(prev => [...prev, newPoster]);
        setSelectedPosterId(newPoster.id);
        setSelectedPointId(null);
    };

    const selectedPoint = loungePoints.find(p => p.id === selectedPointId);
    const selectedPoster = loungePosters.find(p => p.id === selectedPosterId);

    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FiSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Lounge Settings</h2>
                        <p className="text-sm text-gray-500">Configure parameters for this environment</p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={addPoster}
                    className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
                >
                    <FiPlus /> Add Poster
                </button>
            </div>

            <form onSubmit={handleLoungeSave} className="flex flex-col gap-6">
                {/* Bg image configuration */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lounge Background Image</label>
                    <div className="flex gap-3">
                        <input 
                            type="text"
                            value={loungeBgImage}
                            onChange={(e) => setLoungeBgImage(e.target.value)}
                            placeholder="e.g. /virtual-events-assets/lounge-bg.png"
                            className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                            required
                        />
                        <div className="relative">
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={handleLoungeImageUpload}
                                className="hidden"
                                id="lounge-bg-upload"
                            />
                            <label 
                                htmlFor="lounge-bg-upload"
                                className="bg-blue-50 hover:bg-blue-100 text-[#295ce8] border border-blue-200 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                            >
                                Upload Image
                            </label>
                        </div>
                    </div>
                </div>

                {/* Interactive click preview */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-gray-700">Lounge Map Editor</label>
                        <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded border border-blue-100">
                            Click on image to add a discussion point!
                        </span>
                    </div>
                    <div 
                        className="w-full bg-neutral-900 border border-gray-200 rounded-xl relative overflow-hidden shadow-inner cursor-pointer select-none"
                        onClick={handleLoungePreviewClick}
                    >
                        <img 
                            src={loungeBgImage} 
                            alt="Lounge Preview"
                            className="w-full h-full object-cover pointer-events-none block"
                        />

                        {/* Render Posters */}
                        {loungePosters.map(poster => (
                            <div
                                key={poster.id}
                                className={`interactive-element absolute z-10 cursor-pointer ${selectedPosterId === poster.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
                                style={poster.type === 'youtube' ? {
                                    top: `${poster.top}%`,
                                    left: `${poster.left}%`,
                                    width: `${poster.width}%`,
                                    height: `${poster.height}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: '#000'
                                } : {
                                    top: `${poster.top}%`,
                                    left: `${poster.left}%`,
                                    width: `${poster.width}%`,
                                    height: `${poster.height}%`,
                                    backgroundImage: poster.imageUrl ? `url(${poster.imageUrl})` : 'none',
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    backgroundColor: poster.imageUrl ? 'transparent' : 'rgba(0,0,0,0.4)',
                                    transform: 'translate(-50%, -50%)',
                                    border: poster.imageUrl ? 'none' : '2px dashed #ffffff80'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPosterId(poster.id);
                                    setSelectedPointId(null);
                                }}
                            >
                                {poster.type === 'youtube' ? (
                                    poster.videoUrl ? (
                                        <div className="w-full h-full pointer-events-none relative">
                                            <div className="absolute inset-0 z-10 bg-transparent"></div>
                                            <iframe src={poster.videoUrl} className="w-full h-full border-0" title="YouTube Video" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-red-500/30 flex items-center justify-center rounded border-2 border-red-500 pointer-events-none">
                                            <span className="text-red-500 text-sm font-extrabold text-center px-1">
                                                VIDEO SCREEN
                                            </span>
                                        </div>
                                    )
                                ) : (
                                    !poster.imageUrl && (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-2">
                                            <FiImage className="w-6 h-6 mb-1 opacity-75" />
                                            <span className="text-[10px] font-bold text-center leading-tight">No Image</span>
                                        </div>
                                    )
                                )}
                                
                                {/* Delete Button */}
                                {selectedPosterId === poster.id && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLoungePosters(prev => prev.filter(p => p.id !== poster.id));
                                            if (selectedPosterId === poster.id) setSelectedPosterId(null);
                                        }}
                                        className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full font-extrabold text-[10px] flex items-center justify-center border border-white shadow-lg transition-transform hover:scale-110"
                                        title="Delete poster"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Map Pins */}
                        {loungePoints.map(point => (
                            <div
                                key={point.id}
                                className="absolute z-10 pointer-events-none"
                                style={{
                                    top: `${point.top}%`,
                                    left: `${point.left}%`
                                }}
                            >
                                {/* Dot */}
                                <div 
                                    className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-pointer z-20"
                                    style={{
                                        width: `${point.size || 24}px`,
                                        height: `${point.size || 24}px`
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPointId(point.id);
                                        setSelectedPosterId(null);
                                    }}
                                >
                                    <span 
                                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                        style={{ backgroundColor: point.color || '#f87171' }}
                                    ></span>
                                    <span 
                                        className={`relative inline-flex rounded-full border-2 border-white shadow-md ${selectedPointId === point.id ? 'ring-2 ring-red-500 scale-110' : ''}`}
                                        style={{ 
                                            width: `${(point.size || 24) * 0.6}px`, 
                                            height: `${(point.size || 24) * 0.6}px`,
                                            backgroundColor: point.color || '#ef4444' 
                                        }}
                                    ></span>

                                    {/* Unconditional Delete Button directly on the dot */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLoungePoints(prev => prev.filter(p => p.id !== point.id));
                                            if (selectedPointId === point.id) setSelectedPointId(null);
                                        }}
                                        className="absolute -top-3 -right-3 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-extrabold text-[8px] flex items-center justify-center border border-white shadow-lg z-30 transition-transform hover:scale-125 cursor-pointer"
                                        title="Delete point"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Text Bubble & Stem (Only show when selected) */}
                                {selectedPointId === point.id && (
                                    <div className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 scale-110 drop-shadow-xl"
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             setSelectedPointId(point.id);
                                         }}
                                    >
                                    <div className={`bg-black text-white rounded-xl p-2 shadow-2xl border relative ${selectedPointId === point.id ? 'border-red-400 ring-2 ring-red-400/50' : 'border-red-500/30'} max-w-[150px] text-center`}>
                                        <p className="text-sm font-semibold leading-tight whitespace-nowrap">
                                            {point.text || 'New Point'}
                                        </p>
                                    </div>
                                        <div className="w-0.5 h-5 bg-gradient-to-b from-red-500 to-red-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Pin Details Form */}
                {selectedPoint && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                <FiMapPin className="text-red-500" /> Discussion Point ({selectedPoint.left}%, {selectedPoint.top}%)
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setLoungePoints(prev => prev.filter(p => p.id !== selectedPointId));
                                    setSelectedPointId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Pin
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Discussion Topic / Speech Bubble Text</label>
                            <textarea
                                value={selectedPoint.text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLoungePoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, text: val } : p));
                                }}
                                rows="2"
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                placeholder="Write discussion prompt here..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Dot Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={selectedPoint.color || '#ef4444'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLoungePoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, color: val } : p));
                                        }}
                                        className="h-9 w-12 rounded cursor-pointer border border-gray-200 p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={selectedPoint.color || '#ef4444'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLoungePoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, color: val } : p));
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                        placeholder="#ef4444"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Dot Size (px)</label>
                                <input
                                    type="number"
                                    min="12"
                                    max="64"
                                    value={selectedPoint.size || 24}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLoungePoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, size: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Room Password (Optional)</label>
                            <input
                                type="text"
                                value={selectedPoint.password || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLoungePoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, password: val } : p));
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                placeholder="Enter password to restrict entry (leave blank for none)..."
                            />
                        </div>
                    </div>
                )}

                {/* Selected Poster Details Form */}
                {selectedPoster && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col gap-3.5 mt-2 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <FiSettings className="text-indigo-600" /> Poster Settings ({selectedPoster.left}%, {selectedPoster.top}%)
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setLoungePosters(prev => prev.filter(p => p.id !== selectedPosterId));
                                    setSelectedPosterId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Poster
                            </button>
                        </div>
                        
                        <div className="mb-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Content Type</label>
                            <select
                                value={selectedPoster.type || 'image'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, type: val } : p));
                                }}
                                className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="image">Static Image</option>
                                <option value="youtube">YouTube Video</option>
                            </select>
                        </div>

                        {(selectedPoster.type || 'image') === 'image' ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Poster Image</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        value={selectedPoster.imageUrl || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, imageUrl: val } : p));
                                        }}
                                        className="flex-1 bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                        placeholder="https://example.com/poster.jpg"
                                    />
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePosterImageUpload(e, selectedPosterId)}
                                        className="hidden"
                                        id="lounge-poster-upload"
                                    />
                                    <label 
                                        htmlFor="lounge-poster-upload"
                                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                    >
                                        Upload Poster
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">YouTube Embed URL</label>
                                <input
                                    type="text"
                                    value={selectedPoster.videoUrl || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, videoUrl: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                    placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                                />
                                <p className="text-sm text-indigo-500 mt-1">Make sure to use the "Embed" link from YouTube, not the regular watch link.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">X Position ({selectedPoster.left}%)</label>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={selectedPoster.left}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, left: val } : p));
                                    }}
                                    className="w-full cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Y Position ({selectedPoster.top}%)</label>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={selectedPoster.top}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, top: val } : p));
                                    }}
                                    className="w-full cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Width ({selectedPoster.width}%)</label>
                                <input 
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="0.5"
                                    value={selectedPoster.width}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, width: val } : p));
                                    }}
                                    className="w-full cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Height ({selectedPoster.height}%)</label>
                                <input 
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="0.5"
                                    value={selectedPoster.height}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLoungePosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, height: val } : p));
                                    }}
                                    className="w-full cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {loungeStatus && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${loungeStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{loungeStatus}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loungeLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <FiSave />
                    <span>{loungeLoading ? 'Saving...' : 'Save Lounge Settings'}</span>
                </button>
            </form>
        </div>
    );
};

export default AdminLounge;
