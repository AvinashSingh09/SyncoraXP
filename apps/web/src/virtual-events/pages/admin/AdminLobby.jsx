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
    const [helpDeskAdminEmail, setHelpDeskAdminEmail] = useState('info@virtualevent.com');
    const [helpDeskAdminPassword, setHelpDeskAdminPassword] = useState('InfoDesk123');
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
                    if (config.helpDeskAdminEmail) setHelpDeskAdminEmail(config.helpDeskAdminEmail);
                    if (config.helpDeskAdminPassword) setHelpDeskAdminPassword(config.helpDeskAdminPassword);
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
                posters: lobbyPosters,
                helpDeskAdminEmail,
                helpDeskAdminPassword
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

    const handlePdfFileUpload = async (e, pointId) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLobbyLoading(true);
            setLobbyStatus('Uploading PDF document...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLobbyPoints(prev => prev.map(p => p.id === pointId ? { ...p, pdfUrl: response.data.url } : p));
                    setLobbyStatus('PDF document uploaded successfully!');
                    setTimeout(() => setLobbyStatus(''), 4000);
                }
            } catch (err) {
                console.error('PDF upload failed', err);
                setLobbyStatus('PDF upload failed. Try again.');
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
        { path: '#pdf-modal', label: 'Open PDF Document (Modal)' },
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

                {/* Information / Help Desk Representative Credentials */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="mb-3">
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 tracking-tight">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                            Information / Help Desk Representative Credentials
                        </h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mt-0.5">
                            Set the login Email ID and Password for the representative sitting at the Information Desk to answer attendee queries live.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Help Desk Email ID</label>
                            <input 
                                type="email" 
                                value={helpDeskAdminEmail} 
                                onChange={(e) => setHelpDeskAdminEmail(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 font-semibold"
                                placeholder="info@virtualevent.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Help Desk Password</label>
                            <input 
                                type="text" 
                                value={helpDeskAdminPassword} 
                                onChange={(e) => setHelpDeskAdminPassword(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 font-semibold"
                                placeholder="InfoDesk123"
                            />
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
                            className="w-full h-full object-cover pointer-events-none block"
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
                                    backgroundImage: poster.type === 'youtube' ? 'none' : (poster.imageUrl ? `url(${poster.imageUrl})` : 'none'),
                                    backgroundColor: poster.type === 'youtube' ? 'transparent' : (poster.imageUrl ? 'transparent' : 'rgba(255,255,255,0.8)'),
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: (poster.type === 'youtube' || poster.imageUrl) ? 'none' : '1px dashed #ccc'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPosterId(poster.id);
                                    setSelectedPointId(null);
                                }}
                            >
                                {poster.type === 'youtube' && poster.videoUrl ? (
                                    <iframe src={poster.videoUrl} className="w-full h-full border-0 pointer-events-none" title="YouTube Video" />
                                ) : (
                                    !poster.imageUrl && <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold text-center px-1">POSTER ({poster.width}% &times; {poster.height}%)</div>
                                )}
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
                                {/* Hotspot Dot */}
                                <div 
                                    className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer z-30"
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
                                        className={`relative inline-flex rounded-full border-2 border-white shadow-md ${selectedPointId === point.id ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                                        style={{ 
                                            width: `${(point.size || 24) * 0.6}px`, 
                                            height: `${(point.size || 24) * 0.6}px`,
                                            backgroundColor: point.color || '#ef4444' 
                                        }}
                                    ></span>
                                    {/* Text Bubble Tooltip */}
                                    {point.showBubble !== false && point.text && (
                                        <div 
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900/90 text-white font-bold rounded-lg whitespace-normal text-center shadow-lg pointer-events-none z-50 flex items-center justify-center gap-1 border border-white/20"
                                            style={{
                                                width: point.boxWidth ? `${point.boxWidth}px` : 'auto',
                                                maxWidth: '300px',
                                                fontSize: point.fontSize ? `${point.fontSize}px` : '11px'
                                            }}
                                        >
                                            <span>{point.text}</span>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
                                        </div>
                                    )}
                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLobbyPoints(prev => prev.filter(p => p.id !== point.id));
                                            if (selectedPointId === point.id) {
                                                setSelectedPointId(null);
                                            }
                                        }}
                                        className="absolute -top-3 -right-3 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-extrabold text-[8px] flex items-center justify-center border border-white shadow-lg z-40 transition-transform hover:scale-125 cursor-pointer"
                                        title="Delete point"
                                    >
                                        ✕
                                    </button>
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
                            {selectedPoint.targetPage === '#pdf-modal' && (
                                <div className="col-span-2 bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl space-y-2">
                                    <label className="block text-xs font-bold text-blue-900">PDF File URL / Upload</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={selectedPoint.pdfUrl || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, pdfUrl: val } : p));
                                            }}
                                            className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 font-medium"
                                            placeholder="https://example.com/document.pdf or upload from PC ->"
                                            required
                                        />
                                        <div className="relative shrink-0">
                                            <input 
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => handlePdfFileUpload(e, selectedPointId)}
                                                className="hidden"
                                                id={`pdf-file-upload-${selectedPointId}`}
                                            />
                                            <label 
                                                htmlFor={`pdf-file-upload-${selectedPointId}`}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
                                            >
                                                📁 Upload PDF
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-blue-600 font-medium">Click "Upload PDF" to choose a file from your PC or paste a direct PDF URL above.</p>
                                </div>
                            )}
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
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Dot Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={selectedPoint.color || '#ef4444'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, color: val } : p));
                                        }}
                                        className="h-9 w-12 rounded cursor-pointer border border-gray-200 p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={selectedPoint.color || '#ef4444'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, color: val } : p));
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
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, size: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Box Width (px)</label>
                                <input
                                    type="number"
                                    min="50"
                                    max="400"
                                    placeholder="auto (e.g. 150)"
                                    value={selectedPoint.boxWidth || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : '';
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, boxWidth: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-500 mb-1">Font Size (px)</label>
                                <input
                                    type="number"
                                    min="8"
                                    max="32"
                                    placeholder="12"
                                    value={selectedPoint.fontSize || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : '';
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, fontSize: val } : p));
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="col-span-2 bg-slate-100/70 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-bold text-gray-800">Show Label Bubble Tooltip</label>
                                    <p className="text-[11px] text-gray-500">Display a floating text bubble above the point in the lobby</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedPoint.showBubble !== false}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setLobbyPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, showBubble: checked } : p));
                                    }}
                                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
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
                        
                        <div className="mb-2">
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Content Type</label>
                            <select
                                value={selectedPoster.type || 'image'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, type: val } : p));
                                }}
                                className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                            >
                                <option value="image">Static Image</option>
                                <option value="youtube">YouTube Video</option>
                            </select>
                        </div>

                        {(selectedPoster.type || 'image') === 'image' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Poster Image</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={selectedPoster.imageUrl || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, imageUrl: val } : p));
                                            }}
                                            className="flex-1 bg-white border border-emerald-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
                                            placeholder="https://example.com/poster.jpg"
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
                                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 font-bold px-3 py-2.5 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                            >
                                                Upload
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-500 mb-1">YouTube Embed URL</label>
                                <input
                                    type="text"
                                    value={selectedPoster.videoUrl || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, videoUrl: val } : p));
                                    }}
                                    className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
                                    placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                                />
                                <p className="text-sm text-emerald-500 mt-1">Make sure to use the "Embed" link from YouTube, not the regular watch link.</p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">X Position ({selectedPoster.left}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={selectedPoster.left}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, left: val } : p));
                                        }}
                                        className="w-full cursor-pointer accent-[#295ce8]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Y Position ({selectedPoster.top}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={selectedPoster.top}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, top: val } : p));
                                        }}
                                        className="w-full cursor-pointer accent-[#295ce8]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Width ({selectedPoster.width}%)</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                        value={selectedPoster.width}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, width: val } : p));
                                        }}
                                        className="w-full cursor-pointer accent-[#295ce8]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Height ({selectedPoster.height}%)</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                        value={selectedPoster.height}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLobbyPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, height: val } : p));
                                        }}
                                        className="w-full cursor-pointer accent-[#295ce8]"
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
