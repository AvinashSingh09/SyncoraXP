import React, { useState, useEffect, useRef } from 'react';
import { meetingService, configService } from '../../services/api';
import { 
    FiCheckCircle, 
    FiSave, 
    FiTrash2, 
    FiVideo,
    FiPlusCircle,
    FiExternalLink,
    FiEdit2,
    FiX
} from 'react-icons/fi';

const AdminMeetingRoom = () => {
    const [meetings, setMeetings] = useState([]);
    const [code, setCode] = useState('');
    const [zoomLink, setZoomLink] = useState('');
    const [topic, setTopic] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [hostEmail, setHostEmail] = useState('');
    // Tracks which meeting is being edited (null = add mode)
    const [editingMeeting, setEditingMeeting] = useState(null);
    
    const [layoutTop, setLayoutTop] = useState(10.5);
    const [layoutLeft, setLayoutLeft] = useState(18.0);
    const [layoutWidth, setLayoutWidth] = useState(64.0);
    const [layoutHeight, setLayoutHeight] = useState(41.2);
    
    // Hover coordinates states
    const [hoverTop, setHoverTop] = useState(70.0);
    const [hoverLeft, setHoverLeft] = useState(50.0);
    const [hoverWidth, setHoverWidth] = useState(13.0);
    const [hoverHeight, setHoverHeight] = useState(6.0);
    
    const [editMode, setEditMode] = useState('layout'); // 'layout' or 'hover'
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
    
    const previewRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const fetchMeetings = async () => {
        try {
            const response = await meetingService.getMeetings();
            if (response.data && response.data.data) {
                setMeetings(response.data.data);
            }
        } catch (err) {
            console.error('Failed to load meetings', err);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchHoverConfig();
    }, []);

    const fetchHoverConfig = async () => {
        try {
            const res = await configService.getConfig('meeting_hover_area');
            if (res.data && res.data.value) {
                const config = JSON.parse(res.data.value);
                setHoverTop(config.top !== undefined ? config.top : 70.0);
                setHoverLeft(config.left !== undefined ? config.left : 50.0);
                setHoverWidth(config.width !== undefined ? config.width : 13.0);
                setHoverHeight(config.height !== undefined ? config.height : 6.0);
            }
        } catch (e) {
            console.error('Failed to load hover config', e);
        }
    };

    const handleSaveHover = async () => {
        try {
            await configService.setConfig('meeting_hover_area', JSON.stringify({
                top: hoverTop,
                left: hoverLeft,
                width: hoverWidth,
                height: hoverHeight
            }));
            setStatus('Hover area saved successfully!');
            setTimeout(() => setStatus(''), 4000);
        } catch (e) {
            console.error('Failed to save hover area', e);
            setStatus('Error saving hover area.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!code.trim() || (!isCustom && !zoomLink.trim())) return;

        setLoading(true);
        setStatus('');
        try {
            await meetingService.saveMeeting({
                code: code.trim(),
                zoomLink: isCustom ? '' : zoomLink.trim(),
                topic: topic.trim(),
                isCustom: isCustom,
                hostEmail: hostEmail.trim().toLowerCase(),
                layoutTop,
                layoutLeft,
                layoutWidth,
                layoutHeight
            });
            setStatus(editingMeeting ? 'Meeting updated successfully!' : 'Meeting saved successfully!');
            resetForm();
            fetchMeetings();
            setTimeout(() => setStatus(''), 4000);
        } catch (err) {
            console.error('Failed to save meeting', err);
            setStatus('Error saving meeting.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCode('');
        setZoomLink('');
        setTopic('');
        setHostEmail('');
        setIsCustom(false);
        setLayoutTop(10.5);
        setLayoutLeft(18.0);
        setLayoutWidth(64.0);
        setLayoutHeight(41.2);
        setEditingMeeting(null);
    };

    const handleEdit = (m) => {
        setEditingMeeting(m);
        setCode(m.code || '');
        setZoomLink(m.zoomLink || '');
        setTopic(m.topic || '');
        setIsCustom(!!m.isCustom);
        setHostEmail(m.hostEmail || '');
        setLayoutTop(m.layoutTop ?? 10.5);
        setLayoutLeft(m.layoutLeft ?? 18.0);
        setLayoutWidth(m.layoutWidth ?? 64.0);
        setLayoutHeight(m.layoutHeight ?? 41.2);
        // Scroll form into view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        resetForm();
        setStatus('');
    };

    const getPercentageCoords = (e) => {
        if (!previewRef.current) return { x: 0, y: 0 };
        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        };
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        const coords = getPercentageCoords(e);
        setIsDrawing(true);
        setDrawStart(coords);
        if (editMode === 'layout') {
            setLayoutLeft(parseFloat(coords.x.toFixed(1)));
            setLayoutTop(parseFloat(coords.y.toFixed(1)));
            setLayoutWidth(0);
            setLayoutHeight(0);
        } else {
            setHoverLeft(parseFloat(coords.x.toFixed(1)));
            setHoverTop(parseFloat(coords.y.toFixed(1)));
            setHoverWidth(0);
            setHoverHeight(0);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const coords = getPercentageCoords(e);
        
        const left = Math.min(drawStart.x, coords.x);
        const top = Math.min(drawStart.y, coords.y);
        const width = Math.abs(coords.x - drawStart.x);
        const height = Math.abs(coords.y - drawStart.y);
        
        if (editMode === 'layout') {
            setLayoutLeft(parseFloat(left.toFixed(1)));
            setLayoutTop(parseFloat(top.toFixed(1)));
            setLayoutWidth(parseFloat(width.toFixed(1)));
            setLayoutHeight(parseFloat(height.toFixed(1)));
        } else {
            setHoverLeft(parseFloat(left.toFixed(1)));
            setHoverTop(parseFloat(top.toFixed(1)));
            setHoverWidth(parseFloat(width.toFixed(1)));
            setHoverHeight(parseFloat(height.toFixed(1)));
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this meeting code?')) return;
        try {
            await meetingService.deleteMeeting(id);
            fetchMeetings();
        } catch (err) {
            console.error('Failed to delete meeting', err);
        }
    };

    return (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FiVideo className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Meeting Room Settings</h2>
                        <p className="text-sm text-gray-500">Configure codes and Zoom meeting links for the Meeting Room</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Save / Edit Form */}
                <form onSubmit={handleSave} className={`flex flex-col gap-5 ${editingMeeting ? 'ring-2 ring-blue-400 rounded-2xl p-4 bg-blue-50/30' : ''}`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                            {editingMeeting ? (
                                <><FiEdit2 className="text-blue-600" /> Edit Meeting — <span className="font-mono text-blue-600">{editingMeeting.code}</span></>
                            ) : (
                                <><FiPlusCircle /> Add / Update Meeting</>
                            )}
                        </h3>
                        {editingMeeting && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
                            >
                                <FiX className="w-3.5 h-3.5" /> Cancel
                            </button>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Access Code (e.g. BOARDROOM, SESSION1)
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. DEMO123"
                            className={`w-full bg-[#f8fafc] border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400 font-mono ${
                                editingMeeting
                                    ? 'border-blue-300 bg-blue-50 text-blue-700 cursor-not-allowed opacity-80'
                                    : 'border-gray-200'
                            }`}
                            required
                            readOnly={!!editingMeeting}
                        />
                        {editingMeeting && (
                            <p className="text-[10px] text-blue-600 mt-1">Code cannot be changed — it is the unique identifier for this meeting.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-[#f8fafc] border border-gray-150 p-3 rounded-xl">
                        <input
                            type="checkbox"
                            id="isCustom"
                            checked={isCustom}
                            onChange={(e) => {
                                setIsCustom(e.target.checked);
                                if (e.target.checked) setZoomLink('');
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="isCustom" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                            Use Custom Video Call (In-App WebRTC)
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {isCustom ? "Zoom / Meeting Link (Disabled for Custom Call)" : "Zoom / Meeting Link"}
                        </label>
                        <input
                            type="url"
                            value={zoomLink}
                            onChange={(e) => setZoomLink(e.target.value)}
                            placeholder={isCustom ? "No link required" : "https://zoom.us/j/... or any meeting URL"}
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400 disabled:opacity-50"
                            required={!isCustom}
                            disabled={isCustom}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Topic / Description (Optional)
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Board of Directors Meeting"
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <label className="block text-xs font-semibold text-amber-800 mb-1">
                            🔑 Host Email (Only this person enters directly as Host)
                        </label>
                        <p className="text-[10px] text-amber-700 mb-2 leading-relaxed">
                            If set, only the participant whose login email matches will be the meeting host. All other participants — even if they join first — will wait in the waiting room until the host admits them.
                        </p>
                        <input
                            type="email"
                            value={hostEmail}
                            onChange={(e) => setHostEmail(e.target.value)}
                            placeholder="e.g. host@company.com"
                            className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all text-gray-800 placeholder-gray-400"
                        />
                        {!hostEmail.trim() && (
                            <p className="text-[10px] text-amber-600 mt-1.5">Leave blank to use legacy mode (first to join = host)</p>
                        )}
                    </div>

                    {/* Screen & Hover Layout Positions */}
                    <div className="border-t border-gray-150 pt-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-gray-700">Area Adjuster</h4>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                    type="button"
                                    onClick={() => setEditMode('layout')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${editMode === 'layout' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Video Screen
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditMode('hover')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${editMode === 'hover' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Join Button
                                </button>
                            </div>
                        </div>
                        
                        {editMode === 'layout' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Video Top Position ({layoutTop}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={layoutTop}
                                        onChange={(e) => setLayoutTop(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Video Left Position ({layoutLeft}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={layoutLeft}
                                        onChange={(e) => setLayoutLeft(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Video Width ({layoutWidth}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={layoutWidth}
                                        onChange={(e) => setLayoutWidth(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Video Height ({layoutHeight}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={layoutHeight}
                                        onChange={(e) => setLayoutHeight(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Button Top Position ({hoverTop}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={hoverTop}
                                        onChange={(e) => setHoverTop(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Button Left Position ({hoverLeft}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={hoverLeft}
                                        onChange={(e) => setHoverLeft(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Button Width ({hoverWidth}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={hoverWidth}
                                        onChange={(e) => setHoverWidth(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                        Button Height ({hoverHeight}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={hoverHeight}
                                        onChange={(e) => setHoverHeight(parseFloat(parseFloat(e.target.value).toFixed(1)))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Interactive Drag & Draw Preview */}
                        <div className="flex justify-between items-center text-[10px] mt-1">
                            <span className="font-bold text-gray-600">Layout Preview</span>
                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 animate-pulse">
                                Click and Drag on preview to draw screen!
                            </span>
                        </div>

                        <div 
                            ref={previewRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="relative w-full aspect-video bg-neutral-900 rounded-xl overflow-hidden cursor-crosshair select-none border border-gray-200 shadow-sm"
                        >
                            <img 
                                src="/virtual-events-assets/meeting-room-bg.png" 
                                alt="Meeting Room"
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                            />
                            {/* Draggable/Drawn Screen Overlay */}
                            <div 
                                className="absolute bg-red-500/40 border-2 border-red-500 flex items-center justify-center pointer-events-none rounded transition-shadow shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                style={{
                                    top: `${layoutTop}%`,
                                    left: `${layoutLeft}%`,
                                    width: `${layoutWidth}%`,
                                    height: `${layoutHeight}%`
                                }}
                            >
                                <span className="text-[10px] font-bold text-red-100 bg-red-600/80 px-2 py-1 rounded shadow select-none text-center">
                                    VIDEO ({layoutWidth}% × {layoutHeight}%)
                                </span>
                            </div>
                            
                            <div 
                                className="absolute bg-yellow-500/40 border-2 border-yellow-500 pointer-events-none rounded transition-shadow shadow-[0_0_10px_rgba(234,179,8,0.5)] transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    top: `${hoverTop}%`,
                                    left: `${hoverLeft}%`,
                                    width: `${hoverWidth}%`,
                                    height: `${hoverHeight}%`
                                }}
                            >
                            </div>
                        </div>
                    </div>

                    {status && (
                        <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${status.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                            <FiCheckCircle className="flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {editMode === 'layout' ? (
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                                editingMeeting
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-[#295ce8] hover:bg-blue-700'
                            }`}
                        >
                            <FiSave />
                            <span>{editingMeeting ? 'Update Meeting' : 'Save Meeting Settings'}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSaveHover}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FiSave />
                            <span>Save Global Join Button Position</span>
                        </button>
                    )}
                </form>

                {/* List Meetings */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-700">Existing Meeting Codes</h3>
                    {meetings.length === 0 ? (
                        <p className="text-xs text-gray-450 italic bg-gray-50 p-4 rounded-xl text-center border border-gray-100">No meeting codes configured yet.</p>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                            {meetings.map((m) => (
                                <div key={m._id} className={`bg-[#f8fafc] p-4 rounded-xl border flex justify-between items-start shadow-sm transition-all hover:border-gray-300 ${
                                        editingMeeting?._id === m._id ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : 'border-gray-150'
                                    }`}>
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-blue-100 text-[#295ce8] font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-blue-200">
                                                {m.code}
                                            </span>
                                            {m.topic && (
                                                <span className="text-xs font-bold text-gray-750 truncate">
                                                    {m.topic}
                                                </span>
                                            )}
                                        </div>
                                        {m.isCustom ? (
                                            <span className="inline-block text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold border border-green-150 mt-1">
                                                In-App WebRTC Video Call Room
                                            </span>
                                        ) : (
                                            <a 
                                                href={m.zoomLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[11px] text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 mt-1.5 break-all font-semibold"
                                            >
                                                {m.zoomLink} <FiExternalLink className="shrink-0 w-3 h-3" />
                                            </a>
                                        )}
                                        {m.hostEmail && (
                                            <div className="mt-1.5 flex items-center gap-1">
                                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                                                    🔑 Host: {m.hostEmail}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(m)}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                editingMeeting?._id === m._id
                                                    ? 'text-blue-600 bg-blue-100'
                                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                            title="Edit Meeting"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m._id)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                            title="Delete Code"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMeetingRoom;
