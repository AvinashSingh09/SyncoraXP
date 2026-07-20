import React, { useState, useEffect } from 'react';
import TicTacToe from './games/TicTacToe';
import MemoryMatch from './games/MemoryMatch';
import Photobooth from './games/Photobooth';
import Hangman from './games/Hangman';
import Snake from './games/Snake';
import WordScramble from './games/WordScramble';
import MemoryMatrix from './games/MemoryMatrix';
import ArrowEscape from './games/ArrowEscape';
import { configService } from '../../services/api';

// Styled Game Controller SVG component
const GameControllerSVG = ({ className }) => (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow */}
        <ellipse cx="100" cy="165" rx="65" ry="12" fill="rgba(0,0,0,0.15)" filter="blur(4px)" />

        {/* Main Body */}
        <path d="M50 70 C70 70 85 80 100 80 C115 80 130 70 150 70 C180 70 190 95 180 135 C175 155 155 160 140 145 C125 130 115 125 100 125 C85 125 75 130 60 145 C45 160 25 155 20 135 C10 95 20 70 50 70 Z" fill="url(#bodyGradient)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.1))" />

        {/* Grips Details */}
        <path d="M 23 125 C 21 115 22 105 25 95" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <path d="M 177 125 C 179 115 178 105 175 95" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

        {/* D-Pad (Left Side) */}
        <g transform="translate(45, 92)">
            <rect x="7" y="0" width="8" height="22" rx="2" fill="#94A3B8" />
            <rect x="0" y="7" width="22" height="8" rx="2" fill="#94A3B8" />
            <circle cx="11" cy="11" r="3.5" fill="#475569" />
        </g>

        {/* Action Buttons (Right Side) */}
        <g transform="translate(125, 92)">
            {/* Y Button (Top) */}
            <circle cx="11" cy="0" r="4.5" fill="#FBBF24" />
            {/* A Button (Bottom) */}
            <circle cx="11" cy="22" r="4.5" fill="#34D399" />
            {/* X Button (Left) */}
            <circle cx="0" cy="11" r="4.5" fill="#60A5FA" />
            {/* B Button (Right) */}
            <circle cx="22" cy="11" r="4.5" fill="#F87171" />
        </g>

        {/* Thumbsticks */}
        {/* Left Thumbstick */}
        <circle cx="76" cy="120" r="13" fill="#64748B" opacity="0.15" />
        <circle cx="76" cy="120" r="9" fill="#CBD5E1" />
        <circle cx="74" cy="118" r="6" fill="#94A3B8" />

        {/* Right Thumbstick */}
        <circle cx="124" cy="120" r="13" fill="#64748B" opacity="0.15" />
        <circle cx="124" cy="120" r="9" fill="#CBD5E1" />
        <circle cx="122" cy="118" r="6" fill="#94A3B8" />

        {/* Logo/Center Button */}
        <circle cx="100" cy="98" r="6" fill="#F1F5F9" />
        <circle cx="100" cy="98" r="3" fill="#A78BFA" />

        <defs>
            <linearGradient id="bodyGradient" x1="100" y1="70" x2="100" y2="155" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
        </defs>
    </svg>
);
// Styled Polaroid Camera SVG component
const PolaroidCameraSVG = ({ className }) => (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow */}
        <ellipse cx="100" cy="170" rx="70" ry="10" fill="rgba(0,0,0,0.15)" filter="blur(4px)" />

        {/* Main Camera Body (White top, Pink bottom) */}
        {/* Top White Body */}
        <rect x="30" y="50" width="140" height="90" rx="24" fill="url(#cameraBodyWhite)" />
        {/* Pink bottom half overlay */}
        <path d="M 30 95 Q 30 75 50 75 L 150 75 Q 170 75 170 95 L 170 120 Q 170 140 150 140 L 50 140 Q 30 140 30 120 Z" fill="url(#cameraBodyPink)" />

        {/* Lens */}
        {/* Outer Ring */}
        <circle cx="100" cy="105" r="35" fill="white" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" />
        {/* Inner Ring (Pink) */}
        <circle cx="100" cy="105" r="28" fill="#F472B6" />
        {/* Dark Lens Center */}
        <circle cx="100" cy="105" r="22" fill="#1E293B" />
        {/* Lens Reflection */}
        <circle cx="92" cy="97" r="6" fill="white" opacity="0.4" />

        {/* Flash (Top Right) */}
        <rect x="135" y="60" width="22" height="12" rx="4" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="141" y="64" width="10" height="4" rx="1" fill="#FCD34D" />

        {/* Viewfinder (Top Left) */}
        <rect x="45" y="60" width="18" height="12" rx="4" fill="#E2E8F0" />
        <rect x="49" y="64" width="10" height="4" rx="2" fill="#94A3B8" />

        {/* Photo paper spitting out at bottom */}
        <path d="M 65 140 L 135 140 L 140 180 L 60 180 Z" fill="white" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" />
        {/* Image on photo */}
        <rect x="68" y="145" width="64" height="28" rx="2" fill="url(#photoGradient)" />

        <defs>
            <linearGradient id="cameraBodyWhite" x1="30" y1="50" x2="170" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
            <linearGradient id="cameraBodyPink" x1="30" y1="75" x2="170" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="photoGradient" x1="68" y1="145" x2="132" y2="173" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
        </defs>
    </svg>
);

// Styled Tic Tac Toe SVG component
const TicTacToeSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Grid lines */}
        <line x1="35" y1="15" x2="35" y2="85" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        <line x1="65" y1="15" x2="65" y2="85" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        <line x1="15" y1="35" x2="85" y2="35" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        <line x1="15" y1="65" x2="85" y2="65" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.35" />

        {/* X Mark */}
        <path d="M22 22 L30 30 M30 22 L22 30" stroke="#FCD34D" strokeWidth="5.5" strokeLinecap="round" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />

        {/* O Mark */}
        <circle cx="50" cy="50" r="7.5" stroke="white" strokeWidth="5.5" fill="none" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />

        {/* Another X Mark */}
        <path d="M70 70 L78 78 M78 70 L70 78" stroke="#FCD34D" strokeWidth="5.5" strokeLinecap="round" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />
    </svg>
);

// Styled Memory Match SVG component
const MemoryMatchSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Brain outline / Card outlines */}
        <rect x="15" y="20" width="30" height="42" rx="6" fill="white" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.12))" />
        <rect x="55" y="38" width="30" height="42" rx="6" fill="white" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.12))" />

        {/* Question marks or patterns on card back */}
        <circle cx="30" cy="41" r="5" fill="#818CF8" />
        <circle cx="70" cy="59" r="5" fill="#F472B6" />

        {/* Sparkles */}
        <path d="M50 15 L52 22 L59 24 L52 26 L50 33 L48 26 L41 24 L48 22 Z" fill="#FCD34D" />
    </svg>
);

// Styled Hangman SVG component
const HangmanSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <line x1="25" y1="80" x2="75" y2="80" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.4" />
        <line x1="40" y1="80" x2="40" y2="25" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.4" />
        <line x1="40" y1="25" x2="70" y2="25" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.4" />
        <line x1="70" y1="25" x2="70" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <circle cx="70" cy="46" r="6" stroke="#FCD34D" strokeWidth="4.5" fill="none" />
        <line x1="70" y1="52" x2="70" y2="68" stroke="#FCD34D" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="70" y1="56" x2="62" y2="63" stroke="#FCD34D" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="70" y1="56" x2="78" y2="63" stroke="#FCD34D" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="70" y1="68" x2="63" y2="78" stroke="#FCD34D" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="70" y1="68" x2="77" y2="78" stroke="#FCD34D" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M25 35 L27 39 L31 40 L27 41 L25 45 L23 41 L19 40 L23 39 Z" fill="#FCD34D" />
    </svg>
);

// Styled Snake SVG component
const SnakeSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Glowing Snake grid path */}
        <path d="M 20 80 C 40 80 40 60 50 60 C 60 60 60 40 70 40 L 80 40" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        <path d="M 50 60 C 60 60 60 40 70 40 L 80 40" stroke="#FCD34D" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Snake eyes */}
        <circle cx="77" cy="38" r="1.5" fill="black" />
        {/* Food */}
        <circle cx="20" cy="50" r="4.5" fill="#f43f5e" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
    </svg>
);

// Styled Word Scramble SVG component
const WordScrambleSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="15" y="25" width="22" height="22" rx="6" fill="white" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <text x="26" y="41" fill="#4F46E5" fontSize="14" fontWeight="900" textAnchor="middle">W</text>
        <rect x="42" y="20" width="22" height="22" rx="6" fill="#FCD34D" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <text x="53" y="36" fill="black" fontSize="14" fontWeight="900" textAnchor="middle">O</text>
        <rect x="69" y="30" width="22" height="22" rx="6" fill="white" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <text x="80" y="46" fill="#3B82F6" fontSize="14" fontWeight="900" textAnchor="middle">R</text>
        <rect x="25" y="55" width="22" height="22" rx="6" fill="white" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <text x="36" y="71" fill="#F472B6" fontSize="14" fontWeight="900" textAnchor="middle">D</text>
    </svg>
);

// Styled Memory Matrix SVG component
const MemoryMatrixSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="15" y="15" width="22" height="22" rx="6" fill="#38BDF8" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <rect x="42" y="15" width="22" height="22" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="69" y="15" width="22" height="22" rx="6" fill="#38BDF8" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <rect x="15" y="42" width="22" height="22" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="42" y="42" width="22" height="22" rx="6" fill="#38BDF8" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
        <rect x="69" y="42" width="22" height="22" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="15" y="69" width="22" height="22" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="42" y="69" width="22" height="22" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="69" y="69" width="22" height="22" rx="6" fill="#38BDF8" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))" />
    </svg>
);

// Styled Arrow Escape SVG component
const ArrowEscapeSVG = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M 20 80 C 20 50, 50 50, 50 20" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        <path d="M 20 80 C 20 50, 50 50, 50 20" stroke="#a855f7" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="50,12 43,24 57,24" fill="#a855f7" />
        
        <path d="M 80 80 C 80 50, 50 50, 50 20" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.1" />
        <path d="M 30 50 L 70 50" stroke="#f43f5e" strokeWidth="6.5" strokeLinecap="round" />
        <polygon points="76,50 68,44 68,56" fill="#f43f5e" />
    </svg>
);

// Styled Engage Hub page background component
const EngageBackground = () => (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {/* Main background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ebf4ff] via-[#e0e7ff] to-[#f3e8ff]"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Blur Circles */}
        <div className="absolute top-20 right-[-10%] w-[45%] h-[45%] bg-[#F472B6]/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-10 left-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-[-5%] w-[35%] h-[35%] bg-[#F43F5E]/10 rounded-full blur-[90px]"></div>


        {/* Floating Sparkles and Stars */}
        <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
            {/* Blue Sparkle */}
            <path d="M180 160 L182 165 L187 167 L182 169 L180 174 L178 169 L173 167 L178 165 Z" fill="#60A5FA" />
            {/* Orange Sparkle */}
            <path d="M340 230 L341 234 L345 235 L341 236 L340 240 L339 236 L335 235 L339 234 Z" fill="#FDBA74" />
            {/* Pink Sparkle */}
            <path d="M680 180 L681 184 L685 185 L681 186 L680 190 L679 186 L675 185 L679 184 Z" fill="#F9A8D4" />
            {/* Small dots */}
            <circle cx="220" cy="280" r="2" fill="#93C5FD" />
            <circle cx="620" cy="140" r="2.5" fill="#FCA5A5" />
        </svg>
    </div>
);

const Games = () => {
    const [activeSection, setActiveSection] = useState('engage'); // 'engage', 'games', 'photobooth'
    const [activeGame, setActiveGame] = useState(null); // null = lobby, 'tictactoe', 'memory', 'hangman', 'snake', 'scramble', 'matrix', 'arrowescape'
    const [isZooming, setIsZooming] = useState(null);
    const [hangmanEnabled, setHangmanEnabled] = useState(true);
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [snakeEnabled, setSnakeEnabled] = useState(true);
    const [scrambleEnabled, setScrambleEnabled] = useState(true);
    const [matrixEnabled, setMatrixEnabled] = useState(true);
    const [arrowEscapeEnabled, setArrowEscapeEnabled] = useState(true);

    useEffect(() => {
        const fetchGameStatus = async () => {
            try {
                const [hangmanRes, memoryRes, snakeRes, scrambleRes, matrixRes, arrowEscapeRes] = await Promise.all([
                    configService.getFreshConfig('game_hangman_enabled'),
                    configService.getFreshConfig('game_memory_match_enabled'),
                    configService.getFreshConfig('game_snake_enabled'),
                    configService.getFreshConfig('game_scramble_enabled'),
                    configService.getFreshConfig('game_matrix_enabled'),
                    configService.getFreshConfig('game_arrow_escape_enabled')
                ]);

                if (hangmanRes.data && hangmanRes.data.value) {
                    setHangmanEnabled(hangmanRes.data.value === 'true');
                }
                if (memoryRes.data && memoryRes.data.value) {
                    setMemoryEnabled(memoryRes.data.value === 'true');
                }
                if (snakeRes.data && snakeRes.data.value) {
                    setSnakeEnabled(snakeRes.data.value === 'true');
                }
                if (scrambleRes.data && scrambleRes.data.value) {
                    setScrambleEnabled(scrambleRes.data.value === 'true');
                }
                if (matrixRes.data && matrixRes.data.value) {
                    setMatrixEnabled(matrixRes.data.value === 'true');
                }
                if (arrowEscapeRes.data && arrowEscapeRes.data.value) {
                    setArrowEscapeEnabled(arrowEscapeRes.data.value === 'true');
                } else {
                    setArrowEscapeEnabled(true);
                }
            } catch (err) {
                console.error('Failed to load active games configuration', err);
            }
        };
        fetchGameStatus();
    }, []);

    if (activeSection === 'photobooth') {
        return <Photobooth onBack={() => setActiveSection('engage')} />;
    }

    if (activeSection === 'games') {
        if (activeGame === 'tictactoe') {
            return <TicTacToe onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'memory') {
            return <MemoryMatch onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'hangman') {
            return <Hangman onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'snake') {
            return <Snake onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'scramble') {
            return <WordScramble onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'matrix') {
            return <MemoryMatrix onBack={() => setActiveGame(null)} />;
        }

        if (activeGame === 'arrowescape') {
            return <ArrowEscape onBack={() => setActiveGame(null)} />;
        }

        const enabledCount = 1 + (memoryEnabled ? 1 : 0) + (hangmanEnabled ? 1 : 0) + (snakeEnabled ? 1 : 0) + (scrambleEnabled ? 1 : 0) + (matrixEnabled ? 1 : 0) + (arrowEscapeEnabled ? 1 : 0);
        const gridClass = enabledCount >= 3 ? 'md:grid-cols-3' : enabledCount === 2 ? 'md:grid-cols-2 max-w-3xl' : 'md:grid-cols-1 max-w-md';

        return (
            <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <EngageBackground />
                </div>

                <div
                    className="w-full h-full flex flex-col items-center justify-start px-8 pb-8 pt-[124px] overflow-y-auto font-sans transition-all duration-[850ms] ease-in-out z-10"
                    style={isZooming ? {
                        transformOrigin: `${isZooming.left}% ${isZooming.top}%`,
                        transform: 'scale(5)',
                        opacity: 0
                    } : {
                        transformOrigin: '50% 50%',
                        transform: 'scale(1)',
                        opacity: 1
                    }}
                >
                    {/* Back button */}
                    <div className="w-full max-w-5xl px-4 flex justify-start mb-4 z-10">
                        <button
                            onClick={() => setActiveSection('engage')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm hover:shadow transition-all"
                        >
                            ← Back to Engage Hub
                        </button>
                    </div>

                    {/* Hub Header */}
                    <div className="text-center mt-2 mb-12 z-10">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-650 bg-clip-text text-transparent">
                            Game Arena
                        </h1>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Challenge yourself or play with friends in the lobby</p>
                    </div>

                    {/* Games Grid */}
                    <div className={`grid grid-cols-1 ${gridClass} gap-6 w-full max-w-5xl px-4 z-10 justify-center`}>
                        {/* Tic-Tac-Toe Game Box */}
                        <div
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                setIsZooming({ left, top });
                                setTimeout(() => {
                                    setActiveGame('tictactoe');
                                    setIsZooming(null);
                                }, 850);
                            }}
                            className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                        >
                            {/* Content Section */}
                            <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                    Tic-Tac-Toe
                                </h3>
                                <p className="text-[11px] text-blue-100 leading-relaxed font-medium mb-6">
                                    Classic X and O game. Play vs smart CPU Bot.
                                </p>
                                <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#2563EB] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                    Play Now →
                                </span>
                            </div>

                            {/* SVG Asset */}
                            <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                <TicTacToeSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                            </div>
                        </div>

                        {/* Memory Match Game Box */}
                        {memoryEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('memory');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Memory Match
                                    </h3>
                                    <p className="text-[11px] text-indigo-100 leading-relaxed font-medium mb-6">
                                        Test your memory and match sponsor logos to claim points.
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#4F46E5] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 flex items-center justify-center">
                                    <MemoryMatchSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}

                        {/* Hangman Game Box */}
                        {hangmanEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('hangman');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#EC4899] via-[#D946EF] to-[#8B5CF6] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Hangman
                                    </h3>
                                    <p className="text-[11px] text-pink-100 leading-relaxed font-medium mb-6">
                                        Guess tech terms and complete the stick figure to earn points.
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#EC4899] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                    <HangmanSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}

                        {/* Snake Game Box */}
                        {snakeEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('snake');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Snake
                                    </h3>
                                    <p className="text-[11px] text-emerald-100 leading-relaxed font-medium mb-6">
                                        Classic retro arcade game. Eat food, grow and claim points.
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#059669] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                    <SnakeSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}

                        {/* Word Scramble Game Box */}
                        {scrambleEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('scramble');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#EC4899] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Word Scramble
                                    </h3>
                                    <p className="text-[11px] text-pink-100 leading-relaxed font-medium mb-6">
                                        Solve scrambled keywords from the event to claim points.
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#4F46E5] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                    <WordScrambleSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}

                        {/* Memory Matrix Game Box */}
                        {matrixEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('matrix');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Memory Matrix
                                    </h3>
                                    <p className="text-[11px] text-sky-100 leading-relaxed font-medium mb-6">
                                        Recall flashed patterns in a grid. Levels get harder!
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#0284c7] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                    <MemoryMatrixSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}

                        {/* Arrow Escape Game Box */}
                        {arrowEscapeEnabled && (
                            <div
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                                    const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                                    setIsZooming({ left, top });
                                    setTimeout(() => {
                                        setActiveGame('arrowescape');
                                        setIsZooming(null);
                                    }, 850);
                                }}
                                className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#C084FC] rounded-[2.5rem] p-6 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[240px]"
                            >
                                {/* Content Section */}
                                <div className="max-w-[70%] z-10 flex flex-col items-start justify-center h-full">
                                    <h3 className="text-2xl font-extrabold tracking-tight mb-2">
                                        Arrow Escape
                                    </h3>
                                    <p className="text-[11px] text-purple-100 leading-relaxed font-medium mb-6">
                                        Slide winding paths off the grid. Clear roadblocks and exit!
                                    </p>
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#7C3AED] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                        Play Now →
                                    </span>
                                </div>

                                {/* SVG Asset */}
                                <div className="absolute right-[-10px] bottom-[-10px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                                    <ArrowEscapeSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <EngageBackground />
            </div>

            <div
                className="w-full h-full flex flex-col items-center justify-start px-8 pb-8 pt-[124px] overflow-y-auto font-sans transition-all duration-[850ms] ease-in-out z-10"
                style={isZooming ? {
                    transformOrigin: `${isZooming.left}% ${isZooming.top}%`,
                    transform: 'scale(5)',
                    opacity: 0
                } : {
                    transformOrigin: '50% 50%',
                    transform: 'scale(1)',
                    opacity: 1
                }}
            >
                {/* Hub Header */}
                <div className="text-center mt-6 mb-12 z-10">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-650 bg-clip-text text-transparent">
                        Engage Hub
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Interact, play games, and capture memories</p>
                </div>

                {/* Engage Hub Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 z-10">
                    {/* Games Hub Box */}
                    <div
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                            const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                            const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                            setIsZooming({ left, top });
                            setTimeout(() => {
                                setActiveSection('games');
                                setIsZooming(null);
                            }, 850);
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] rounded-[2.5rem] p-8 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[260px]"
                    >
                        {/* Content Section */}
                        <div className="max-w-[60%] z-10 flex flex-col items-start justify-center h-full">
                            <h3 className="text-3xl font-extrabold tracking-tight mb-2">
                                Games
                            </h3>
                            <p className="text-xs text-purple-100 leading-relaxed font-medium mb-6">
                                Play fun games and earn points
                            </p>
                            <span className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-[#7C3AED] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                Explore Games →
                            </span>
                        </div>

                        {/* 3D Game Controller Asset */}
                        <div className="absolute right-[-15px] bottom-[-15px] w-[50%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
                            <GameControllerSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.25)]" />
                        </div>
                    </div>

                    {/* Photobooth Box */}
                    <div
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                            const left = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
                            const top = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
                            setIsZooming({ left, top });
                            setTimeout(() => {
                                setActiveSection('photobooth');
                                setIsZooming(null);
                            }, 850);
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#EC4899] via-[#F43F5E] to-[#FB7185] rounded-[2.5rem] p-8 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between min-h-[260px]"
                    >
                        {/* Content Section */}
                        <div className="max-w-[60%] z-10 flex flex-col items-start justify-center h-full">
                            <h3 className="text-3xl font-extrabold tracking-tight mb-2">
                                Photo Booth
                            </h3>
                            <p className="text-xs text-pink-100 leading-relaxed font-medium mb-6">
                                Capture amazing moments
                            </p>
                            <span className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-[#EC4899] rounded-full font-bold text-xs shadow hover:shadow-md transition-all group-hover:scale-105">
                                Open Photo Booth →
                            </span>
                        </div>

                        {/* 3D Camera Asset */}
                        <div className="absolute right-[-10px] bottom-[-15px] w-[45%] h-[75%] z-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                            <PolaroidCameraSVG className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.25)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Games;

