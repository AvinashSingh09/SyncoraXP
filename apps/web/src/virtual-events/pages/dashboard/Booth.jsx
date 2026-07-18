import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi';
import { FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaLinkedin, FaTiktok, FaWhatsapp, FaTelegram, FaDiscord, FaPinterest, FaSnapchat, FaReddit, FaGlobe } from 'react-icons/fa';
import { configService, authService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ResourceCenterModal from '../../components/ResourceCenterModal';
import ProductGalleryModal from '../../components/ProductGalleryModal';

const Booth = () => {
    const { hallId, boothId } = useParams();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const navigateTo = (path) => {
        let target = path;
        if (target.startsWith('/dashboard')) {
            target = `/virtual-events-platform/app${target}`;
        } else if (target.startsWith('dashboard')) {
            target = `/virtual-events-platform/app/${target}`;
        }
        navigate(target);
    };

    // Fetch booth-specific config from the DB
    const [bgImage, setBgImage] = useState('');
    const [points, setPoints] = useState([]);
    const [posters, setPosters] = useState([]);
    const [socialLinks, setSocialLinks] = useState([]);
    const [activePosterUrl, setActivePosterUrl] = useState(null);
    const [resources, setResources] = useState({ documents: [], videos: [] });
    const [products, setProducts] = useState([]);
    const [showResourceCenter, setShowResourceCenter] = useState(false);
    const [showProductGallery, setShowProductGallery] = useState(false);
    const [showPointsToast, setShowPointsToast] = useState(false);
    const [boothVisitPoints, setBoothVisitPoints] = useState(50);

    useEffect(() => {
        const fetchBoothPoints = async () => {
            try {
                const res = await configService.getConfig('points_booth_visit');
                if (res.data && res.data.value) {
                    const parsed = parseInt(res.data.value);
                    if (!isNaN(parsed) && parsed > 0) {
                        setBoothVisitPoints(parsed);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchBoothPoints();
    }, []);

    useEffect(() => {
        if (!user || user.visitedBooths?.includes(`booth_${boothId}`)) return;

        const timer = setTimeout(async () => {
            try {
                const res = await authService.visitBooth(`booth_${boothId}`);
                if (res.data && res.data.earned) {
                    if (updateUser) {
                        updateUser(res.data.user);
                    }
                    setShowPointsToast(true);
                    setTimeout(() => setShowPointsToast(false), 4000);
                }
            } catch (err) {
                console.error('Failed to reward booth points', err);
            }
        }, 10000); // 10 seconds stay time lock

        return () => clearTimeout(timer);
    }, [boothId, user, updateUser]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const key = `booth_${boothId}_layout`;
                const response = await configService.getConfig(key);
                // Reset states
                setBgImage('');
                setPoints([]);
                setPosters([]);
                setSocialLinks([]);
                setResources({ documents: [], videos: [] });
                setProducts([]);

                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setBgImage(config.bgImage);
                    if (config.points) setPoints(config.points);
                    if (config.posters) setPosters(config.posters);
                    if (config.socialLinks) setSocialLinks(config.socialLinks);
                    if (config.resources) setResources(config.resources);
                    if (config.products) setProducts(config.products);
                }
            } catch (err) {
                console.error(`Failed to load config for Booth ${boothId}`, err);
            }
        };
        fetchConfig();
    }, [boothId]);

    const TOTAL_BOOTHS = 18;
    const currentBoothNum = parseInt(boothId) || 1;
    const prevBoothNum = currentBoothNum > 1 ? currentBoothNum - 1 : TOTAL_BOOTHS;
    const nextBoothNum = currentBoothNum < TOTAL_BOOTHS ? currentBoothNum + 1 : 1;

    const getEmbedUrl = (url) => {
        if (!url) return '';
        const params = 'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0';
        if (url.includes('youtube.com/embed/')) {
            return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
        }
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?${params}&playlist=${videoId}`;
        }
        return url;
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-black flex flex-col">
            {/* Top Bar for Navigation */}
            <div className="absolute top-0 left-0 w-full p-6 sm:p-8 z-20 flex justify-between items-start pointer-events-none">
                <button 
                    onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${hallId ? hallId.toLowerCase() : 'a'}`)}
                    className="pointer-events-auto bg-white/90 backdrop-blur hover:bg-white text-gray-800 font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-2xl border border-gray-200 group"
                >
                    <FiArrowLeft className="w-6 h-6 text-blue-600 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xl">Back to Hall {hallId ? hallId.toUpperCase() : 'A'}</span>
                </button>
                
                <div className="bg-black/70 backdrop-blur-md px-10 py-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center justify-center text-center pointer-events-auto">
                    <span className="text-blue-400 font-bold tracking-[0.3em] text-sm mb-1 uppercase">Exhibitor</span>
                    <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">BOOTH {boothId}</h1>
                </div>
            </div>

            {/* Quick Navigation Arrows */}
            <button
                onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${hallId}/booth/${prevBoothNum}`)}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 z-20 shadow-2xl border border-white/10 group"
            >
                <FiArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <button
                onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${hallId}/booth/${nextBoothNum}`)}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 z-20 shadow-2xl border border-white/10 group"
            >
                <FiArrowRight className="w-8 h-8 sm:w-10 sm:h-10 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Background Image and Interactive Areas */}
            {bgImage ? (
                <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center bg-black overflow-hidden">
                    <div className="relative inline-flex max-w-full max-h-full items-center justify-center">
                        <img 
                            src={bgImage} 
                            alt={`Booth ${boothId}`} 
                            className="max-w-full max-h-screen block object-contain animate-fade-in"
                        />
                        
                        {/* Interactive Areas (Points & Posters) */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            {/* Posters */}
                             {posters && posters.map(poster => (
                                 <div
                                     key={poster.id}
                                     className={`absolute bg-black/20 flex items-center justify-center overflow-hidden z-10 shadow-2xl ${poster.type !== 'youtube' && poster.imageUrl ? 'pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200' : 'pointer-events-auto'}`}
                                     style={{
                                         top: `${poster.top}%`,
                                         left: `${poster.left}%`,
                                         width: `${poster.width}%`,
                                         height: `${poster.height}%`,
                                         transform: 'translate(-50%, -50%)',
                                         backgroundColor: poster.type === 'youtube' ? '#000' : 'transparent'
                                     }}
                                     onClick={() => poster.type !== 'youtube' && poster.imageUrl && setActivePosterUrl(poster.imageUrl)}
                                 >
                                     {poster.type === 'youtube' && poster.videoUrl && (
                                         <iframe 
                                             src={getEmbedUrl(poster.videoUrl)} 
                                             className="w-full h-full border-0 pointer-events-auto" 
                                             title="YouTube Video" 
                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                             allowFullScreen
                                         />
                                     )}
                                     {poster.type !== 'youtube' && poster.imageUrl && (
                                         <img 
                                             src={poster.imageUrl} 
                                             alt="Poster"
                                             className="w-full h-full object-cover pointer-events-none"
                                             style={{ imageRendering: 'high-quality' }}
                                         />
                                     )}
                                 </div>
                             ))}

                            {/* Dynamic Social Media Links */}
                            {socialLinks && socialLinks.map(social => {
                                let Icon = FaInstagram;
                                let hoverColor = 'hover:bg-pink-600';
                                
                                if (social.platform === 'facebook') {
                                    Icon = FaFacebook;
                                    hoverColor = 'hover:bg-blue-600';
                                } else if (social.platform === 'twitter') {
                                    Icon = FaTwitter;
                                    hoverColor = 'hover:bg-sky-500';
                                } else if (social.platform === 'youtube') {
                                    Icon = FaYoutube;
                                    hoverColor = 'hover:bg-red-600';
                                } else if (social.platform === 'linkedin') {
                                    Icon = FaLinkedin;
                                    hoverColor = 'hover:bg-blue-700';
                                } else if (social.platform === 'tiktok') {
                                    Icon = FaTiktok;
                                    hoverColor = 'hover:bg-black';
                                } else if (social.platform === 'whatsapp') {
                                    Icon = FaWhatsapp;
                                    hoverColor = 'hover:bg-green-500';
                                } else if (social.platform === 'telegram') {
                                    Icon = FaTelegram;
                                    hoverColor = 'hover:bg-blue-400';
                                } else if (social.platform === 'discord') {
                                    Icon = FaDiscord;
                                    hoverColor = 'hover:bg-indigo-500';
                                } else if (social.platform === 'pinterest') {
                                    Icon = FaPinterest;
                                    hoverColor = 'hover:bg-red-600';
                                } else if (social.platform === 'snapchat') {
                                    Icon = FaSnapchat;
                                    hoverColor = 'hover:bg-yellow-400 hover:text-black';
                                } else if (social.platform === 'reddit') {
                                    Icon = FaReddit;
                                    hoverColor = 'hover:bg-orange-500';
                                } else if (social.platform === 'website') {
                                    Icon = FaGlobe;
                                    hoverColor = 'hover:bg-emerald-500';
                                }
            
                                return (
                                    <div
                                        key={social.id}
                                        className="absolute pointer-events-auto z-30"
                                        style={{
                                            top: `${social.top}%`,
                                            left: `${social.left}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: social.width ? `${social.width}px` : '32px',
                                            height: social.height ? `${social.height}px` : '32px'
                                        }}
                                    >
                                        <a href={social.url || '#'} target="_blank" rel="noopener noreferrer" className={`w-full h-full bg-black/60 backdrop-blur-sm rounded-full border border-white/20 shadow-xl flex items-center justify-center text-white transition-colors transform hover:-translate-y-1 ${hoverColor}`}>
                                            <Icon style={{ width: '50%', height: '50%' }} />
                                        </a>
                                    </div>
                                );
                            })}

                            {/* Points */}
                            {points && points.map(point => (
                                <div
                                    key={point.id}
                                    className="absolute z-20"
                                    style={{
                                        top: `${point.top}%`,
                                        left: `${point.left}%`
                                    }}
                                >
                                    <div className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all hover:scale-105 z-10"
                                         onClick={() => {
                                             if (point.targetPage) {
                                                 if (point.targetPage === 'action:resource_center') {
                                                     setShowResourceCenter(true);
                                                 } else if (point.targetPage === 'action:product_gallery') {
                                                     setShowProductGallery(true);
                                                 } else if (point.targetPage.startsWith('user-chat:')) {
                                                     const userId = point.targetPage.substring(10).trim();
                                                     const assistantName = boothId === '10' ? 'MuscleBlaze' : `Booth ${boothId}`;
                                                     window.dispatchEvent(new CustomEvent('open-chat', { detail: { user: { _id: userId, firstName: assistantName, lastName: 'Assistant' } } }));
                                                 } else if (point.targetPage.startsWith('chat:')) {
                                                     const roomName = point.targetPage.substring(5).trim();
                                                     window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName } }));
                                                 } else if (point.targetPage.startsWith('http')) {
                                                     window.open(point.targetPage, '_blank');
                                                 } else {
                                                     navigateTo(point.targetPage);
                                                 }
                                             }
                                         }}
                                    >
                                        <div className="bg-black text-white rounded-xl p-2 shadow-2xl border border-blue-500/30 max-w-[150px] text-center hover:border-blue-400">
                                            <p className="text-[10px] font-semibold leading-tight whitespace-nowrap">
                                                {point.text}
                                            </p>
                                        </div>
                                        <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-blue-400" />
                                    </div>

                                    <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center pointer-events-auto cursor-pointer z-20">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-6 border border-zinc-700 shadow-xl">
                        <span className="text-zinc-500 text-4xl">🏗️</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-zinc-500 mb-2 uppercase tracking-widest">Booth Under Construction</h2>
                    <p className="text-zinc-600 text-lg">The exhibitor is currently setting up this space.</p>
                </div>
            )}
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(1.03); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {showResourceCenter && (
                <ResourceCenterModal 
                    onClose={() => setShowResourceCenter(false)} 
                    resources={resources} 
                    boothId={boothId}
                />
            )}

            {showProductGallery && (
                <ProductGalleryModal 
                    onClose={() => setShowProductGallery(false)} 
                    products={products} 
                    boothId={boothId}
                />
            )}

            {showPointsToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold text-amber-100">+{boothVisitPoints} points added to your score</p>
                    </div>
                </div>
            )}
            {/* Poster Lightbox Modal */}
            {activePosterUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
                    onClick={() => setActivePosterUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-lg overflow-hidden border border-white/20 p-2">
                        <button 
                            onClick={() => setActivePosterUrl(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/85 transition-colors text-white z-10"
                        >
                            <FiX size={20} />
                        </button>
                        <img 
                            src={activePosterUrl} 
                            alt="Poster Full View"
                            className="max-w-full max-h-[85vh] object-contain rounded"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Booth;
