import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { configService } from '../../services/api';
import { FiX, FiInfo, FiCalendar, FiMapPin, FiClock, FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';

const Lobby = () => {
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
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [lobbyConfig, setLobbyConfig] = useState(() => {
        if (layoutConfigs && layoutConfigs.lobby_layout) {
            return {
                bgImage: layoutConfigs.lobby_layout.bgImage || '/virtual-events-assets/lobby-bg.png',
                points: layoutConfigs.lobby_layout.points || [],
                posters: layoutConfigs.lobby_layout.posters || []
            };
        }
        return {
            bgImage: '/virtual-events-assets/lobby-bg.png',
            points: [],
            posters: []
        };
    });
    const [isZooming, setIsZooming] = useState(null);
    const [activePosterUrl, setActivePosterUrl] = useState(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello! I am your virtual receptionist. How can I help you today?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    // Scroll to bottom of chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isInfoModalOpen]);

    useEffect(() => {
        if (layoutConfigs && layoutConfigs.lobby_layout) {
            setLobbyConfig({
                bgImage: layoutConfigs.lobby_layout.bgImage || '/virtual-events-assets/lobby-bg.png',
                points: layoutConfigs.lobby_layout.points || [],
                posters: layoutConfigs.lobby_layout.posters || []
            });
            return;
        }

        const fetchLobbyConfig = async () => {
            try {
                const response = await configService.getConfig('lobby_layout');
                if (response.data && response.data.value) {
                    const parsedConfig = JSON.parse(response.data.value);
                    setLobbyConfig({
                        bgImage: parsedConfig.bgImage || '/virtual-events-assets/lobby-bg.png',
                        points: parsedConfig.points || [],
                        posters: parsedConfig.posters || []
                    });
                }
            } catch (error) {
                console.error("Failed to load lobby layout", error);
            }
        };

        fetchLobbyConfig();
    }, [layoutConfigs]);

    const getBotReply = (msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('schedule') || lowerMsg.includes('time')) {
            return "The keynote starts at 10:00 AM, followed by breakout sessions at 11:30 AM.";
        } else if (lowerMsg.includes('speaker') || lowerMsg.includes('who')) {
            return "Our main speakers include industry leaders from tech and design. You can check the Auditorium for the full list!";
        } else if (lowerMsg.includes('hall') || lowerMsg.includes('where')) {
            return "You can visit the Expo Hall through the main doors, or check out the Lounge for networking.";
        }
        return "That's a great question! Feel free to explore the virtual space or let me know if you need specific directions.";
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');

        // Simulate bot reply
        setTimeout(() => {
            const botMsg = { id: Date.now() + 1, sender: 'bot', text: getBotReply(userMsg.text) };
            setChatMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    return (
        <div className="absolute inset-0 w-full h-full animate-fade-in bg-black overflow-auto hide-scrollbar">
            {/* Background Canvas automatically scales to image aspect ratio */}
            <div 
                className="relative w-full min-w-[1200px] h-auto mx-auto z-0 transition-all duration-1000 ease-in-out"
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
                <img 
                    src={lobbyConfig.bgImage || '/virtual-events-assets/lobby-bg.png'} 
                    alt="Lobby"
                    className="w-full h-auto pointer-events-none block"
                />
                    {/* Render Posters */}
                    {lobbyConfig.posters && lobbyConfig.posters.map(poster => (
                        <div
                            key={poster.id}
                            className={`absolute z-10 overflow-hidden ${poster.imageUrl ? 'pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200' : 'pointer-events-none'}`}
                            style={{
                                top: `${poster.top}%`,
                                left: `${poster.left}%`,
                                width: `${poster.width}%`,
                                height: `${poster.height}%`,
                                border: poster.imageUrl ? 'none' : '1px dashed #ffffff33'
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

                    {/* Render Navigation Points */}
                    {lobbyConfig.points && lobbyConfig.points.map(point => (
                        <div
                            key={point.id}
                            className="absolute z-30"
                            style={{
                                top: `${point.top}%`,
                                left: `${point.left}%`
                            }}
                        >
                            {/* Interactive Dot */}
                            <div 
                                onClick={() => {
                                    if (point.targetPage === '#info-modal') {
                                        window.dispatchEvent(new CustomEvent('open-chat', { detail: { roomName: 'Information Desk' } }));
                                    } else if (point.targetPage) {
                                        setIsZooming(point);
                                        setTimeout(() => {
                                            navigateTo(point.targetPage);
                                        }, 850);
                                    }
                                }}
                                className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex h-3.5 w-3.5 items-center justify-center pointer-events-auto cursor-pointer z-40"
                            >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white hover:scale-125 transition-transform"></span>
                            </div>
                        </div>
                    ))}
                </div>

            {/* Information Desk Modal with Chat */}
            {isInfoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
                    <div className="bg-white/95 backdrop-blur-xl w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative transform transition-all border border-white/20">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center relative shrink-0">
                            <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <FiInfo className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Information Desk</h2>
                                    <p className="text-xs text-blue-100 font-medium">Virtual Event Receptionist</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsInfoModalOpen(false)}
                                className="relative z-10 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Body - Split Pane */}
                        <div className="flex-1 flex overflow-hidden">
                            
                            {/* Left Pane - Event Info */}
                            <div className="w-1/3 bg-slate-50 border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                                <div className="text-gray-700 leading-relaxed bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                                    <p className="mb-2 font-bold text-blue-900 text-sm">Welcome to the Event!</p>
                                    <p className="text-xs text-blue-800/80">Explore the areas using the interactive points in the lobby. Need help? Ask the receptionist in the chat!</p>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                                            <FiCalendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-xs mb-0.5">Event Date</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">October 24 - 26</p>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                                            <FiClock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-xs mb-0.5">Keynote</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">Starts at 10:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                                            <FiMapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-xs mb-0.5">Main Stage</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">In the Auditorium</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane - Chat */}
                            <div className="flex-1 flex flex-col bg-white">
                                {/* Chat Header */}
                                <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-2 shrink-0">
                                    <FiMessageSquare className="text-blue-600 w-5 h-5" />
                                    <h3 className="font-bold text-gray-800 text-sm">Live Assistant</h3>
                                </div>

                                {/* Chat Messages Container */}
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-800' : 'bg-blue-600'}`}>
                                                    {msg.sender === 'user' ? <FiUser className="text-white w-4 h-4" /> : <FiInfo className="text-white w-4 h-4" />}
                                                </div>
                                                {/* Bubble */}
                                                <div className={`p-3.5 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                 {/* Chat Input Area */}
                                 <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                                     <form onSubmit={handleSendMessage} className="relative flex items-center">
                                         <input 
                                             type="text"
                                             value={chatInput}
                                             onChange={(e) => setChatInput(e.target.value)}
                                             placeholder="Ask the receptionist anything..."
                                             className="w-full bg-slate-100 border-none rounded-full py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                         />
                                         <button 
                                             type="submit"
                                             disabled={!chatInput.trim()}
                                             className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
                                         >
                                             <FiSend className="w-4 h-4" />
                                         </button>
                                     </form>
                                 </div>
                             </div>

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

export default Lobby;
