import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';

const SESSION_TIMESTAMP = Date.now();

const Lounge = () => {
    const [loungeConfig, setLoungeConfig] = useState({
        bgImage: null,
        points: []
    });
    const [bustedBgImage, setBustedBgImage] = useState(null);

    useEffect(() => {
        const fetchLoungeLayout = async () => {
            try {
                const response = await configService.getConfig('lounge_layout');
                let newBg = '/virtual-events-assets/lounge-bg.jpg';
                let newPoints = [];
                if (response.data && response.data.value) {
                    const parsed = JSON.parse(response.data.value);
                    newBg = parsed.bgImage || '/virtual-events-assets/lounge-bg.jpg';
                    newPoints = parsed.points || [];
                }

                setLoungeConfig(prev => {
                    const isBgChanged = prev.bgImage !== newBg;
                    const isPointsChanged = JSON.stringify(prev.points) !== JSON.stringify(newPoints);
                    
                    if (isBgChanged || isPointsChanged) {
                        if (isBgChanged) {
                            if (newBg.startsWith('data:')) {
                                setBustedBgImage(newBg);
                            } else {
                                const cleanUrl = newBg.split('?')[0];
                                setBustedBgImage(`${cleanUrl}?v=${SESSION_TIMESTAMP}`);
                            }
                        }
                        return { bgImage: newBg, points: newPoints };
                    }
                    return prev;
                });
            } catch (err) {
                console.error('Failed to load lounge layout config', err);
                setLoungeConfig(prev => {
                    if (prev.bgImage !== '/virtual-events-assets/lounge-bg.jpg') {
                        setBustedBgImage(`/virtual-events-assets/lounge-bg.jpg?v=${SESSION_TIMESTAMP}`);
                        return { bgImage: '/virtual-events-assets/lounge-bg.jpg', points: prev.points };
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
                        className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3.5 w-3.5 items-center justify-center pointer-events-auto cursor-pointer z-20"
                    >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                    </div>

                    {/* Content container shifted exactly above the coordinate */}
                    <div 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: point.text } }));
                        }}
                        className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 hover:scale-105"
                    >
                        {/* Discussion Text Bubble */}
                        <div className="bg-black/90 text-white rounded-xl p-3 shadow-2xl border border-red-500/30 max-w-[200px] text-center">
                            <p className="text-[10px] font-semibold leading-normal whitespace-nowrap">
                                {point.text}
                            </p>
                        </div>
                        {/* Connecting Stem Line */}
                        <div className="w-0.5 h-6 bg-gradient-to-b from-red-500 to-red-400" />
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
};

export default Lounge;
