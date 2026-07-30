import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { FiX } from 'react-icons/fi';

const SESSION_TIMESTAMP = Date.now();

const Lounge = () => {
    const [loungeConfig, setLoungeConfig] = useState({
        bgImage: null,
        points: [],
        posters: []
    });
    const [bustedBgImage, setBustedBgImage] = useState(null);
    const [activePosterUrl, setActivePosterUrl] = useState(null);

    useEffect(() => {
        const fetchLoungeLayout = async () => {
            try {
                const response = await configService.getConfig('lounge_layout');
                let newBg = '/virtual-events-assets/lounge-bg.jpg';
                let newPoints = [];
                let newPosters = [];
                if (response.data && response.data.value) {
                    const parsed = JSON.parse(response.data.value);
                    newBg = parsed.bgImage || '/virtual-events-assets/lounge-bg.jpg';
                    newPoints = parsed.points || [];
                    newPosters = parsed.posters || [];
                }

                setLoungeConfig(prev => {
                    const isBgChanged = prev.bgImage !== newBg;
                    const isPointsChanged = JSON.stringify(prev.points) !== JSON.stringify(newPoints);
                    const isPostersChanged = JSON.stringify(prev.posters) !== JSON.stringify(newPosters);
                    
                    if (isBgChanged || isPointsChanged || isPostersChanged) {
                        if (isBgChanged) {
                            if (newBg.startsWith('data:')) {
                                setBustedBgImage(newBg);
                            } else {
                                const cleanUrl = newBg.split('?')[0];
                                setBustedBgImage(`${cleanUrl}?v=${SESSION_TIMESTAMP}`);
                            }
                        }
                        return { bgImage: newBg, points: newPoints, posters: newPosters };
                    }
                    return prev;
                });
            } catch (err) {
                console.error('Failed to load lounge layout config', err);
                setLoungeConfig(prev => {
                    if (prev.bgImage !== '/virtual-events-assets/lounge-bg.jpg') {
                        setBustedBgImage(`/virtual-events-assets/lounge-bg.jpg?v=${SESSION_TIMESTAMP}`);
                        return { bgImage: '/virtual-events-assets/lounge-bg.jpg', points: prev.points, posters: prev.posters };
                    }
                    return prev;
                });
            }
        };

        fetchLoungeLayout();
        const interval = setInterval(() => {
            fetchLoungeLayout();
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-auto hide-scrollbar bg-neutral-900">
            {/* Background Canvas automatically scales to image aspect ratio */}
            <div className="relative w-full min-w-[1200px] h-auto mx-auto z-0">
                {bustedBgImage && (
                    <img 
                        src={bustedBgImage} 
                        alt="Lounge"
                        className="w-full h-auto pointer-events-none block"
                    />
                )}

            {/* Posters */}
            {loungeConfig.posters && loungeConfig.posters.map(poster => (
                <div
                    key={poster.id}
                    className={`absolute z-10 overflow-hidden ${poster.type !== 'youtube' && poster.imageUrl ? 'pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200' : (poster.type === 'youtube' ? 'pointer-events-auto' : 'pointer-events-none')}`}
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
                    }}
                    onClick={() => poster.type !== 'youtube' && poster.imageUrl && setActivePosterUrl(poster.imageUrl)}
                >
                    {poster.type === 'youtube' ? (
                        poster.videoUrl && (
                            <iframe 
                                src={poster.videoUrl} 
                                className="w-full h-full border-0" 
                                title="YouTube Video" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )
                    ) : (
                        poster.imageUrl && (
                            <img 
                                src={poster.imageUrl} 
                                alt="Poster"
                                className="w-full h-full object-cover"
                                style={{ imageRendering: 'high-quality' }}
                            />
                        )
                    )}
                </div>
            ))}

            {/* Customizable Text Overlays for Tables */}
            {loungeConfig.points && loungeConfig.points.map(point => (
                <div
                    key={point.id}
                    className="absolute z-10 pointer-events-none"
                    style={{
                        top: `${point.top}%`,
                        left: `${point.left}%`
                    }}
                >
                    {/* Pulsing Dot resting on the coordinates */}
                    <div 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: point.text } }));
                        }}
                        className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-pointer z-20"
                        style={{
                            width: `${point.size || 24}px`,
                            height: `${point.size || 24}px`
                        }}
                    >
                        <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: point.color || '#f87171' }}
                        ></span>
                        <span 
                            className="relative inline-flex rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform"
                            style={{ 
                                width: `${(point.size || 24) * 0.6}px`, 
                                height: `${(point.size || 24) * 0.6}px`,
                                backgroundColor: point.color || '#ef4444' 
                            }}
                        ></span>
                    </div>

                    {/* Content container shifted exactly above the coordinate */}
                    <div 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: point.text } }));
                        }}
                        className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 hover:scale-105"
                    >
                        {/* Discussion Text Bubble */}
                        <div 
                            className="bg-black/90 text-white rounded-xl p-3 shadow-2xl border border-red-500/30 text-center"
                            style={{ maxWidth: `${point.boxWidth || 200}px` }}
                        >
                            <p 
                                className="font-semibold leading-normal whitespace-normal break-words"
                                style={{ fontSize: `${point.fontSize || 10}px` }}
                            >
                                {point.text}
                            </p>
                        </div>
                        {/* Connecting Stem Line */}
                        <div className="w-0.5 h-6 bg-gradient-to-b from-red-500 to-red-400" />
                    </div>
                </div>
            ))}
            </div>

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

export default Lounge;
