import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MdStorefront, MdArrowForward } from 'react-icons/md';
import { configService } from '../../services/api';


const ExpoHall = () => {
    const navigate = useNavigate();
    const { layoutConfigs } = useOutletContext();

    const halls = [
        {
            id: 'A',
            title: 'Hall A',
            desc: 'Payments, Banking & WealthTech',
            gradient: 'from-[#7e22ce] to-[#a855f7]',
            textColor: 'text-[#7e22ce]',
            shadowColor: 'shadow-purple-500/20',
            illustration: (
                <svg viewBox="0 0 100 100" className="w-32 h-32 text-white/90 drop-shadow-lg select-none">
                    {/* POS / Credit Card SVG */}
                    <rect x="20" y="25" width="60" height="40" rx="6" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
                    <rect x="20" y="37" width="60" height="8" fill="currentColor" />
                    <rect x="30" y="50" width="16" height="8" rx="2" fill="#fef08a" />
                    <rect x="52" y="52" width="20" height="4" rx="1" fill="currentColor" opacity="0.7" />
                    {/* Mobile Phone / Contactless tap */}
                    <rect x="55" y="45" width="30" height="45" rx="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="70" cy="83" r="2.5" fill="currentColor" />
                    <path d="M 62 60 A 8 8 0 0 1 78 60" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                    <path d="M 65 65 A 4 4 0 0 1 75 65" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        },
        {
            id: 'B',
            title: 'Hall B',
            desc: 'Lending, InsurTech & Credit Infrastructure',
            gradient: 'from-[#ec4899] to-[#f43f5e]',
            textColor: 'text-[#f43f5e]',
            shadowColor: 'shadow-pink-500/20',
            illustration: (
                <svg viewBox="0 0 100 100" className="w-32 h-32 text-white/90 drop-shadow-lg select-none">
                    {/* Shield & Growth Bar Chart SVG */}
                    <path d="M50 15 L80 30 V55 C80 72 50 88 50 88 C50 88 20 72 20 55 V30 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
                    {/* Growth Chart bars */}
                    <rect x="32" y="55" width="8" height="18" rx="1.5" fill="currentColor" />
                    <rect x="44" y="45" width="8" height="28" rx="1.5" fill="currentColor" />
                    <rect x="56" y="35" width="8" height="38" rx="1.5" fill="#22c55e" className="animate-pulse" />
                    {/* Trend Line Arrow */}
                    <path d="M 30 52 L 44 42 L 56 32 L 68 25" stroke="#facc15" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="68,20 72,27 64,27" fill="#facc15" />
                </svg>
            )
        },
        {
            id: 'C',
            title: 'Hall C',
            desc: 'Crypto, Web3 & Cross-Border Payments',
            gradient: 'from-[#0284c7] to-[#3b82f6]',
            textColor: 'text-[#0284c7]',
            shadowColor: 'shadow-blue-500/20',
            illustration: (
                <svg viewBox="0 0 100 100" className="w-32 h-32 text-white/90 drop-shadow-lg select-none">
                    {/* Blockchain Coin & Globe Network SVG */}
                    <circle cx="50" cy="50" r="34" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="3" />
                    <ellipse cx="50" cy="50" rx="34" ry="14" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <ellipse cx="50" cy="50" rx="14" ry="34" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    {/* Central Digital Currency Coin */}
                    <circle cx="50" cy="50" r="16" fill="#38bdf8" stroke="currentColor" strokeWidth="2" />
                    <text x="50" y="56" fill="white" fontSize="18" fontWeight="900" textAnchor="middle">₹</text>
                    {/* Orbiting node dots */}
                    <circle cx="20" cy="35" r="4.5" fill="#facc15" className="animate-ping" />
                    <circle cx="80" cy="65" r="4.5" fill="#38bdf8" />
                </svg>
            )
        }
    ];

    const [bgImage, setBgImage] = useState(() => {
        if (layoutConfigs && layoutConfigs.expo_hall_entrance) {
            try {
                const config = typeof layoutConfigs.expo_hall_entrance === 'string'
                    ? JSON.parse(layoutConfigs.expo_hall_entrance)
                    : layoutConfigs.expo_hall_entrance;
                return config.bgImage || '';
            } catch (e) {
                if (typeof layoutConfigs.expo_hall_entrance === 'string' && layoutConfigs.expo_hall_entrance.startsWith('http')) {
                    return layoutConfigs.expo_hall_entrance;
                }
            }
        }
        return '';
    });

    useEffect(() => {
        if (layoutConfigs && layoutConfigs.expo_hall_entrance) {
            try {
                const config = typeof layoutConfigs.expo_hall_entrance === 'string'
                    ? JSON.parse(layoutConfigs.expo_hall_entrance)
                    : layoutConfigs.expo_hall_entrance;
                if (config.bgImage) setBgImage(config.bgImage);
            } catch (e) {
                if (typeof layoutConfigs.expo_hall_entrance === 'string' && (layoutConfigs.expo_hall_entrance.startsWith('http') || layoutConfigs.expo_hall_entrance.startsWith('/'))) {
                    setBgImage(layoutConfigs.expo_hall_entrance);
                }
            }
            return;
        }

        const fetchConfig = async () => {
            try {
                const response = await configService.getConfig('expo_hall_entrance');
                if (response.data && response.data.value) {
                    const config = JSON.parse(response.data.value);
                    if (config.bgImage) setBgImage(config.bgImage);
                }
            } catch (err) {
                console.error('Failed to load expo entrance config', err);
            }
        };
        fetchConfig();
    }, [layoutConfigs]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden text-slate-800">
            {/* Background base layer (Image or Gradient) */}
            {bgImage ? (
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                    style={{ backgroundImage: `url(${bgImage})` }}
                >
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm pointer-events-none"></div>
                </div>
            ) : (
                <>
                    {/* Default main background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ebf4ff] via-[#e0e7ff] to-[#f3e8ff] z-0"></div>
                    {/* Blur Circles */}
                    <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#F472B6]/15 rounded-full blur-[120px] z-0"></div>
                    <div className="absolute top-10 left-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/10 rounded-full blur-[100px] z-0"></div>
                    <div className="absolute bottom-10 right-[-5%] w-[35%] h-[35%] bg-[#F43F5E]/10 rounded-full blur-[90px] z-0"></div>
                    
                    {/* Grid pattern overlay (only visible on default background) */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] z-0 pointer-events-none"></div>
                    
                    {/* Floating Sparkles and Stars */}
                    <svg className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M180 160 L182 165 L187 167 L182 169 L180 174 L178 169 L173 167 L178 165 Z" fill="#60A5FA" />
                        <path d="M340 230 L341 234 L345 235 L341 236 L340 240 L339 236 L335 235 L339 234 Z" fill="#FDBA74" />
                        <path d="M680 180 L681 184 L685 185 L681 186 L680 190 L679 186 L675 185 L679 184 Z" fill="#F9A8D4" />
                        <circle cx="220" cy="280" r="2" fill="#93C5FD" />
                        <circle cx="620" cy="140" r="2.5" fill="#FCA5A5" />
                    </svg>
                </>
            )}
            
            <div className="w-full h-full overflow-y-auto px-8 pb-8 pt-[124px] relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10 text-center">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 tracking-tight mb-3">GFF Expo Halls</h1>
                        <p className="text-sm text-slate-500 font-semibold tracking-wide">Explore Global Fintech Fest exhibitor halls, discover financial innovations, and network</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                        {halls.map((hall) => (
                            <div 
                                key={hall.id} 
                                onClick={() => navigate(`/virtual-events-platform/app/dashboard/expo-hall/${hall.id}`)} 
                                className={`bg-gradient-to-br ${hall.gradient} rounded-[2rem] p-8 cursor-pointer shadow-xl hover:shadow-2xl ${hall.shadowColor} hover:scale-[1.03] transition-all duration-500 flex flex-col justify-between min-h-[260px] relative overflow-hidden group`}
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>

                                <div className="z-10 max-w-[70%]">
                                    <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{hall.title}</h2>
                                    <p className="text-white/80 text-sm leading-relaxed font-semibold pr-2 mb-6">{hall.desc}</p>
                                </div>
                                
                                <div className="z-10 mt-auto">
                                    <span className={`inline-flex items-center gap-2 bg-white hover:bg-white/95 ${hall.textColor} font-bold px-6 py-3 rounded-full text-xs shadow-md transition-all group-hover:shadow-lg group-hover:scale-105 duration-300`}>
                                        Enter {hall.title} →
                                    </span>
                                </div>

                                <div className="absolute bottom-4 right-4 z-0 opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3 pointer-events-none">
                                    {hall.illustration}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpoHall;
