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

const AdminLobby = () => {
    // Lobby Configuration States
    const [lobbyBgImage, setLobbyBgImage] = useState('/virtual-events-assets/lobby-bg.png');
    const [lobbyPoints, setLobbyPoints] = useState([]);
    const [lobbyPosters, setLobbyPosters] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState(null);
    const [selectedPosterId, setSelectedPosterId] = useState(null);
    const [lobbyLoading, setLobbyLoading] = useState(false);
    const [lobbyStatus, setLobbyStatus] = useState('');

    useEffect(() => {
        const fetchLobbyLayout = async () => {
            try {
                const response = await configService.getConfig('lobby_layout');
                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setLobbyBgImage(config.bgImage);
                    if (config.points) setLobbyPoints(config.points);
                    if (config.posters) setLobbyPosters(config.posters);
                }
            } catch (err) {
                console.error('Failed to load lobby layout', err);
            }
        };
        fetchLobbyLayout();
    }, []);

    const handleLobbySave = async (e) => {
        e.preventDefault();
        setLobbyLoading(true);
        setLobbyStatus('');
        try {
            const lobbyConfig = JSON.stringify({
                bgImage: lobbyBgImage,
                points: lobbyPoints,
                posters: lobbyPosters
            });
            await configService.setConfig('lobby_layout', lobbyConfig);
            setLobbyStatus('Lobby settings saved successfully!');
            setTimeout(() => setLobbyStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save lobby settings', err);
            setLobbyStatus('Error saving lobby settings.');
        } finally {
            setLobbyLoading(false);
        }
    };

    const handleLobbyImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLobbyLoading(true);
            setLobbyStatus('Uploading image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLobbyBgImage(response.data.url);
                    setLobbyStatus('Image uploaded successfully!');
                    setTimeout(() => setLobbyStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLobbyStatus('Image upload failed. Try again.');
            } finally {
                setLobbyLoading(false);
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
            setLobbyLoading(true);
            setLobbyStatus('Uploading poster image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLobbyPosters(prev => prev.map(p => p.id === posterId ? { ...p, imageUrl: response.data.url } : p));
                    setLobbyStatus('Poster uploaded successfully!');
                    setTimeout(() => setLobbyStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLobbyStatus('Poster upload failed. Try again.');
            } finally {
                setLobbyLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLobbyPreviewClick = (e) => {
        // Prevent click if we clicked on an existing point or poster
        if (e.target.closest('.interactive-element')) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const clickX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
        const clickY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

        const newPoint = {
            id: 'point_' + Date.now(),
            left: clickX,
            top: clickY,
            text: 'New Point',
            targetPage: '/virtual-events-platform/app/dashboard/auditorium'
        };

        setLobbyPoints(prev => [...prev, newPoint]);
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
        setLobbyPosters(prev => [...prev, newPoster]);
        setSelectedPosterId(newPoster.id);
        setSelectedPointId(null);
    };

    const selectedPoint = lobbyPoints.find(p => p.id === selectedPointId);
    const selectedPoster = lobbyPosters.find(p => p.id === selectedPosterId);

    const availablePages = [
        { path: '/virtual-events-platform/app/dashboard/auditorium', label: 'Auditorium' },
        { path: '/virtual-events-platform/app/dashboard/lounge', label: 'Lounge' },
        { path: '/virtual-events-platform/app/dashboard/round-tables', label: 'Round Tables' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall', label: 'Expo Hall' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall/A', label: 'Hall A' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall/B', label: 'Hall B' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall/C', label: 'Hall C' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall/a/booth/1', label: 'Booth 1 (Hall A)' },
        { path: '/virtual-events-platform/app/dashboard/expo-hall/a/booth/1?chat=true', label: 'Booth 1 + Open Chat' },
        { path: '/virtual-events-platform/app/dashboard/meeting-room', label: 'Meeting Room' },
        { path: '/virtual-events-platform/app/dashboard/survey', label: 'Survey' },
        { path: '/virtual-events-platform/app/dashboard/games', label: 'Game Zone' },
        { path: '/virtual-events-platform/app/dashboard/games?section=photobooth', label: 'Photo Booth' },
        { path: '#info-modal', label: 'Open Information Desk (Modal)' },
    ];

    return (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FiSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Lobby Settings</h2>
                        <p className="text-sm text-gray-500">Configure points and posters for the Lobby</p>
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

            <form onSubmit={handleLobbySave} className="flex flex-col gap-6">
                {/* Bg image configuration */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lobby Background Image</label>
                    <div className="flex gap-3">
                        <input 
                            type="text"
                            value={lobbyBgImage}
                            onChange={(e) => setLobbyBgImage(e.target.value)}
                            placeholder="e.g. /virtual-events-assets/lobby-bg.png"
                            className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                            required
                        />
                        <div className="relative">
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={handleLobbyImageUpload}
                                className="hidden"
                                id="lobby-bg-upload"
                            />
                            <label 
                                htmlFor="lobby-bg-upload"
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
                        <label className="block text-sm font-bold text-gray-700">Lobby Map Editor</label>
                        <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded border border-blue-100">
                            Click on image to add a navigation point!
                        </span>
                    </div>
                    <div 
                        className="w-full bg-neutral-900 border border-gray-200 rounded-xl relative overflow-hidden shadow-inner cursor-crosshair select-none"
                        onClick={handleLobbyPreviewClick}
                    >
                        <img 
                            src={lobbyBgImage} 
                            alt="Lobby Preview"
                            className="w-full h-auto pointer-events-none block"
                        />
                        
                        {/* Render Posters */}
                        {lobbyPosters.map(poster => (
                            <div
                                key={poster.id}
                                className={`interactive-element absolute z-10 cursor-pointer ${selectedPosterId === poster.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
                                style={{
                                    top: `${poster.top}%`,
                                    left: `${poster.left}%`,
                                    width: `${poster.width}%`,
                                    height: `${poster.height}%`,
                                    backgroundImage: poster.imageUrl ? `url(${poster.imageUrl})` : 'none',
                                    backgroundColor: poster.imageUrl ? 'transparent' : 'rgba(255,255,255,0.8)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: poster.imageUrl ? 'none' : '1px dashed #ccc'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPosterId(poster.id);
                                    setSelectedPointId(null);
                                }}
                            >
                                {!poster.imageUrl && <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 font-bold">Poster</div>}
                            </div>
                        ))}

                        {/* Render Points */}
                        {lobbyPoints.map(point => (
                            <div
                                key={point.id}
                                className="interactive-element absolute z-20"
                                style={{
                                    top: `${point.top}%`,
                                    left: `${point.left}%`
                                }}
                            >
                                {/* Small Red Dot */}
                                <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center cursor-pointer z-30"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setSelectedPointId(point.id);
                                         setSelectedPosterId(null);
                                     }}>
                                    {selectedPointId === point.id && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white ${selectedPointId === point.id ? 'ring-2 ring-red-400' : ''}`}></span>
                                </div>


                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Pin Details Form */}
                {selectedPoint && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                <FiMapPin className="text-red-500" /> Navigation Point ({selectedPoint.left}%, {selectedPoint.top}%)
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setLobbyPoints(prev => prev.filter(p => p.id !== selectedPointId));
                                    setSelectedPointId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Pin
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Target Page</label>
                                <select
                                    value={selectedPoint.targetPage}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, targetPage: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    {availablePages.map(page => (
                                        <option key={page.path} value={page.path}>{page.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Label Text</label>
                                <input
                                    type="text"
                                    value={selectedPoint.text}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, text: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Go to Auditorium"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Poster Details Form */}
                {selectedPoster && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                <FiImage className="text-emerald-500" /> Poster Configuration
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setLobbyPosters(prev => prev.filter(p => p.id !== selectedPosterId));
                                    setSelectedPosterId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Poster
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Poster Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={selectedPoster.imageUrl}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, imageUrl: val } : p));
                                        }}
                                        className="flex-1 bg-white border border-emerald-200 rounded-lg p-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
                                        placeholder="e.g. /poster.png"
                                    />
                                    <div className="relative">
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handlePosterImageUpload(e, selectedPosterId)}
                                            className="hidden"
                                            id={`poster-upload-${selectedPosterId}`}
                                        />
                                        <label 
                                            htmlFor={`poster-upload-${selectedPosterId}`}
                                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 font-bold px-2 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                        >
                                            Upload
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Left (%)</label>
                                    <input
                                        type="number"
                                        value={selectedPoster.left}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, left: val } : p));
                                        }}
                                        className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Top (%)</label>
                                    <input
                                        type="number"
                                        value={selectedPoster.top}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, top: val } : p));
                                        }}
                                        className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Width (%)</label>
                                    <input
                                        type="number"
                                        value={selectedPoster.width}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, width: val } : p));
                                        }}
                                        className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Height (%)</label>
                                    <input
                                        type="number"
                                        value={selectedPoster.height}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, height: val } : p));
                                        }}
                                        className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {lobbyStatus && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${lobbyStatus.includes('Error') || lobbyStatus.includes('failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{lobbyStatus}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={lobbyLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <FiSave />
                    <span>{lobbyLoading ? 'Saving...' : 'Save Lobby Settings'}</span>
                </button>
            </form>
        </div>
    );
};

export default AdminLobby;
