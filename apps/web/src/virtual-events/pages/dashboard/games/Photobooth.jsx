import React, { useState, useRef, useEffect } from 'react';
import {
    MdCameraAlt,
    MdRefresh,
    MdArrowBack,
    MdCloudUpload,
    MdFace,
    MdHistory,
    MdLock,
    MdLightbulbOutline,
    MdChevronRight,
    MdFileDownload,
    MdPrint,
    MdQrCode
} from 'react-icons/md';
import { photoboothService } from '../../../services/api';
import { renderPersonaCard, PERSONA_QUOTES, PERSONA_BADGES } from '../../../utils/personaCanvasRenderer';

const STYLES = [
    // Caricature Avatar Styles
    {
        id: 'VIBRANT',
        name: 'Vibrant Cartoon',
        description: 'Bold comic colors & exaggerated features',
        color: 'from-purple-500 to-pink-500',
        emoji: '🎨',
        image: '/photobooth/caricature1.jpg',
        categories: ['cartoon'],
        popular: true
    },
    {
        id: 'SKETCH',
        name: 'Sketch Artist',
        description: 'Raw hand-drawn charcoal aesthetic',
        color: 'from-gray-600 to-gray-900',
        emoji: '✏️',
        image: '/photobooth/caricature2.jpg',
        categories: ['artistic']
    },
    {
        id: 'MODERN',
        name: 'Modern 3D',
        description: 'Clean Pixar-inspired 3D look',
        color: 'from-blue-400 to-indigo-600',
        emoji: '👾',
        image: '/photobooth/caricature3.jpg',
        categories: ['3d']
    },
    {
        id: 'PHOTOREALISTIC',
        name: 'Photo-Realistic',
        description: 'Blend of photo face with hand-drawn vector art',
        color: 'from-emerald-500 to-teal-600',
        emoji: '📷',
        image: '/photobooth/caricature4.jpeg',
        categories: ['realistic']
    },
    {
        id: 'BOBBLEHEAD',
        name: 'Bobblehead',
        description: '3D bobblehead figurine with oversized head',
        color: 'from-orange-400 to-red-500',
        emoji: '🧸',
        image: '/photobooth/caricature5.png',
        categories: ['3d', 'cartoon']
    },
    {
        id: 'WATERCOLOR',
        name: 'Watercolor Art',
        description: 'Hand-drawn linework with soft watercolor washes',
        color: 'from-cyan-400 to-blue-500',
        emoji: '🖌️',
        image: '/photobooth/watercolor.png',
        categories: ['artistic']
    },
    // Persona Poster Styles
    {
        id: 'CREATOR',
        name: 'Creator Folk',
        description: 'Ornate traditional Indian miniature folk art poster',
        color: 'from-red-500 to-yellow-500',
        isPersona: true,
        emoji: '🎪',
        image: '/photobooth/creator.png',
        categories: ['artistic', 'folkart']
    },
    {
        id: 'INNOVATOR',
        name: 'Innovator Folk',
        description: 'Intricate folk art backdrop with progress storytelling',
        color: 'from-blue-400 to-teal-500',
        isPersona: true,
        emoji: '💡',
        image: '/photobooth/innovator.png',
        categories: ['artistic', 'folkart']
    },
    {
        id: 'LEADER',
        name: 'Leader Folk',
        description: 'Royal folk-art style with pathways and rising sun motifs',
        color: 'from-yellow-500 to-orange-600',
        isPersona: true,
        emoji: '👑',
        image: '/photobooth/leader.png',
        categories: ['artistic', 'folkart']
    },
    {
        id: 'DREAMER',
        name: 'Dreamer Folk',
        description: 'Fantasy folk starry landscape with floating birds',
        color: 'from-purple-400 to-pink-500',
        isPersona: true,
        emoji: '🌟',
        image: '/photobooth/dreamer.png',
        categories: ['artistic', 'folkart']
    },
    {
        id: 'EXPLORER',
        name: 'Explorer Folk',
        description: 'Forest & mountain folk-art journey storytelling',
        color: 'from-green-400 to-emerald-600',
        isPersona: true,
        emoji: '🧭',
        image: '/photobooth/Explorer.png',
        categories: ['artistic', 'folkart']
    },
    // Style Transfer Styles
    {
        id: 'GHIBLI',
        name: 'Ghibli',
        description: 'Soft watercolor Ghibli magic with warm golden hues',
        color: 'from-green-300 to-teal-400',
        emoji: '🌿',
        image: '/style-transfer-images/ghibli-style.png',
        categories: ['style-transfer'],
        popular: true
    },
    {
        id: 'PIXAR',
        name: 'Pixar 3D',
        description: 'Smooth Pixar-style CGI with cinematic lighting',
        color: 'from-blue-400 to-indigo-500',
        emoji: '🎬',
        image: '/style-transfer-images/pixar-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'ANIME',
        name: 'Anime',
        description: 'High-quality modern anime cel-shading',
        color: 'from-pink-400 to-purple-500',
        emoji: '⚡',
        image: '/style-transfer-images/anime-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'PENCIL_SKETCH',
        name: 'Pencil Sketch',
        description: 'Detailed graphite pencil with cross-hatched shading',
        color: 'from-gray-400 to-gray-700',
        emoji: '✏️',
        image: '/style-transfer-images/sketch-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'WATERCOLOR_ART',
        name: 'Watercolor',
        description: 'Fine-art watercolor with luminous pigment blooms',
        color: 'from-cyan-300 to-blue-400',
        emoji: '💧',
        image: '/style-transfer-images/watercolor-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'OIL_PAINTING',
        name: 'Oil Painting',
        description: 'Classical Rembrandt-style oil portrait with impasto',
        color: 'from-amber-500 to-orange-600',
        emoji: '🖼️',
        image: '/style-transfer-images/oilpainting-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'COMIC_BOOK',
        name: 'Comic Book',
        description: 'Bold ink outlines, halftone textures, flat colors',
        color: 'from-yellow-400 to-red-500',
        emoji: '💥',
        image: '/style-transfer-images/comicbook-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'CYBERPUNK',
        name: 'Cyberpunk',
        description: 'Neon-lit futuristic portrait with holographic glitch',
        color: 'from-purple-500 to-cyan-500',
        emoji: '🤖',
        image: '/style-transfer-images/cyberpunk-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'POP_ART',
        name: 'Pop Art',
        description: 'Andy Warhol / Lichtenstein bold graphic style',
        color: 'from-red-400 to-yellow-400',
        emoji: '🎭',
        image: '/style-transfer-images/popart-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'CLAYMATION',
        name: 'Claymation',
        description: 'Laika-style polymer clay sculpted portrait',
        color: 'from-orange-300 to-amber-500',
        emoji: '🏺',
        image: '/style-transfer-images/claymation-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'PIXEL_ART',
        name: 'Pixel Art',
        description: 'Retro 64x64 pixel sprite with Bayer dithering',
        color: 'from-green-400 to-emerald-600',
        emoji: '🕹️',
        image: '/style-transfer-images/pixelart-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'VINTAGE_FILM',
        name: 'Vintage Film',
        description: 'Kodak Portra analog grain with faded milky blacks',
        color: 'from-amber-300 to-yellow-600',
        emoji: '📽️',
        image: '/style-transfer-images/vintagefilm-style.png',
        categories: ['style-transfer']
    },
    {
        id: 'ACTION_FIGURE',
        name: 'Action Figure',
        description: 'Retail action-figure box with your likeness',
        color: 'from-blue-500 to-purple-600',
        emoji: '🦸',
        image: '/style-transfer-images/actionfigure-style.png',
        categories: ['style-transfer']
    }
];

const TABS = [
    { id: 'all', name: 'All Styles' },
    { id: 'cartoon', name: 'Cartoon' },
    { id: 'artistic', name: 'Artistic' },
    { id: '3d', name: '3D' },
    { id: 'realistic', name: 'Realistic' },
    { id: 'folkart', name: 'Persona Folk Art' },
    { id: 'style-transfer', name: '✨ Style Transfer' }
];

const Photobooth = ({ onBack }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('VIBRANT');
    const [activeTab, setActiveTab] = useState('all');
    const [imageSrc, setImageSrc] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [swappedImage, setSwappedImage] = useState(null);
    const [nickname, setNickname] = useState('');
    const [backstory, setBackstory] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [currentStep, setCurrentStep] = useState('selection');

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleDownload = async () => {
        if (!swappedImage) return;
        try {
            const response = await fetch(swappedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${nickname || 'caricature'}_caricature.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            window.open(swappedImage, '_blank');
        }
    };

    const handlePrint = () => {
        if (!swappedImage) return;

        const existingIframe = document.getElementById('print-iframe');
        if (existingIframe) {
            existingIframe.remove();
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.write(`
            <html>
                <head>
                    <title>Print</title>
                    <style>
                        @page { size: auto; margin: 0; }
                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: white; }
                        img { max-width: 100%; max-height: 100%; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${swappedImage}" onload="setTimeout(() => { window.print(); }, 200);" />
                </body>
            </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 500);
    };

    // Fetch history
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await photoboothService.getHistory();
            if (res.data && res.data.success) {
                setHistory(res.data.history || []);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    // Start webcam
    const startCamera = async () => {
        setIsCameraActive(true);
        setSwappedImage(null);
        setNickname('');
        setBackstory('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Webcam access error:", err);
            setIsCameraActive(false);
            alert("Could not access webcam. Please upload an image instead.");
        }
    };

    // Capture photo
    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImageSrc(dataUrl);
            stopCamera();
        }
    };

    // Stop webcam
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    // File upload handler
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
                setSwappedImage(null);
                setNickname('');
                setBackstory('');
            };
            reader.readAsDataURL(file);
        }
    };

    // Trigger AI generation
    const startFaceSwap = async () => {
        if (!imageSrc || !selectedTemplate) return;

        const templateObj = STYLES.find(s => s.id === selectedTemplate);
        const isPersona = templateObj?.isPersona;

        if (isPersona && !guestName.trim()) {
            alert('Please enter your name for the Folk Art Poster.');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await photoboothService.process(imageSrc, selectedTemplate);
            if (response.data && response.data.success) {
                const session = response.data.session;

                if (isPersona) {
                    try {
                        const quotes = PERSONA_QUOTES[selectedTemplate] || PERSONA_QUOTES.CREATOR;
                        const quote = quotes[Math.floor(Math.random() * quotes.length)];

                        // Render the composite card
                        const posterBase64 = await renderPersonaCard(session.resultImage, guestName, selectedTemplate, quote);

                        // Upload poster back to server
                        const uploadResponse = await photoboothService.uploadPoster(session._id, posterBase64);
                        if (uploadResponse.data && uploadResponse.data.success) {
                            const updatedSession = uploadResponse.data.session;
                            setSwappedImage(updatedSession.resultImage);
                            setNickname(guestName);
                            setBackstory(quote);
                        } else {
                            // Fallback to the restyled face if upload fails
                            setSwappedImage(session.resultImage);
                            setNickname(guestName);
                            setBackstory(quote);
                        }
                    } catch (canvasErr) {
                        console.error('Canvas poster rendering or upload failed:', canvasErr);
                        // Fallback to the restyled face
                        setSwappedImage(session.resultImage);
                        setNickname(guestName);
                        setBackstory('Folk Art Restyling');
                    }
                } else {
                    setSwappedImage(session.resultImage);
                    setNickname(session.nickname);
                    setBackstory(session.backstory);
                }

                fetchHistory(); // Refresh history
            } else {
                alert(response.data.message || 'Restyling failed. Please check backend config.');
            }
        } catch (err) {
            console.error('Error generating AI photo:', err);
            alert(err.response?.data?.message || 'Error communicating with AI restyling server.');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetBooth = () => {
        setImageSrc(null);
        setSwappedImage(null);
        setNickname('');
        setBackstory('');
        setGuestName('');
        stopCamera();
    };

    // Filter styles by tab
    const filteredStyles = STYLES.filter(tpl => {
        if (activeTab === 'all') return true;
        return tpl.categories.includes(activeTab);
    });

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-start text-slate-800 px-8 pb-20 pt-[124px] overflow-y-auto font-sans bg-slate-50 z-10">

            {/* Header */}
            <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-8 gap-4 z-10">
                <button
                    onClick={() => { stopCamera(); onBack(); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:shadow transition-all"
                >
                    <MdArrowBack className="w-5 h-5 text-indigo-650" /> Back to Engage
                </button>

                <div className="flex flex-col items-center text-center relative">
                    {/* Hand-drawn arrow illustration SVG */}
                    <div className="absolute -left-12 top-2 hidden lg:block text-indigo-500">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 32C10 24 16 18 28 12M28 12C24 12 18 13 14 15M28 12C26 16 23 22 21 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-2 text-indigo-905">
                        AI Photobooth
                        <span className="text-blue-500">
                            <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 font-semibold mt-1">Transform yourself into fun characters instantly</p>
                </div>

                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-indigo-200 rounded-xl font-bold text-indigo-750 shadow-sm hover:shadow transition-all"
                >
                    <MdHistory className="w-5 h-5" /> {showHistory ? 'Use Photobooth' : 'View History'}
                </button>
            </div>

            {showHistory ? (
                /* History Screen */
                <div className="w-full max-w-7xl bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl animate-fade-in">
                    <h2 className="text-2xl font-black text-slate-850 mb-6 flex items-center gap-2">
                        <span className="w-3.5 h-3.5 bg-indigo-600 rounded-full"></span> Previous Creations
                    </h2>
                    {history.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-semibold italic">No creations found. Capture or upload one to get started!</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {history.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => window.open(item.resultImage, '_blank')}
                                    className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                    title="Click to view full size"
                                >
                                    <div className={`${STYLES.some(s => s.id === item.style && s.isPersona) ? 'aspect-video' : 'aspect-square'} w-full rounded-xl overflow-hidden relative border border-slate-200 bg-white flex items-center justify-center`}>
                                        <img src={item.resultImage} alt={item.style} className="w-full h-full object-cover" />
                                        <span className="absolute bottom-3 left-3 bg-indigo-650 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                            {item.style}
                                        </span>
                                    </div>
                                    {item.nickname && (
                                        <div className="flex flex-col gap-1">
                                            <h4 className="font-extrabold text-sm text-indigo-905">{item.nickname}</h4>
                                            <p className="text-xs text-slate-500 italic leading-relaxed">"{item.backstory}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : currentStep === 'selection' ? (
                /* Style Selection Screen */
                <div className="flex flex-col gap-10 w-full max-w-7xl z-10 animate-fade-in">

                    {/* Section 1: Caricature Avatars */}
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wider text-indigo-905 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-650 rounded-full"></span>
                            Caricature Avatars
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {STYLES.filter(s => !s.isPersona && !s.categories.includes('style-transfer')).map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => {
                                        setSelectedTemplate(tpl.id);
                                        setCurrentStep('capture');
                                    }}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl p-3 text-left transition-all hover:scale-105 active:scale-98 shadow-sm hover:shadow-md flex flex-col gap-3 group"
                                >
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                                        {tpl.popular && (
                                            <span className="absolute top-2 right-2 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{tpl.name}</h3>
                                        <p className="text-[10px] text-slate-450 leading-snug">{tpl.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Folk Art Posters */}
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wider text-indigo-905 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-650 rounded-full"></span>
                            Folk Art Posters
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {STYLES.filter(s => s.isPersona).map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => {
                                        setSelectedTemplate(tpl.id);
                                        setCurrentStep('capture');
                                    }}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl p-3 text-left transition-all hover:scale-105 active:scale-98 shadow-sm hover:shadow-md flex flex-col gap-3 group"
                                >
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{tpl.name}</h3>
                                        <p className="text-[10px] text-slate-450 leading-snug">{tpl.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Style Transfer */}
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wider text-indigo-905 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            ✨ Style Transfer
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {STYLES.filter(s => s.categories.includes('style-transfer')).map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => {
                                        setSelectedTemplate(tpl.id);
                                        setCurrentStep('capture');
                                    }}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl p-3 text-left transition-all hover:scale-105 active:scale-98 shadow-sm hover:shadow-md flex flex-col gap-3 group"
                                >
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                                        {tpl.popular && (
                                            <span className="absolute top-2 right-2 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-tight group-hover:text-purple-600 transition-colors">{tpl.name}</h3>
                                        <p className="text-[10px] text-slate-450 leading-snug">{tpl.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Photobooth Capture/Editor Screen */
                <div className="flex flex-col gap-6 w-full max-w-7xl z-10 animate-fade-in">

                    {/* Header bar with Ghibli-style pill on top */}
                    <div className="flex items-center justify-between w-full border-b border-slate-200/80 pb-4 mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Step 2</span>
                            <h2 className="text-2xl font-black text-slate-850 uppercase tracking-tight">Capture Your Photo</h2>
                        </div>
                        {(() => {
                            const activeStyle = STYLES.find(s => s.id === selectedTemplate);
                            if (!activeStyle) return null;
                            return (
                                <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200/50 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                    {activeStyle.name}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">

                        {/* Left Column: Camera / Captured Preview */}
                        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl flex flex-col gap-5 min-h-[460px]">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Camera</h3>

                            <div className="flex-1 w-full relative bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                                {isCameraActive ? (
                                    <div className="w-full h-full relative flex flex-col items-center justify-center bg-black min-h-[350px]">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover max-h-[360px]"></video>
                                        <div className="absolute bottom-4 flex gap-4">
                                            <button
                                                onClick={capturePhoto}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                                            >
                                                <MdCameraAlt className="w-5 h-5" /> Capture
                                            </button>
                                            <button
                                                onClick={stopCamera}
                                                className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : swappedImage ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                        <div className={`relative w-full ${STYLES.some(s => s.id === selectedTemplate && s.isPersona) ? 'max-w-xl aspect-video' : 'max-w-sm aspect-square'} rounded-2xl overflow-hidden shadow-md border border-indigo-100 bg-white flex items-center justify-center`}>
                                            <img src={swappedImage} alt="Swapped face" className="w-full h-full object-contain" />
                                            <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                                                ✨ AI RESTYLED
                                            </span>
                                        </div>
                                    </div>
                                ) : imageSrc ? (
                                    <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-4 bg-slate-900">
                                        <img src={imageSrc} alt="Preview" className="max-h-[320px] rounded-xl object-contain border border-slate-800 shadow-sm" />
                                        <button
                                            onClick={resetBooth}
                                            className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-550 shadow transition-colors"
                                            title="Reset photo"
                                        >
                                            <MdRefresh className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                            <MdFace className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 mb-1 text-sm">Camera Offline</h3>
                                        <p className="text-xs text-slate-450 leading-relaxed mb-6">
                                            Start live webcam to capture a portrait photo.
                                        </p>
                                        <button
                                            onClick={startCamera}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow hover:shadow-md transition-all"
                                        >
                                            <MdCameraAlt className="w-4 h-4" /> Start Webcam
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Library Upload, Name Entry, Convert Button */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* File Library Card */}
                            {!swappedImage && (
                                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Photo Library</h3>
                                    <p className="text-[11px] text-slate-450 leading-relaxed">
                                        Prefer an existing image? Pick one from your device and keep the same selected style.
                                    </p>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 border border-dashed border-slate-200/80 rounded-2xl transition-all group"
                                    >
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">CHOOSE FROM LIBRARY</span>
                                        <MdCloudUpload className="w-5 h-5 text-indigo-600" />
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    {/* Small preview of uploaded source image */}
                                    {imageSrc && (
                                        <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl animate-fade-in">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                                                <img src={imageSrc} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700 truncate">Source Photo Loaded</p>
                                                <p className="text-[10px] text-slate-400">Ready to restyle</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Guest Name Input (only show if selected style is a Persona theme and NOT swapped yet) */}
                            {!swappedImage && STYLES.find(tpl => tpl.id === selectedTemplate)?.isPersona && (
                                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl flex flex-col gap-4 animate-fade-in">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                        Enter Your Name for Poster
                                    </label>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Type your name here..."
                                        maxLength={28}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none transition duration-350"
                                    />
                                </div>
                            )}

                            {/* Action Buttons Box */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl flex flex-col gap-4">
                                {swappedImage ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-xs text-green-600 font-bold flex items-center gap-1">✨ Photo generated successfully!</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={handleDownload}
                                                className="bg-[#dffe00] hover:bg-[#c5ff00] text-black font-extrabold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 text-xs"
                                            >
                                                <MdFileDownload className="w-5 h-5 text-black" />
                                                Save
                                            </button>
                                            <button
                                                onClick={resetBooth}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 text-xs"
                                            >
                                                <MdRefresh className="w-5 h-5 text-[#dffe00]" />
                                                Retry
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 text-xs"
                                            >
                                                <MdPrint className="w-5 h-5 text-white" />
                                                Print
                                            </button>
                                        </div>

                                        <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex items-center justify-between mt-2">
                                            <span className="text-xs font-bold text-slate-700">Share Result</span>
                                            <button
                                                onClick={() => setShowQrModal(true)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg flex items-center gap-1 text-[10px] font-extrabold shadow-sm"
                                            >
                                                <MdQrCode className="w-3.5 h-3.5 text-[#dffe00]" />
                                                QR Code
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={startFaceSwap}
                                        disabled={!imageSrc || !selectedTemplate || isProcessing}
                                        className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${imageSrc && selectedTemplate && !isProcessing
                                            ? 'bg-gradient-to-r from-indigo-650 to-violet-600 hover:from-indigo-700 hover:to-violet-750 text-white hover:scale-[1.01] hover:shadow-indigo-200'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating.....
                                            </>
                                        ) : (
                                            <>Convert This Photo ✨</>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        stopCamera();
                                        setCurrentStep('selection');
                                    }}
                                    className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
                                >
                                    ← Pick Another Style
                                </button>

                                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-450 font-semibold mt-1">
                                    <MdLock className="w-3.5 h-3.5" /> Your photo is safe and secure with us.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* QR Code Modal Overlay */}
            {showQrModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowQrModal(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl mx-4 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-slate-850 mb-2">Scan QR Code</h3>
                        <p className="text-xs text-slate-500 mb-6">Scan with your phone camera to download or share your caricature!</p>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-inner">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(swappedImage)}`}
                                alt="QR Code"
                                className="w-48 h-48 rounded-lg"
                            />
                        </div>

                        <button
                            onClick={() => setShowQrModal(false)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors text-sm shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Photobooth;
