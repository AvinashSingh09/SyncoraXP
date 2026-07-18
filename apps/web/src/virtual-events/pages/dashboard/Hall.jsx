import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi';
import { configService } from '../../services/api';

const Hall = () => {
    const { hallId } = useParams();
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
    const { layoutConfigs } = useOutletContext();

    const halls = ['A', 'B', 'C'];
    const currentId = hallId ? hallId.toUpperCase() : 'A';
    const currentIndex = halls.indexOf(currentId);

    // Config State
    const [hallConfig, setHallConfig] = useState(() => {
        const key = `hall_${currentId.toLowerCase()}_layout`;
        if (layoutConfigs && layoutConfigs[key]) {
            return layoutConfigs[key];
        }
        return { bgImage: '/virtual-events-assets/expo-bg.jpg', points: [], posters: [] };
    });
    const [isZooming, setIsZooming] = useState(null);
    const [activePosterUrl, setActivePosterUrl] = useState(null);

    useEffect(() => {
        const key = `hall_${currentId.toLowerCase()}_layout`;
        if (layoutConfigs && layoutConfigs[key]) {
            setHallConfig(layoutConfigs[key]);
            return;
        }

        const fetchConfig = async () => {
            try {
                const response = await configService.getConfig(key);
                if (response.data && response.data.value) {
                    setHallConfig(JSON.parse(response.data.value));
                } else {
                    setHallConfig({ bgImage: '/virtual-events-assets/expo-bg.jpg', points: [], posters: [] });
                }
            } catch (err) {
                console.error(`Failed to load config for Hall ${currentId}`, err);
            }
        };
        fetchConfig();
    }, [currentId, layoutConfigs]);

    // Prefetch booths in this hall
    useEffect(() => {
        if (hallConfig && hallConfig.points) {
            hallConfig.points.forEach(point => {
                if (point.targetPage) {
                    const match = point.targetPage.match(/\/booth\/(\w+)/);
                    if (match && match[1]) {
                        configService.preloadBooth(match[1]);
                    }
                }
            });
        }
    }, [hallConfig]);

    // Loop around logic
    const prevHall = currentIndex > 0 ? halls[currentIndex - 1] : halls[halls.length - 1];
    const nextHall = currentIndex < halls.length - 1 ? halls[currentIndex + 1] : halls[0];

    return (
        <div className="w-full h-full relative overflow-hidden bg-black flex flex-col">
            {/* Top Bar for Navigation */}
            <div className="absolute top-0 left-0 w-full p-6 sm:p-8 z-20 flex justify-between items-start pointer-events-none">
                <button
                    onClick={() => navigate('/virtual-events-platform/app/dashboard/expo-hall')}
                    className="pointer-events-auto bg-white/90 backdrop-blur hover:bg-white text-gray-800 font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-2xl border border-gray-200 group"
                >
                    <FiArrowLeft className="w-6 h-6 text-blue-600 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xl">Back to Expo Halls</span>
                </button>

                <div className="bg-black/70 backdrop-blur-md px-10 py-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center justify-center text-center pointer-events-auto">
                    <span className="text-blue-400 font-bold tracking-[0.3em] text-sm mb-1 uppercase">Currently Viewing</span>
                    <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">HALL {currentId}</h1>
                </div>
            </div>

            {/* Left & Right Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-start pl-6 z-20 pointer-events-none">
                <button
                    onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${prevHall.toLowerCase()}`)}
                    title={`Go to Hall ${prevHall}`}
                    className="pointer-events-auto bg-black/40 hover:bg-black/80 text-white p-5 rounded-full backdrop-blur-md border border-white/20 transition-all transform hover:scale-110 shadow-2xl group"
                >
                    <FiArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-end pr-6 z-20 pointer-events-none">
                <button
                    onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${nextHall.toLowerCase()}`)}
                    title={`Go to Hall ${nextHall}`}
                    className="pointer-events-auto bg-black/40 hover:bg-black/80 text-white p-5 rounded-full backdrop-blur-md border border-white/20 transition-all transform hover:scale-110 shadow-2xl group"
                >
                    <FiArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* 3D World Wrapper */}
            <div 
                className="absolute inset-0 transition-all duration-1000 ease-in-out"
                style={isZooming ? {
                    transformOrigin: `${isZooming.left}% ${isZooming.top}%`,
                    transform: 'scale(6)',
                    opacity: 0
                } : {
                    transformOrigin: '50% 50%',
                    transform: 'scale(1)',
                    opacity: 1
                }}
            >
                {/* Interactive Areas (Points & Posters) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Posters */}
                {hallConfig.posters && hallConfig.posters.map(poster => (
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
                                src={poster.videoUrl}
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

                {/* Points */}
                {hallConfig.points && hallConfig.points.map(point => (
                    <div
                        key={point.id}
                        className="absolute z-20"
                        style={{
                            top: `${point.top}%`,
                            left: `${point.left}%`
                        }}
                    >
                         {/* Connecting Stem Line */}
                        <div className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all hover:scale-105 z-10"
                            onMouseEnter={() => {
                                if (point.targetPage) {
                                    const match = point.targetPage.match(/\/booth\/(\w+)/);
                                    if (match && match[1]) {
                                        configService.preloadBooth(match[1]);
                                    }
                                }
                            }}
                            onClick={() => {
                                if (point.targetPage) {
                                    if (point.targetPage.startsWith('http')) {
                                        window.open(point.targetPage, '_blank');
                                    } else {
                                        setIsZooming(point);
                                        setTimeout(() => {
                                            navigateTo(point.targetPage);
                                        }, 850);
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

                        {/* Pulsing Dot */}
                        <div 
                            className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center pointer-events-auto cursor-pointer z-20"
                            onMouseEnter={() => {
                                if (point.targetPage) {
                                    const match = point.targetPage.match(/\/booth\/(\w+)/);
                                    if (match && match[1]) {
                                        configService.preloadBooth(match[1]);
                                    }
                                }
                            }}
                            onClick={() => {
                                if (point.targetPage) {
                                    if (point.targetPage.startsWith('http')) {
                                        window.open(point.targetPage, '_blank');
                                    } else {
                                        setIsZooming(point);
                                        setTimeout(() => {
                                            navigateTo(point.targetPage);
                                        }, 850);
                                    }
                                }
                            }}
                        >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full z-0">
                <img
                    src={hallConfig.bgImage || "/virtual-events-assets/expo-bg.jpg"}
                    alt={`Expo Hall ${hallId}`}
                    className="w-full h-full object-cover object-center animate-fade-in"
                />
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(1.03); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
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

export default Hall;
