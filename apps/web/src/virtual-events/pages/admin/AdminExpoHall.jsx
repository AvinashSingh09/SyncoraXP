import React, { useState, useEffect } from 'react';
import { configService, leadService } from '../../services/api';
import {
    FiCheckCircle,
    FiSave,
    FiTrash2,
    FiMapPin,
    FiSettings,
    FiPlus,
    FiRefreshCw,
    FiMail
} from 'react-icons/fi';
import { FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaLinkedin, FaTiktok, FaWhatsapp, FaTelegram, FaDiscord, FaPinterest, FaSnapchat, FaReddit, FaGlobe } from 'react-icons/fa';

const AdminExpoHall = () => {
    const [activeTab, setActiveTab] = useState('Entrance'); // 'Entrance', 'A', 'B', 'C', 'Booths'
    const [boothId, setBoothId] = useState('1');

    const [bgImage, setBgImage] = useState('/virtual-events-assets/expo-bg.jpg');
    const [points, setPoints] = useState([]);
    const [posters, setPosters] = useState([]);
    const [socialLinks, setSocialLinks] = useState([]);
    const [resources, setResources] = useState({ documents: [], videos: [] });
    const [products, setProducts] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedItemType, setSelectedItemType] = useState('point'); // 'point', 'poster', or 'social'
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const getConfigKey = (tab, bId) => {
        if (tab === 'Entrance') return 'expo_hall_entrance';
        if (tab === 'Booths') return `booth_${bId}_layout`;
        return `hall_${tab.toLowerCase()}_layout`;
    };

    const fetchLeadsForBooth = async () => {
        if (activeTab !== 'Booths') return;
        try {
            setLoadingLeads(true);
            const res = await leadService.getLeads(boothId);
            if (res.data && res.data.success) {
                setLeads(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load leads for booth", err);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleDeleteLead = async (leadId) => {
        if (!window.confirm("Are you sure you want to delete this inquiry?")) return;
        try {
            await leadService.deleteLead(leadId);
            setLeads(prev => prev.filter(l => l._id !== leadId));
        } catch (err) {
            console.error("Failed to delete lead", err);
        }
    };

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                setBgImage('');
                setPoints([]);
                setPosters([]);
                setSocialLinks([]);
                setResources({ documents: [], videos: [] });
                setProducts([]);
                setLeads([]);
                setIsFullscreen(false);
                setSelectedItemId(null);
                setStatus('');

                const key = getConfigKey(activeTab, boothId);
                const response = await configService.getConfig(key);
                const defaultBg = activeTab === 'Booths' ? '' : '/virtual-events-assets/expo-bg.jpg';

                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setBgImage(config.bgImage);
                    else setBgImage(defaultBg);

                    if (config.points) setPoints(config.points);
                    if (config.posters) setPosters(config.posters);
                    if (config.socialLinks) setSocialLinks(config.socialLinks);
                    if (config.resources) setResources(config.resources);
                    if (config.products) setProducts(config.products);
                } else {
                    // Default fallback images
                    setBgImage(defaultBg);
                }

                if (activeTab === 'Booths') {
                    fetchLeadsForBooth();
                }
            } catch (err) {
                console.error(`Failed to load config for ${activeTab}`, err);
            }
        };
        fetchLayout();
    }, [activeTab, boothId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        try {
            const configKey = getConfigKey(activeTab, boothId);
            const configVal = JSON.stringify({
                bgImage,
                points: activeTab === 'Entrance' ? [] : points,
                posters: activeTab === 'Entrance' ? [] : posters,
                socialLinks: activeTab === 'Entrance' ? [] : socialLinks,
                resources: activeTab === 'Entrance' ? { documents: [], videos: [] } : resources,
                products: activeTab === 'Entrance' ? [] : products
            });
            await configService.setConfig(configKey, configVal);

            let successMsg = `Hall ${activeTab} settings saved successfully!`;
            if (activeTab === 'Entrance') successMsg = 'Entrance settings saved successfully!';
            if (activeTab === 'Booths') successMsg = `Booth ${boothId} settings saved successfully!`;

            setStatus(successMsg);
            setTimeout(() => setStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save settings', err);
            setStatus('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLoading(true);
            setStatus('Uploading background image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setBgImage(response.data.url);
                    setStatus('Background uploaded successfully!');
                    setTimeout(() => setStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setStatus('Background upload failed. Try again.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e) => {
        if (activeTab === 'Entrance') return; // No points in entrance yet
        if (e.button !== 0) return;
        if (e.target.closest('.map-item')) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const clickX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
        const clickY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

        if (selectedItemType === 'poster' && selectedItemId) {
            setDrawStart({ x: clickX, y: clickY });
            setIsDrawing(true);
            setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, left: clickX, top: clickY, width: 0, height: 0 } : p));
        } else {
            const newPoint = {
                id: 'point_' + Date.now(),
                left: clickX,
                top: clickY,
                text: 'New Discussion Point',
                targetPage: '' // Optional navigation target
            };

            setPoints(prev => [...prev, newPoint]);
            setSelectedItemId(newPoint.id);
            setSelectedItemType('point');
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || selectedItemType !== 'poster' || !selectedItemId) return;
        
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;
        
        const leftEdge = Math.max(0, Math.min(currentX, drawStart.x));
        const topEdge = Math.max(0, Math.min(currentY, drawStart.y));
        const rightEdge = Math.min(100, Math.max(currentX, drawStart.x));
        const bottomEdge = Math.min(100, Math.max(currentY, drawStart.y));
        
        const width = rightEdge - leftEdge;
        const height = bottomEdge - topEdge;
        const centerX = leftEdge + (width / 2);
        const centerY = topEdge + (height / 2);
        
        setPosters(prev => prev.map(p => p.id === selectedItemId ? { 
            ...p, 
            left: Number(centerX.toFixed(1)), 
            top: Number(centerY.toFixed(1)), 
            width: Number(width.toFixed(1)), 
            height: Number(height.toFixed(1)) 
        } : p));
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleAddPoster = () => {
        const newPoster = {
            id: 'poster_' + Date.now(),
            left: 50,
            top: 50,
            width: 15,
            height: 25,
            type: 'image', // 'image' or 'youtube'
            imageUrl: '',
            videoUrl: ''
        };
        setPosters(prev => [...prev, newPoster]);
        setSelectedItemId(newPoster.id);
        setSelectedItemType('poster');
    };

    const handleAddSocialLink = () => {
        const newSocial = {
            id: 'social_' + Date.now(),
            left: 50,
            top: 50,
            width: 32,
            height: 32,
            platform: 'instagram', // 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'
            url: ''
        };
        setSocialLinks(prev => [...prev, newSocial]);
        setSelectedItemId(newSocial.id);
        setSelectedItemType('social');
    };

    const handlePosterImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedItemId) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLoading(true);
            setStatus('Uploading poster image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, imageUrl: response.data.url } : p));
                    setStatus('Poster image uploaded successfully!');
                    setTimeout(() => setStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setStatus('Poster image upload failed.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const selectedPoint = points.find(p => p.id === selectedItemId);
    const selectedPoster = posters.find(p => p.id === selectedItemId);
    const selectedSocial = socialLinks.find(p => p.id === selectedItemId);

    return (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10 mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <FiSettings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">Expo Hall Settings</h2>
                    <p className="text-sm text-gray-500">Configure parameters for the entrance and individual halls</p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border border-gray-200 mb-6 bg-gray-50 p-1 rounded-xl gap-1">
                {['Entrance', 'A', 'B', 'C', 'Booths'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${activeTab === tab ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab === 'Entrance' ? 'Expo Entrance' : tab === 'Booths' ? 'Booth Settings' : `Hall ${tab}`}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSave} className="space-y-6 animate-fade-in-up">
                {/* Booth Selector (Only for Booths tab) */}
                {activeTab === 'Booths' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                        <label className="block text-sm font-bold text-indigo-800 mb-2">Select Booth ID to Edit</label>
                        <input
                            type="text"
                            value={boothId}
                            onChange={(e) => setBoothId(e.target.value)}
                            className="w-full max-w-xs bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. 1"
                        />
                        <p className="text-sm text-indigo-600 mt-2">Enter the ID of the booth you want to configure (e.g. "1" for /dashboard/expo-hall/a/booth/1)</p>
                    </div>
                )}
                {/* General Background Config */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">
                        {activeTab === 'Entrance' ? 'Entrance Appearance' : activeTab === 'Booths' ? `Booth ${boothId} Appearance` : `Hall ${activeTab} Appearance`}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Background Image</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={bgImage}
                                    onChange={(e) => setBgImage(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                    placeholder="https://example.com/bg.png"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="eh-bg-upload"
                                />
                                <label
                                    htmlFor="eh-bg-upload"
                                    className="bg-blue-50 hover:bg-blue-100 text-[#295ce8] border border-blue-200 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload Image
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive preview (Only for Halls) */}
                {activeTab !== 'Entrance' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-gray-700">Map Editor</label>
                            <div className="flex gap-3 items-center">
                                <button
                                    type="button"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="text-[10px] text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded shadow cursor-pointer border border-gray-300"
                                >
                                    Expand Editor
                                </button>
                                <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                    Click on image to add point. To draw poster, click "+ Add Poster" first, then click and drag on image!
                                </span>
                                <button
                                    type="button"
                                    onClick={handleAddPoster}
                                    className="text-sm text-white font-bold bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-colors"
                                >
                                    + Add Poster
                                </button>
                                {activeTab === 'Booths' && (
                                    <button
                                        type="button"
                                        onClick={handleAddSocialLink}
                                        className="text-sm text-white font-bold bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-colors"
                                    >
                                        + Add Social
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={isFullscreen ? "fixed inset-0 z-50 bg-black/95 overflow-auto p-4 flex flex-col items-center" : ""}>
                            {isFullscreen && (
                                <div className="w-full flex justify-end mb-4 sticky top-0 z-[60] pointer-events-auto">
                                    <button type="button" onClick={() => setIsFullscreen(false)} className="bg-white text-black px-4 py-2 text-sm font-bold rounded shadow-lg hover:bg-gray-200">
                                        Close Fullscreen
                                    </button>
                                </div>
                            )}
                            <div
                                className={`bg-neutral-900 border border-gray-200 relative shadow-inner cursor-crosshair select-none ${isFullscreen ? 'w-[1600px] max-w-none shadow-2xl' : 'w-full rounded-xl overflow-hidden'}`}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <img
                                src={bgImage || undefined}
                                alt="Hall Preview"
                                className="w-full h-auto pointer-events-none block"
                            />

                            {/* Posters */}
                            {posters.map(poster => (
                                <div
                                    key={poster.id}
                                    className={`map-item absolute border-2 ${selectedItemId === poster.id ? 'border-indigo-400 z-30 shadow-2xl ring-4 ring-indigo-500/50' : 'border-transparent z-10 hover:border-white/50 hover:shadow-xl'} bg-black/20 flex items-center justify-center overflow-hidden cursor-move pointer-events-auto`}
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
                                        transform: 'translate(-50%, -50%)',
                                        backgroundImage: poster.imageUrl ? `url(${poster.imageUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItemId(poster.id);
                                        setSelectedItemType('poster');
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
                                                    VIDEO SCREEN ({poster.width}% &times; {poster.height}%)
                                                </span>
                                            </div>
                                        )
                                    ) : (
                                        !poster.imageUrl && (
                                            <span className="text-white text-sm font-bold opacity-50 text-center px-1">Poster</span>
                                        )
                                    )}
                                </div>
                            ))}

                            {/* Social Links */}
                            {socialLinks.map(social => {
                                let Icon = FaInstagram;
                                if (social.platform === 'facebook') Icon = FaFacebook;
                                else if (social.platform === 'twitter') Icon = FaTwitter;
                                else if (social.platform === 'youtube') Icon = FaYoutube;
                                else if (social.platform === 'linkedin') Icon = FaLinkedin;
                                else if (social.platform === 'tiktok') Icon = FaTiktok;
                                else if (social.platform === 'whatsapp') Icon = FaWhatsapp;
                                else if (social.platform === 'telegram') Icon = FaTelegram;
                                else if (social.platform === 'discord') Icon = FaDiscord;
                                else if (social.platform === 'pinterest') Icon = FaPinterest;
                                else if (social.platform === 'snapchat') Icon = FaSnapchat;
                                else if (social.platform === 'reddit') Icon = FaReddit;
                                else if (social.platform === 'website') Icon = FaGlobe;

                                return (
                                    <div
                                        key={social.id}
                                        className={`map-item absolute z-20 pointer-events-auto flex items-center justify-center cursor-move w-6 h-6 bg-pink-500 rounded-full border-2 ${selectedItemId === social.id ? 'border-white shadow-xl ring-2 ring-pink-400' : 'border-transparent'}`}
                                        style={{
                                            top: `${social.top}%`,
                                            left: `${social.left}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: social.width ? `${social.width}px` : '32px',
                                            height: social.height ? `${social.height}px` : '32px'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItemId(social.id);
                                            setSelectedItemType('social');
                                        }}
                                    >
                                        <Icon className="text-white w-4 h-4" />
                                    </div>
                                );
                            })}

                            {/* Points */}
                            {points.map(point => (
                                <div
                                    key={point.id}
                                    className="map-item absolute z-20 pointer-events-none"
                                    style={{
                                        top: `${point.top}%`,
                                        left: `${point.left}%`
                                    }}
                                >
                                    {/* Small Blue Dot */}
                                    <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center pointer-events-auto cursor-pointer z-20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItemId(point.id);
                                            setSelectedItemType('point');
                                        }}>
                                        {selectedItemId === point.id && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        )}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white ${selectedItemId === point.id ? 'ring-2 ring-blue-400' : ''}`}></span>
                                    </div>

                                    {/* Text Bubble & Stem */}
                                    <div className={`absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 ${selectedItemId === point.id ? 'scale-110 drop-shadow-xl' : 'hover:scale-105'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItemId(point.id);
                                            setSelectedItemType('point');
                                        }}
                                    >
                                        <div className={`bg-black text-white rounded-xl p-2 shadow-2xl border ${selectedItemId === point.id ? 'border-blue-400' : 'border-blue-500/30'} max-w-[150px] text-center`}>
                                            <p className="text-sm font-semibold leading-tight whitespace-nowrap">
                                                {point.text || 'New Point'}
                                            </p>
                                        </div>
                                        <div className="w-0.5 h-5 bg-gradient-to-b from-blue-500 to-blue-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                )}

                {/* Selected Item Editor Form */}
                {(activeTab !== 'Entrance' && selectedItemType === 'point' && selectedPoint) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                <FiMapPin className="text-blue-500" /> Point Settings ({selectedPoint.left}%, {selectedPoint.top}%)
                            </h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setPoints(prev => prev.filter(p => p.id !== selectedItemId));
                                    setSelectedItemId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Point
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Text Bubble Content</label>
                            <textarea
                                value={selectedPoint.text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPoints(prev => prev.map(p => p.id === selectedItemId ? { ...p, text: val } : p));
                                }}
                                rows="2"
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                placeholder="Write point prompt here..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Target Action (Optional URL or Navigation)</label>
                            <input
                                type="text"
                                value={selectedPoint.targetPage || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPoints(prev => prev.map(p => p.id === selectedItemId ? { ...p, targetPage: val } : p));
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                placeholder="/virtual-events-platform/app/dashboard/auditorium or https://example.com"
                            />
                        </div>
                    </div>
                )}

                {(activeTab !== 'Entrance' && selectedItemType === 'poster' && selectedPoster) && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <FiSettings className="text-indigo-600" /> Poster Settings ({selectedPoster.left}%, {selectedPoster.top}%)
                            </h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setPosters(prev => prev.filter(p => p.id !== selectedItemId));
                                    setSelectedItemId(null);
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
                                    setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, type: val } : p));
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
                                            setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, imageUrl: val } : p));
                                        }}
                                        className="flex-1 bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                        placeholder="https://example.com/poster.jpg"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePosterImageUpload}
                                        className="hidden"
                                        id="eh-poster-upload"
                                    />
                                    <label
                                        htmlFor="eh-poster-upload"
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
                                        setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, videoUrl: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                    placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                                />
                                <p className="text-sm text-indigo-500 mt-1">Make sure to use the "Embed" link from YouTube, not the regular watch link.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">X Position (%)</label>
                                <input
                                    type="number"
                                    value={selectedPoster.left}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, left: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Y Position (%)</label>
                                <input
                                    type="number"
                                    value={selectedPoster.top}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, top: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Width (%)</label>
                                <input
                                    type="number"
                                    value={selectedPoster.width}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, width: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Height (%)</label>
                                <input
                                    type="number"
                                    value={selectedPoster.height}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setPosters(prev => prev.map(p => p.id === selectedItemId ? { ...p, height: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab !== 'Entrance' && selectedItemType === 'social' && selectedSocial) && (
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-pink-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <FiSettings className="text-pink-600" /> Social Link Settings ({selectedSocial.left}%, {selectedSocial.top}%)
                            </h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setSocialLinks(prev => prev.filter(p => p.id !== selectedItemId));
                                    setSelectedItemId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Social
                            </button>
                        </div>

                        <div className="mb-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Platform</label>
                            <select
                                value={selectedSocial.platform}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, platform: val } : p));
                                }}
                                className="w-full bg-white border border-pink-200 rounded-lg p-2 text-sm focus:outline-none focus:border-pink-500"
                            >
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">Twitter / X</option>
                                <option value="youtube">YouTube</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="tiktok">TikTok</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="telegram">Telegram</option>
                                <option value="discord">Discord</option>
                                <option value="pinterest">Pinterest</option>
                                <option value="snapchat">Snapchat</option>
                                <option value="reddit">Reddit</option>
                                <option value="website">Custom Website</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Target URL</label>
                            <input
                                type="text"
                                value={selectedSocial.url || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, url: val } : p));
                                }}
                                className="w-full bg-white border border-pink-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-pink-500"
                                placeholder="https://www.instagram.com/username/"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">X Position (%)</label>
                                <input
                                    type="number"
                                    value={selectedSocial.left}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, left: val } : p));
                                    }}
                                    className="w-full bg-white border border-pink-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Y Position (%)</label>
                                <input
                                    type="number"
                                    value={selectedSocial.top}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, top: val } : p));
                                    }}
                                    className="w-full bg-white border border-pink-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Width (px)</label>
                                <input
                                    type="number"
                                    value={selectedSocial.width || 32}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, width: val } : p));
                                    }}
                                    className="w-full bg-white border border-pink-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Height (px)</label>
                                <input
                                    type="number"
                                    value={selectedSocial.height || 32}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSocialLinks(prev => prev.map(p => p.id === selectedItemId ? { ...p, height: val } : p));
                                    }}
                                    className="w-full bg-white border border-pink-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Resource Center (Only for Booths) */}
                {activeTab === 'Booths' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Resource Center (Documents & Videos)</h3>
                        
                        <div className="space-y-4">
                            {/* Documents */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-700">Documents (PDFs)</h4>
                                    <button type="button" onClick={() => setResources(prev => ({ ...prev, documents: [...prev.documents, { id: Date.now(), name: '', url: '' }] }))} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                        + ADD DOCUMENT
                                    </button>
                                </div>
                                {resources.documents.map((doc, idx) => (
                                    <div key={doc.id} className="flex gap-2 mb-2 items-center">
                                        <input type="text" placeholder="Doc Name" value={doc.name} onChange={(e) => { const newDocs = [...resources.documents]; newDocs[idx].name = e.target.value; setResources(prev => ({...prev, documents: newDocs})); }} className="w-1/3 bg-gray-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500" />
                                        <input type="text" placeholder="URL" value={doc.url} onChange={(e) => { const newDocs = [...resources.documents]; newDocs[idx].url = e.target.value; setResources(prev => ({...prev, documents: newDocs})); }} className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500" />
                                        <button type="button" onClick={() => setResources(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== doc.id) }))} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                                    </div>
                                ))}
                            </div>

                            {/* Videos */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-700">Videos</h4>
                                    <button type="button" onClick={() => setResources(prev => ({ ...prev, videos: [...prev.videos, { id: Date.now(), name: '', url: '' }] }))} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                        + ADD VIDEO
                                    </button>
                                </div>
                                {resources.videos.map((vid, idx) => (
                                    <div key={vid.id} className="flex gap-2 mb-2 items-center">
                                        <input type="text" placeholder="Video Title" value={vid.name} onChange={(e) => { const newVids = [...resources.videos]; newVids[idx].name = e.target.value; setResources(prev => ({...prev, videos: newVids})); }} className="w-1/3 bg-gray-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500" />
                                        <input type="text" placeholder="YouTube URL" value={vid.url} onChange={(e) => { const newVids = [...resources.videos]; newVids[idx].url = e.target.value; setResources(prev => ({...prev, videos: newVids})); }} className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500" />
                                        <button type="button" onClick={() => setResources(prev => ({ ...prev, videos: prev.videos.filter(v => v.id !== vid.id) }))} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Showcase Catalogue */}
                {activeTab === 'Booths' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-800">Product Showcase Catalogue</h3>
                            <button
                                type="button"
                                onClick={() => setProducts(prev => [...prev, { id: 'prod_' + Date.now(), name: '', description: '', imageUrl: '', moreInfoUrl: '', videoUrl: '' }])}
                                className="text-[10px] text-white font-bold bg-[#295ce8] hover:bg-blue-700 px-3 py-1.5 rounded shadow"
                            >
                                + Add Product
                            </button>
                        </div>

                        <div className="space-y-4">
                            {products.map((product, idx) => (
                                <div key={product.id} className="border border-gray-200 bg-white p-4 rounded-lg relative">
                                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                                        <h4 className="text-xs font-bold text-gray-800">Product #{idx + 1}</h4>
                                        <button type="button" onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))} className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:text-red-700">
                                            <FiTrash2 /> Delete
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Product Name</label>
                                            <input type="text" value={product.name} onChange={(e) => { const newP = [...products]; newP[idx].name = e.target.value; setProducts(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">More Info URL</label>
                                            <input type="text" value={product.moreInfoUrl} onChange={(e) => { const newP = [...products]; newP[idx].moreInfoUrl = e.target.value; setProducts(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Main Image URL</label>
                                            <input type="text" value={product.imageUrl} onChange={(e) => { const newP = [...products]; newP[idx].imageUrl = e.target.value; setProducts(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Product Video URL (Youtube)</label>
                                            <input type="text" value={product.videoUrl} onChange={(e) => { const newP = [...products]; newP[idx].videoUrl = e.target.value; setProducts(newP); }} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Description</label>
                                        <textarea value={product.description} onChange={(e) => { const newP = [...products]; newP[idx].description = e.target.value; setProducts(newP); }} rows="2" className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500"></textarea>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-4 italic">No products added yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Booth Inquiries / Leads */}
                {activeTab === 'Booths' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FiMail className="text-blue-500" /> Booth Inquiries (Leads)
                            </h3>
                            <button type="button" onClick={fetchLeadsForBooth} className="text-[10px] text-gray-600 bg-white border border-gray-300 font-bold px-2 py-1 rounded shadow-sm hover:bg-gray-50 flex items-center gap-1">
                                <FiRefreshCw className={loadingLeads ? 'animate-spin' : ''} /> Refresh
                            </button>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {leads.length > 0 ? (
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">User</th>
                                            <th className="px-4 py-3 font-semibold">Email</th>
                                            <th className="px-4 py-3 font-semibold">Product</th>
                                            <th className="px-4 py-3 font-semibold">Time</th>
                                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map(lead => (
                                            <tr key={lead._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium text-gray-800">{lead.user?.name}</td>
                                                <td className="px-4 py-2">{lead.user?.email}</td>
                                                <td className="px-4 py-2 font-medium">{lead.productName}</td>
                                                <td className="px-4 py-2 text-[10px] text-gray-500">{new Date(lead.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button type="button" onClick={() => handleDeleteLead(lead._id)} className="text-red-500 hover:text-red-700 font-bold text-[10px]">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-6 italic">No inquiries submitted yet.</p>
                            )}
                        </div>
                    </div>
                )}

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
                    <span>{loading ? 'Saving...' : `Save ${activeTab === 'Entrance' ? 'Entrance' : activeTab === 'Booths' ? 'Booth ' + boothId : 'Hall ' + activeTab} Settings`}</span>
                </button>
            </form>
        </div>
    );
};

export default AdminExpoHall;
