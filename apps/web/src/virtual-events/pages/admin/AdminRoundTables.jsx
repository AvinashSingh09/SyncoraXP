import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { 
    FiCheckCircle, 
    FiSave, 
    FiTrash2, 
    FiEdit2,
    FiMapPin, 
    FiSettings
} from 'react-icons/fi';

const AdminRoundTables = () => {
    const [roundTablesBgImage, setRoundTablesBgImage] = useState('/virtual-events-assets/lobby-bg.png');
    const [roundTablesPoints, setRoundTablesPoints] = useState([]);
    const [roundTablesPosters, setRoundTablesPosters] = useState([]);
    const [selectedRtItemId, setSelectedRtItemId] = useState(null);
    const [selectedRtItemType, setSelectedRtItemType] = useState('point'); // 'point' or 'poster'
    const [rtLoading, setRtLoading] = useState(false);
    const [rtStatus, setRtStatus] = useState('');
    const [newScheduleItem, setNewScheduleItem] = useState({ title: '', presenter: '', start: '', end: '', zoomLink: '', ytLink: '' });
    const [editingScheduleIdx, setEditingScheduleIdx] = useState(null);
    const [editScheduleItem, setEditScheduleItem] = useState({ title: '', presenter: '', start: '', end: '', zoomLink: '', ytLink: '' });

    useEffect(() => {
        const fetchRoundTablesLayout = async () => {
            try {
                const response = await configService.getConfig('round_tables_layout');
                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setRoundTablesBgImage(config.bgImage);
                    if (config.points) setRoundTablesPoints(config.points);
                    if (config.posters) setRoundTablesPosters(config.posters);
                }
            } catch (err) {
                console.error('Failed to load round tables layout', err);
            }
        };
        fetchRoundTablesLayout();
    }, []);

    const handleSaveRoundTables = async (e) => {
        e.preventDefault();
        setRtLoading(true);
        setRtStatus('');
        try {
            const rtConfig = JSON.stringify({
                bgImage: roundTablesBgImage,
                points: roundTablesPoints,
                posters: roundTablesPosters
            });
            await configService.setConfig('round_tables_layout', rtConfig);
            setRtStatus('Round Tables settings saved successfully!');
            setTimeout(() => setRtStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save round tables settings', err);
            setRtStatus('Error saving round tables settings.');
        } finally {
            setRtLoading(false);
        }
    };

    const handleRtBgImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setRtLoading(true);
            setRtStatus('Uploading background image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setRoundTablesBgImage(response.data.url);
                    setRtStatus('Background uploaded successfully!');
                    setTimeout(() => setRtStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setRtStatus('Background upload failed. Try again.');
            } finally {
                setRtLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRtPreviewClick = (e) => {
        // Prevent click if we click on an existing item
        if (e.target.closest('.rt-item')) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const clickX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
        const clickY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

        const newPoint = {
            id: 'point_' + Date.now(),
            left: clickX,
            top: clickY,
            text: 'New Discussion Point',
            schedule: []
        };

        setRoundTablesPoints(prev => [...prev, newPoint]);
        setSelectedRtItemId(newPoint.id);
        setSelectedRtItemType('point');
    };

    const handleAddRtPoster = () => {
        const newPoster = {
            id: 'poster_' + Date.now(),
            left: 50,
            top: 50,
            width: 15,
            height: 25,
            imageUrl: ''
        };
        setRoundTablesPosters(prev => [...prev, newPoster]);
        setSelectedRtItemId(newPoster.id);
        setSelectedRtItemType('poster');
    };

    const handleRtPosterImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedRtItemId) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setRtLoading(true);
            setRtStatus('Uploading poster image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, imageUrl: response.data.url } : p));
                    setRtStatus('Poster image uploaded successfully!');
                    setTimeout(() => setRtStatus(''), 4000);
                }
            } catch (err) {
                console.error('Upload failed', err);
                setRtStatus('Poster image upload failed.');
            } finally {
                setRtLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const selectedRtPoint = roundTablesPoints.find(p => p.id === selectedRtItemId);
    const selectedRtPoster = roundTablesPosters.find(p => p.id === selectedRtItemId);

    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <FiSettings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">Round Tables Settings</h2>
                    <p className="text-sm text-gray-500">Configure parameters for this environment</p>
                </div>
            </div>

            <form onSubmit={handleSaveRoundTables} className="space-y-6 animate-fade-in-up">
                {/* General Background Config */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Round Tables Appearance</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Background Image</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text" 
                                    value={roundTablesBgImage} 
                                    onChange={(e) => setRoundTablesBgImage(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                    placeholder="https://example.com/bg.png"
                                />
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleRtBgImageUpload}
                                    className="hidden"
                                    id="rt-bg-upload"
                                />
                                <label 
                                    htmlFor="rt-bg-upload"
                                    className="bg-blue-50 hover:bg-blue-100 text-[#295ce8] border border-blue-200 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload Image
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive click preview */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-gray-700">Round Tables Map Editor</label>
                        <div className="flex gap-2 items-center">
                            <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded border border-blue-100">
                                Click on image to add a point
                            </span>
                            <button 
                                type="button" 
                                onClick={handleAddRtPoster}
                                className="text-sm text-white font-semibold bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded shadow cursor-pointer"
                            >
                                + Add Poster
                            </button>
                        </div>
                    </div>
                    <div 
                        className="w-full bg-neutral-900 border border-gray-200 rounded-xl relative overflow-hidden shadow-inner cursor-pointer select-none"
                        onClick={handleRtPreviewClick}
                    >
                        <img 
                            src={roundTablesBgImage} 
                            alt="Round Tables Preview"
                            className="w-full h-auto pointer-events-none block"
                        />
                        
                        {/* Posters */}
                        {roundTablesPosters.map(poster => (
                            <div
                                key={poster.id}
                                className={`rt-item absolute border-2 ${selectedRtItemId === poster.id ? 'border-indigo-400 z-30 shadow-2xl ring-4 ring-indigo-500/50' : 'border-transparent z-10 hover:border-white/50 hover:shadow-xl'} bg-black/20 flex items-center justify-center overflow-hidden cursor-move pointer-events-auto`}
                                style={{
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
                                    setSelectedRtItemId(poster.id);
                                    setSelectedRtItemType('poster');
                                }}
                            >
                                {!poster.imageUrl && (
                                    <span className="text-white text-sm font-bold opacity-50 text-center px-1">Poster</span>
                                )}
                            </div>
                        ))}

                        {/* Points */}
                        {roundTablesPoints.map(point => (
                            <div
                                key={point.id}
                                className="rt-item absolute z-20 pointer-events-none"
                                style={{
                                    top: `${point.top}%`,
                                    left: `${point.left}%`
                                }}
                            >
                                {/* Small Blue Dot */}
                                <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center pointer-events-auto cursor-pointer z-20"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setSelectedRtItemId(point.id);
                                         setSelectedRtItemType('point');
                                     }}>
                                    {selectedRtItemId === point.id && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white ${selectedRtItemId === point.id ? 'ring-2 ring-blue-400' : ''}`}></span>
                                </div>

                                {/* Text Bubble & Stem (Only show when selected to avoid map clutter) */}
                                {selectedRtItemId === point.id && (
                                    <div className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 scale-110 drop-shadow-xl"
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             setSelectedRtItemId(point.id);
                                             setSelectedRtItemType('point');
                                         }}
                                    >
                                        <div className="bg-black text-white rounded-xl p-2 shadow-2xl border border-blue-400 max-w-[150px] text-center">
                                            <p className="text-sm font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                                {point.text || 'New Point'}
                                            </p>
                                        </div>
                                        <div className="w-0.5 h-5 bg-gradient-to-b from-blue-500 to-blue-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Item Editor Form */}
                {(selectedRtItemType === 'point' && selectedRtPoint) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                <FiMapPin className="text-blue-500" /> Point Settings ({selectedRtPoint.left}%, {selectedRtPoint.top}%)
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setRoundTablesPoints(prev => prev.filter(p => p.id !== selectedRtItemId));
                                    setSelectedRtItemId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Point
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Text Bubble Content</label>
                            <textarea
                                value={selectedRtPoint.text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setRoundTablesPoints(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, text: val } : p));
                                }}
                                rows="2"
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                placeholder="Write point prompt here..."
                            />
                        </div>

                        {/* Schedule Manager */}
                        <div className="mt-4 border-t border-slate-200 pt-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Table Schedule</h5>
                            
                            {/* Existing Schedule Items */}
                            <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-2">
                                {(!selectedRtPoint.schedule || selectedRtPoint.schedule.length === 0) ? (
                                    <p className="text-xs text-gray-400 italic">No schedule items added.</p>
                                ) : (
                                    selectedRtPoint.schedule.map((item, idx) => (
                                        <div key={item.id || idx} className="bg-white p-2.5 rounded border border-gray-200 flex flex-col gap-2">
                                            {editingScheduleIdx === idx ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <input
                                                        type="text"
                                                        value={editScheduleItem.title}
                                                        onChange={e => setEditScheduleItem({...editScheduleItem, title: e.target.value})}
                                                        placeholder="Session Title"
                                                        className="w-full bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editScheduleItem.presenter}
                                                        onChange={e => setEditScheduleItem({...editScheduleItem, presenter: e.target.value})}
                                                        placeholder="Presenter Name"
                                                        className="w-full bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="time"
                                                            value={editScheduleItem.start}
                                                            onChange={e => setEditScheduleItem({...editScheduleItem, start: e.target.value})}
                                                            className="flex-1 bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                        />
                                                        <input
                                                            type="time"
                                                            value={editScheduleItem.end}
                                                            onChange={e => setEditScheduleItem({...editScheduleItem, end: e.target.value})}
                                                            className="flex-1 bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editScheduleItem.zoomLink || ''}
                                                            onChange={e => setEditScheduleItem({...editScheduleItem, zoomLink: e.target.value})}
                                                            placeholder="Zoom Link (Optional)"
                                                            className="flex-1 bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editScheduleItem.ytLink || ''}
                                                            onChange={e => setEditScheduleItem({...editScheduleItem, ytLink: e.target.value})}
                                                            placeholder="YouTube Link (Optional)"
                                                            className="flex-1 bg-slate-50 border border-gray-200 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setEditingScheduleIdx(null)}
                                                            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                if(!editScheduleItem.title || !editScheduleItem.presenter) return;
                                                                setRoundTablesPoints(prev => prev.map(p => {
                                                                    if (p.id === selectedRtItemId) {
                                                                        const updatedSchedule = [...p.schedule];
                                                                        updatedSchedule[idx] = { ...updatedSchedule[idx], ...editScheduleItem };
                                                                        return { ...p, schedule: updatedSchedule };
                                                                    }
                                                                    return p;
                                                                }));
                                                                setEditingScheduleIdx(null);
                                                            }}
                                                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded font-bold cursor-pointer transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center gap-2 w-full">
                                                    <div className="flex flex-col flex-1 overflow-hidden">
                                                        <span className="text-xs font-bold truncate" title={item.title}>{item.title}</span>
                                                    <span className="text-[10px] text-gray-500">
                                                        By {item.presenter} | {item.start ? new Date(`1970-01-01T${item.start}`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''} - {item.end ? new Date(`1970-01-01T${item.end}`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''}
                                                    </span>
                                                </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingScheduleIdx(idx);
                                                                setEditScheduleItem({ ...item });
                                                            }}
                                                            className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer transition-colors"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRoundTablesPoints(prev => prev.map(p => {
                                                                    if (p.id === selectedRtItemId) {
                                                                        return { ...p, schedule: p.schedule.filter((_, i) => i !== idx) };
                                                                    }
                                                                    return p;
                                                                }));
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add New Schedule Item Form */}
                            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newScheduleItem.title}
                                    onChange={e => setNewScheduleItem({...newScheduleItem, title: e.target.value})}
                                    placeholder="Session Title"
                                    className="w-full bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text"
                                    value={newScheduleItem.presenter}
                                    onChange={e => setNewScheduleItem({...newScheduleItem, presenter: e.target.value})}
                                    placeholder="Presenter Name"
                                    className="w-full bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        value={newScheduleItem.start}
                                        onChange={e => setNewScheduleItem({...newScheduleItem, start: e.target.value})}
                                        className="flex-1 bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="time"
                                        value={newScheduleItem.end}
                                        onChange={e => setNewScheduleItem({...newScheduleItem, end: e.target.value})}
                                        className="flex-1 bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newScheduleItem.zoomLink || ''}
                                        onChange={e => setNewScheduleItem({...newScheduleItem, zoomLink: e.target.value})}
                                        placeholder="Zoom Link (Optional)"
                                        className="flex-1 bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={newScheduleItem.ytLink || ''}
                                        onChange={e => setNewScheduleItem({...newScheduleItem, ytLink: e.target.value})}
                                        placeholder="YouTube Link (Optional)"
                                        className="flex-1 bg-slate-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if(!newScheduleItem.title || !newScheduleItem.presenter) return;
                                        setRoundTablesPoints(prev => prev.map(p => {
                                            if (p.id === selectedRtItemId) {
                                                const currentSchedule = p.schedule || [];
                                                return { 
                                                    ...p, 
                                                    schedule: [...currentSchedule, { ...newScheduleItem, id: Date.now() }] 
                                                };
                                            }
                                            return p;
                                        }));
                                        setNewScheduleItem({ title: '', presenter: '', start: '', end: '', zoomLink: '', ytLink: '' });
                                    }}
                                    className="w-full mt-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-1.5 rounded text-xs transition-colors cursor-pointer"
                                >
                                    + Add Schedule Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {(selectedRtItemType === 'poster' && selectedRtPoster) && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col gap-3.5">
                        <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <FiSettings className="text-indigo-600" /> Poster Settings ({selectedRtPoster.left}%, {selectedRtPoster.top}%)
                            </h4>
                            <button 
                                type="button"
                                onClick={() => {
                                    setRoundTablesPosters(prev => prev.filter(p => p.id !== selectedRtItemId));
                                    setSelectedRtItemId(null);
                                }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold cursor-pointer"
                            >
                                <FiTrash2 /> Delete Poster
                            </button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Poster Image</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text" 
                                    value={selectedRtPoster.imageUrl} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, imageUrl: val } : p));
                                    }}
                                    className="flex-1 bg-white border border-indigo-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                    placeholder="https://example.com/poster.jpg"
                                />
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleRtPosterImageUpload}
                                    className="hidden"
                                    id="rt-poster-upload"
                                />
                                <label 
                                    htmlFor="rt-poster-upload"
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 font-bold px-3 py-2 rounded-lg text-sm cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload Poster
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">X Position (%)</label>
                                <input 
                                    type="number"
                                    value={selectedRtPoster.left}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, left: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Y Position (%)</label>
                                <input 
                                    type="number"
                                    value={selectedRtPoster.top}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, top: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Width (%)</label>
                                <input 
                                    type="number"
                                    value={selectedRtPoster.width}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, width: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Height (%)</label>
                                <input 
                                    type="number"
                                    value={selectedRtPoster.height}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setRoundTablesPosters(prev => prev.map(p => p.id === selectedRtItemId ? { ...p, height: val } : p));
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {rtStatus && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${rtStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{rtStatus}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={rtLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <FiSave />
                    <span>{rtLoading ? 'Saving...' : 'Save Round Tables Settings'}</span>
                </button>
            </form>
        </div>
    );
};

export default AdminRoundTables;
