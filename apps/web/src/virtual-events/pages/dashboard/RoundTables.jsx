import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { FiX } from 'react-icons/fi';

const RoundTables = () => {
    const [roundTablesConfig, setRoundTablesConfig] = useState({
        bgImage: '/virtual-events-assets/round-tables-bg.jpg',
        points: [],
        posters: []
    });
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [playingVideoUrl, setPlayingVideoUrl] = useState(null);
    const [activePosterUrl, setActivePosterUrl] = useState(null);

    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com/watch?v=')) {
            const base = url.replace('youtube.com/watch?v=', 'youtube.com/embed/').split('&')[0];
            return `${base}?controls=0&disablekb=1&modestbranding=1&rel=0&autoplay=1&iv_load_policy=3`;
        }
        if (url.includes('youtu.be/')) {
            const base = url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
            return `${base}?controls=0&disablekb=1&modestbranding=1&rel=0&autoplay=1&iv_load_policy=3`;
        }
        return url;
    };

    useEffect(() => {
        const fetchRoundTablesLayout = async () => {
            try {
                const response = await configService.getConfig('round_tables_layout');
                if (response.data && response.data.value) {
                    setRoundTablesConfig(JSON.parse(response.data.value));
                }
            } catch (err) {
                console.error('Failed to load round tables layout config', err);
            }
        };

        fetchRoundTablesLayout();
        const interval = setInterval(() => {
            fetchRoundTablesLayout();
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handlePointClick = (pointId) => {
        setSelectedRoomId(pointId);
    };

    const selectedRoomData = selectedRoomId ? roundTablesConfig.points.find(p => p.id === selectedRoomId) : null;
    const roomSchedule = selectedRoomData?.schedule || [];

    return (
        <div className="absolute inset-0 w-full h-full overflow-auto hide-scrollbar bg-neutral-900">
            {/* Background Canvas automatically scales to image aspect ratio */}
            <div className="relative w-full min-w-[1200px] h-auto mx-auto z-0">
                <img 
                    src={roundTablesConfig.bgImage || '/virtual-events-assets/round-tables-bg.jpg'} 
                    alt="Round Tables"
                    className="w-full h-auto pointer-events-none block"
                />

                {/* Customizable Posters */}
                {roundTablesConfig.posters && roundTablesConfig.posters.map(poster => (
                    <div
                        key={poster.id}
                        className={`absolute z-10 overflow-hidden ${poster.imageUrl ? 'pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200' : 'pointer-events-none'}`}
                        style={{
                            top: `${poster.top}%`,
                            left: `${poster.left}%`,
                            width: `${poster.width}%`,
                            height: `${poster.height}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        onClick={() => poster.imageUrl && setActivePosterUrl(poster.imageUrl)}
                    >
                        {poster.imageUrl && (
                            <img 
                                src={poster.imageUrl} 
                                alt="Poster"
                                className="w-full h-full object-cover"
                                style={{ imageRendering: 'high-quality' }}
                            />
                        )}
                    </div>
                ))}

                {/* Customizable Text Overlays for Tables */}
                {roundTablesConfig.points && roundTablesConfig.points.map(point => (
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
                            onClick={() => handlePointClick(point.id)}
                            className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center pointer-events-auto cursor-pointer z-20"
                        >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white"></span>
                        </div>

                        {/* Content container shifted exactly above the coordinate */}
                        <div 
                            onClick={() => handlePointClick(point.id)}
                            className="absolute bottom-1 left-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-all z-10 hover:scale-105"
                        >
                            {/* Discussion Text Bubble */}
                            <div className="bg-black/90 text-white rounded-xl p-2.5 shadow-2xl border border-blue-500/30 max-w-[200px] text-center">
                                <p className="text-[10px] font-semibold leading-normal whitespace-nowrap">
                                    {point.text}
                                </p>
                            </div>
                            {/* Connecting Stem Line */}
                            <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-blue-400" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Room Schedule Modal */}
            {selectedRoomId && selectedRoomData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-5xl rounded-2xl bg-primary/90 text-white shadow-2xl backdrop-blur-xl border border-white/20 animate-slide-up flex flex-col overflow-hidden max-h-[90vh]">
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedRoomId(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white z-10"
                        >
                            <FiX size={20} />
                        </button>

                        {/* Header */}
                        <div className="pt-8 pb-4 px-8 text-center relative z-0">
                            <h2 className="text-3xl font-bold tracking-wider uppercase">{selectedRoomData.text}</h2>
                        </div>

                        {/* Table Content */}
                        <div className="px-6 pb-8 overflow-y-auto overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b-2 border-white/30 text-white/90">
                                        <th className="py-4 px-4 font-semibold w-12 text-center">#</th>
                                        <th className="py-4 px-4 font-semibold w-[45%]">Title</th>
                                        <th className="py-4 px-4 font-semibold text-center">Presenter</th>
                                        <th className="py-4 px-4 font-semibold text-center">Start</th>
                                        <th className="py-4 px-4 font-semibold text-center">End</th>
                                        <th className="py-4 px-4 font-semibold text-center w-24">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roomSchedule.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-white/70 italic">
                                                No schedule available for this table.
                                            </td>
                                        </tr>
                                    ) : (
                                        roomSchedule.map((item, index) => (
                                            <tr 
                                                key={item.id || index} 
                                                className="border-b border-white/20 hover:bg-white/10 transition-colors"
                                            >
                                                <td className="py-4 px-4 font-bold text-center">{index + 1}</td>
                                                <td className="py-4 px-4 text-sm font-medium leading-relaxed">{item.title}</td>
                                                <td className="py-4 px-4 text-sm text-center font-semibold">{item.presenter}</td>
                                                <td className="py-4 px-4 text-sm text-center">
                                                    {item.start ? new Date(`1970-01-01T${item.start}`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-center">
                                                    {item.end ? new Date(`1970-01-01T${item.end}`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex flex-col gap-2 items-center justify-center">
                                                        {(item.zoomLink || item.ytLink) ? (
                                                            <button 
                                                                onClick={() => setPlayingVideoUrl(getEmbedUrl(item.zoomLink || item.ytLink))}
                                                                className="bg-neutral-900 hover:bg-black text-white text-sm font-bold py-2 px-8 rounded-md transition-colors shadow-lg cursor-pointer"
                                                            >
                                                                Join
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-white/50 italic">No Links</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Embedded Video Modal */}
            {playingVideoUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
                        <div className="bg-neutral-900 p-3 flex justify-between items-center shrink-0">
                            <span className="text-white font-bold text-sm tracking-wide px-2">Video Player</span>
                            <button 
                                onClick={() => setPlayingVideoUrl(null)}
                                className="text-white/70 hover:text-white transition-colors p-1"
                            >
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="relative w-full h-full flex-1">
                            {playingVideoUrl.includes('youtube.com') && (
                                <>
                                    {/* Visually hide top header (Title) with a black bar */}
                                    <div className="absolute top-0 left-0 w-full h-[14%] z-10 bg-black cursor-pointer" onClick={(e) => e.stopPropagation()}></div>
                                    {/* Visually hide bottom footer (Share, Watch on YouTube, More Videos) with a black bar */}
                                    <div className="absolute bottom-0 left-0 w-full h-[15%] z-10 bg-black cursor-pointer" onClick={(e) => e.stopPropagation()}></div>
                                </>
                            )}
                            <iframe 
                                src={playingVideoUrl}
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
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

export default RoundTables;
