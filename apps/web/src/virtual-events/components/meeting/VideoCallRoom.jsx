import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import {
    FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiUsers, FiAlertCircle, FiTv,
    FiShield, FiMessageSquare, FiCircle, FiSmile, FiType, FiMonitor, FiX, FiSend,
    FiLock, FiUnlock, FiGlobe, FiMoreVertical, FiSearch, FiChevronUp, FiChevronDown,
    FiGrid
} from 'react-icons/fi';
import { FaHandPaper } from 'react-icons/fa';

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Free TURN servers for NAT traversal on live/cloud deployments
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    }
];

// Prevent rapid camera state changes from leaving the local WebRTC sender and
// the status seen by remote participants out of sync.
const VIDEO_TOGGLE_COOLDOWN_MS = 1500;

const TRANSLATION_LANGUAGES = [
    { value: 'en', code: 'en-US', langCode: 'en', label: 'English' },
    { value: 'hi', code: 'hi-IN', langCode: 'hi', label: 'Hindi' },
    { value: 'mr', code: 'mr-IN', langCode: 'mr', label: 'Marathi' },
    { value: 'ta', code: 'ta-IN', langCode: 'ta', label: 'Tamil' },
    { value: 'es', code: 'es-ES', langCode: 'es', label: 'Spanish' },
    { value: 'fr', code: 'fr-FR', langCode: 'fr', label: 'French' },
    { value: 'de', code: 'de-DE', langCode: 'de', label: 'German' },
    { value: 'ja', code: 'ja-JP', langCode: 'ja', label: 'Japanese' },
    { value: 'zh', code: 'zh-CN', langCode: 'zh', label: 'Chinese' }
];

const BACKGROUND_CATEGORIES = [
    {
        id: 'professional',
        title: 'Professional',
        items: [
            { id: 'prof_bookshelf', name: 'Classic Bookshelf', url: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_office_1', name: 'Bright Minimalist Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_plants', name: 'Sunlit Plant Corner', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_warm_wood', name: 'Warm Wood Panels', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_office_window', name: 'City Skyline View', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_cozy_lounge', name: 'Green Lounge', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_study_lounge', name: 'Library Study', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=640&auto=format&fit=crop' },
            { id: 'prof_classroom', name: 'Modern Classroom', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=640&auto=format&fit=crop' }
        ]
    },
    {
        id: 'cozy_home',
        title: 'Cozy home',
        items: [
            { id: 'cozy_neon', name: 'Purple Neon Desk', url: 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=640&auto=format&fit=crop' },
            { id: 'cozy_living', name: 'Warm Living Room', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=640&auto=format&fit=crop' },
            { id: 'cozy_cabin', name: 'Snowy Cabin View', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=640&auto=format&fit=crop' },
            { id: 'cozy_patio', name: 'Lantern-Lit Patio', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=640&auto=format&fit=crop' },
            { id: 'cozy_window_seat', name: 'Rainy Window Seat', url: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?q=80&w=640&auto=format&fit=crop' }
        ]
    },
    {
        id: 'nature',
        title: 'Nature',
        items: [
            { id: 'nature_forest', name: 'Misty Pine Trees', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=640&auto=format&fit=crop' },
            { id: 'nature_beach', name: 'Sunny Tropical Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=640&auto=format&fit=crop' },
            { id: 'nature_lake', name: 'Mountain Lake Reflection', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=640&auto=format&fit=crop' },
            { id: 'nature_greenhouse', name: 'Lush Sunlit Greenhouse', url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=640&auto=format&fit=crop' },
            { id: 'nature_zen', name: 'Zen Bamboo Garden', url: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?q=80&w=640&auto=format&fit=crop' },
            { id: 'nature_camper', name: 'Camper Van by Ocean', url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=640&auto=format&fit=crop' }
        ]
    },
    {
        id: 'stylized',
        title: 'Stylized',
        items: [
            { id: 'style_anime_classroom', name: 'Anime Classroom View', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=640&auto=format&fit=crop' },
            { id: 'style_cyberpunk', name: 'Cyberpunk Neon Alley', url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=640&auto=format&fit=crop' },
            { id: 'style_eiffel', name: 'Eiffel Tower Balcony', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=640&auto=format&fit=crop' },
            { id: 'style_arcade', name: 'Retro Arcade Room', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=640&auto=format&fit=crop' }
        ]
    },
    {
        id: 'fantasy',
        title: 'Fantasy',
        items: [
            { id: 'fant_cockpit', name: 'Starship Cockpit', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=640&auto=format&fit=crop' },
            { id: 'fant_underwater', name: 'Sunken Atlantis Ruins', url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=640&auto=format&fit=crop' },
            { id: 'fant_castle', name: 'Misty Fairy-tale Castle', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=640&auto=format&fit=crop' },
            { id: 'fant_mystic', name: 'Enchanted Forest Path', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=640&auto=format&fit=crop' }
        ]
    }
];


// --- Audio processing helpers for Gemini Live API ---

// Downsample from browser native rate (44.1/48kHz) to 16kHz using weighted averaging
function downsampleTo16k(input, inputSampleRate) {
    const targetRate = 16000;
    if (inputSampleRate === targetRate) return new Float32Array(input);

    const ratio = inputSampleRate / targetRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const start = i * ratio;
        const end = Math.min(input.length, (i + 1) * ratio);

        let sum = 0;
        let weight = 0;

        for (let j = Math.floor(start); j < Math.ceil(end); j++) {
            const sampleStart = Math.max(start, j);
            const sampleEnd = Math.min(end, j + 1);
            const sampleWeight = Math.max(0, sampleEnd - sampleStart);

            sum += (input[j] || 0) * sampleWeight;
            weight += sampleWeight;
        }

        output[i] = weight > 0 ? sum / weight : 0;
    }

    return output;
}

// Convert Float32 audio samples (-1..1) to little-endian PCM16 ArrayBuffer
function pcm16FromFloat32(samples) {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < samples.length; i++) {
        const clamped = Math.max(-1, Math.min(1, samples[i]));
        const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
        view.setInt16(i * 2, value, true); // true = little-endian
    }

    return buffer;
}

// VAD constants
const FRAME_SAMPLES = 1600;       // 100ms at 16kHz
const RMS_THRESHOLD = 0.006;
const PEAK_THRESHOLD = 0.035;
const PREROLL_FRAMES = 3;          // 300ms buffer before speech
const HANGOVER_FRAMES = 8;         // 800ms after speech ends
const KEEPALIVE_INTERVAL = 10;     // Send silence every 10 quiet frames (~1s)

const isOnlyEmojis = (text) => {
    if (!text || !text.trim()) return false;
    const cleanStr = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\s]/gu, '');
    return cleanStr.length === 0;
};

const loadSelfieSegmentation = () => {
    return new Promise((resolve, reject) => {
        if (window.SelfieSegmentation) {
            resolve(window.SelfieSegmentation);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            if (window.SelfieSegmentation) {
                resolve(window.SelfieSegmentation);
            } else {
                reject(new Error('SelfieSegmentation not found on window object'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load SelfieSegmentation script'));
        document.head.appendChild(script);
    });
};

const getColorFilter = (filterType) => {
    switch (filterType) {
        case 'grayscale':
            return 'grayscale(100%)';
        case 'sepia':
            return 'sepia(100%)';
        case 'warm':
            return 'saturate(130%) sepia(20%) brightness(105%) contrast(100%)';
        case 'cool':
            return 'saturate(95%) hue-rotate(15deg) brightness(105%)';
        case 'vintage':
            return 'sepia(50%) contrast(85%) brightness(95%) saturate(85%)';
        case 'neon':
            return 'hue-rotate(90deg) saturate(220%) contrast(110%)';
        case 'invert':
            return 'invert(100%)';
        default:
            return 'none';
    }
};

const VideoCallRoom = ({ code, onLeave, initialIsMuted = false, initialIsVideoOff = false, onChatToggle }) => {
    const { user } = useAuth();
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [isMuted, setIsMuted] = useState(initialIsMuted);
    const [isVideoOff, setIsVideoOff] = useState(initialIsVideoOff);
    const [isVideoToggleCoolingDown, setIsVideoToggleCoolingDown] = useState(false);
    const [error, setError] = useState('');
    const [isLocalAdmin, setIsLocalAdmin] = useState(false);
    const [debugLog, setDebugLog] = useState([]);
    const [screenSharer, setScreenSharer] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [raisedHands, setRaisedHands] = useState(new Set());
    const [localSocketId, setLocalSocketId] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isMicLocked, setIsMicLocked] = useState(false);
    const [isVideoLocked, setIsVideoLocked] = useState(false);
    const [roomLocks, setRoomLocks] = useState({ mic: false, video: false, chat: false, raiseHand: false, reaction: false, shareScreen: false });
    const [showLockMenu, setShowLockMenu] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [streamReady, setStreamReady] = useState(false);
    // Authoritative participant count from the server (prevents desync)
    const [serverParticipantCount, setServerParticipantCount] = useState(1);
    const [joinRequests, setJoinRequests] = useState([]);
    const [handNotifications, setHandNotifications] = useState([]);
    const [globalReactions, setGlobalReactions] = useState([]);
    const [captions, setCaptions] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDestructive: false, isAlert: false });
    const [listenLanguage, setListenLanguage] = useState('off');
    const [isTranslationActive, setIsTranslationActive] = useState(false);
    const [translationError, setTranslationError] = useState('');
    const [translationDemandActive, setTranslationDemandActive] = useState(false);


    // Participant Sidebar enhancements
    const [searchQuery, setSearchQuery] = useState('');
    const [isContributorsOpen, setIsContributorsOpen] = useState(true);
    const [activePinMenu, setActivePinMenu] = useState(null);
    const [pinnedUser, setPinnedUser] = useState(null);
    const [isPinnedByHost, setIsPinnedByHost] = useState(false);
    const [layoutSettled, setLayoutSettled] = useState(true);

    useEffect(() => {
        setLayoutSettled(false);
        const timer = setTimeout(() => {
            setLayoutSettled(true);
            // Rebuild streams from live receivers on every layout switch
            // (screen share start/stop or pin change can cause stale stream references)
            setRemoteUsers(prev => prev.map(user => {
                const entry = peerConnectionsRef.current.get(user.socketId);
                if (!entry) return user;
                const videoReceiver = entry.pc.getReceivers().find(r => r.track?.kind === 'video' && r.track.readyState === 'live');
                if (!videoReceiver) return user;
                const existingStream = user.stream;
                if (existingStream && existingStream.getVideoTracks().some(t => t.readyState === 'live')) {
                    return user; // still alive
                }
                const audioReceiver = entry.pc.getReceivers().find(r => r.track?.kind === 'audio' && r.track.readyState === 'live');
                const freshStream = new MediaStream(audioReceiver ? [videoReceiver.track, audioReceiver.track] : [videoReceiver.track]);
                return { ...user, stream: freshStream };
            }));
        }, 400);
        return () => clearTimeout(timer);
    }, [screenSharer, pinnedUser]);

    // Background Blur states and refs
    const [isBlurActive, setIsBlurActive] = useState(false);
    const [blurError, setBlurError] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const filterCanvasRef = useRef(null);
    const filterVideoRef = useRef(null);
    const segmentationRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const blurredTrackRef = useRef(null);

    // Enhanced Background Effects states and refs
    const [showEffects, setShowEffects] = useState(false);
    const [bgEffect, setBgEffect] = useState('none'); // 'none', 'blur-light', 'blur-heavy', 'image'
    const [selectedBgUrl, setSelectedBgUrl] = useState('');
    const bgImageRef = useRef(null);
    const bgEffectRef = useRef('none');

    useEffect(() => {
        bgEffectRef.current = bgEffect;
    }, [bgEffect]);

    const [videoFilter, setVideoFilter] = useState('none'); // 'none', 'grayscale', 'sepia', 'warm', 'cool', 'vintage', 'neon', 'invert'
    const videoFilterRef = useRef('none');
    const [activeTab, setActiveTab] = useState('backgrounds'); // 'backgrounds' | 'filters'

    useEffect(() => {
        videoFilterRef.current = videoFilter;
    }, [videoFilter]);


    const [showLangMenu, setShowLangMenu] = useState(false);
    const [translateInput, setTranslateInput] = useState('');
    const recognitionRef = useRef(null);
    // Use a ref for state access inside socket listener
    const listenLangRef = useRef(listenLanguage);
    const translationActiveRef = useRef(isTranslationActive);

    useEffect(() => { listenLangRef.current = listenLanguage; }, [listenLanguage]);
    useEffect(() => { translationActiveRef.current = isTranslationActive; }, [isTranslationActive]);



    const showSidebar = showChat || showParticipants || showEffects;
    const showChatRef = useRef(showChat);

    useEffect(() => {
        showChatRef.current = showChat;
        if (showChat) {
            setUnreadChatCount(0);
        }
    }, [showChat]);

    useEffect(() => {
        if (onChatToggle) onChatToggle(showSidebar);
    }, [showSidebar, onChatToggle]);

    const containerRef = useRef(null);
    const [chatRect, setChatRect] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (showChat) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat]);

    useEffect(() => {
        if (handNotifications.length > 0) {
            const timer = setTimeout(() => {
                setHandNotifications(prev => prev.slice(1));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [handNotifications]);

    useEffect(() => {
        if (globalReactions.length > 0) {
            const timer = setTimeout(() => {
                setGlobalReactions(prev => prev.slice(1));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [globalReactions]);

    useEffect(() => {
        if (captions) {
            const timer = setTimeout(() => {
                setCaptions('');
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [captions]);

    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    // Keep one MediaStream per peer. Browser-provided `event.streams[0]` is not
    // guaranteed to contain every track when audio and video arrive separately.
    // A stable stream ensures the persistent audio element receives late audio
    // tracks instead of being left attached to a video-only stream.
    const remoteMediaStreamsRef = useRef(new Map());
    const localStreamRef = useRef(null);
    const videoToggleLockedRef = useRef(false);
    const videoToggleCooldownTimerRef = useRef(null);
    const iceCandidateQueue = useRef(new Map());
    const socketRef = useRef(null);

    // Speaking indicator for local user's bottom control bar
    const isSpeakingLocal = useSpeakingDetection(isMuted ? null : (streamReady ? localStreamRef.current : null));
    const screenStreamRef = useRef(null);
    const screenPeerConnectionsRef = useRef(new Map());
    const screenIceCandidateQueue = useRef(new Map());
    const [remoteScreenStream, setRemoteScreenStream] = useState(null);
    const playbackContextRef = useRef(null);
    const remoteAudioContextRef = useRef(null);
    const remoteAudioNodesRef = useRef(new Map());
    const nextStartTimeRef = useRef(0);
    const setMainVideoNode = useCallback((node) => {
        localVideoRef.current = node;
        if (node && localStreamRef.current) {
            const targetStream = (isBlurActive && blurredTrackRef.current)
                ? new MediaStream([blurredTrackRef.current, ...localStreamRef.current.getAudioTracks()])
                : localStreamRef.current;
            if (node.srcObject !== targetStream) {
                node.srcObject = targetStream;
                if (targetStream) {
                    node.play().catch(e => console.error("Error playing main local video:", e));
                }
            }
        }
    }, [isBlurActive]);

    const setScreenVideoNode = useCallback((node) => {
        localVideoRef.current = node;
        if (node && screenStreamRef.current && node.srcObject !== screenStreamRef.current) {
            node.srcObject = screenStreamRef.current;
            node.play().catch(e => console.error("Error playing screen video:", e));
        }
    }, []);

    const setPipVideoNode = useCallback((node) => {
        if (node && localStreamRef.current) {
            const targetStream = (isBlurActive && blurredTrackRef.current)
                ? new MediaStream([blurredTrackRef.current, ...localStreamRef.current.getAudioTracks()])
                : localStreamRef.current;
            if (node.srcObject !== targetStream) {
                node.srcObject = targetStream;
                if (targetStream) {
                    node.play().catch(e => console.error("Error playing pip local video:", e));
                }
            }
        }
    }, [isBlurActive]);

    // Media initialization is asynchronous. Rebind after it completes so a
    // participant joining an already-active room cannot be left with a mounted
    // local <video> element that was created before its stream was available.
    useEffect(() => {
        const videoNode = localVideoRef.current;
        const localStream = localStreamRef.current;
        if (!streamReady || !videoNode || !localStream || isScreenSharing) return;

        const targetStream = (isBlurActive && blurredTrackRef.current)
            ? new MediaStream([blurredTrackRef.current, ...localStream.getAudioTracks()])
            : localStream;

        if (videoNode.srcObject !== targetStream) {
            videoNode.srcObject = targetStream;
        }
        videoNode.play().catch(error => {
            console.error('Error restoring local camera preview:', error);
        });
    }, [streamReady, isBlurActive, isVideoOff, isScreenSharing]);

    const userName = user ? (user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest') : 'Guest';
    const userId = user ? (user._id || user.id) : `guest-${Date.now()}`;
    const userEmail = user ? (user.email || '') : '';
    const roomCode = code ? code.trim().toUpperCase() : '';

    // Use AudioContext to capture raw PCM audio, downsample to 16kHz, and apply VAD
    const recordContextRef = useRef(null);
    const processorRef = useRef(null);
    const sourceNodeRef = useRef(null);

    useEffect(() => {
        if (!translationDemandActive || isMuted || !streamReady || !localStreamRef.current) {
            if (recordContextRef.current) {
                try { recordContextRef.current.close(); } catch (e) { }
                recordContextRef.current = null;
            }
            return;
        }

        const stream = localStreamRef.current;
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        // VAD state
        let pendingSamples = new Float32Array(0);
        let preRollBuffer = [];  // circular buffer of last N frames
        let hangoverCount = 0;
        let isSpeaking = false;
        let silenceFrameCount = 0;

        // Helper: send one 1600-sample frame as base64 PCM16
        const sendFrame = (frame16k) => {
            const pcmBuffer = pcm16FromFloat32(frame16k);
            const bytes = new Uint8Array(pcmBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            if (socketRef.current) {
                socketRef.current.emit('video:broadcast-audio-chunk', {
                    roomCode,
                    pcmBase64: base64
                });
            }
        };

        // Helper: check if a frame passes VAD
        const framePassesVAD = (frame) => {
            let sumSq = 0;
            let peak = 0;
            for (let i = 0; i < frame.length; i++) {
                const abs = Math.abs(frame[i]);
                sumSq += frame[i] * frame[i];
                if (abs > peak) peak = abs;
            }
            const rms = Math.sqrt(sumSq / frame.length);
            return rms > RMS_THRESHOLD || peak > PEAK_THRESHOLD;
        };

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            // Use native sample rate — we downsample ourselves
            recordContextRef.current = new AudioCtx();
            const ctx = recordContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(e => console.error("[AudioContext] Error resuming record context:", e));
            }
            const nativeSampleRate = ctx.sampleRate;


            sourceNodeRef.current = ctx.createMediaStreamSource(stream);
            // 4096 is a good buffer size for ScriptProcessor
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);

            sourceNodeRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);

            processorRef.current.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);

                // Downsample to 16kHz
                const downsampled = downsampleTo16k(inputData, nativeSampleRate);

                // Accumulate into pending buffer
                const merged = new Float32Array(pendingSamples.length + downsampled.length);
                merged.set(pendingSamples);
                merged.set(downsampled, pendingSamples.length);
                pendingSamples = merged;

                // Extract 1600-sample frames (100ms each)
                while (pendingSamples.length >= FRAME_SAMPLES) {
                    const frame = pendingSamples.slice(0, FRAME_SAMPLES);
                    pendingSamples = pendingSamples.slice(FRAME_SAMPLES);

                    const hasVoice = framePassesVAD(frame);

                    if (hasVoice) {
                        // If just started speaking, flush pre-roll first
                        if (!isSpeaking) {
                            for (const prFrame of preRollBuffer) {
                                sendFrame(prFrame);
                            }
                            preRollBuffer = [];
                        }
                        isSpeaking = true;
                        hangoverCount = HANGOVER_FRAMES;
                        silenceFrameCount = 0;
                        sendFrame(frame);
                    } else if (isSpeaking) {
                        // Still in hangover — keep sending
                        hangoverCount--;
                        sendFrame(frame);
                        if (hangoverCount <= 0) {
                            isSpeaking = false;
                        }
                    } else {
                        // Silence: maintain pre-roll buffer
                        preRollBuffer.push(frame);
                        if (preRollBuffer.length > PREROLL_FRAMES) {
                            preRollBuffer.shift();
                        }
                        // Keepalive: send a silence frame periodically
                        silenceFrameCount++;
                        if (silenceFrameCount >= KEEPALIVE_INTERVAL) {
                            sendFrame(frame);
                            silenceFrameCount = 0;
                        }
                    }
                }
            };
        } catch (err) {
            console.error("Error setting up PCM recording:", err);
        }

        return () => {
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
            if (recordContextRef.current) {
                try { recordContextRef.current.close(); } catch (e) { }
                recordContextRef.current = null;
            }
        };
    }, [translationDemandActive, isMuted, streamReady, roomCode]);


    const log = useCallback((msg) => {
        console.log(`[VideoCall] ${msg}`);
        setDebugLog(prev => [...prev.slice(-7), msg]);
    }, []);

    const ensureRemoteAudioContext = useCallback(() => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        let ctx = remoteAudioContextRef.current;
        if (!ctx || ctx.state === 'closed') {
            ctx = new AudioCtx();
            remoteAudioContextRef.current = ctx;
            ctx.onstatechange = () => log(`Remote audio context: ${ctx.state}`);
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(err => console.error('Unable to resume remote audio:', err));
        }
        return ctx;
    }, [log]);

    const disconnectRemoteAudio = useCallback((remoteSocketId) => {
        const node = remoteAudioNodesRef.current.get(remoteSocketId);
        if (!node) return;
        try { node.source.disconnect(); } catch (e) { }
        try { node.gain.disconnect(); } catch (e) { }
        remoteAudioNodesRef.current.delete(remoteSocketId);
    }, []);

    const connectRemoteAudioTrack = useCallback((remoteSocketId, track) => {
        if (!track || track.kind !== 'audio' || track.readyState !== 'live') return;
        const ctx = ensureRemoteAudioContext();
        const existing = remoteAudioNodesRef.current.get(remoteSocketId);
        if (existing?.trackId === track.id) {
            existing.gain.gain.setValueAtTime(listenLangRef.current === 'off' ? 1 : 0, ctx.currentTime);
            return;
        }

        disconnectRemoteAudio(remoteSocketId);
        const stream = new MediaStream([track]);
        const source = ctx.createMediaStreamSource(stream);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(listenLangRef.current === 'off' ? 1 : 0, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);
        remoteAudioNodesRef.current.set(remoteSocketId, { stream, source, gain, trackId: track.id });

        const resume = () => {
            if (ctx.state === 'suspended') ctx.resume().catch(() => { });
        };
        track.addEventListener('unmute', resume);
        track.addEventListener('ended', () => {
            const current = remoteAudioNodesRef.current.get(remoteSocketId);
            if (current?.trackId === track.id) disconnectRemoteAudio(remoteSocketId);
        }, { once: true });
        resume();
        log(`Remote audio connected for ${remoteSocketId}`);
    }, [disconnectRemoteAudio, ensureRemoteAudioContext, log]);


    useEffect(() => {
        const resumeRemoteAudio = () => {
            const ctx = remoteAudioContextRef.current;
            if (ctx?.state === 'suspended') ctx.resume().catch(() => { });
        };
        window.addEventListener('pointerdown', resumeRemoteAudio);
        window.addEventListener('keydown', resumeRemoteAudio);
        const watchdog = setInterval(resumeRemoteAudio, 2000);
        return () => {
            window.removeEventListener('pointerdown', resumeRemoteAudio);
            window.removeEventListener('keydown', resumeRemoteAudio);
            clearInterval(watchdog);
        };
    }, []);

    const createPeerConnection = useCallback((remoteSocketId, remoteName, stream, isInitiator) => {
        if (peerConnectionsRef.current.has(remoteSocketId)) {
            log(`PC already exists for ${remoteName}`);
            return peerConnectionsRef.current.get(remoteSocketId).pc;
        }
        log(`Creating PC: ${remoteName} (init=${isInitiator})`);
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionsRef.current.set(remoteSocketId, { pc, name: remoteName, isInitiator });

        if (stream) {
            stream.getTracks().forEach(t => pc.addTrack(t, stream));
        }

        pc.ontrack = (e) => {
            log(`Track from ${remoteName}: kind=${e.track.kind}`);
            let rs = remoteMediaStreamsRef.current.get(remoteSocketId);
            if (!rs) {
                rs = new MediaStream();
                remoteMediaStreamsRef.current.set(remoteSocketId, rs);
            }
            if (!rs.getTracks().some(track => track.id === e.track.id)) {
                rs.addTrack(e.track);
            }
            if (e.track.kind === 'audio') {
                connectRemoteAudioTrack(remoteSocketId, e.track);
                let muteRecoveryTimer = null;
                const clearMuteRecovery = () => {
                    if (muteRecoveryTimer) clearTimeout(muteRecoveryTimer);
                    muteRecoveryTimer = null;
                };
                e.track.addEventListener('mute', () => {
                    clearMuteRecovery();
                    muteRecoveryTimer = setTimeout(() => {
                        if (e.track.muted && pc.connectionState === 'connected') {
                            log(`Remote audio stalled for ${remoteName}; restarting ICE`);
                            recoverDisconnectedConnection();
                        }
                    }, 2500);
                });
                e.track.addEventListener('unmute', clearMuteRecovery);
                e.track.addEventListener('ended', clearMuteRecovery, { once: true });
            }

            e.track.addEventListener('ended', () => {
                if (rs.getTracks().some(track => track.id === e.track.id)) {
                    rs.removeTrack(e.track);
                }
            });
            setRemoteUsers(prev => {
                const ex = prev.find(u => u.socketId === remoteSocketId);
                if (ex) {
                    return prev.map(u => u.socketId === remoteSocketId ? { ...u, stream: rs } : u);
                }
                // User entry doesn't exist yet (race condition) — create a placeholder
                return [...prev, { socketId: remoteSocketId, userName: remoteName, stream: rs, isMuted: false, isVideoOff: false }];
            });
        };

        pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current) {
                socketRef.current.emit('video:send-signal', {
                    targetSocketId: remoteSocketId,
                    signalData: { candidate: e.candidate }
                });
            }
        };

        let disconnectedRecoveryTimer = null;
        const recoverDisconnectedConnection = async () => {
            if (!socketRef.current || pc.connectionState === 'closed') return;
            if (!isInitiator) {
                socketRef.current.emit('video:send-signal', {
                    targetSocketId: remoteSocketId,
                    signalData: { requestIceRestart: true }
                });
                return;
            }
            if (pc.signalingState !== 'stable') {
                log(`ICE recovery deferred for ${remoteName}: ${pc.signalingState}`);
                return;
            }
            try {
                log(`Recovering disconnected connection for ${remoteName}`);
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                socketRef.current.emit('video:send-signal', {
                    targetSocketId: remoteSocketId,
                    signalData: { sdp: pc.localDescription }
                });
            } catch (err) {
                console.error('Delayed ICE recovery failed:', err);
            }
        };

        pc.onconnectionstatechange = () => {
            log(`State ${remoteName}: ${pc.connectionState}`);
            if (pc.connectionState !== 'disconnected' && disconnectedRecoveryTimer) {
                clearTimeout(disconnectedRecoveryTimer);
                disconnectedRecoveryTimer = null;
            }
            if (pc.connectionState === 'failed') {
                recoverDisconnectedConnection();
            } else if (pc.connectionState === 'disconnected') {
                if (disconnectedRecoveryTimer) clearTimeout(disconnectedRecoveryTimer);
                disconnectedRecoveryTimer = setTimeout(() => {
                    disconnectedRecoveryTimer = null;
                    if (pc.connectionState === 'disconnected') {
                        recoverDisconnectedConnection();
                    }
                }, 4000);
            } else if (pc.connectionState === 'closed') {
                peerConnectionsRef.current.delete(remoteSocketId);
            }
        };

        pc.oniceconnectionstatechange = () => {
            log(`ICE ${remoteName}: ${pc.iceConnectionState}`);
        };

        if (isInitiator) {
            (async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    log(`Offer sent to ${remoteName}`);
                    socketRef.current.emit('video:send-signal', {
                        targetSocketId: remoteSocketId,
                        signalData: { sdp: pc.localDescription }
                    });
                } catch (err) { console.error('Offer error', err); }
            })();
        }
        return pc;
    }, [connectRemoteAudioTrack, log]);

    const createScreenPeerConnection = useCallback((remoteSocketId, isInitiator) => {
        if (screenPeerConnectionsRef.current.has(remoteSocketId)) {
            log(`Screen PC already exists for ${remoteSocketId}`);
            return screenPeerConnectionsRef.current.get(remoteSocketId).pc;
        }
        log(`Creating Screen PC for ${remoteSocketId} (init=${isInitiator})`);
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        screenPeerConnectionsRef.current.set(remoteSocketId, { pc });

        if (isInitiator && screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => pc.addTrack(t, screenStreamRef.current));
        }

        pc.ontrack = (e) => {
            log(`Screen Track from ${remoteSocketId}: kind=${e.track.kind}`);
            setRemoteScreenStream(prevStream => {
                if (prevStream) {
                    if (!prevStream.getTracks().some(t => t.id === e.track.id)) {
                        prevStream.addTrack(e.track);
                    }
                    return new MediaStream(prevStream.getTracks());
                } else {
                    return e.streams[0] || new MediaStream([e.track]);
                }
            });
        };


        pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current) {
                socketRef.current.emit('video:send-signal', {
                    targetSocketId: remoteSocketId,
                    signalData: { candidate: e.candidate, isScreenShare: true }
                });
            }
        };

        pc.onconnectionstatechange = () => {
            log(`Screen PC State for ${remoteSocketId}: ${pc.connectionState}`);
            if (pc.connectionState === 'failed') {
                log(`Screen PC failed for ${remoteSocketId}, closing`);
                pc.close();
                screenPeerConnectionsRef.current.delete(remoteSocketId);
            } else if (pc.connectionState === 'closed') {
                screenPeerConnectionsRef.current.delete(remoteSocketId);
            }
        };

        if (isInitiator) {
            (async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    log(`Screen Offer sent to ${remoteSocketId}`);
                    socketRef.current.emit('video:send-signal', {
                        targetSocketId: remoteSocketId,
                        signalData: { sdp: pc.localDescription, isScreenShare: true }
                    });
                } catch (err) { console.error('Screen Offer error', err); }
            })();
        }
        return pc;
    }, [log]);

    const handleSignal = useCallback(async ({ senderSocketId, signalData }) => {
        if (signalData.requestIceRestart) {
            log(`ICE restart requested by ${senderSocketId}`);
            let entry = peerConnectionsRef.current.get(senderSocketId);
            if (entry && entry.isInitiator) {
                try {
                    const offer = await entry.pc.createOffer({ iceRestart: true });
                    await entry.pc.setLocalDescription(offer);
                    socketRef.current?.emit('video:send-signal', {
                        targetSocketId: senderSocketId,
                        signalData: { sdp: entry.pc.localDescription }
                    });
                } catch (e) {
                    console.error("ICE restart offer failed:", e);
                }
            }
            return;
        }

        if (signalData.isScreenShare) {
            let pc = screenPeerConnectionsRef.current.get(senderSocketId)?.pc;
            if (!pc) {
                pc = createScreenPeerConnection(senderSocketId, false);
            }
            try {
                if (signalData.sdp) {
                    const desc = new RTCSessionDescription(signalData.sdp);
                    await pc.setRemoteDescription(desc);
                    log(`Screen Remote desc set (${desc.type}) from ${senderSocketId}`);
                    const queue = screenIceCandidateQueue.current.get(senderSocketId) || [];
                    for (const c of queue) {
                        try {
                            await pc.addIceCandidate(c);
                        } catch (e) {
                            console.error("Error adding queued screen ICE candidate:", e);
                        }
                    }
                    screenIceCandidateQueue.current.delete(senderSocketId);
                    if (queue.length) log(`Drained ${queue.length} Screen ICE`);
                    if (desc.type === 'offer') {
                        const ans = await pc.createAnswer();
                        await pc.setLocalDescription(ans);
                        log(`Screen Answer sent to ${senderSocketId}`);
                        socketRef.current.emit('video:send-signal', {
                            targetSocketId: senderSocketId,
                            signalData: { sdp: pc.localDescription, isScreenShare: true }
                        });
                    }
                } else if (signalData.candidate) {
                    const c = new RTCIceCandidate(signalData.candidate);
                    if (pc.remoteDescription?.type) {
                        await pc.addIceCandidate(c);
                    } else {
                        const q = screenIceCandidateQueue.current.get(senderSocketId) || [];
                        q.push(c);
                        screenIceCandidateQueue.current.set(senderSocketId, q);
                        log(`Screen ICE queued from ${senderSocketId}`);
                    }
                }
            } catch (err) { console.error('Screen Signal error', err); }
            return;
        }

        const stream = localStreamRef.current;
        let entry = peerConnectionsRef.current.get(senderSocketId);
        if (!entry) {
            const pc = createPeerConnection(senderSocketId, 'Participant', stream, false);
            entry = { pc, name: 'Participant' };
        }
        const { pc } = entry;
        try {
            if (signalData.sdp) {
                const desc = new RTCSessionDescription(signalData.sdp);
                await pc.setRemoteDescription(desc);
                log(`Remote desc set (${desc.type}) from ${senderSocketId}`);
                const queue = iceCandidateQueue.current.get(senderSocketId) || [];
                for (const c of queue) {
                    try {
                        await pc.addIceCandidate(c);
                    } catch (e) {
                        console.error("Error adding queued primary ICE candidate:", e);
                    }
                }
                iceCandidateQueue.current.delete(senderSocketId);
                if (queue.length) log(`Drained ${queue.length} ICE`);
                if (desc.type === 'offer') {
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    log(`Answer sent to ${senderSocketId}`);
                    socketRef.current.emit('video:send-signal', {
                        targetSocketId: senderSocketId,
                        signalData: { sdp: pc.localDescription }
                    });
                }
            } else if (signalData.candidate) {
                const c = new RTCIceCandidate(signalData.candidate);
                if (pc.remoteDescription?.type) {
                    await pc.addIceCandidate(c);
                } else {
                    const q = iceCandidateQueue.current.get(senderSocketId) || [];
                    q.push(c);
                    iceCandidateQueue.current.set(senderSocketId, q);
                    log(`ICE queued from ${senderSocketId}`);
                }
            }
        } catch (err) { console.error('Signal error', err); }
    }, [createPeerConnection, createScreenPeerConnection, log]);

    useEffect(() => {
        if (!showSidebar) return;

        let animationFrameId;
        const startTime = Date.now();

        const updateRect = () => {
            if (containerRef.current) {
                setChatRect(containerRef.current.getBoundingClientRect());
            }
            // Continue tracking for 1 second to perfectly sync with the 500ms CSS slide animation
            if (Date.now() - startTime < 1000) {
                animationFrameId = requestAnimationFrame(updateRect);
            }
        };

        updateRect();

        const handleResize = () => {
            if (containerRef.current) {
                setChatRect(containerRef.current.getBoundingClientRect());
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [showSidebar]);


    useEffect(() => {
        if (!roomCode) return;
        let destroyed = false;
        let syncInterval = null;

        const run = async () => {
            let stream = null;
            let cameraFailed = false;
            let audioFailed = false;
            try {
                if (navigator.mediaDevices?.getUserMedia) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
                            audio: true
                        });
                    } catch (e1) {
                        log('Video+Audio failed, trying Audio only');
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                            if (!destroyed) setIsVideoOff(true);
                        } catch (e2) {
                            log('Audio only failed, joining as observer');
                            if (!destroyed) {
                                setIsVideoOff(true);
                                setIsMuted(true);
                            }
                        }
                    }
                } else {
                    throw new Error('HTTPS required for camera/mic access');
                }
            } catch (err) {
                log(`Camera access failed, trying audio only: ${err.message}`);
                cameraFailed = true;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (err2) {
                    log(`Audio access failed, falling back to empty stream: ${err2.message}`);
                    audioFailed = true;
                    stream = new MediaStream();
                }
            }

            if (destroyed) {
                if (stream) stream.getTracks().forEach(t => t.stop());
                return;
            }

            if (cameraFailed) setIsVideoOff(true);
            if (audioFailed) setIsMuted(true);

            localStreamRef.current = stream;
            setStreamReady(true);

            // Apply initial muted/video off states
            if (initialIsMuted && stream) {
                stream.getAudioTracks().forEach(t => { t.enabled = false; });
            }
            if (initialIsVideoOff && stream) {
                stream.getVideoTracks().forEach(t => { t.enabled = false; });
            }

            // Derive the join status from the media that was actually acquired.
            // React state updates above are asynchronous and may still contain
            // the preview defaults when the socket join request is emitted.
            const joiningIsMuted = !stream?.getAudioTracks().some(
                track => track.readyState === 'live' && track.enabled
            );
            const joiningIsVideoOff = !stream?.getVideoTracks().some(
                track => track.readyState === 'live' && track.enabled
            );
            setIsMuted(joiningIsMuted);
            setIsVideoOff(joiningIsVideoOff);

            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            const BACKEND = import.meta.env.VITE_API_URL || window.location.origin;
            const sock = io(BACKEND, { transports: ['websocket', 'polling'] });
            socketRef.current = sock;

            const updateSocketId = () => {
                setLocalSocketId(sock.id || '');
            };

            if (sock.connected) {
                updateSocketId();
            }

            sock.on('connect', () => {
                if (destroyed) return;
                log(`Connected: ${sock.id}`);
                updateSocketId();

                sock.on('connect_error', e => log(`Conn error: ${e.message}`));
            });

            sock.on('disconnect', () => {
                log(`Disconnected from socket`);
                updateSocketId();
                setScreenSharer(null);
                setPinnedUser(null);
                setIsPinnedByHost(false);
                setTranslationDemandActive(false);
            });

            sock.on('video:room-joined', ({ isAdmin, roomLocks: initialLocks }) => {
                setIsLocalAdmin(isAdmin);
                if (initialLocks) {
                    setRoomLocks(initialLocks);

                    // Apply locks to the actual media tracks before all-users is
                    // processed and peer connections begin publishing media.
                    if (!isAdmin && initialLocks.mic) {
                        stream?.getAudioTracks().forEach(track => {
                            track.enabled = false;
                        });
                        setIsMuted(true);
                    }
                    if (!isAdmin && initialLocks.video) {
                        stream?.getVideoTracks().forEach(track => {
                            track.enabled = false;
                        });
                        setIsVideoOff(true);
                    }
                }
                updateSocketId();
            });

            sock.on('video:translation-demand', ({ active }) => {
                setTranslationDemandActive(Boolean(active));
            });

            sock.on('video:all-users', (users) => {
                log(`Existing users: ${users.length}`);
                setRemoteUsers(previousUsers => {
                    const previousBySocketId = new Map(
                        previousUsers.map(previousUser => [previousUser.socketId, previousUser])
                    );

                    return users.map(u => {
                        const previousUser = previousBySocketId.get(u.socketId);
                        const existingStream = previousUser?.stream
                            || remoteMediaStreamsRef.current.get(u.socketId)
                            || null;

                        return {
                            ...previousUser,
                            socketId: u.socketId,
                            userName: u.userName,
                            // Participant sync must never discard an already-received
                            // stream. Existing peer connections will not fire ontrack
                            // again merely because the participant list was refreshed.
                            stream: existingStream,
                            isMuted: u.isMuted,
                            isVideoOff: u.isVideoOff,
                            isAdmin: u.isAdmin,
                            isMicLocked: u.isMicLocked,
                            isVideoLocked: u.isVideoLocked
                        };
                    });
                });

                setRaisedHands(prev => {
                    const next = new Set(prev);
                    users.forEach(u => {
                        if (u.isHandRaised) next.add(u.socketId);
                    });
                    return next;
                });

                users.forEach(u => createPeerConnection(u.socketId, u.userName, stream, true));
            });

            sock.on('video:user-joined', ({ socketId, userName: n, isMuted: m, isVideoOff: v, isAdmin: a, isHandRaised, isMicLocked, isVideoLocked }) => {
                log(`Joined: ${n} (${socketId})`);
                setRemoteUsers(prev => {
                    const ex = prev.find(u => u.socketId === socketId);
                    if (ex) return prev.map(u => u.socketId === socketId ? { ...u, userName: n, isMuted: m, isVideoOff: v, isAdmin: a, isMicLocked, isVideoLocked } : u);
                    return [...prev, { socketId, userName: n, stream: null, isMuted: m, isVideoOff: v, isAdmin: a, isMicLocked, isVideoLocked }];
                });

                if (isHandRaised) {
                    setRaisedHands(prev => {
                        const next = new Set(prev);
                        next.add(socketId);
                        return next;
                    });
                }

                createPeerConnection(socketId, n, stream, false);

                // If we are currently screen sharing, initiate screen peer connection to the new user
                if (screenStreamRef.current) {
                    createScreenPeerConnection(socketId, true);
                }
            });

            sock.on('video:user-left', ({ socketId }) => {
                log(`User left: ${socketId}`);
                if (peerConnectionsRef.current.has(socketId)) {
                    peerConnectionsRef.current.get(socketId).pc.close();
                    peerConnectionsRef.current.delete(socketId);
                }
                if (screenPeerConnectionsRef.current.has(socketId)) {
                    screenPeerConnectionsRef.current.get(socketId).pc.close();
                    screenPeerConnectionsRef.current.delete(socketId);
                }
                remoteMediaStreamsRef.current.delete(socketId);
                disconnectRemoteAudio(socketId);
                screenIceCandidateQueue.current.delete(socketId);
                setRemoteUsers(prev => prev.filter(u => u.socketId !== socketId));
                setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
                setScreenSharer(current => {
                    if (current === socketId) {
                        setRemoteScreenStream(null);
                        return null;
                    }
                    return current;
                });
                setPinnedUser(prev => prev === socketId ? null : prev);
            });

            sock.on('video:signal-received', handleSignal);

            sock.on('video:force-mute', () => {
                if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
                setIsMuted(true);
            });

            sock.on('video:force-video-off', () => {
                if (localStreamRef.current) localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false; });
                setIsVideoOff(true);
            });

            sock.on('video:room-locks-updated', ({ locks }) => {
                setRoomLocks(locks);
            });

            sock.on('video:locks-updated', ({ socketId, isMicLocked: newMicLock, isVideoLocked: newVidLock }) => {
                if (socketId === sock.id) {
                    if (newMicLock !== undefined) setIsMicLocked(newMicLock);
                    if (newVidLock !== undefined) setIsVideoLocked(newVidLock);
                }
                setRemoteUsers(prev => prev.map(u => {
                    if (u.socketId === socketId) {
                        return {
                            ...u,
                            isMicLocked: newMicLock !== undefined ? newMicLock : u.isMicLocked,
                            isVideoLocked: newVidLock !== undefined ? newVidLock : u.isVideoLocked
                        };
                    }
                    return u;
                }));
            });

            sock.on('video:kicked', () => {
                if (onLeave) onLeave();
            });

            sock.on('video:meeting-ended', () => {
                if (onLeave) onLeave();
            });

            sock.on('video:screen-share-started', ({ socketId }) => {
                log(`Screen share started by: ${socketId}`);
                setScreenSharer(socketId);
            });

            sock.on('video:screen-share-stopped', ({ socketId }) => {
                log(`Screen share stopped by: ${socketId}`);
                setScreenSharer(current => {
                    if (current === socketId) {
                        setRemoteScreenStream(null);
                        return null;
                    }
                    return current;
                });
                if (screenPeerConnectionsRef.current.has(socketId)) {
                    screenPeerConnectionsRef.current.get(socketId).pc.close();
                    screenPeerConnectionsRef.current.delete(socketId);
                }
                screenIceCandidateQueue.current.delete(socketId);
            });

            sock.on('video:screen-share-rejected', ({ message }) => {
                log(`Screen share rejected: ${message}`);
                setError(message);
                setTimeout(() => setError(''), 3000);
            });

            sock.on('video:status-updated', ({ socketId, isMuted: m, isVideoOff: v }) => {
                setRemoteUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, isMuted: m, isVideoOff: v } : u));
            });

            sock.on('video:pinned-user-updated', ({ socketId }) => {
                if (!socketId) {
                    setPinnedUser(null);
                    setIsPinnedByHost(false);
                } else {
                    setIsPinnedByHost(true);
                    if (socketId === sock.id) {
                        setPinnedUser('local');
                    } else {
                        setPinnedUser(socketId);
                    }
                }
            });

            sock.on('video:receive-reaction', ({ socketId, emoji }) => {
                if (socketId === sock.id) return;
                setGlobalReactions(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    emoji,
                    offsetX: Math.random() * 60 - 30
                }]);
            });

            sock.on('video:hand-toggled', ({ socketId, userName: raiserName, isRaised }) => {
                setRaisedHands(prev => {
                    const next = new Set(prev);
                    if (isRaised) next.add(socketId);
                    else next.delete(socketId);
                    return next;
                });

                if (isRaised && raiserName) {
                    setHandNotifications(prev => {
                        const filtered = prev.filter(n => n.userName !== raiserName);
                        return [...filtered, { id: Date.now(), socketId, userName: raiserName }];
                    });
                } else if (!isRaised) {
                    setHandNotifications(prev => prev.filter(n => n.socketId !== socketId && n.userName !== raiserName));
                }
            });

            sock.on('video:receive-chat', ({ socketId, userName: senderName, message, timestamp }) => {
                setChatMessages(prev => [...prev, {
                    socketId,
                    userName: senderName,
                    text: message,
                    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                if (!showChatRef.current) {
                    setUnreadChatCount(prev => prev + 1);
                }
            });

            sock.on('video:waiting-for-host', () => {
                setIsWaiting(true);
            });

            sock.on('video:request-accepted', () => {
                setIsWaiting(false);
            });

            sock.on('video:request-denied', () => {
                setConfirmDialog({
                    isOpen: true,
                    title: "Request Denied",
                    message: "The Host denied your request to join.",
                    isAlert: true,
                    onConfirm: () => {
                        if (onLeave) onLeave();
                    }
                });
            });

            sock.on('video:request-cancelled', ({ socketId }) => {
                setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
            });

            sock.on('video:join-request', ({ socketId, userName: reqUserName }) => {
                setJoinRequests(prev => {
                    const ex = prev.find(r => r.socketId === socketId);
                    if (ex) return prev;
                    return [...prev, { socketId, userName: reqUserName }];
                });
            });

            sock.on('video:receive-live-audio', async ({ audioData }) => {
                if (!translationActiveRef.current) return;
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (!playbackContextRef.current) {
                        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
                    }
                    const ctx = playbackContextRef.current;
                    if (ctx.state === 'suspended') await ctx.resume();

                    const binary = atob(audioData);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const int16 = new Int16Array(bytes.buffer);

                    const float32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) {
                        float32[i] = int16[i] / 32768.0;
                    }

                    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
                    audioBuffer.getChannelData(0).set(float32);

                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);

                    // If nextStartTime has drifted more than 500ms into future, reset it.
                    // This prevents audio going silent after pauses/gaps/silence frames.
                    const MAX_LOOKAHEAD_SECS = 0.5;
                    if (nextStartTimeRef.current > ctx.currentTime + MAX_LOOKAHEAD_SECS) {
                        nextStartTimeRef.current = ctx.currentTime + 0.02;
                    }

                    // Schedule with 20ms padding to avoid gaps
                    const startAt = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
                    source.start(startAt);
                    nextStartTimeRef.current = startAt + audioBuffer.duration;

                } catch (err) {
                    console.error('Audio playback error:', err);
                }
            });

            sock.on('connect_error', e => log(`Conn error: ${e.message}`));

            sock.on('video:translation-error', ({ error }) => {
                console.error("[Translation Error]:", error);
                setTranslationError(error);
                setIsTranslationActive(false);
                setListenLanguage('off');
            });


            log(`Requesting to join room: ${roomCode}`);
            sock.emit('video:request-join', {
                roomCode,
                userId,
                userName,
                userEmail,
                isMuted: joiningIsMuted,
                isVideoOff: joiningIsVideoOff
            });

            // Listen to server-authoritative participant count
            sock.on('video:participant-count', ({ count }) => {
                setServerParticipantCount(count);
            });

            // Periodically request a sync to keep count accurate
            syncInterval = setInterval(() => {
                if (sock.connected) {
                    sock.emit('video:request-sync', { roomCode });
                }
            }, 30000);

            if (listenLangRef.current && listenLangRef.current !== 'off') {
                const lang = TRANSLATION_LANGUAGES.find(l => l.value === listenLangRef.current);
                sock.emit('video:enable-translation', {
                    languageCode: lang?.langCode || 'hi',
                    roomCode,
                    listenLanguageName: lang?.label || 'Hindi'
                });
            }
        };

        run();

        return () => {
            destroyed = true;
            if (syncInterval) clearInterval(syncInterval);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (blurredTrackRef.current) {
                blurredTrackRef.current.stop();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            peerConnectionsRef.current.forEach(({ pc }) => pc.close());
            peerConnectionsRef.current.clear();
            remoteMediaStreamsRef.current.clear();
            remoteAudioNodesRef.current.forEach((_, socketId) => disconnectRemoteAudio(socketId));
            if (remoteAudioContextRef.current) {
                try { remoteAudioContextRef.current.close(); } catch (e) { }
                remoteAudioContextRef.current = null;
            }
            iceCandidateQueue.current.clear();
            screenPeerConnectionsRef.current.forEach(({ pc }) => pc.close());
            screenPeerConnectionsRef.current.clear();
            screenIceCandidateQueue.current.clear();
            if (socketRef.current) {
                socketRef.current.emit('video:leave-room', { roomCode });
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomCode]); // eslint-disable-line

    useEffect(() => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('video:update-status', { roomCode, isMuted, isVideoOff });
        }
    }, [isMuted, isVideoOff, roomCode]);

    useEffect(() => {
        // Reset the playback scheduler when translation changes language or is toggled.
        const remoteAudioCtx = remoteAudioContextRef.current;
        const normalAudioGain = listenLanguage === 'off' ? 1 : 0;
        if (remoteAudioCtx && remoteAudioCtx.state !== 'closed') {
            remoteAudioNodesRef.current.forEach(({ gain }) => {
                gain.gain.setValueAtTime(normalAudioGain, remoteAudioCtx.currentTime);
            });
        }

        // Without this, nextStartTimeRef from a previous session causes audio to be
        // scheduled far in the future, appearing silent.
        nextStartTimeRef.current = 0;
        if (playbackContextRef.current) {
            try { playbackContextRef.current.close(); } catch (e) {}
            playbackContextRef.current = null;
        }

        if (socketRef.current && socketRef.current.connected) {
            if (listenLanguage !== 'off') {
                const lang = TRANSLATION_LANGUAGES.find(l => l.value === listenLanguage);
                socketRef.current.emit('video:enable-translation', {
                    languageCode: lang?.langCode || 'hi',
                    roomCode,
                    listenLanguageName: lang?.label || 'Hindi'
                });
            } else {
                socketRef.current.emit('video:disable-translation');
            }
        }
    }, [listenLanguage]);

    const isMicDisabled = isMicLocked || (!isLocalAdmin && roomLocks.mic);
    const isVideoDisabled = isVideoLocked || (!isLocalAdmin && roomLocks.video);
    const isChatDisabled = !isLocalAdmin && roomLocks.chat;
    const isHandDisabled = !isLocalAdmin && roomLocks.raiseHand;
    const isReactionDisabled = !isLocalAdmin && roomLocks.reaction;
    const isShareDisabled = !isLocalAdmin && roomLocks.shareScreen;

    const toggleMute = () => {
        if (isMicDisabled) return;
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsMuted(m => !m);
    };
    const toggleVideo = async () => {
        if (isVideoDisabled || videoToggleLockedRef.current) return;

        const videoTracks = localStreamRef.current?.getVideoTracks() || [];
        if (videoTracks.length === 0) return;

        videoToggleLockedRef.current = true;
        setIsVideoToggleCoolingDown(true);

        const nextIsVideoOff = !isVideoOff;
        try {
            const rawVideoTrack = videoTracks.find(track => track.readyState === 'live');
            const filteredVideoTrack = blurredTrackRef.current?.readyState === 'live'
                ? blurredTrackRef.current
                : null;
            const outboundVideoTrack = isBlurActive && filteredVideoTrack
                ? filteredVideoTrack
                : rawVideoTrack;

            if (!nextIsVideoOff && !outboundVideoTrack) {
                throw new Error('No live camera track is available');
            }

            // `track.enabled` updates the local preview, but it is not always
            // enough to wake a stalled WebRTC sender after video is resumed.
            // Pause and restore every sender explicitly so remote receivers get
            // a live source again instead of remaining on a black frame.
            videoTracks.forEach(track => {
                track.enabled = !nextIsVideoOff;
            });
            if (filteredVideoTrack) {
                filteredVideoTrack.enabled = !nextIsVideoOff;
            }

            const senderUpdates = [];
            peerConnectionsRef.current.forEach(({ pc }) => {
                if (pc.connectionState === 'closed') return;

                const videoSender = pc.getSenders().find(sender => sender.track?.kind === 'video')
                    || pc.getTransceivers().find(transceiver => transceiver.receiver?.track?.kind === 'video')?.sender;

                if (videoSender) {
                    senderUpdates.push(videoSender.replaceTrack(nextIsVideoOff ? null : outboundVideoTrack));
                }
            });

            const senderResults = await Promise.allSettled(senderUpdates);
            senderResults.forEach(result => {
                if (result.status === 'rejected') {
                    console.error('Failed to update one remote video sender:', result.reason);
                }
            });
            setIsVideoOff(nextIsVideoOff);
        } catch (err) {
            console.error('Failed to toggle camera for remote participants:', err);
            setError('Could not update the camera feed. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            if (videoToggleCooldownTimerRef.current) {
                clearTimeout(videoToggleCooldownTimerRef.current);
            }
            videoToggleCooldownTimerRef.current = setTimeout(() => {
                videoToggleLockedRef.current = false;
                setIsVideoToggleCoolingDown(false);
                videoToggleCooldownTimerRef.current = null;
            }, VIDEO_TOGGLE_COOLDOWN_MS);
        }
    };

    useEffect(() => () => {
        if (videoToggleCooldownTimerRef.current) {
            clearTimeout(videoToggleCooldownTimerRef.current);
        }
    }, []);

    const startScreenShare = async () => {
        if (isShareDisabled) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            screenStreamRef.current = stream;
            const screenTrack = stream.getVideoTracks()[0];

            // Create separate screen peer connections to all remote users
            peerConnectionsRef.current.forEach(({ name }, remoteSocketId) => {
                createScreenPeerConnection(remoteSocketId, true);
            });

            socketRef.current?.emit('video:start-screen-share', { roomCode });
            setIsScreenSharing(true);
            setScreenSharer(socketRef.current?.id || localSocketId);

            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error('Screen share error', err);
        }
    };

    const stopScreenShare = async () => {
        try {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }

            // Close and clear all screen peer connections
            screenPeerConnectionsRef.current.forEach(({ pc }) => {
                try {
                    pc.close();
                } catch (e) {
                    console.error('Error closing screen PC:', e);
                }
            });
            screenPeerConnectionsRef.current.clear();
            screenIceCandidateQueue.current.clear();
            setRemoteScreenStream(null);
        } catch (err) {
            console.error('Error in screen share cleanup:', err);
        }

        // ALWAYS restart local camera track to re-acquire webcam hardware from OS
        if (localStreamRef.current) {
            try {
                // Stop old camera track
                localStreamRef.current.getVideoTracks().forEach(t => t.stop());

                const freshStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
                    audio: false
                });
                const freshTrack = freshStream.getVideoTracks()[0];

                peerConnectionsRef.current.forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(freshTrack).catch(e => console.error("Error replacing track:", e));
                });

                const audioTracks = localStreamRef.current.getAudioTracks();
                localStreamRef.current = new MediaStream([freshTrack, ...audioTracks]);
            } catch (e) {
                console.error("Failed to restart camera on stop screen share:", e);
            }
        }

        // Re-enable tracks based on state
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !isVideoOff; });
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
        }

        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }

        socketRef.current?.emit('video:stop-screen-share', { roomCode });
        socketRef.current?.emit('video:update-status', { roomCode, isMuted, isVideoOff });
        setIsScreenSharing(false);
        setScreenSharer(null);

        // Rebuild remoteUsers stream from live peer connections after screen share ends
        // This is needed because the grid was hidden during screen share and streams may be stale
        setTimeout(() => {
            setRemoteUsers(prev => prev.map(user => {
                const entry = peerConnectionsRef.current.get(user.socketId);
                if (!entry) return user;
                const receiver = entry.pc.getReceivers().find(r => r.track?.kind === 'video' && r.track.readyState === 'live');
                if (!receiver) return user;
                const existingStream = user.stream;
                if (existingStream && existingStream.getVideoTracks().some(t => t.readyState === 'live')) {
                    return user; // stream is still alive, no need to rebuild
                }
                // Build a fresh stream from live receivers
                const videoTrack = receiver.track;
                const audioReceiver = entry.pc.getReceivers().find(r => r.track?.kind === 'audio' && r.track.readyState === 'live');
                const freshStream = new MediaStream(audioReceiver ? [videoTrack, audioReceiver.track] : [videoTrack]);
                return { ...user, stream: freshStream };
            }));
        }, 400);
    };

    const handleScreenShareClick = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    const onSegmentationResults = useCallback((results) => {
        if (!filterCanvasRef.current) return;
        const canvas = filterCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!results || !results.image || !results.segmentationMask) {
                ctx.restore();
                return;
            }

            const colorFilterStr = getColorFilter(videoFilterRef.current);

            // If background effect is 'none' but a video filter is active, just draw full frame with color filter
            if (bgEffectRef.current === 'none') {
                ctx.filter = colorFilterStr;
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                return;
            }

            // 1. Draw the segmentation mask
            ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

            // 2. Draw original video frame but only inside the mask (foreground / person)
            ctx.globalCompositeOperation = 'source-in';
            ctx.filter = colorFilterStr;
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // 3. Draw background effect behind the person
            ctx.globalCompositeOperation = 'destination-over';
            if (bgEffectRef.current === 'blur-light') {
                ctx.filter = `blur(4px) ${colorFilterStr === 'none' ? '' : colorFilterStr}`;
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            } else if (bgEffectRef.current === 'blur-heavy') {
                ctx.filter = `blur(15px) ${colorFilterStr === 'none' ? '' : colorFilterStr}`;
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            } else if (bgEffectRef.current === 'image' && bgImageRef.current) {
                ctx.filter = colorFilterStr;
                ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback
                ctx.filter = colorFilterStr;
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            }

            ctx.restore();
        } catch (err) {
            console.error("Error rendering blurred frame:", err);
            try {
                ctx.restore();
            } catch (e) { }
        }
    }, []);

    const handleSelectEffect = async (effectType, effectUrl) => {
        if (!streamReady || !localStreamRef.current) return;

        // Clean up previous custom blob URL if any
        if (selectedBgUrl && selectedBgUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(selectedBgUrl); } catch (e) { }
        }

        if (effectType === 'none') {
            setBgEffect('none');
            setSelectedBgUrl('');

            // Only stop the segmentation loop if NO video filter is active either
            if (videoFilterRef.current === 'none') {
                setIsBlurActive(false);
                setBlurError(null);
                if (animationFrameIdRef.current) {
                    cancelAnimationFrame(animationFrameIdRef.current);
                    animationFrameIdRef.current = null;
                }
                if (blurredTrackRef.current) {
                    blurredTrackRef.current.stop();
                    blurredTrackRef.current = null;
                }
                if (filterVideoRef.current) {
                    filterVideoRef.current.srcObject = null;
                    filterVideoRef.current = null;
                }

                // Restore raw track to peer connections
                const rawTrack = localStreamRef.current.getVideoTracks()[0];
                if (rawTrack) {
                    peerConnectionsRef.current.forEach(({ pc }) => {
                        try {
                            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                            if (sender) {
                                sender.replaceTrack(rawTrack);
                            }
                        } catch (e) {
                            console.error("Error restoring raw track on peer:", e);
                        }
                    });
                }
            }
        } else {
            // If switching to an image effect, load the image first
            if (effectType === 'image' && effectUrl) {
                setIsModelLoading(true);
                setBlurError(null);
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = effectUrl;
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            bgImageRef.current = img;
                            resolve();
                        };
                        img.onerror = (e) => {
                            reject(new Error("Image failed to load (check CORS/network)"));
                        };
                    });
                } catch (e) {
                    setIsModelLoading(false);
                    setBlurError("Failed to load background image.");
                    return; // abort activation if background image fails
                }
            }

            setBgEffect(effectType);
            setSelectedBgUrl(effectUrl || '');

            // If the segmentation loop is already active, we just update the states (no need to re-init)
            if (isBlurActive) {
                setBlurError(null);
                setIsModelLoading(false);
                return;
            }

            setIsModelLoading(true);
            setBlurError(null);
            try {
                const SelfieSegmentationClass = await loadSelfieSegmentation();

                if (!segmentationRef.current) {
                    const seg = new SelfieSegmentationClass({
                        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`
                    });
                    seg.setOptions({ modelSelection: 1 });
                    segmentationRef.current = seg;
                }

                const rawTrack = localStreamRef.current.getVideoTracks()[0];
                if (!rawTrack) {
                    setBlurError("Please turn on your camera first.");
                    setIsBlurActive(false);
                    return;
                }
                const settings = rawTrack.getSettings();
                const width = settings?.width || 640;
                const height = settings?.height || 480;

                if (!filterCanvasRef.current) {
                    filterCanvasRef.current = document.createElement('canvas');
                }
                filterCanvasRef.current.width = width;
                filterCanvasRef.current.height = height;

                const initialCtx = filterCanvasRef.current.getContext('2d');
                if (initialCtx) {
                    initialCtx.fillStyle = '#000000';
                    initialCtx.fillRect(0, 0, width, height);
                }

                if (!filterVideoRef.current) {
                    filterVideoRef.current = document.createElement('video');
                    filterVideoRef.current.autoplay = true;
                    filterVideoRef.current.playsInline = true;
                    filterVideoRef.current.muted = true;
                }

                filterVideoRef.current.srcObject = localStreamRef.current;
                await new Promise(resolve => {
                    if (filterVideoRef.current.readyState >= 2) resolve();
                    else filterVideoRef.current.onloadeddata = resolve;
                });
                await filterVideoRef.current.play();

                let hasReceivedResults = false;
                segmentationRef.current.onResults((results) => {
                    hasReceivedResults = true;
                    setIsModelLoading(false);
                    setBlurError(null);
                    onSegmentationResults(results);
                });

                // Start processing loop
                const process = async () => {
                    if (!filterVideoRef.current) return;

                    if (filterVideoRef.current.readyState >= 2) {
                        let success = false;
                        try {
                            await segmentationRef.current.send({ image: filterVideoRef.current });
                            success = true;
                        } catch (e) {
                            console.error('Error sending frame to segmentation:', e);
                            setBlurError(`Send error: ${e.message || String(e)}`);
                        }

                        if (!success || !hasReceivedResults) {
                            const canvas = filterCanvasRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    try {
                                        ctx.save();
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        ctx.drawImage(filterVideoRef.current, 0, 0, canvas.width, canvas.height);
                                        ctx.restore();
                                    } catch (err) { }
                                }
                            }
                        }
                    }
                    animationFrameIdRef.current = requestAnimationFrame(process);
                };
                process();

                const canvasStream = filterCanvasRef.current.captureStream(30);
                const filteredTrack = canvasStream.getVideoTracks()[0];
                blurredTrackRef.current = filteredTrack;

                peerConnectionsRef.current.forEach(({ pc }) => {
                    try {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(filteredTrack);
                        }
                    } catch (e) {
                        console.error("Error replacing track on peer:", e);
                    }
                });

                setIsBlurActive(true);

                setTimeout(() => {
                    if (!hasReceivedResults && filterVideoRef.current) {
                        setBlurError("Load timeout. Check internet/CORS.");
                    }
                }, 8000);
            } catch (err) {
                console.error('Failed to start background blur:', err);
                setBlurError(`Init error: ${err.message || String(err)}`);
                setIsBlurActive(false);
            }
        }
    };

    const handleSelectFilter = async (filterType) => {
        if (!streamReady || !localStreamRef.current) return;

        setVideoFilter(filterType);
        setBlurError(null);

        const willBeActive = bgEffectRef.current !== 'none' || filterType !== 'none';

        if (!willBeActive) {
            setIsBlurActive(false);
            setBlurError(null);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            if (blurredTrackRef.current) {
                blurredTrackRef.current.stop();
                blurredTrackRef.current = null;
            }
            if (filterVideoRef.current) {
                filterVideoRef.current.srcObject = null;
                filterVideoRef.current = null;
            }

            // Restore raw track to peer connections
            const rawTrack = localStreamRef.current.getVideoTracks()[0];
            if (rawTrack) {
                peerConnectionsRef.current.forEach(({ pc }) => {
                    try {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(rawTrack);
                        }
                    } catch (e) {
                        console.error("Error restoring raw track on peer:", e);
                    }
                });
            }
        } else {
            if (isBlurActive) {
                return;
            }

            setIsModelLoading(true);
            setBlurError(null);
            try {
                const SelfieSegmentationClass = await loadSelfieSegmentation();

                if (!segmentationRef.current) {
                    const seg = new SelfieSegmentationClass({
                        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`
                    });
                    seg.setOptions({ modelSelection: 1 });
                    segmentationRef.current = seg;
                }

                const rawTrack = localStreamRef.current.getVideoTracks()[0];
                if (!rawTrack) {
                    setBlurError("Please turn on your camera first.");
                    setIsBlurActive(false);
                    return;
                }
                const settings = rawTrack.getSettings();
                const width = settings?.width || 640;
                const height = settings?.height || 480;

                if (!filterCanvasRef.current) {
                    filterCanvasRef.current = document.createElement('canvas');
                }
                filterCanvasRef.current.width = width;
                filterCanvasRef.current.height = height;

                const initialCtx = filterCanvasRef.current.getContext('2d');
                if (initialCtx) {
                    initialCtx.fillStyle = '#000000';
                    initialCtx.fillRect(0, 0, width, height);
                }

                if (!filterVideoRef.current) {
                    filterVideoRef.current = document.createElement('video');
                    filterVideoRef.current.autoplay = true;
                    filterVideoRef.current.playsInline = true;
                    filterVideoRef.current.muted = true;
                }

                filterVideoRef.current.srcObject = localStreamRef.current;
                await new Promise(resolve => {
                    if (filterVideoRef.current.readyState >= 2) resolve();
                    else filterVideoRef.current.onloadeddata = resolve;
                });
                await filterVideoRef.current.play();

                let hasReceivedResults = false;
                segmentationRef.current.onResults((results) => {
                    hasReceivedResults = true;
                    setIsModelLoading(false);
                    setBlurError(null);
                    onSegmentationResults(results);
                });

                // Start processing loop
                const process = async () => {
                    if (!filterVideoRef.current) return;

                    if (filterVideoRef.current.readyState >= 2) {
                        let success = false;
                        try {
                            await segmentationRef.current.send({ image: filterVideoRef.current });
                            success = true;
                        } catch (e) {
                            console.error('Error sending frame to segmentation:', e);
                            setBlurError(`Send error: ${e.message || String(e)}`);
                        }

                        if (!success || !hasReceivedResults) {
                            const canvas = filterCanvasRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    try {
                                        ctx.save();
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        ctx.drawImage(filterVideoRef.current, 0, 0, canvas.width, canvas.height);
                                        ctx.restore();
                                    } catch (err) { }
                                }
                            }
                        }
                    }
                    animationFrameIdRef.current = requestAnimationFrame(process);
                };
                process();

                const canvasStream = filterCanvasRef.current.captureStream(30);
                const filteredTrack = canvasStream.getVideoTracks()[0];
                blurredTrackRef.current = filteredTrack;

                peerConnectionsRef.current.forEach(({ pc }) => {
                    try {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(filteredTrack);
                        }
                    } catch (e) {
                        console.error("Error replacing track on peer:", e);
                    }
                });

                setIsBlurActive(true);

                setTimeout(() => {
                    if (!hasReceivedResults && filterVideoRef.current) {
                        setIsModelLoading(false);
                        setBlurError("Couldn't apply effect. Check your internet connection.");
                    }
                }, 8000);
            } catch (err) {
                console.error('Failed to start background blur:', err);
                setIsModelLoading(false);
                setBlurError(`Failed to apply effect: ${err.message || String(err)}`);
                setIsBlurActive(false);
            }
        }
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (isChatDisabled || !chatInput.trim()) return;

        const timestamp = Date.now();
        setChatMessages(prev => [...prev, {
            socketId: localSocketId,
            userName: userName + ' (You)',
            text: chatInput.trim(),
            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        socketRef.current?.emit('video:send-chat', {
            roomCode,
            message: chatInput.trim(),
            userName,
            timestamp
        });

        setChatInput('');
    };

    const handleLeaveClick = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Leave Meeting",
            message: "Are you sure you want to leave the meeting?",
            isDestructive: true,
            onConfirm: () => {
                if (isLocalAdmin) {
                    // Host leaves -> Meeting Ends automatically
                    socketRef.current?.emit('video:host-end-meeting', { roomCode });
                    setTimeout(() => { if (onLeave) onLeave(); }, 100);
                } else {
                    if (onLeave) onLeave();
                }
            }
        });
    };

    // --- Host Handlers ---
    const handleHostMuteAll = () => {
        if (!isLocalAdmin) return;
        socketRef.current?.emit('video:host-mute-all', { roomCode });
    };

    const handleHostEndMeeting = () => {
        if (!isLocalAdmin) return;
        setConfirmDialog({
            isOpen: true,
            title: "End Meeting for All",
            message: "Are you sure you want to end this meeting for everyone? This action cannot be undone.",
            isDestructive: true,
            onConfirm: () => {
                socketRef.current?.emit('video:host-end-meeting', { roomCode });
                setTimeout(() => {
                    if (onLeave) onLeave();
                }, 100);
            }
        });
    };

    const handleHostMuteUser = (targetSocketId) => {
        if (!isLocalAdmin) return;
        socketRef.current?.emit('video:host-mute-user', { roomCode, targetSocketId });
    };

    const handleHostVideoOffUser = (targetSocketId) => {
        if (!isLocalAdmin) return;
        socketRef.current?.emit('video:host-video-off-user', { roomCode, targetSocketId });
    };

    const handleHostUnlockMic = (targetSocketId) => {
        if (!isLocalAdmin) return;
        socketRef.current?.emit('video:host-unlock-mic', { roomCode, targetSocketId });
    };

    const handleHostUnlockVideo = (targetSocketId) => {
        if (!isLocalAdmin) return;
        socketRef.current?.emit('video:host-unlock-video', { roomCode, targetSocketId });
    };

    const handleHostKickUser = (targetSocketId) => {
        if (!isLocalAdmin) return;
        setConfirmDialog({
            isOpen: true,
            title: "Remove Participant",
            message: "Remove this participant from the meeting?",
            isDestructive: true,
            onConfirm: () => {
                socketRef.current?.emit('video:host-kick-user', { roomCode, targetSocketId });
            }
        });
    };
    // --- End Host Handlers ---

    const toggleHand = () => {
        if (isHandDisabled) return;
        const myId = myHandActiveId;
        if (!myId) return;
        const isRaised = !raisedHands.has(myId);

        // Optimistically update instantly
        setRaisedHands(prev => {
            const next = new Set(prev);
            if (isRaised) next.add(myId);
            else next.delete(myId);
            return next;
        });

        if (isRaised) {
            setHandNotifications(prev => {
                const filtered = prev.filter(n => n.userName !== userName);
                return [...filtered, { id: Date.now(), socketId: myId, userName }];
            });
        } else {
            setHandNotifications(prev => prev.filter(n => n.socketId !== myId && n.userName !== userName));
        }

        socketRef.current?.emit('video:toggle-hand', { roomCode, isRaised });
    };

    // Use the server count as the authoritative value when available (prevents desync)
    const total = Math.max(remoteUsers.length + 1, serverParticipantCount);
    let gridClass = 'grid-cols-1';
    if (total === 2) {
        gridClass = 'grid-cols-2';
    } else if (total > 2) {
        gridClass = total <= 4 ? 'grid-cols-2' : total <= 9 ? 'grid-cols-3' : 'grid-cols-4';
    }

    const myHandActiveId = localSocketId || socketRef.current?.id || '';
    const isSomeoneElseSharing = screenSharer && screenSharer !== myHandActiveId;

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col bg-neutral-950 text-white relative overflow-hidden">

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
                    <div className="bg-red-950/60 border border-red-800/40 p-4 rounded-xl text-center max-w-sm flex flex-col items-center gap-2.5">
                        <FiAlertCircle className="w-8 h-8 text-red-500" />
                        <p className="text-xs text-red-300">{error}</p>
                        <button onClick={onLeave} className="bg-red-700 hover:bg-red-600 text-white text-xs px-4 py-2 rounded-lg font-bold mt-2">Return</button>
                    </div>
                </div>
            )}

            {/* Waiting Room Overlay */}
            {isWaiting && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-6 text-white bg-[#1A1A1A]">
                    <FiUsers className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold mb-2">Waiting Room</h2>
                    <p className="text-neutral-400 mb-6">Waiting for the host to let you in...</p>
                    <button
                        onClick={onLeave}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Leave Waiting Room
                    </button>
                </div>
            )}

            {/* Join Requests Toasts */}
            {joinRequests.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[60] max-h-[80vh] overflow-y-auto p-2">
                    {joinRequests.length > 1 && (
                        <div className="bg-blue-600 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 mb-2">
                            <span className="font-semibold text-sm whitespace-nowrap">{joinRequests.length} people waiting</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    joinRequests.forEach(req => {
                                        socketRef.current?.emit('video:admit-user', { roomCode, targetSocketId: req.socketId });
                                    });
                                    setJoinRequests([]);
                                }} className="bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">
                                    Admit All
                                </button>
                                <button onClick={() => {
                                    joinRequests.forEach(req => {
                                        socketRef.current?.emit('video:deny-user', { roomCode, targetSocketId: req.socketId });
                                    });
                                    setJoinRequests([]);
                                }} className="bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                                    Deny All
                                </button>
                            </div>
                        </div>
                    )}
                    {joinRequests.map(req => (
                        <div key={req.socketId} className="bg-white text-black p-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
                            <span className="font-semibold text-sm whitespace-nowrap">{req.userName} wants to join</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    socketRef.current?.emit('video:admit-user', { roomCode, targetSocketId: req.socketId });
                                    setJoinRequests(prev => prev.filter(r => r.socketId !== req.socketId));
                                }} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">Admit</button>
                                <button onClick={() => {
                                    socketRef.current?.emit('video:deny-user', { roomCode, targetSocketId: req.socketId });
                                    setJoinRequests(prev => prev.filter(r => r.socketId !== req.socketId));
                                }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">Deny</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="absolute top-3 left-3 z-40 bg-black/60 backdrop-blur border border-white/10 px-3 py-1 rounded-lg flex items-center gap-2 text-[10px]">
                <FiUsers className="w-3 h-3 text-blue-400" />
                <span className="font-bold">{total} Active</span>
            </div>

            {/* Hand Raised Notifications */}
            {handNotifications.length > 0 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 pointer-events-none">
                    {handNotifications.map(notif => (
                        <div key={notif.id} className="bg-[#1A73E8] text-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in">
                            <span className="text-2xl">✋</span>
                            <span className="font-bold text-sm tracking-wide">{notif.userName} raised hand</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Global Reactions Stream */}
            {globalReactions.length > 0 && (
                <div className="absolute bottom-24 left-12 w-24 h-[400px] flex flex-col-reverse items-center justify-end pointer-events-none z-[100] overflow-visible">
                    {globalReactions.map(r => (
                        <div key={r.id} className="text-6xl absolute bottom-0 animate-float-up drop-shadow-2xl"
                            style={{ left: `calc(50% + ${r.offsetX}px)` }}>
                            {r.emoji}
                        </div>
                    ))}
                </div>
            )}

            {/* Live Captions */}
            {captions && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[150] pointer-events-none w-full max-w-2xl px-4 flex justify-center">
                    <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 text-center text-lg sm:text-xl font-medium tracking-wide animate-in fade-in slide-in-from-bottom-4">
                        {captions}
                    </div>
                </div>
            )}

            <div className="flex-1 flex min-h-0 relative">
                <div className="flex-1 min-w-0 relative flex flex-col">

                    {screenSharer ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
                            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                                {screenSharer === myHandActiveId ? (
                                    <video ref={setScreenVideoNode} autoPlay playsInline muted className="max-w-full max-h-full object-contain" />
                                ) : (
                                    remoteScreenStream ? (
                                        <video
                                            ref={el => {
                                                if (el && remoteScreenStream) {
                                                    if (el.srcObject !== remoteScreenStream) {
                                                        el.srcObject = remoteScreenStream;
                                                    }
                                                    el.play().catch(e => console.error("[VideoCallRoom] Screen audio play error:", e));
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-xs text-neutral-400">Loading screen share...</div>
                                    )
                                )}
                                <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-[10px] font-bold border border-white/10">
                                    {screenSharer === myHandActiveId ? `${userName}'s Screen (You)` : `${remoteUsers.find(u => u.socketId === screenSharer)?.userName || 'Participant'}'s Screen`}
                                </div>
                            </div>

                            <div className="h-24 sm:h-28 bg-neutral-900/60 border-t border-white/10 p-2 flex gap-2 overflow-x-auto min-h-0 justify-center">
                                <ParticipantCard
                                    stream={streamReady ? localStreamRef.current : null}
                                    isMuted={isMuted}
                                    className="relative aspect-video h-full shrink-0 bg-neutral-950 rounded-lg overflow-hidden"
                                >
                                    <video ref={setPipVideoNode} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                                    {raisedHands.has(myHandActiveId) && (
                                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-30 animate-in zoom-in duration-200">✋</div>
                                    )}
                                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                        You {isMuted && <FiMicOff className="w-2.5 h-2.5 text-red-500" />}
                                    </div>
                                </ParticipantCard>
                                {remoteUsers.map(r => {
                                    return (
                                        <ParticipantCard
                                            key={`strip-${r.socketId}`}
                                            stream={r.stream}
                                            isMuted={r.isMuted}
                                            className="relative aspect-video h-full shrink-0 bg-neutral-950 rounded-lg overflow-hidden"
                                        >
                                            {r.isVideoOff || !layoutSettled ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-neutral-700">
                                                        {r.userName?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <VideoTile stream={r.stream} muted />
                                            )}
                                            {raisedHands.has(r.socketId) && (
                                                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-30 animate-in zoom-in duration-200">✋</div>
                                            )}
                                            <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                                {r.userName} {r.isMuted && <FiMicOff className="w-2.5 h-2.5 text-red-500" />}
                                            </div>
                                        </ParticipantCard>
                                    );
                                })}
                            </div>
                        </div>
                    ) : pinnedUser ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1f20]">
                            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden m-2 rounded-2xl border border-neutral-800">
                                {pinnedUser === 'local' ? (
                                    <video ref={setMainVideoNode} autoPlay playsInline muted className={`max-w-full max-h-full object-contain scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                                ) : (
                                    (() => {
                                        const pinned = remoteUsers.find(u => u.socketId === pinnedUser);
                                        return pinned ? (
                                            pinned.isVideoOff || !layoutSettled ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                                    <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold border border-neutral-700">
                                                        {pinned.userName?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <VideoTile stream={pinned.stream} muted className="max-w-full max-h-full object-contain" />
                                            )
                                        ) : (
                                            <div className="text-xs text-neutral-400">Loading pinned video...</div>
                                        );
                                    })()
                                )}
                                {pinnedUser === 'local' && isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#1e1f20]">
                                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold border border-neutral-700">
                                            {userName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                )}
                                {pinnedUser === 'local' && blurError && (
                                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[9px] px-2 py-1 rounded-md z-[100] max-w-[220px] font-mono break-all leading-tight shadow">
                                        ⚠️ {blurError}
                                    </div>
                                )}
                                {raisedHands.has(pinnedUser === 'local' ? myHandActiveId : pinnedUser) && (
                                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg z-30 animate-bounce">
                                        <span>✋</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold">Hand Raised</span>
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 flex items-center gap-2">
                                    <span>📌 Pinned: {pinnedUser === 'local' ? 'You' : `${remoteUsers.find(u => u.socketId === pinnedUser)?.userName || 'Participant'}`}</span>
                                    {(!isPinnedByHost || isLocalAdmin) && (
                                        <button onClick={() => {
                                            if (isPinnedByHost && isLocalAdmin) {
                                                socketRef.current?.emit('video:host-unpin-user', { roomCode });
                                            } else {
                                                setPinnedUser(null);
                                            }
                                        }} className="bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer">Unpin</button>
                                    )}
                                </div>
                            </div>

                            <div className="h-24 sm:h-28 bg-neutral-900/60 border-t border-white/10 p-2 flex gap-2 overflow-x-auto min-h-0 justify-center">
                                {pinnedUser !== 'local' && (
                                    <ParticipantCard
                                        stream={streamReady ? localStreamRef.current : null}
                                        isMuted={isMuted}
                                        className="relative aspect-video h-full shrink-0 bg-neutral-950 rounded-lg overflow-hidden"
                                    >
                                        <video ref={setPipVideoNode} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                                        {raisedHands.has(myHandActiveId) && (
                                            <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-30 animate-in zoom-in duration-200">✋</div>
                                        )}
                                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                            You {isMuted && <FiMicOff className="w-2.5 h-2.5 text-red-500" />}
                                        </div>
                                    </ParticipantCard>
                                )}
                                {remoteUsers.map(r => {
                                    if (r.socketId === pinnedUser) return null;
                                    return (
                                        <ParticipantCard
                                            key={`pinned-strip-${r.socketId}`}
                                            stream={r.stream}
                                            isMuted={r.isMuted}
                                            className="relative aspect-video h-full shrink-0 bg-neutral-950 rounded-lg overflow-hidden"
                                        >
                                            {r.isVideoOff || !layoutSettled ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-neutral-700">
                                                        {r.userName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <VideoTile stream={r.stream} muted />
                                            )}
                                            {raisedHands.has(r.socketId) && (
                                                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-30 animate-in zoom-in duration-200">✋</div>
                                            )}
                                            <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                                {r.userName} {r.isMuted && <FiMicOff className="w-2.5 h-2.5 text-red-500" />}
                                            </div>
                                        </ParticipantCard>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className={`flex-1 grid gap-2 p-3 ${gridClass} auto-rows-fr items-stretch justify-items-stretch overflow-y-auto min-h-0`}>
                            <ParticipantCard
                                stream={streamReady ? localStreamRef.current : null}
                                isMuted={isMuted}
                                className="relative w-full h-full bg-neutral-900 rounded-xl overflow-hidden"
                            >
                                <video ref={setMainVideoNode} autoPlay playsInline muted
                                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                                {isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold border border-neutral-700">
                                            {userName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                )}
                                {blurError && (
                                    <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] px-2 py-1 rounded-md z-[100] max-w-[220px] font-mono break-all leading-tight shadow">
                                        ⚠️ {blurError}
                                    </div>
                                )}
                                {raisedHands.has(myHandActiveId) && (
                                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg z-30 animate-bounce">
                                        <span>✋</span>
                                        <span className="text-[9px] uppercase tracking-wider font-bold">Hand Raised</span>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    {userName} (You) {isMuted && <FiMicOff className="w-3 h-3 text-red-500" />}
                                </div>
                            </ParticipantCard>

                            {remoteUsers.map(r => (
                                <ParticipantCard
                                    key={`grid-${r.socketId}`}
                                    stream={r.stream}
                                    isMuted={r.isMuted}
                                    className="relative w-full h-full bg-neutral-900 rounded-xl overflow-hidden"
                                >
                                    {r.isVideoOff ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold border border-neutral-700">
                                                {r.userName?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                    ) : (
                                        <VideoTile stream={r.stream} muted />
                                    )}
                                    {raisedHands.has(r.socketId) && (
                                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg z-30 animate-bounce">
                                            <span>✋</span>
                                            <span className="text-[9px] uppercase tracking-wider font-bold">Hand Raised</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                        {r.userName} {r.isMuted && <FiMicOff className="w-3 h-3 text-red-500" />}
                                    </div>
                                </ParticipantCard>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Sidebar via Portal */}
                {(showChat && chatRect) && createPortal(
                    <div
                        className="fixed bg-[#1f1f1f] text-white flex flex-col shrink-0 animate-in slide-in-from-right-8 fade-in duration-200 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[40] pointer-events-auto rounded-xl overflow-hidden border border-neutral-800"
                        style={{
                            top: chatRect.top,
                            height: chatRect.height,
                            left: chatRect.right + 16,
                            width: `calc(100vw - ${chatRect.right}px - 36px)`
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                            <h3 className="font-medium text-lg text-white">In-call messages</h3>
                            <button onClick={() => setShowChat(false)} className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded transition-colors cursor-pointer">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
                            {chatMessages.map((msg, i) => {
                                const emojiOnly = isOnlyEmojis(msg.text);
                                return (
                                    <div key={i} className="flex flex-col">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-bold text-[13px] text-neutral-200">{msg.userName}</span>
                                            <span className="text-[10px] text-neutral-500">{msg.time}</span>
                                        </div>
                                        <p className={`text-neutral-300 leading-snug break-words break-all whitespace-pre-wrap ${emojiOnly ? 'text-4xl py-1' : 'text-[14px]'}`}>{msg.text}</p>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-neutral-800">
                            <form onSubmit={handleChatSubmit} className="flex gap-2 bg-[#2d2e30] border border-[#3c4043] rounded-full px-4 py-1 items-center">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    disabled={isChatDisabled}
                                    placeholder={isChatDisabled ? "Chat Locked by Host" : "Send a message"}
                                    className={`flex-1 bg-transparent py-2.5 text-[14px] outline-none text-white placeholder-neutral-500 ${isChatDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                />
                                <button type="submit" disabled={isChatDisabled || !chatInput.trim()} className="text-[#8ab4f8] disabled:text-neutral-600 p-1 cursor-pointer transition-colors hover:text-blue-400">
                                    <FiSend className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* Zoom-style Control Bar */}
            <div className="bg-[#1A1A1A] border-t border-black px-4 py-2 flex items-center justify-between text-[10px] text-neutral-300 font-medium select-none">

                {/* Left: End Button */}
                <div className="flex items-center w-auto sm:w-[80px] shrink-0">
                    <button onClick={handleLeaveClick} className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 text-xs sm:text-sm rounded-lg transition-all shadow hover:shadow-md active:scale-95">
                        End
                    </button>
                </div>

                {/* Center: Main Controls */}
                <div className="flex items-center justify-center gap-3 sm:gap-5 flex-1">
                    <button
                        onClick={toggleMute}
                        disabled={isMicDisabled}
                        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isMicDisabled ? 'opacity-40 cursor-not-allowed text-red-500' :
                                (isMuted ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' :
                                    (isSpeakingLocal ? 'bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-green-500/30' : 'hover:bg-white/10 text-neutral-300'))
                            }`}
                        title={isMicDisabled ? "Microphone Locked by Host" : ""}
                    >
                        {isMicDisabled ? <FiLock className="w-6 h-6 mb-1" /> : (isMuted ? <FiMicOff className="w-6 h-6 mb-1" /> : <FiMic className={`w-6 h-6 mb-1 ${isSpeakingLocal ? 'animate-pulse' : ''}`} />)}
                        <span className="text-[10px] font-medium tracking-wide">{isMicDisabled ? 'Locked' : (isMuted ? 'Unmute' : 'Mute')}</span>
                    </button>

                    <button
                        onClick={toggleVideo}
                        disabled={isVideoDisabled || isVideoToggleCoolingDown}
                        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isVideoDisabled ? 'opacity-40 cursor-not-allowed text-red-500' : (isVideoToggleCoolingDown ? 'opacity-60 cursor-wait text-neutral-400' : (isVideoOff ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-white/10 text-neutral-300'))}`}
                        title={isVideoDisabled ? "Camera Locked by Host" : (isVideoToggleCoolingDown ? "Please wait before toggling the camera again" : "")}
                    >
                        {isVideoDisabled ? <FiLock className="w-6 h-6 mb-1" /> : (isVideoOff ? <FiVideoOff className="w-6 h-6 mb-1" /> : <FiVideo className="w-6 h-6 mb-1" />)}
                        <span className="text-[10px] font-medium tracking-wide">{isVideoDisabled ? 'Locked' : (isVideoToggleCoolingDown ? 'Please wait' : (isVideoOff ? 'Start Video' : 'Stop Video'))}</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowEffects(!showEffects);
                            setShowChat(false);
                            setShowParticipants(false);
                        }}
                        disabled={isVideoOff || isVideoDisabled}
                        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isVideoOff || isVideoDisabled ? 'opacity-40 cursor-not-allowed text-neutral-500' :
                                (showEffects ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10 text-neutral-300')
                            }`}
                        title={isVideoOff ? "Turn on camera first to change background" : ""}
                    >
                        <FiGrid className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium tracking-wide">Effects</span>
                    </button>

                    {/* Participants Toggle */}
                    <button
                        onClick={() => {
                            setShowParticipants(!showParticipants);
                            setShowChat(false);
                            setShowEffects(false);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${showParticipants ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10 text-neutral-300'}`}
                    >
                        <div className="relative">
                            <FiUsers className="w-6 h-6 mb-1" />
                            <div className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-black">{1 + remoteUsers.length}</div>
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">Participants</span>
                    </button>

                    {/* Chat Toggle */}
                    <button onClick={() => { setShowChat(!showChat); setUnreadChatCount(0); setShowParticipants(false); setShowEffects(false); }} className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${showChat ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-neutral-300'}`}>
                        <div className="relative mb-1">
                            <FiMessageSquare className="w-6 h-6" />
                            {unreadChatCount > 0 && (
                                <div className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">{unreadChatCount}</div>
                            )}
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">Chat</span>
                    </button>

                    <button onClick={handleScreenShareClick} disabled={isSomeoneElseSharing || isShareDisabled} className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isSomeoneElseSharing || isShareDisabled ? 'opacity-40 cursor-not-allowed text-neutral-500' : 'text-green-500 hover:bg-white/10 hover:text-green-400'}`} title={isShareDisabled ? "Screen Share Locked by Host" : ""}>
                        <FiMonitor className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium tracking-wide">Share Screen</span>
                    </button>

                    <button
                        onClick={toggleHand}
                        disabled={isHandDisabled}
                        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isHandDisabled ? 'opacity-40 cursor-not-allowed' : (raisedHands.has(myHandActiveId) ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'hover:bg-white/10 text-neutral-300')}`}
                        title={isHandDisabled ? "Hand Raise Locked by Host" : ""}
                    >
                        <FaHandPaper className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium tracking-wide">Raise Hand</span>
                    </button>

                    <div
                        className="relative"
                        onMouseEnter={() => !isReactionDisabled && setShowReactions(true)}
                    >
                        <button
                            onClick={() => setShowReactions(!showReactions)}
                            disabled={isReactionDisabled}
                            className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-xl transition-all duration-300 shrink-0 ${isReactionDisabled ? 'opacity-40 cursor-not-allowed' : (showReactions ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10 text-neutral-300')}`}
                            title={isReactionDisabled ? "Reactions Locked by Host" : ""}
                        >
                            <FiSmile className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-medium tracking-wide">Reactions</span>
                        </button>

                        {showReactions && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl p-2 flex gap-1 z-50 origin-bottom animate-in fade-in slide-in-from-bottom-2">
                                {['👍', '❤️', '😂', '😮', '😢', '👏', '🎉'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            setGlobalReactions(prev => [...prev, {
                                                id: Date.now() + Math.random(),
                                                emoji,
                                                offsetX: Math.random() * 60 - 30
                                            }]);
                                            socketRef.current?.emit('video:send-reaction', { roomCode, emoji });
                                            setShowReactions(false);
                                        }}
                                        className="text-xl sm:text-2xl hover:bg-neutral-700 rounded-xl p-2 transition-transform hover:scale-110 cursor-pointer"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Language Translation Selector */}
                    <div className="relative flex items-center justify-center shrink-0 px-1">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-xl transition-all duration-300 ${isTranslationActive ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'hover:bg-white/10 text-neutral-300'}`}
                            title="Translate Speech"
                        >
                            <FiGlobe className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium tracking-wide">
                                {listenLanguage === 'off' ? 'Translate' : TRANSLATION_LANGUAGES.find(o => o.value === listenLanguage)?.label || 'Translate'}
                            </span>
                        </button>

                        {showLangMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 max-h-[350px] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-3 z-50 origin-bottom animate-in fade-in slide-in-from-bottom-2 custom-scrollbar">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-white text-xs font-bold">Translation Settings</h3>
                                        <button onClick={() => { setIsTranslationActive(false); setListenLanguage('off'); setShowLangMenu(false); setTranslationError(''); }} className="text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-400/10 px-2 py-1 rounded">Turn Off</button>
                                    </div>

                                    {translationError && (
                                        <div className="mb-3 p-2 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 text-[10px] leading-relaxed break-words font-medium">
                                            {translationError}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-[10px] text-neutral-400 mb-2 font-semibold uppercase tracking-wider">I want to listen in:</label>
                                        <div className="grid grid-cols-2 gap-1 mb-4">
                                            {TRANSLATION_LANGUAGES.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setTranslationError('');
                                                        setListenLanguage(opt.value);
                                                        setIsTranslationActive(true);

                                                        setShowLangMenu(false);
                                                        try {
                                                            const AudioContext = window.AudioContext || window.webkitAudioContext;
                                                            if (!playbackContextRef.current) {
                                                                playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
                                                            }
                                                            if (playbackContextRef.current.state === 'suspended') {
                                                                playbackContextRef.current.resume();
                                                            }
                                                        } catch (e) {
                                                            console.error("Failed to init AudioContext", e);
                                                        }
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-[8px] text-[11px] font-medium transition-colors ${listenLanguage === opt.value ? 'bg-[#1A73E8] text-white' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>


                                </div>
                            </>
                        )}
                    </div>

                </div>

                {/* Right: Spacer to keep center items perfectly centered */}
                <div className="w-[60px] shrink-0 hidden sm:block"></div>

                {/* Participants Sidebar via Portal */}
                {(showParticipants && chatRect) && createPortal(
                    <div
                        className="fixed bg-[#1f1f1f] text-white flex flex-col shrink-0 animate-in slide-in-from-right-8 fade-in duration-200 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[40] pointer-events-auto rounded-xl overflow-hidden border border-neutral-800"
                        style={{
                            top: chatRect.top,
                            height: chatRect.height,
                            left: chatRect.right + 16,
                            width: `calc(100vw - ${chatRect.right}px - 36px)`
                        }}
                    >
                        <div className="flex items-center justify-between p-4 shrink-0">
                            <h3 className="font-medium text-lg text-white">Participants</h3>
                            <button onClick={() => setShowParticipants(false)} className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded transition-colors cursor-pointer">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-4 pb-2">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search for people"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border border-neutral-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                                />
                            </div>
                        </div>

                        {isLocalAdmin && (
                            <div className="px-4 py-3 bg-neutral-800/50 flex gap-2 shrink-0 border-y border-neutral-800">
                                <div className="relative flex-1">
                                    <button onClick={() => setShowLockMenu(!showLockMenu)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold py-2 px-3 rounded-lg border border-neutral-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1">
                                        <FiLock className="w-3 h-3" /> Lock Features
                                    </button>
                                    {showLockMenu && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-neutral-900 rounded-lg shadow-xl border border-neutral-700 overflow-hidden z-50">
                                            {Object.entries(roomLocks).map(([feature, isLocked]) => (
                                                <button key={feature} onClick={() => socketRef.current.emit('video:host-toggle-lock', { roomCode, feature, isLocked: !isLocked })} className="w-full text-left px-3 py-2 text-[11px] hover:bg-neutral-800 flex items-center justify-between border-b border-neutral-800 last:border-0 text-white">
                                                    <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    {isLocked ? <FiLock className="w-3 h-3 text-red-500" /> : <FiUnlock className="w-3 h-3 text-green-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleHostEndMeeting} className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-[11px] font-semibold py-2 px-3 rounded-lg border border-red-900/50 transition-all shadow-sm active:scale-95">End for All</button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">IN THE MEETING</div>

                            <div className="bg-[#282a2d] border border-[#3c4043] rounded-[16px] relative">
                                <button
                                    onClick={() => setIsContributorsOpen(!isContributorsOpen)}
                                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[#323639] transition-colors rounded-t-[16px] ${!isContributorsOpen ? 'rounded-b-[16px]' : ''}`}
                                >
                                    <span className="font-semibold text-[15px] text-[#e8eaed]">Contributors</span>
                                    <div className="flex items-center gap-3 text-[#9aa0a6]">
                                        <span className="text-[13px] font-medium">{1 + remoteUsers.length}</span>
                                        {isContributorsOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                                    </div>
                                </button>

                                {isContributorsOpen && (
                                    <div className="flex flex-col pb-2">
                                        {/* Local User */}
                                        {(!searchQuery || userName.toLowerCase().includes(searchQuery.toLowerCase())) && (
                                            <div className="flex items-center justify-between px-4 py-2 hover:bg-[#323639]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-[#a142f4] rounded-full flex items-center justify-center text-white font-medium text-lg relative">
                                                        {userName?.charAt(0).toUpperCase() || 'Y'}
                                                        {raisedHands.has(myHandActiveId) && (
                                                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">✋</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-[14px] text-[#e8eaed]">
                                                            {userName} (You)
                                                        </span>
                                                        <span className="text-[12px] text-[#9aa0a6]">
                                                            {isLocalAdmin ? 'Meeting host' : 'Participant'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 relative">
                                                    {isMuted ? <FiMicOff className="w-[18px] h-[18px] text-[#e25c5c] mr-1" /> : <FiMic className="w-[18px] h-[18px] text-[#9aa0a6] mr-1" />}
                                                    {isVideoOff ? <FiVideoOff className="w-[18px] h-[18px] text-[#e25c5c] mr-2" /> : <FiVideo className="w-[18px] h-[18px] text-[#9aa0a6] mr-2" />}
                                                    <button onClick={() => setActivePinMenu(activePinMenu === 'local' ? null : 'local')} className="p-2 hover:bg-white/10 rounded-full text-[#9aa0a6] transition-colors relative">
                                                        <FiMoreVertical className="w-5 h-5" />
                                                    </button>
                                                    {activePinMenu === 'local' && (
                                                        <div className="absolute right-0 top-full mt-1 w-56 bg-[#2d2e30] border border-[#3c4043] rounded-lg shadow-xl z-50 overflow-hidden py-2">
                                                            {pinnedUser === 'local' ? (
                                                                (!isPinnedByHost || isLocalAdmin) ? (
                                                                    <button onClick={() => {
                                                                        if (isPinnedByHost && isLocalAdmin) {
                                                                            socketRef.current?.emit('video:host-unpin-user', { roomCode });
                                                                        } else {
                                                                            setPinnedUser(null);
                                                                        }
                                                                        setActivePinMenu(null);
                                                                    }} className="w-full text-left text-[14px] px-4 py-2 text-[#e8eaed] hover:bg-[#3c4043]">
                                                                        ❌ Unpin from screen
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-full text-left text-[14px] px-4 py-2 text-neutral-500 cursor-not-allowed">
                                                                        🔒 Pinned by Host
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <>
                                                                    <div className="px-4 py-2 text-[14px] text-[#e8eaed] flex items-center gap-3 border-b border-[#3c4043] pb-3 mb-1">
                                                                        <span className="text-[#9aa0a6]">📌</span> Pin to the screen
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <button onClick={() => { setPinnedUser('local'); setActivePinMenu(null); }} className="text-left text-[14px] px-10 py-2 text-[#e8eaed] hover:bg-[#3c4043]">For myself only</button>
                                                                        {isLocalAdmin && (
                                                                            <button onClick={() => {
                                                                                socketRef.current?.emit('video:host-pin-user', { roomCode, targetSocketId: myHandActiveId });
                                                                                setPinnedUser('local');
                                                                                setActivePinMenu(null);
                                                                            }} className="text-left text-[14px] px-10 py-2 text-[#e8eaed] hover:bg-[#3c4043]">For everyone</button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Remote Users */}
                                        {remoteUsers
                                            .filter(u => !searchQuery || (u.userName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(remoteUser => (
                                                <div key={remoteUser.socketId} className="flex items-center justify-between px-4 py-2 hover:bg-[#323639]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-[#5f6368] rounded-full flex items-center justify-center text-white font-medium text-lg relative">
                                                            {remoteUser.userName?.charAt(0).toUpperCase() || 'U'}
                                                            {raisedHands.has(remoteUser.socketId) && (
                                                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">✋</div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-[14px] text-[#e8eaed]">
                                                                {remoteUser.userName || 'Participant'}
                                                            </span>
                                                            {remoteUser.isAdmin && <span className="text-[12px] text-[#9aa0a6]">Meeting host</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 relative">
                                                        {remoteUser.isMuted ? <FiMicOff className="w-[18px] h-[18px] text-[#e25c5c] mr-1" /> : <FiMic className="w-[18px] h-[18px] text-[#9aa0a6] mr-1" />}
                                                        {remoteUser.isVideoOff ? <FiVideoOff className="w-[18px] h-[18px] text-[#e25c5c] mr-2" /> : <FiVideo className="w-[18px] h-[18px] text-[#9aa0a6] mr-2" />}

                                                        {(isLocalAdmin && !remoteUser.isAdmin) && (
                                                            <div className="flex items-center gap-1 mr-1 border-r border-[#3c4043] pr-2">
                                                                {roomLocks.mic ? null : remoteUser.isMicLocked ? (
                                                                    <button onClick={() => handleHostUnlockMic(remoteUser.socketId)} title="Allow Mic" className="p-1.5 text-[#81c995] hover:bg-white/10 rounded-full transition-colors">
                                                                        <FiUnlock className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => handleHostMuteUser(remoteUser.socketId)} title="Force Mute (Lock)" className="p-1.5 text-[#9aa0a6] hover:text-[#f28b82] hover:bg-white/10 rounded-full transition-colors">
                                                                        <FiMicOff className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {roomLocks.video ? null : remoteUser.isVideoLocked ? (
                                                                    <button onClick={() => handleHostUnlockVideo(remoteUser.socketId)} title="Allow Video" className="p-1.5 text-[#81c995] hover:bg-white/10 rounded-full transition-colors">
                                                                        <FiUnlock className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => handleHostVideoOffUser(remoteUser.socketId)} title="Force Stop Video (Lock)" className="p-1.5 text-[#9aa0a6] hover:text-[#f28b82] hover:bg-white/10 rounded-full transition-colors">
                                                                        <FiVideoOff className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        <button onClick={() => setActivePinMenu(activePinMenu === remoteUser.socketId ? null : remoteUser.socketId)} className="p-2 hover:bg-white/10 rounded-full text-[#9aa0a6] transition-colors">
                                                            <FiMoreVertical className="w-5 h-5" />
                                                        </button>
                                                        {activePinMenu === remoteUser.socketId && (
                                                            <div className="absolute right-0 top-full mt-1 w-56 bg-[#2d2e30] border border-[#3c4043] rounded-lg shadow-xl z-50 overflow-hidden py-2">
                                                                {pinnedUser === remoteUser.socketId ? (
                                                                    (!isPinnedByHost || isLocalAdmin) ? (
                                                                        <button onClick={() => {
                                                                            if (isPinnedByHost && isLocalAdmin) {
                                                                                socketRef.current?.emit('video:host-unpin-user', { roomCode });
                                                                            } else {
                                                                                setPinnedUser(null);
                                                                            }
                                                                            setActivePinMenu(null);
                                                                        }} className="w-full text-left text-[14px] px-4 py-2 text-[#e8eaed] hover:bg-[#3c4043]">
                                                                            ❌ Unpin from screen
                                                                        </button>
                                                                    ) : (
                                                                        <div className="w-full text-left text-[14px] px-4 py-2 text-neutral-500 cursor-not-allowed">
                                                                            🔒 Pinned by Host
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <>
                                                                        <div className="px-4 py-2 text-[14px] text-[#e8eaed] flex items-center gap-3 border-b border-[#3c4043] pb-3 mb-1">
                                                                            <span className="text-[#9aa0a6]">📌</span> Pin to the screen
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <button onClick={() => { setPinnedUser(remoteUser.socketId); setActivePinMenu(null); }} className="text-left text-[14px] px-10 py-2 text-[#e8eaed] hover:bg-[#3c4043]">For myself only</button>
                                                                            {isLocalAdmin && (
                                                                                <button onClick={() => {
                                                                                    socketRef.current?.emit('video:host-pin-user', { roomCode, targetSocketId: remoteUser.socketId });
                                                                                    setPinnedUser(remoteUser.socketId);
                                                                                    setActivePinMenu(null);
                                                                                }} className="text-left text-[14px] px-10 py-2 text-[#e8eaed] hover:bg-[#3c4043]">For everyone</button>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {(isLocalAdmin && !remoteUser.isAdmin) && (
                                                                    <div className="border-t border-[#3c4043] mt-2 pt-2">
                                                                        <button onClick={() => handleHostKickUser(remoteUser.socketId)} className="w-full text-left px-10 py-2 text-[14px] text-[#f28b82] hover:bg-[#3c4043]">Remove from meeting</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Backgrounds & Effects Sidebar via Portal */}
                {(showEffects && chatRect) && createPortal(
                    <div
                        className="fixed bg-[#1f1f1f] text-white flex flex-col shrink-0 animate-in slide-in-from-right-8 fade-in duration-200 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[40] pointer-events-auto rounded-xl overflow-hidden border border-neutral-800"
                        style={{
                            top: chatRect.top,
                            height: chatRect.height,
                            left: chatRect.right + 16,
                            width: `calc(100vw - ${chatRect.right}px - 36px)`
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                            <h3 className="font-medium text-lg text-white">Backgrounds and effects</h3>
                            <button onClick={() => setShowEffects(false)} className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded transition-colors cursor-pointer">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-800 px-4 shrink-0">
                            <button
                                onClick={() => setActiveTab('backgrounds')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === 'backgrounds' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                            >
                                Backgrounds
                            </button>
                            <button
                                onClick={() => setActiveTab('filters')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === 'filters' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                            >
                                Filters
                            </button>
                        </div>

                        {/* Loading/Error indicator in the effects panel */}
                        {isModelLoading && (
                            <div className="mx-4 mt-3 flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg px-3 py-2.5 text-xs">
                                <svg className="animate-spin h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                <span>Applying effect, please wait…</span>
                            </div>
                        )}
                        {blurError && !isModelLoading && (
                            <div className="mx-4 mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2.5 text-xs">
                                <span>⚠️</span>
                                <span>{blurError}</span>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">

                            {activeTab === 'backgrounds' ? (
                                <>
                                    {/* Blur & Personal Section */}
                                    <div>
                                        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Blur and personal</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* None */}
                                            <button
                                                onClick={() => handleSelectEffect('none')}
                                                className={`aspect-video flex flex-col items-center justify-center rounded-lg border-2 bg-[#2d2e30] hover:bg-[#3c4043] transition-all p-2 ${bgEffect === 'none' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent text-neutral-300'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full border border-neutral-500 flex items-center justify-center text-sm font-bold relative">
                                                    <span className="absolute w-full h-[2px] bg-red-500 rotate-45"></span>
                                                    <FiVideo className="w-4 h-4 text-neutral-400" />
                                                </div>
                                                <span className="text-[9px] mt-1.5 font-medium">None</span>
                                            </button>

                                            {/* Light Blur */}
                                            <button
                                                onClick={() => handleSelectEffect('blur-light')}
                                                className={`aspect-video flex flex-col items-center justify-center rounded-lg border-2 bg-[#2d2e30] hover:bg-[#3c4043] transition-all p-2 ${bgEffect === 'blur-light' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent text-neutral-300'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full border border-dashed border-neutral-500 flex items-center justify-center text-sm">
                                                    ✨
                                                </div>
                                                <span className="text-[9px] mt-1.5 font-medium">Light blur</span>
                                            </button>

                                            {/* Heavy Blur */}
                                            <button
                                                onClick={() => handleSelectEffect('blur-heavy')}
                                                className={`aspect-video flex flex-col items-center justify-center rounded-lg border-2 bg-[#2d2e30] hover:bg-[#3c4043] transition-all p-2 ${bgEffect === 'blur-heavy' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent text-neutral-300'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center text-sm filter blur-[1px]">
                                                    ✨
                                                </div>
                                                <span className="text-[9px] mt-1.5 font-medium">Heavy blur</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Background Images Section */}
                                    <div className="flex flex-col gap-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Virtual backgrounds</h4>

                                            {/* Custom Upload Input */}
                                            <label className="text-[10px] text-blue-400 hover:text-blue-350 font-bold cursor-pointer flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const url = URL.createObjectURL(file);
                                                            await handleSelectEffect('image', url);
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                Upload Custom
                                            </label>
                                        </div>

                                        {BACKGROUND_CATEGORIES.map(category => (
                                            <div key={category.id} className="border-t border-neutral-800/60 pt-4 first:border-t-0 first:pt-0">
                                                <h5 className="text-[11px] font-bold text-neutral-300 mb-2.5 flex items-center gap-1.5">
                                                    <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
                                                    {category.title}
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {category.items.map(bg => (
                                                        <button
                                                            key={bg.id}
                                                            onClick={() => handleSelectEffect('image', bg.url)}
                                                            className={`relative aspect-video rounded-xl overflow-hidden border-2 bg-neutral-800 group hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ${bgEffect === 'image' && selectedBgUrl === bg.url ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent'}`}
                                                        >
                                                            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-all flex items-end p-2">
                                                                <span className="text-[9px] font-bold text-white tracking-wide truncate w-full text-left">{bg.name}</span>
                                                            </div>
                                                            {bgEffect === 'image' && selectedBgUrl === bg.url && (
                                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-md border border-neutral-900">
                                                                    ✓
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                /* Filters tab contents */
                                <div>
                                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Color Filters</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'none', label: 'None', preview: 'bg-neutral-700 text-neutral-300 border-neutral-600' },
                                            { id: 'grayscale', label: 'B&W', preview: 'bg-neutral-800 text-neutral-400 border-neutral-700 filter grayscale' },
                                            { id: 'sepia', label: 'Sepia', preview: 'bg-orange-950/40 text-orange-200 border-orange-900/50 filter sepia' },
                                            { id: 'warm', label: 'Warm', preview: 'bg-amber-900/30 text-amber-200 border-amber-800/40' },
                                            { id: 'cool', label: 'Cool', preview: 'bg-blue-900/30 text-blue-200 border-blue-800/40' },
                                            { id: 'vintage', label: 'Vintage', preview: 'bg-yellow-950/20 text-yellow-100 border-yellow-900/30 filter sepia(40%) contrast(90%)' },
                                            { id: 'neon', label: 'Neon', preview: 'bg-purple-900/40 text-purple-200 border-purple-800/40 filter hue-rotate(90deg)' },
                                            { id: 'invert', label: 'Invert', preview: 'bg-white text-black border-neutral-200 filter invert' }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleSelectFilter(f.id)}
                                                className={`aspect-video flex flex-col items-center justify-center rounded-lg border-2 bg-neutral-900/80 hover:bg-neutral-800 transition-all p-2 ${f.preview} ${videoFilter === f.id ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'}`}
                                            >
                                                <div className="text-[10px] font-bold flex items-center justify-center h-6 w-6 rounded-full border border-current">
                                                    Ab
                                                </div>
                                                <span className="text-[9px] mt-1.5 font-medium">{f.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>,
                    document.body
                )}

                {/* Confirm Dialog Modal */}
                {confirmDialog.isOpen && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#1C1C1E] border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-200">
                            <h3 className="text-lg font-semibold text-white mb-2">{confirmDialog.title}</h3>
                            <p className="text-neutral-400 text-sm mb-6">{confirmDialog.message}</p>
                            <div className="flex items-center justify-end gap-3">
                                {!confirmDialog.isAlert && (
                                    <button
                                        onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg cursor-pointer active:scale-95 ${confirmDialog.isDestructive ? 'bg-red-600 hover:bg-red-500 hover:shadow-red-900/50' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-900/50'}`}
                                >
                                    {confirmDialog.isAlert ? "OK" : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Persistent Audio Elements for Remote Users to prevent autoplay/layout-switch audio cutoffs */}
                <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
                    {remoteUsers.map(r => (
                        r.stream && r.isVideoOff && <AudioElement key={r.socketId} stream={r.stream} muted />
                    ))}
                </div>

            </div>
        </div>
    );
};

const AudioElement = ({ stream, muted }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current || !stream) return;

        const audioElement = ref.current;

        const updateAudio = () => {
            audioElement.muted = muted;
            if (audioElement.srcObject !== stream) {
                audioElement.srcObject = stream;
            }
            audioElement.play().catch(e => console.error("Audio playback error:", e));
        };

        updateAudio();

        stream.addEventListener('addtrack', updateAudio);
        stream.addEventListener('removetrack', updateAudio);
        audioElement.addEventListener('pause', updateAudio);
        audioElement.addEventListener('stalled', updateAudio);
        window.addEventListener('pointerdown', updateAudio);
        const retryTimer = setInterval(() => {
            if (!muted && audioElement.paused) updateAudio();
        }, 3000);

        const tracks = stream.getAudioTracks();
        tracks.forEach(track => {
            track.addEventListener('unmute', updateAudio);
        });

        return () => {
            stream.removeEventListener('addtrack', updateAudio);
            audioElement.removeEventListener('pause', updateAudio);
            audioElement.removeEventListener('stalled', updateAudio);
            window.removeEventListener('pointerdown', updateAudio);
            clearInterval(retryTimer);
            stream.removeEventListener('removetrack', updateAudio);
            tracks.forEach(track => {
                track.removeEventListener('unmute', updateAudio);
            });
        };
    }, [stream, muted]);
    return <audio ref={ref} autoPlay muted={muted} />;
};

const useSpeakingDetection = (stream) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);
    const analyserRef = useRef(null);

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) {
            setIsSpeaking(false);
            return;
        }
        let frameId;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioCtx();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            analyserRef.current = ctx.createAnalyser();
            const analyser = analyserRef.current;
            analyser.fftSize = 256;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.4;

            sourceRef.current = ctx.createMediaStreamSource(stream);
            const source = sourceRef.current;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const check = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / dataArray.length;

                // Lower threshold to 3 for better sensitivity
                setIsSpeaking(avg > 3);

                frameId = requestAnimationFrame(check);
            };
            check();
        } catch (e) {
            console.error('Speech detection error', e);
        }
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch (e) { }
                sourceRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try { audioContextRef.current.close(); } catch (e) { }
                audioContextRef.current = null;
            }
            analyserRef.current = null;
        };
    }, [stream]);
    return isSpeaking;
};

const ParticipantCard = ({ stream, isMuted, className = '', children }) => {
    const isSpeaking = useSpeakingDetection(isMuted ? null : stream);
    const borderClass = isSpeaking ? 'border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border border-white/5';

    return (
        <div className={`transition-all duration-300 ${borderClass} ${className}`}>
            {children}
            {isSpeaking && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-[4px] p-1.5 flex gap-[3px] items-end h-5 shadow-sm z-10">
                    <div className="w-[3px] bg-green-500 rounded-full animate-[bounce_1s_infinite_0ms]" style={{ height: '60%' }}></div>
                    <div className="w-[3px] bg-green-500 rounded-full animate-[bounce_1s_infinite_200ms]" style={{ height: '100%' }}></div>
                    <div className="w-[3px] bg-green-500 rounded-full animate-[bounce_1s_infinite_400ms]" style={{ height: '80%' }}></div>
                </div>
            )}
        </div>
    );
};

const VideoTile = ({ stream, muted = false, className = "w-full h-full object-cover" }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current || !stream) return;

        const videoElement = ref.current;

        videoElement.muted = muted;
        const updateVideo = () => {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
            videoElement.play().catch(() => { });
        };

        updateVideo();

        stream.addEventListener('addtrack', updateVideo);
        videoElement.addEventListener('pause', updateVideo);
        videoElement.addEventListener('stalled', updateVideo);
        window.addEventListener('pointerdown', updateVideo);
        const retryTimer = setInterval(() => {
            if (!muted && videoElement.paused) updateVideo();
        }, 3000);
        stream.addEventListener('removetrack', updateVideo);

        const tracks = stream.getTracks();
        tracks.forEach(track => {
            track.addEventListener('unmute', updateVideo);
            track.addEventListener('ended', updateVideo);
        });

        return () => {
            stream.removeEventListener('addtrack', updateVideo);
            videoElement.removeEventListener('pause', updateVideo);
            videoElement.removeEventListener('stalled', updateVideo);
            window.removeEventListener('pointerdown', updateVideo);
            clearInterval(retryTimer);
            stream.removeEventListener('removetrack', updateVideo);
            tracks.forEach(track => {
                track.removeEventListener('unmute', updateVideo);
                track.removeEventListener('ended', updateVideo);
            });
        };
    }, [stream, muted]);
    return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
};

export default VideoCallRoom;
