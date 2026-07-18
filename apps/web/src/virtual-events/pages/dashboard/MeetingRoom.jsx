import React, { useState, useEffect } from 'react';
import { meetingService, configService } from '../../services/api';
import { FiVideo, FiX, FiAlertCircle } from 'react-icons/fi';
import VideoCallRoom from '../../components/meeting/VideoCallRoom';
import VideoPreview from '../../components/meeting/VideoPreview';

const isEmbeddable = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('zoom.us') && !lower.includes('/wc/')) return false;
    if (lower.includes('meet.google.com')) return false;
    if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return false;
    if (lower.includes('webex.com')) return false;
    return true;
};

const MeetingRoom = () => {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [code, setCode] = useState('');
    const [activeMeetingUrl, setActiveMeetingUrl] = useState('');
    const [meetingTopic, setMeetingTopic] = useState('');
    const [isCustomMeeting, setIsCustomMeeting] = useState(false);
    const [activeMeetingCode, setActiveMeetingCode] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [initialMuted, setInitialMuted] = useState(false);
    const [initialVideoOff, setInitialVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Layout dynamic positions
    const [layoutTop, setLayoutTop] = useState('10.5%');
    const [layoutLeft, setLayoutLeft] = useState('18%');
    const [layoutWidth, setLayoutWidth] = useState('64%');
    const [layoutHeight, setLayoutHeight] = useState('41.2%');
    
    // Custom confirm dialog for leaving page
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, targetUrl: '' });

    // Hover dynamic positions for JOIN MEETING overlay
    const [hoverTop, setHoverTop] = useState(70);
    const [hoverLeft, setHoverLeft] = useState(50);
    const [hoverWidth, setHoverWidth] = useState(13);
    const [hoverHeight, setHoverHeight] = useState(6);

    useEffect(() => {
        const handleAnchorClick = (e) => {
            const target = e.target.closest('a');
            if (target && target.href && (isCustomMeeting || activeMeetingUrl || showPreview)) {
                // Allow reopening link in new tab
                if (target.target === '_blank') return;
                
                e.preventDefault();
                e.stopPropagation();
                
                setConfirmDialog({
                    isOpen: true,
                    targetUrl: target.href
                });
            }
        };
        
        document.addEventListener('click', handleAnchorClick, { capture: true });
        return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
    }, [isCustomMeeting, activeMeetingUrl, showPreview]);

    useEffect(() => {
        const fetchHoverConfig = async () => {
            try {
                const res = await configService.getConfig('meeting_hover_area');
                if (res.data && res.data.value) {
                    const config = JSON.parse(res.data.value);
                    setHoverTop(config.top !== undefined ? config.top : 70);
                    setHoverLeft(config.left !== undefined ? config.left : 50);
                    setHoverWidth(config.width !== undefined ? config.width : 13);
                    setHoverHeight(config.height !== undefined ? config.height : 6);
                }
            } catch (e) {
                console.error('Failed to load hover config', e);
            }
        };
        fetchHoverConfig();
    }, []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoinClick = () => {
        setError('');
        setCode('');
        setShowJoinModal(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError('');
        try {
            const response = await meetingService.join(code.trim());
            const data = response.data;
            if (data) {
                // Apply dynamic layout coordinates if available
                setLayoutTop(data.layoutTop !== undefined ? `${data.layoutTop}%` : '10.5%');
                setLayoutLeft(data.layoutLeft !== undefined ? `${data.layoutLeft}%` : '18%');
                setLayoutWidth(data.layoutWidth !== undefined ? `${data.layoutWidth}%` : '64%');
                setLayoutHeight(data.layoutHeight !== undefined ? `${data.layoutHeight}%` : '41.2%');

                if (data.isCustom) {
                    setActiveMeetingCode(code.trim().toUpperCase());
                    setMeetingTopic(data.topic || ' Meeting');
                    setShowJoinModal(false);
                    setShowPreview(true);
                } else if (data.zoomLink) {
                    const url = data.zoomLink;
                    setActiveMeetingUrl(url);
                    setMeetingTopic(data.topic || 'Zoom Meeting');
                    setShowJoinModal(false);

                    // If it is not embeddable, automatically open in a new tab
                    if (!isEmbeddable(url)) {
                        window.open(url, '_blank');
                    }
                } else {
                    setError('Invalid meeting response.');
                }
            } else {
                setError('Invalid meeting response.');
            }
        } catch (err) {
            console.error('Failed to join meeting', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Invalid meeting code.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        setActiveMeetingUrl('');
        setMeetingTopic('');
        setIsCustomMeeting(false);
        setShowPreview(false);
        setActiveMeetingCode('');
        setInitialMuted(false);
        setInitialVideoOff(false);
    };

    const handlePreviewJoin = (muted, videoOff) => {
        setInitialMuted(muted);
        setInitialVideoOff(videoOff);
        setShowPreview(false);
        setIsCustomMeeting(true);
    };

    const handlePreviewCancel = () => {
        setShowPreview(false);
        setActiveMeetingCode('');
        setMeetingTopic('');
    };

    return (
        <div className="absolute inset-0 w-full h-full animate-fade-in bg-black overflow-hidden flex items-center justify-center">
            {/* 16:9 Container that scales to cover screen while preserving aspect ratio exactly */}
            <div className="absolute min-w-full min-h-full pointer-events-none" style={{ aspectRatio: '16/9' }}>
                {/* Background Image perfectly filling the 16:9 container */}
                <img
                    src="/virtual-events-assets/meeting-room-bg.png"
                    alt="Meeting Room"
                    className="absolute inset-0 w-full h-full object-fill z-0"
                />

                {/* Interactive Layer mathematically matching the 16:9 image bounds perfectly */}
                <div className="absolute inset-0 z-10 pointer-events-none">

                    {/* Embedded IFrame Screen / Custom Video Call (over the black wall screen) */}
                    {(activeMeetingUrl || isCustomMeeting || showPreview) ? (
                        <div
                            className="absolute z-20 bg-black pointer-events-auto rounded-xl shadow-2xl overflow-hidden border border-neutral-800/40"
                            style={{
                                top: layoutTop,
                                left: isChatOpen ? `calc(${layoutLeft} - 6%)` : layoutLeft,
                                width: layoutWidth,
                                height: layoutHeight
                            }}
                        >
                            {showPreview ? (
                                <VideoPreview onJoin={handlePreviewJoin} onCancel={handlePreviewCancel} />
                            ) : isCustomMeeting ? (
                                <VideoCallRoom code={activeMeetingCode} onLeave={handleDisconnect} initialIsMuted={initialMuted} initialIsVideoOff={initialVideoOff} onChatToggle={setIsChatOpen} />
                            ) : isEmbeddable(activeMeetingUrl) ? (
                                <iframe
                                    src={activeMeetingUrl}
                                    title={meetingTopic}
                                    className="w-full h-full border-0"
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white bg-neutral-900/90 backdrop-blur">
                                    <FiVideo className="w-8 h-8 text-blue-500 mb-2.5 animate-pulse" />
                                    <h4 className="font-bold text-xs mb-1 truncate max-w-[90%]">{meetingTopic}</h4>
                                    <p className="text-[9px] text-neutral-450 max-w-[220px] mb-3 leading-relaxed">
                                        This meeting platform forbids embedding. Opened in a new tab.
                                    </p>
                                    <a
                                        href={activeMeetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] transition-colors pointer-events-auto shadow-md"
                                    >
                                        Reopen Meeting
                                    </a>
                                </div>
                            )}

                            {/* Topic Banner / Status */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1.5 rounded text-[10px] font-bold text-white flex items-center gap-2 border border-white/25 backdrop-blur-sm z-30">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                <span>{meetingTopic.replace(/webrtc/gi, '').trim()}</span>
                            </div>

                            {/* Disconnect button overlay - only show for zoom/iframe calls as Custom Video Call has its own controls */}
                            {(!isCustomMeeting && !showPreview) && (
                                <button
                                    onClick={handleDisconnect}
                                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-550 text-white font-bold px-2.5 py-1 rounded text-[10px] shadow-lg transition-all cursor-pointer z-30"
                                >
                                    Leave
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Standard "JOIN MEETING" Overlay Button */
                        /* Placed precisely over the "JOIN MEETING" graphic on the table */
                        <button
                            onClick={handleJoinClick}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-transparent hover:bg-white/10 rounded-lg transition-all group flex items-center justify-center pointer-events-auto"
                            style={{ 
                                top: `${hoverTop}%`, 
                                left: `${hoverLeft}%`, 
                                width: `${hoverWidth}%`, 
                                height: `${hoverHeight}%` 
                            }}
                            title="Click to Join Meeting"
                        >
                            {/* Glowing border effect on hover to indicate it's clickable */}
                            <span className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-500/70 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] rounded-lg transition-all" />
                        </button>
                    )}
                </div>
            </div>



            {/* Join Code Modal Dialog */}
            {showJoinModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in pointer-events-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 p-6 w-full max-w-sm flex flex-col gap-4 relative animate-slide-up mx-4">
                        {/* Close button */}
                        <button
                            onClick={() => setShowJoinModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <FiX className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-[#295ce8] border border-blue-100">
                                <FiVideo className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Enter Meeting Code</h3>
                                <p className="text-xs text-gray-500">Provide the code to join the room meeting</p>
                            </div>
                        </div>

                        <form onSubmit={handleModalSubmit} className="flex flex-col gap-3 mt-1">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter meeting code..."
                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400 font-mono text-center uppercase tracking-wider"
                                autoFocus
                                required
                            />

                            {error && (
                                <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-150 px-3 py-2 rounded-lg font-medium">
                                    <FiAlertCircle className="shrink-0 w-3.5 h-3.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-xs mt-1 shadow-md"
                            >
                                {loading ? 'Verifying...' : 'Join Meeting'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Custom Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1C1C1E] border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">Leave Page?</h3>
                        <p className="text-neutral-400 text-sm mb-6">You are currently in a meeting. Are you sure you want to leave this page?</p>
                        <div className="flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setConfirmDialog({ isOpen: false, targetUrl: '' })} 
                                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    window.location.href = confirmDialog.targetUrl;
                                }} 
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg cursor-pointer active:scale-95 bg-red-600 hover:bg-red-500 hover:shadow-red-900/50"
                            >
                                Leave Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom;
