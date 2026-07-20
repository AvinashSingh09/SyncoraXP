import React, { useState, useEffect } from 'react';
import { configService } from '../../../services/api';
import { FiCheckCircle, FiSave, FiPlusCircle, FiImage, FiTrash2 } from 'react-icons/fi';

const LayoutManager = () => {
    const [layoutBgImage, setLayoutBgImage] = useState('/virtual-events-assets/lobby-bg.png');
    const [videoTop, setVideoTop] = useState(24);
    const [videoLeft, setVideoLeft] = useState(33.5);
    const [videoWidth, setVideoWidth] = useState(33);
    const [videoHeight, setVideoHeight] = useState(30);
    const [layoutLoading, setLayoutLoading] = useState(false);
    const [layoutStatus, setLayoutStatus] = useState('');
    const [auditoriumPosters, setAuditoriumPosters] = useState([]);
    const [selectedPosterId, setSelectedPosterId] = useState(null);

    // Drawing states for mouse selection
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const response = await configService.getConfig('auditorium_layout');
                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setLayoutBgImage(config.bgImage);
                    if (config.videoTop !== undefined) setVideoTop(config.videoTop);
                    if (config.videoLeft !== undefined) setVideoLeft(config.videoLeft);
                    if (config.videoWidth !== undefined) setVideoWidth(config.videoWidth);
                    if (config.videoHeight !== undefined) setVideoHeight(config.videoHeight);
                    if (config.posters !== undefined) setAuditoriumPosters(config.posters);
                }
            } catch (err) {
                console.error('Failed to load layout config', err);
            }
        };
        fetchLayout();
    }, []);

    const handleSaveLayout = async (e) => {
        e.preventDefault();
        setLayoutLoading(true);
        setLayoutStatus('');
        try {
            const layoutConfig = JSON.stringify({
                bgImage: layoutBgImage,
                videoTop: Number(videoTop),
                videoLeft: Number(videoLeft),
                videoWidth: Number(videoWidth),
                videoHeight: Number(videoHeight),
                posters: auditoriumPosters
            });
            await configService.setConfig('auditorium_layout', layoutConfig);
            setLayoutStatus('Layout configurations saved successfully!');
            setTimeout(() => setLayoutStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save layout config', err);
            setLayoutStatus('Error saving layout configurations.');
        } finally {
            setLayoutLoading(false);
        }
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
        setAuditoriumPosters(prev => [...prev, newPoster]);
        setSelectedPosterId(newPoster.id);
    };

    const handlePosterImageUpload = async (e, posterId) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLayoutLoading(true);
            setLayoutStatus('Uploading poster image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setAuditoriumPosters(prev => prev.map(p => p.id === posterId ? { ...p, imageUrl: response.data.url } : p));
                    setLayoutStatus('Poster uploaded successfully!');
                    setTimeout(() => setLayoutStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLayoutStatus('Poster upload failed. Try again.');
            } finally {
                setLayoutLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setLayoutLoading(true);
            setLayoutStatus('Uploading image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLayoutBgImage(response.data.url);
                    setLayoutStatus('Image uploaded successfully!');
                    setTimeout(() => setLayoutStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setLayoutStatus('Image upload failed. Try again.');
            } finally {
                setLayoutLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const startX = ((e.clientX - rect.left) / rect.width) * 100;
        const startY = ((e.clientY - rect.top) / rect.height) * 100;
        
        setDrawStart({ x: startX, y: startY });
        setVideoLeft(Number(startX.toFixed(1)));
        setVideoTop(Number(startY.toFixed(1)));
        setVideoWidth(0);
        setVideoHeight(0);
        setIsDrawing(true);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;
        
        const left = Math.max(0, Math.min(currentX, drawStart.x));
        const top = Math.max(0, Math.min(currentY, drawStart.y));
        const right = Math.min(100, Math.max(currentX, drawStart.x));
        const bottom = Math.min(100, Math.max(currentY, drawStart.y));
        
        setVideoLeft(Number(left.toFixed(1)));
        setVideoTop(Number(top.toFixed(1)));
        setVideoWidth(Number((right - left).toFixed(1)));
        setVideoHeight(Number((bottom - top).toFixed(1)));
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end mb-2">
                <button 
                    type="button" 
                    onClick={addPoster}
                    className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all cursor-pointer"
                >
                    <FiPlusCircle /> Add Poster
                </button>
            </div>
            <form onSubmit={handleSaveLayout} className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Background Image URL</label>
                        <div className="flex gap-3">
                            <input 
                                type="text"
                                value={layoutBgImage}
                                onChange={(e) => setLayoutBgImage(e.target.value)}
                                placeholder="e.g. /virtual-events-assets/lobby-bg.png"
                                className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                required
                            />
                            <div className="relative">
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="bg-upload"
                                />
                                <label 
                                    htmlFor="bg-upload"
                                    className="bg-blue-50 hover:bg-blue-100 text-[#295ce8] border border-blue-200 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload Image
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Video Top Position ({videoTop}%)</label>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                step="0.5"
                                value={videoTop}
                                onChange={(e) => setVideoTop(Number(e.target.value))}
                                className="w-full cursor-pointer accent-[#295ce8]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Video Left Position ({videoLeft}%)</label>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                step="0.5"
                                value={videoLeft}
                                onChange={(e) => setVideoLeft(Number(e.target.value))}
                                className="w-full cursor-pointer accent-[#295ce8]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Video Width ({videoWidth}%)</label>
                            <input 
                                type="range"
                                min="1"
                                max="100"
                                step="0.5"
                                value={videoWidth}
                                onChange={(e) => setVideoWidth(Number(e.target.value))}
                                className="w-full cursor-pointer accent-[#295ce8]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Video Height ({videoHeight}%)</label>
                            <input 
                                type="range"
                                min="1"
                                max="100"
                                step="0.5"
                                value={videoHeight}
                                onChange={(e) => setVideoHeight(Number(e.target.value))}
                                className="w-full cursor-pointer accent-[#295ce8]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-gray-700">Layout Preview</label>
                        <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded border border-blue-100">
                            Click and Drag on preview to draw screen!
                        </span>
                    </div>
                    <div 
                        className="w-full aspect-video bg-neutral-900 border border-gray-200 rounded-xl relative overflow-hidden shadow-inner cursor-crosshair select-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        >
                        <div 
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none"
                            style={{ backgroundImage: `url(${layoutBgImage})` }}
                        />
                        <div 
                            className="absolute border-2 border-red-500 bg-red-500/25 flex items-center justify-center text-sm font-extrabold text-red-500 pointer-events-none shadow-lg rounded"
                            style={{
                                top: `${videoTop}%`,
                                left: `${videoLeft}%`,
                                width: `${videoWidth}%`,
                                height: `${videoHeight}%`
                            }}
                        >
                            VIDEO SCREEN ({videoWidth}% × {videoHeight}%)
                        </div>
                        {auditoriumPosters.map(poster => (
                            <div
                                key={poster.id}
                                className={`interactive-element absolute z-15 cursor-pointer ${selectedPosterId === poster.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
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
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {!poster.imageUrl && <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">Poster</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {selectedPosterId && (
                    (() => {
                        const selectedPoster = auditoriumPosters.find(p => p.id === selectedPosterId);
                        if (!selectedPoster) return null;
                        return (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-3.5">
                                <div className="flex justify-between items-center border-b border-emerald-200 pb-2 text-gray-800">
                                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                        <FiImage className="text-emerald-500" /> Poster Configuration
                                    </h4>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setAuditoriumPosters(prev => prev.filter(p => p.id !== selectedPosterId));
                                            setSelectedPosterId(null);
                                        }}
                                        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                                    >
                                        <FiTrash2 /> Delete Poster
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-850">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Poster Image URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedPoster.imageUrl}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAuditoriumPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, imageUrl: val } : p));
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
                                    
                                    <div className="grid grid-cols-2 gap-2 text-gray-850">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-500 mb-1">Left (%)</label>
                                            <input
                                                type="number"
                                                value={selectedPoster.left}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setAuditoriumPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, left: val } : p));
                                                }}
                                                className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-500 mb-1">Top (%)</label>
                                            <input
                                                type="number"
                                                value={selectedPoster.top}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setAuditoriumPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, top: val } : p));
                                                }}
                                                className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-500 mb-1">Width (%)</label>
                                            <input
                                                type="number"
                                                value={selectedPoster.width}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setAuditoriumPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, width: val } : p));
                                                }}
                                                className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-500 mb-1">Height (%)</label>
                                            <input
                                                type="number"
                                                value={selectedPoster.height}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setAuditoriumPosters(prev => prev.map(p => p.id === selectedPosterId ? { ...p, height: val } : p));
                                                }}
                                                className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}

                {layoutStatus && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${layoutStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{layoutStatus}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={layoutLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <FiSave />
                    <span>{layoutLoading ? 'Saving...' : 'Save Layout Configurations'}</span>
                </button>
            </form>
        </div>
    );
};

export default LayoutManager;
