import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { 
    FiCheckCircle, 
    FiSave, 
    FiTrash2, 
    FiMapPin, 
    FiSettings
} from 'react-icons/fi';

const AdminLounge = () => {
    // Lounge Configuration States
    const [loungeBgImage, setLoungeBgImage] = useState('/virtual-events-assets/lounge-bg.png?v=2');
    const [loungePoints, setLoungePoints] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState(null);
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
                points: loungePoints
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

    const handleLoungePreviewClick = (e) => {
        // Prevent click if we clicked on an existing point
        if (e.target.closest('.absolute.z-10')) return;

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
    };

    const selectedPoint = loungePoints.find(p => p.id === selectedPointId);

    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <FiSettings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">Lounge Settings</h2>
                    <p className="text-sm text-gray-500">Configure parameters for this environment</p>
                </div>
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
                            className="w-full h-auto pointer-events-none block"
                        />
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
                                {/* Small Red Dot */}
                                <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center pointer-events-auto cursor-pointer z-20"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setSelectedPointId(point.id);
                                     }}>
                                    {selectedPointId === point.id && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white ${selectedPointId === point.id ? 'ring-2 ring-red-400' : ''}`}></span>
                                </div>

                                {/* Text Bubble & Stem */}
                                <div className={`absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 ${selectedPointId === point.id ? 'scale-110 drop-shadow-xl' : 'hover:scale-105'}`}
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setSelectedPointId(point.id);
                                     }}
                                >
                                    <div className={`bg-black text-white rounded-xl p-2 shadow-2xl border ${selectedPointId === point.id ? 'border-red-400' : 'border-red-500/30'} max-w-[150px] text-center`}>
                                        <p className="text-sm font-semibold leading-tight whitespace-nowrap">
                                            {point.text || 'New Point'}
                                        </p>
                                    </div>
                                    <div className="w-0.5 h-5 bg-gradient-to-b from-red-500 to-red-400" />
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
