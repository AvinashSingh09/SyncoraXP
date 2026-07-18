import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    FiArrowLeft, 
    FiHeart, 
    FiAward, 
    FiSearch, 
    FiZoomIn, 
    FiZoomOut, 
    FiRefreshCw 
} from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import { authService, configService } from '../../../services/api';

// Direction Vectors
const DIR_VECTORS = {
    'UP': { r: -1, c: 0 },
    'DOWN': { r: 1, c: 0 },
    'LEFT': { r: 0, c: -1 },
    'RIGHT': { r: 0, c: 1 }
};
const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

// Helper function to solve the board using a BFS/greedy search to find circular dependencies/deadlocks
const isLevelSolvable = (gridSize, paths) => {
    // Clone paths to avoid mutating original state
    let remainingPaths = paths.map(p => ({
        ...p,
        coords: [...p.coords]
    }));

    const isBlocked = (path, currentPaths) => {
        const head = path.coords[path.coords.length - 1];
        const vec = DIR_VECTORS[path.direction];
        let r = head.r + vec.r;
        let c = head.c + vec.c;

        while (r >= 0 && r < gridSize.rows && c >= 0 && c < gridSize.cols) {
            const isOccupied = currentPaths.some(other => {
                if (other.id === path.id) return false;
                return other.coords.some(pt => pt.r === r && pt.c === c);
            });
            if (isOccupied) return true;
            r += vec.r;
            c += vec.c;
        }
        return false;
    };

    let progress = true;
    while (remainingPaths.length > 0 && progress) {
        progress = false;
        // Find a path that is not blocked by any other remaining path
        const unblockedIndex = remainingPaths.findIndex(path => !isBlocked(path, remainingPaths));
        if (unblockedIndex !== -1) {
            // Remove it (since it can escape, freeing up space)
            remainingPaths.splice(unblockedIndex, 1);
            progress = true;
        }
    }

    return remainingPaths.length === 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// THEMED SPECIAL LEVEL MASK DEFINITIONS
// Levels 1, 2, 3, 4 use special shape masks to constrain path generation.
// ─────────────────────────────────────────────────────────────────────────────
const inMask = (r, c, shape, rows, cols) => {
    // Normalize coordinates between -1.0 and 1.0
    const x = (c - cols / 2) / (cols / 2);
    const y = (r - rows / 2) / (rows / 2);
    
    if (shape === 'brain') {
        // Round brain head (circle centered slightly higher)
        const inHead = (x * x + (y + 0.2) * (y + 0.2)) < 0.65;
        // Stem trunk at the bottom
        const inTrunk = Math.abs(x) < 0.18 && y >= 0.25;
        return inHead || inTrunk;
    }
    
    if (shape === 'heart') {
        const yAdjusted = y + 0.1;
        const xAbs = Math.abs(x);
        if (yAdjusted < 0) {
            // Two upper lobes of the heart
            return (xAbs - 0.35) * (xAbs - 0.35) + (yAdjusted + 0.25) * (yAdjusted + 0.25) < 0.2;
        } else {
            // Lower triangle pointing down
            return yAdjusted < 1.0 - xAbs * 1.15;
        }
    }
    
    if (shape === 'diagonal') {
        // Diagonal band from top-right to bottom-left
        return Math.abs(y + x) < 0.38;
    }
    
    if (shape === 'star') {
        const px = x;
        const py = y + 0.05; // Center slightly adjusted up
        const rVal = Math.sqrt(px * px + py * py);
        const theta = Math.atan2(py, px);
        // Peak pointing up: cos(5 * theta + Math.PI/2)
        const armVal = 0.52 + 0.35 * Math.cos(5 * theta + Math.PI / 2);
        return rVal < armVal;
    }
    
    return true;
};

// Generate level using reverse generation combined with solver verification to guarantee 100% solvability
const generateLevel = (level) => {
    let shapeName = null;
    let cols = Math.min(22, 10 + (level - 1) * 2);
    let rows = Math.min(36, 16 + (level - 1) * 3);

    // Route themed shaped levels to levels 1 to 4
    if (level === 1) {
        shapeName = 'brain';
        cols = 18;
        rows = 20;
    } else if (level === 2) {
        shapeName = 'heart';
        cols = 20;
        rows = 20;
    } else if (level === 3) {
        shapeName = 'diagonal';
        cols = 18;
        rows = 18;
    } else if (level === 4) {
        shapeName = 'star';
        cols = 22;
        rows = 22;
    }

    const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;

    // Increase density constraints for shaped levels to pack paths and fill the shape
    const baseTargetDensity = shapeName ? 0.92 : Math.min(0.84, 0.72 + (level - 1) * 0.03);
    const baseMinDensity = shapeName ? 0.82 : Math.min(0.74, 0.62 + (level - 1) * 0.03);

    // Retry up to 100 times to guarantee a valid solvable board layout
    for (let tryCount = 0; tryCount < 100; tryCount++) {
        // Smoothly ease density constraints if multiple attempts fail, ensuring success
        const densityFactor = 1.0 - Math.min(20, tryCount) * 0.015;
        const targetDensity = baseTargetDensity * densityFactor;
        const minDensity = baseMinDensity * densityFactor;

        const occupied = Array(rows).fill(null).map(() => Array(cols).fill(false));
        const paths = [];
        
        // Count how many cells are actually in the shape mask
        let maskCellCount = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!shapeName || inMask(r, c, shapeName, rows, cols)) {
                    maskCellCount++;
                }
            }
        }
        
        const targetCells = Math.floor(maskCellCount * targetDensity);
        let occupiedCount = 0;

        let stuckCount = 0;
        while (occupiedCount < targetCells && stuckCount < 50) {
            // Find all unoccupied cell candidate locations systematically
            const candidates = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (occupied[r][c]) continue;
                    if (shapeName && !inMask(r, c, shapeName, rows, cols)) continue;
                    
                    const validDirs = DIRS.filter(dir => {
                        const vec = DIR_VECTORS[dir];
                        const nextR = r + vec.r;
                        const nextC = c + vec.c;
                        const isValidExit = !inBounds(nextR, nextC) || occupied[nextR][nextC] || (shapeName && !inMask(nextR, nextC, shapeName, rows, cols));
                        if (!isValidExit) return false;

                        const prevR = r - vec.r;
                        const prevC = c - vec.c;
                        return inBounds(prevR, prevC) && !occupied[prevR][prevC] && (!shapeName || inMask(prevR, prevC, shapeName, rows, cols));
                    });

                    if (validDirs.length > 0) {
                        candidates.push({ r, c, validDirs });
                    }
                }
            }

            if (candidates.length === 0) {
                stuckCount++;
                if (stuckCount >= 10) break;
                continue;
            }

            // Pick a candidate systematically and build path
            const cand = candidates[Math.floor(Math.random() * candidates.length)];
            const dir = cand.validDirs[Math.floor(Math.random() * cand.validDirs.length)];
            const vec = DIR_VECTORS[dir];

            const prevR = cand.r - vec.r;
            const prevC = cand.c - vec.c;

            const pathCoords = [{ r: prevR, c: prevC }, { r: cand.r, c: cand.c }];
            let currR = prevR;
            let currC = prevC;

            // Keep path lengths short (2 to 3 cells for shaped levels to maximize packing density, 3 to 5 otherwise)
            const minLen = shapeName ? 2 : 3;
            const maxLen = shapeName ? 3 : 5;
            const pathLen = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

            for (let i = 2; i < pathLen; i++) {
                const neighbors = [];
                DIRS.forEach(d => {
                    const nv = DIR_VECTORS[d];
                    const nr = currR + nv.r;
                    const nc = currC + nv.c;
                    if (inBounds(nr, nc) && !occupied[nr][nc] && (!shapeName || inMask(nr, nc, shapeName, rows, cols)) && !pathCoords.some(pt => pt.r === nr && pt.c === nc)) {
                        neighbors.push({ r: nr, c: nc });
                    }
                });

                if (neighbors.length === 0) break;

                const nextPt = neighbors[Math.floor(Math.random() * neighbors.length)];
                pathCoords.unshift(nextPt);
                currR = nextPt.r;
                currC = nextPt.c;
            }

            if (pathCoords.length >= 2) {
                pathCoords.forEach(pt => {
                    occupied[pt.r][pt.c] = true;
                    occupiedCount++;
                });
                paths.push({
                    id: Math.random().toString(36).substr(2, 9),
                    coords: pathCoords,
                    direction: dir,
                    exited: false,
                    isSliding: false
                });
            }
        }

        // Verify the board has dynamic minimum density and is solvable
        if (paths.length > 0 && occupiedCount >= Math.floor(maskCellCount * minDensity) && isLevelSolvable({ rows, cols }, paths)) {
            return { rows, cols, paths };
        }
    }

    // Fallback if loop fails
    const fallbackPaths = [];
    for (let r = 2; r < rows - 2; r += 3) {
        fallbackPaths.push({
            id: `fb-h-${r}`,
            coords: Array(cols - 4).fill().map((_, c) => ({ r, c: c + 2 })),
            direction: 'RIGHT',
            exited: false,
            isSliding: false
        });
    }
    return { rows, cols, paths: fallbackPaths };
};

const ArrowEscape = ({ onBack }) => {
    const { user, updateUser } = useAuth();

    // Config states
    const [pointsLevelList, setPointsLevelList] = useState([10, 15, 20, 25, 30]);
    const [pointsMax, setPointsMax] = useState(100);
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);

    // Game state
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState({ rows: 16, cols: 10 });
    const [paths, setPaths] = useState([]);
    const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'level_clear', 'gameover'
    const [totalPointsEarned, setTotalPointsEarned] = useState(0);

    // Helpers / Zoom / Grid
    const [zoom, setZoom] = useState(1.0);
    const [showGrid, setShowGrid] = useState(false);

    // Timer state (10 minutes countdown = 600 seconds)
    const [timeLeft, setTimeLeft] = useState(600);

    // Tools quantities
    const [hints, setHints] = useState(3);
    const [erasers, setErasers] = useState(1);
    const [eraserActive, setEraserActive] = useState(false);
    const [lives, setLives] = useState(3);

    // Booster modals
    const [showBoosterModal, setShowBoosterModal] = useState(false);

    // Interactive feedbacks
    const [shakingPathId, setShakingPathId] = useState(null);
    const [hintedPathId, setHintedPathId] = useState(null);
    const [toastPoints, setToastPoints] = useState(null);

    // Cell size dynamically scales down on bigger levels so it stays perfectly visible on screen
    const cellSize = Math.max(14, Math.min(32, Math.floor(480 / (gridSize.rows - 1))));
    const padding = 32;
    const svgWidth = (gridSize.cols - 1) * cellSize + 2 * padding;
    const svgHeight = (gridSize.rows - 1) * cellSize + 2 * padding;
    const animationIntervalsRef = useRef({});
    const timerRef = useRef(null);

    // Load configurations from backend
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const [levelListRes, maxRes, enabledRes] = await Promise.all([
                    configService.getFreshConfig('points_arrow_escape_level_list'),
                    configService.getConfig('points_arrow_escape_max'),
                    configService.getFreshConfig('reward_game_enabled')
                ]);

                if (enabledRes.data && enabledRes.data.value) {
                    setGameRewardEnabled(enabledRes.data.value === 'true');
                }
                if (levelListRes.data && levelListRes.data.value) {
                    const parsed = levelListRes.data.value.split(',').map(s => parseInt(s.trim())).filter(val => !isNaN(val) && val > 0);
                    if (parsed.length > 0) setPointsLevelList(parsed);
                }
                if (maxRes.data && maxRes.data.value) {
                    const parsed = parseInt(maxRes.data.value);
                    if (!isNaN(parsed) && parsed > 0) setPointsMax(parsed);
                }
            } catch (err) {
                console.error('Failed to load Arrow Escape configs', err);
            }
        };
        loadConfigs();
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGameState('gameover');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    // Format seconds to XmYs
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m${s}s`;
    };

    // Initialize/Generate Level
    const initLevel = useCallback((lvl) => {
        Object.values(animationIntervalsRef.current).forEach(clearInterval);
        animationIntervalsRef.current = {};

        const { rows, cols, paths: newPaths } = generateLevel(lvl);
        setGridSize({ rows, cols });
        setPaths(newPaths);
        setGameState('playing');
        setTimeLeft(600); // Reset timer to 10 minutes for each new level
        setHintedPathId(null);
        setEraserActive(false);
        setLives(3);
    }, []);

    // Start Game
    const initGame = useCallback(() => {
        setLevel(1);
        setHints(3);
        setErasers(1);
        setLives(3);
        setTotalPointsEarned(0);
        initLevel(1);
    }, [initLevel]);

    useEffect(() => {
        initGame();
        return () => {
            Object.values(animationIntervalsRef.current).forEach(clearInterval);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [initGame]);

    // Check if path is blocked along its exit line
    const isPathBlocked = useCallback((path, currentPaths) => {
        const head = path.coords[path.coords.length - 1];
        const vec = DIR_VECTORS[path.direction];
        let r = head.r + vec.r;
        let c = head.c + vec.c;

        while (r >= 0 && r < gridSize.rows && c >= 0 && c < gridSize.cols) {
            const isOccupied = currentPaths.some(other => {
                if (other.id === path.id || other.exited) return false;
                return other.coords.some(pt => pt.r === r && pt.c === c);
            });
            if (isOccupied) return true;
            r += vec.r;
            c += vec.c;
        }
        return false;
    }, [gridSize]);

    // Trigger sliding animation for a path
    const slidePathOut = useCallback((pathId) => {
        if (animationIntervalsRef.current[pathId]) return;

        setHintedPathId(null);

        // Mark path as sliding
        setPaths(prev => prev.map(p => p.id === pathId ? { ...p, isSliding: true } : p));

        const interval = setInterval(() => {
            setPaths(prev => {
                const target = prev.find(p => p.id === pathId);
                if (!target) {
                    clearInterval(interval);
                    return prev;
                }

                const allOut = target.coords.every(pt => 
                    pt.r < 0 || pt.r >= gridSize.rows || pt.c < 0 || pt.c >= gridSize.cols
                );

                if (allOut) {
                    clearInterval(interval);
                    delete animationIntervalsRef.current[pathId];

                    const updated = prev.map(p => p.id === pathId ? { ...p, coords: [], exited: true, isSliding: false } : p);
                    
                    const remainingActive = updated.filter(p => !p.exited);
                    if (remainingActive.length === 0) {
                        handleLevelClear();
                    }
                    return updated;
                }

                // Move 1 step forward
                const nextCoords = [];
                for (let i = 0; i < target.coords.length - 1; i++) {
                    nextCoords.push(target.coords[i + 1]);
                }
                const head = target.coords[target.coords.length - 1];
                const vec = DIR_VECTORS[target.direction];
                nextCoords.push({
                    r: head.r + vec.r,
                    c: head.c + vec.c
                });

                return prev.map(p => p.id === pathId ? { ...p, coords: nextCoords } : p);
            });
        }, 60);

        animationIntervalsRef.current[pathId] = interval;
    }, [gridSize]);

    // Handle level cleared
    const handleLevelClear = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('level_clear');

        // Award points
        if (gameRewardEnabled && totalPointsEarned < pointsMax) {
            const levelIndex = level - 1;
            const baseLevelPoints = levelIndex < pointsLevelList.length 
                ? pointsLevelList[levelIndex] 
                : pointsLevelList[pointsLevelList.length - 1];

            const earned = Math.min(baseLevelPoints, pointsMax - totalPointsEarned);
            if (earned > 0) {
                try {
                    const res = await authService.addPoints(earned, 'game');
                    if (res.data && res.data.success) {
                        if (updateUser) updateUser(res.data.user);
                        setTotalPointsEarned(prev => prev + earned);
                        setToastPoints(earned);
                        setTimeout(() => setToastPoints(null), 3000);
                    }
                } catch (err) {
                    console.error('Failed to sync Arrow Escape points', err);
                }
            }
        }
    };

    // Proceed to next level
    const nextLevel = () => {
        setLevel(prev => {
            const nextLvl = prev + 1;
            initLevel(nextLvl);
            return nextLvl;
        });
    };

    // Handle Path Tapped
    const handlePathClick = (path) => {
        if (gameState !== 'playing' || path.exited || path.isSliding) return;

        // Eraser Tool Action
        if (eraserActive && erasers > 0) {
            setErasers(prev => prev - 1);
            setEraserActive(false);
            slidePathOut(path.id);
            return;
        }

        const blocked = isPathBlocked(path, paths);
        if (blocked) {
            setShakingPathId(path.id);
            setLives(prev => {
                const nextLives = prev - 1;
                if (nextLives <= 0) {
                    setGameState('gameover');
                }
                return nextLives;
            });
            setTimeout(() => setShakingPathId(null), 300);
        } else {
            slidePathOut(path.id);
        }
    };

    // Tool: Hint
    const handleHint = () => {
        if (gameState !== 'playing') return;

        if (hints <= 0) {
            // Trigger Booster Modal
            setShowBoosterModal(true);
            return;
        }

        const clearPath = paths.find(p => !p.exited && !p.isSliding && !isPathBlocked(p, paths));
        if (clearPath) {
            setHintedPathId(clearPath.id);
            setHints(prev => prev - 1);
            setTimeout(() => setHintedPathId(prev => prev === clearPath.id ? null : prev), 4000);
        }
    };

    // Tool: Eraser Toggle
    const handleEraserToggle = () => {
        if (gameState !== 'playing') return;
        if (erasers <= 0) {
            setShowBoosterModal(true);
            return;
        }
        setEraserActive(prev => !prev);
    };

    // SVG path string builder
    const getSvgPathD = (coords) => {
        if (coords.length === 0) return '';
        const points = coords.map(pt => ({
            x: pt.c * cellSize + padding,
            y: pt.r * cellSize + padding
        }));
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    };

    // Triangle coordinates for direction arrowheads
    const getArrowheadPoints = (headPt, direction) => {
        const hX = headPt.c * cellSize + padding;
        const hY = headPt.r * cellSize + padding;
        const arrowWidth = cellSize * 0.32;
        const arrowSize = cellSize * 0.30;

        switch (direction) {
            case 'UP':
                return `${hX},${hY - arrowSize} ${hX - arrowWidth / 2},${hY} ${hX + arrowWidth / 2},${hY}`;
            case 'DOWN':
                return `${hX},${hY + arrowSize} ${hX - arrowWidth / 2},${hY} ${hX + arrowWidth / 2},${hY}`;
            case 'LEFT':
                return `${hX - arrowSize},${hY} ${hX},${hY - arrowWidth / 2} ${hX},${hY + arrowWidth / 2}`;
            case 'RIGHT':
                return `${hX + arrowSize},${hY} ${hX},${hY - arrowWidth / 2} ${hX},${hY + arrowWidth / 2}`;
            default:
                return '';
        }
    };

    // Path colors: turns green (#22c55e) on escape sliding!
    const getPathColor = (path, isHinted, isShaking) => {
        if (isShaking) return '#ef4444'; // Red error shake
        if (path.isSliding) return '#22c55e'; // Green escaping path matching screenshot
        if (isHinted) return '#eab308'; // Gold hint
        return '#1e293b'; // Charcoal black paths
    };

    // Booster purchase actions
    const handleBuyBooster = (qty, cost) => {
        if (qty === 1) {
            setHints(prev => prev + 1);
            setErasers(prev => prev + 1);
            setShowBoosterModal(false);
        } else if (qty === 3) {
            // Deduct points
            const currentPoints = user?.points || 0;
            if (currentPoints >= cost) {
                authService.addPoints(-cost, 'game').then(res => {
                    if (res.data && res.data.success) {
                        if (updateUser) updateUser(res.data.user);
                        setHints(prev => prev + 3);
                        setErasers(prev => prev + 3);
                        setShowBoosterModal(false);
                    }
                }).catch(err => {
                    console.error('Failed to buy boosters with points', err);
                });
            } else {
                alert('Insufficient points to purchase booster bundle.');
            }
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col font-sans overflow-hidden bg-[#f3f8fc] text-[#1e293b] pt-[72px]">
            
            {/* Play Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 relative">
                
                {toastPoints && (
                    <div className="absolute top-16 bg-emerald-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce z-50">
                        +{toastPoints} Points!
                    </div>
                )}

                {/* Exit Game, Level & Hearts, and Timer Badge (directly above puzzle) */}
                <div className="w-full max-w-md flex items-center justify-between mb-4 px-4 gap-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 rounded-full text-xs font-bold shadow-sm transition-all active:scale-[0.96]"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" /> Exit Game
                    </button>

                    {/* Level & Lives (Hearts) Pill */}
                    <div className="bg-white/80 border border-slate-200/65 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm">
                        <span>Level {level}</span>
                        {level === 1 && <span title="Brain Circuit">🧠</span>}
                        {level === 2 && <span title="Heart Circuit">❤️</span>}
                        {level === 3 && <span title="Lightning">⚡</span>}
                        {level === 4 && <span title="Star Circuit">⭐</span>}
                        <div className="flex gap-0.5 text-red-500 text-sm">
                            {Array(3).fill().map((_, i) => (
                                <span key={i}>{i < lives ? '❤️' : '🖤'}</span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#fef3c7] text-[#b45309] font-bold text-sm px-4 py-1 rounded-full border border-amber-200/50 shadow-sm flex items-center gap-1.5 select-none">
                        <span className="text-base leading-none">🕒</span>
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Main Game Board Card */}
                <div className="relative p-6 rounded-3xl border border-slate-100 bg-white shadow-md max-w-full max-h-[72vh] overflow-auto flex items-center justify-center">
                    
                    {gameState === 'level_clear' && (
                        <div className="absolute inset-0 bg-[#f3f8fc]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 animate-bounce">
                                {level === 1 ? '🧠' : level === 2 ? '❤️' : level === 3 ? '⚡' : level === 4 ? '⭐' : '🏆'}
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight">Level {level} Cleared!</h3>
                            {level === 1 && <p className="text-xs font-bold text-purple-600 mt-0.5">Brain Circuit Complete!</p>}
                            {level === 2 && <p className="text-xs font-bold text-rose-500 mt-0.5">Heart Circuit Complete!</p>}
                            {level === 3 && <p className="text-xs font-bold text-amber-500 mt-0.5">Lightning Diagonal Complete!</p>}
                            {level === 4 && <p className="text-xs font-bold text-yellow-500 mt-0.5">Star Circuit Complete!</p>}
                            <p className="text-xs text-slate-500 font-medium mt-1 mb-6">Excellent speed and path navigation.</p>
                            
                            <div className="flex flex-col gap-2.5 w-48">
                                <button
                                    onClick={nextLevel}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    Next Level →
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                            <div className="w-16 h-16 bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl flex items-center justify-center text-3xl mb-4">
                                {lives <= 0 ? '💔' : '⌛'}
                            </div>
                            <h3 className="text-xl font-extrabold text-amber-800 tracking-tight">
                                {lives <= 0 ? 'No Lives Left!' : 'Time Out!'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 mb-6">
                                {lives <= 0 ? 'You lost all your hearts. Try again!' : 'You ran out of time. Give it another try!'}
                            </p>
                            
                            <div className="flex flex-col gap-2.5 w-48">
                                <button
                                    onClick={initGame}
                                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onBack}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Grid Canvas */}
                    <div 
                        className="transition-transform duration-200"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            width: svgWidth,
                            height: svgHeight
                        }}
                    >
                        <svg 
                            width={svgWidth} 
                            height={svgHeight}
                            className="bg-white rounded-2xl transition-all overflow-visible"
                        >
                            {/* Grid lines stretching edge-to-edge */}
                            {Array(gridSize.cols).fill().map((_, c) => (
                                <line 
                                    key={`v-${c}`}
                                    x1={c * cellSize + padding}
                                    y1={0}
                                    x2={c * cellSize + padding}
                                    y2={svgHeight}
                                    stroke="#cbd5e1"
                                    strokeWidth="1"
                                    strokeDasharray={showGrid ? "none" : "1 5"}
                                    opacity={showGrid ? "0.9" : "0.75"}
                                />
                            ))}
                            {Array(gridSize.rows).fill().map((_, r) => (
                                <line 
                                    key={`h-${r}`}
                                    x1={0}
                                    y1={r * cellSize + padding}
                                    x2={svgWidth}
                                    y2={r * cellSize + padding}
                                    stroke="#cbd5e1"
                                    strokeWidth="1"
                                    strokeDasharray={showGrid ? "none" : "1 5"}
                                    opacity={showGrid ? "0.9" : "0.75"}
                                />
                            ))}



                            {/* Render path lines */}
                            {paths.map((path, idx) => {
                                if (path.exited || path.coords.length < 2) return null;

                                const pathD = getSvgPathD(path.coords);
                                const headPt = path.coords[path.coords.length - 1];
                                const isShaking = shakingPathId === path.id;
                                const isHinted = hintedPathId === path.id;
                                const color = getPathColor(path, isHinted, isShaking);
                                
                                return (
                                    <g 
                                        key={path.id}
                                        onClick={() => handlePathClick(path)}
                                        className={`cursor-pointer transition-all ${
                                            isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''
                                        }`}
                                    >
                                        {/* Invisible thick hitbox path for easier click targets */}
                                        <path 
                                            d={pathD}
                                            stroke="transparent"
                                            strokeWidth={cellSize * 0.55}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />

                                        {/* Main Visible Path Line */}
                                        <path 
                                            d={pathD}
                                            stroke={color}
                                            strokeWidth={cellSize * 0.16}
                                            strokeLinecap="butt"
                                            strokeLinejoin="round"
                                            fill="none"
                                            className="transition-all duration-150"
                                        />

                                        {/* Heading Direction Arrowhead */}
                                        <polygon 
                                            points={getArrowheadPoints(headPt, path.direction)}
                                            fill={color}
                                        />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Bottom Control Actions (matching screenshots exactly) */}
                <div className="w-full max-w-md mt-6 flex items-center justify-between px-4 gap-4">
                    <div className="flex items-center gap-3">
                        {/* Hint Button */}
                        <button
                            onClick={handleHint}
                            className="relative w-14 h-14 bg-[#e8effa] hover:bg-[#dce7f7] text-[#4f46e5] rounded-2xl flex items-center justify-center shadow-sm transition-colors border border-slate-200/50"
                            title="Reveal solvable path"
                        >
                            <FiSearch className="w-5 h-5" />
                            {/* Green plus badge matching screenshot */}
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#22c55e] text-white font-extrabold text-xs rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                +
                            </span>
                        </button>

                        {/* Eraser Button */}
                        <button
                            onClick={handleEraserToggle}
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors border border-slate-200/50 ${
                                eraserActive 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-[#e8effa] hover:bg-[#dce7f7] text-[#4f46e5]'
                            }`}
                            title="Erase one path directly"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="m14 2 8 8c.5.5.5 1.5 0 2l-6 6" />
                                <path d="M12 4 4 12c-.5.5-.5 1.5 0 2l4 4c.5.5 1.5.5 2 0l8-8" />
                                <path d="m18 12-8 8" />
                                <path d="M22 22H2" />
                            </svg>
                            {/* Red quantity count badge matching screenshot */}
                            <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {erasers}
                            </span>
                        </button>

                        {/* Grid Toggle Button (# symbol with ON/OFF badge) */}
                        <button
                            onClick={() => setShowGrid(prev => !prev)}
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors border border-slate-200/50 ${
                                showGrid 
                                    ? 'bg-[#cbd5e1]/40 text-[#4f46e5]' 
                                    : 'bg-[#e8effa] hover:bg-[#dce7f7] text-[#4f46e5]'
                            }`}
                            title="Toggle Grid Lines"
                        >
                            <span className="font-black text-xl tracking-tighter">#</span>
                            {/* ON / OFF tag matching screenshot */}
                            <span className={`absolute -top-1.5 -right-1.5 px-1 rounded text-[7px] font-black uppercase text-white shadow-sm ${
                                showGrid ? 'bg-indigo-650' : 'bg-slate-400'
                            }`}>
                                {showGrid ? 'ON' : 'OFF'}
                            </span>
                        </button>
                    </div>

                    {/* Vertical Zoom / Scaling tools next to buttons */}
                    <div className="flex items-center gap-1.5 text-slate-500 bg-white/40 rounded-xl px-2 py-1 border border-slate-100">
                        <div className="flex flex-col">
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="p-0.5 hover:text-slate-900 transition-colors"
                                title="Zoom In"
                            >
                                <FiZoomIn className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            <button
                                onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
                                className="p-0.5 hover:text-slate-900 transition-colors"
                                title="Zoom Out"
                            >
                                <FiZoomOut className="w-5 h-5 stroke-[2.5]" />
                            </button>
                        </div>
                        <span className="text-[10px] font-black w-8 text-center select-none text-slate-600">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Booster Shop Modal (matching layout screenshot 3) */}
            {showBoosterModal && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 text-center animate-fade-in">
                        
                        {/* Close button */}
                        <button 
                            onClick={() => setShowBoosterModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-xl font-extrabold text-[#3b82f6] tracking-tight mt-2">Get Booster</h3>
                        
                        {/* Beautiful custom vector magnifying glass illustration */}
                        <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto my-3 select-none">
                            <circle cx="46" cy="44" r="23" fill="#edf4ff" stroke="#334155" strokeWidth="5.5" />
                            <path d="M30 34 A18 18 0 0 1 54 28" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                            <rect x="62" y="60" width="8" height="14" transform="rotate(-45 62 60)" fill="#64748b" stroke="#334155" strokeWidth="5.5" />
                            <rect x="67" y="65" width="10" height="26" rx="5" transform="rotate(-45 67 65)" fill="#f43f5e" stroke="#9f1239" strokeWidth="5.5" />
                        </svg>

                        {/* Title block */}
                        <div className="bg-[#e8f0fe] text-blue-700 text-xs font-bold py-2 px-4 rounded-xl mb-6 mx-auto w-fit">
                            Get Hint Booster
                        </div>

                        {/* Booster purchase choices */}
                        <div className="flex justify-between items-center gap-3">
                            {/* Option 1: Watch Video ad */}
                            <button
                                onClick={() => handleBuyBooster(1, 0)}
                                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-xs py-3 px-3 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-all"
                            >
                                <span className="text-base">🎬</span>
                                <span>Get x1</span>
                            </button>

                            {/* Option 2: Pay with game points */}
                            <button
                                onClick={() => handleBuyBooster(3, 1200)}
                                className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-extrabold text-xs py-3 px-2 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-all"
                            >
                                <span className="font-extrabold">Get x3</span>
                                <div className="flex items-center gap-0.5">
                                    <span className="text-[10px] text-amber-300">🟡</span>
                                    <span className="text-[10px]">1200</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom keyframes animation style block */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    15%, 45%, 75% { transform: translate3d(-5px, 0, 0); }
                    30%, 60%, 90% { transform: translate3d(5px, 0, 0); }
                }
            `}} />
        </div>
    );
};

export default ArrowEscape;
