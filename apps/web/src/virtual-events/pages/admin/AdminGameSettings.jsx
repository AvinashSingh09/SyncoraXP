import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { MdSettings, MdAdd, MdDelete, MdRefresh, MdSave } from 'react-icons/md';
import { FiInfo } from 'react-icons/fi';

const DEFAULT_WORDS = [
    'REACT', 'JAVASCRIPT', 'MONGODB', 'NODEJS', 'EXPRESS', 
    'TAILWIND', 'SOCKET', 'GEMINI', 'VIRTUAL', 'EVENT', 
    'LOBBY', 'EXPO', 'AUDITORIUM', 'LOUNGE', 'WEBSOCKET'
];

const DEFAULT_SCRAMBLE_WORDS = [
    'KEYNOTE', 'SPONSOR', 'WEBINAR', 'LOUNGE', 'AUDITORIUM', 
    'NETWORKING', 'EXPO', 'ATTENDEE', 'CHAT', 'LOBBY', 'VIRTUAL'
];

const AdminGameSettings = () => {
    // Hangman states
    const [hangmanEnabled, setHangmanEnabled] = useState(true);
    const [words, setWords] = useState([]);
    const [newWord, setNewWord] = useState('');

    // Memory Match states
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [memoryThemeType, setMemoryThemeType] = useState('sponsors'); // 'sponsors', 'entertainment', 'animals', 'food', 'nature', 'custom'
    const [customImages, setCustomImages] = useState([]);
    const [uploadingCustom, setUploadingCustom] = useState(false);

    // Snake states
    const [snakeEnabled, setSnakeEnabled] = useState(true);
    const [snakeDifficulty, setSnakeDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'

    // Word Scramble states
    const [scrambleEnabled, setScrambleEnabled] = useState(true);
    const [scrambleWords, setScrambleWords] = useState([]);
    const [newScrambleWord, setNewScrambleWord] = useState('');
    const [scrambleTimer, setScrambleTimer] = useState('30');

    // Memory Matrix states
    const [matrixEnabled, setMatrixEnabled] = useState(true);
    const [matrixDifficulty, setMatrixDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'

    // Arrow Escape states
    const [arrowEscapeEnabled, setArrowEscapeEnabled] = useState(true);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error' | 'warning', text }

    // Helper to display message and auto-clear it
    const showStatusMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage(null);
        }, 5000);
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [hangmanEnabledRes, hangmanWordsRes, memoryEnabledRes, memoryThemeRes, snakeEnabledRes, snakeDifficultyRes, scrambleEnabledRes, scrambleWordsRes, scrambleTimerRes, matrixEnabledRes, matrixDifficultyRes, arrowEscapeEnabledRes] = await Promise.all([
                    configService.getConfig('game_hangman_enabled'),
                    configService.getConfig('hangman_words'),
                    configService.getConfig('game_memory_match_enabled'),
                    configService.getConfig('game_memory_match_theme'),
                    configService.getConfig('game_snake_enabled'),
                    configService.getConfig('game_snake_difficulty'),
                    configService.getConfig('game_scramble_enabled'),
                    configService.getConfig('scramble_words'),
                    configService.getConfig('game_scramble_timer'),
                    configService.getConfig('game_matrix_enabled'),
                    configService.getConfig('game_matrix_difficulty'),
                    configService.getConfig('game_arrow_escape_enabled')
                ]);

                // Load Hangman Enable/Disable
                if (hangmanEnabledRes.data && hangmanEnabledRes.data.value) {
                    setHangmanEnabled(hangmanEnabledRes.data.value === 'true');
                }

                // Load Hangman words
                if (hangmanWordsRes.data && hangmanWordsRes.data.value) {
                    const parsed = JSON.parse(hangmanWordsRes.data.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setWords(parsed);
                    } else {
                        setWords(DEFAULT_WORDS);
                    }
                } else {
                    setWords(DEFAULT_WORDS);
                }

                // Load Memory Match Enable/Disable
                if (memoryEnabledRes.data && memoryEnabledRes.data.value) {
                    setMemoryEnabled(memoryEnabledRes.data.value === 'true');
                }

                // Load Memory Match theme
                if (memoryThemeRes.data && memoryThemeRes.data.value) {
                    try {
                        const parsed = JSON.parse(memoryThemeRes.data.value);
                        if (parsed.type) setMemoryThemeType(parsed.type);
                        if (parsed.customImages) setCustomImages(parsed.customImages);
                    } catch (e) {
                        console.error('Failed to parse memory match theme config', e);
                    }
                }

                // Load Snake Enable/Disable
                if (snakeEnabledRes.data && snakeEnabledRes.data.value) {
                    setSnakeEnabled(snakeEnabledRes.data.value === 'true');
                }

                // Load Snake Difficulty
                if (snakeDifficultyRes.data && snakeDifficultyRes.data.value) {
                    setSnakeDifficulty(snakeDifficultyRes.data.value);
                }

                // Load Word Scramble Enable/Disable
                if (scrambleEnabledRes.data && scrambleEnabledRes.data.value) {
                    setScrambleEnabled(scrambleEnabledRes.data.value === 'true');
                }

                // Load Word Scramble words
                if (scrambleWordsRes.data && scrambleWordsRes.data.value) {
                    const parsed = JSON.parse(scrambleWordsRes.data.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setScrambleWords(parsed);
                    } else {
                        setScrambleWords(DEFAULT_SCRAMBLE_WORDS);
                    }
                } else {
                    setScrambleWords(DEFAULT_SCRAMBLE_WORDS);
                }

                // Load Word Scramble timer
                if (scrambleTimerRes.data && scrambleTimerRes.data.value) {
                    setScrambleTimer(scrambleTimerRes.data.value);
                } else {
                    setScrambleTimer('30');
                }

                // Load Memory Matrix Enable/Disable
                if (matrixEnabledRes.data && matrixEnabledRes.data.value) {
                    setMatrixEnabled(matrixEnabledRes.data.value === 'true');
                } else {
                    setMatrixEnabled(true);
                }

                // Load Memory Matrix Difficulty
                if (matrixDifficultyRes.data && matrixDifficultyRes.data.value) {
                    setMatrixDifficulty(matrixDifficultyRes.data.value);
                } else {
                    setMatrixDifficulty('medium');
                }

                // Load Arrow Escape Enable/Disable
                if (arrowEscapeEnabledRes.data && arrowEscapeEnabledRes.data.value) {
                    setArrowEscapeEnabled(arrowEscapeEnabledRes.data.value === 'true');
                } else {
                    setArrowEscapeEnabled(true);
                }
            } catch (err) {
                console.error('Failed to fetch game configs', err);
                setWords(DEFAULT_WORDS);
                setScrambleWords(DEFAULT_SCRAMBLE_WORDS);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleAddWord = () => {
        const trimmed = newWord.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (!trimmed) return;
        if (words.includes(trimmed)) {
            showStatusMessage('error', 'Word already exists in the list!');
            return;
        }
        setWords(prev => [...prev, trimmed]);
        setNewWord('');
    };

    const handleRemoveWord = (wordToRemove) => {
        setWords(prev => prev.filter(w => w !== wordToRemove));
    };

    const handleResetDefaults = () => {
        if (window.confirm('Reset Hangman word list to default tech terms? This will lose unsaved changes.')) {
            setWords(DEFAULT_WORDS);
        }
    };

    const handleAddScrambleWord = () => {
        const trimmed = newScrambleWord.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (!trimmed) return;
        if (scrambleWords.includes(trimmed)) {
            showStatusMessage('error', 'Word already exists in the list!');
            return;
        }
        setScrambleWords(prev => [...prev, trimmed]);
        setNewScrambleWord('');
    };

    const handleRemoveScrambleWord = (wordToRemove) => {
        setScrambleWords(prev => prev.filter(w => w !== wordToRemove));
    };

    const handleResetScrambleDefaults = () => {
        if (window.confirm('Reset Word Scramble list to default event terms? This will lose unsaved changes.')) {
            setScrambleWords(DEFAULT_SCRAMBLE_WORDS);
        }
    };

    const handleCustomImagesChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if (files.length !== 8) {
            showStatusMessage('error', 'Please select exactly 8 images.');
            return;
        }

        setUploadingCustom(true);
        const uploadedUrls = [];
        try {
            for (let file of files) {
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                });
                reader.readAsDataURL(file);
                const base64Data = await base64Promise;
                const res = await configService.uploadImage(base64Data);
                if (res.data && res.data.url) {
                    uploadedUrls.push(res.data.url);
                }
            }
            setCustomImages(uploadedUrls);
            setMemoryThemeType('custom');
            showStatusMessage('success', 'All 8 images uploaded successfully!');
        } catch (err) {
            console.error('Failed to upload custom images', err);
            showStatusMessage('error', 'Failed to upload custom images. Please try again.');
        } finally {
            setUploadingCustom(false);
        }
    };

    const handleSave = async () => {
        if (words.length === 0 && hangmanEnabled) {
            showStatusMessage('error', 'Please add at least one word to the Hangman word pool!');
            return;
        }
        if (scrambleWords.length === 0 && scrambleEnabled) {
            showStatusMessage('error', 'Please add at least one word to the Word Scramble pool!');
            return;
        }
        if (memoryThemeType === 'custom' && customImages.length !== 8 && memoryEnabled) {
            showStatusMessage('error', 'Please upload exactly 8 custom images to use Custom theme.');
            return;
        }

        const timerVal = parseInt(scrambleTimer);
        if (isNaN(timerVal) || timerVal <= 5 || timerVal > 120) {
            showStatusMessage('error', 'Scramble timer must be a number between 5 and 120 seconds!');
            return;
        }

        setSaving(true);
        try {
            await Promise.all([
                configService.setConfig('game_hangman_enabled', hangmanEnabled ? 'true' : 'false'),
                configService.setConfig('hangman_words', JSON.stringify(words)),
                configService.setConfig('game_memory_match_enabled', memoryEnabled ? 'true' : 'false'),
                configService.setConfig('game_memory_match_theme', JSON.stringify({
                    type: memoryThemeType,
                    customImages
                })),
                configService.setConfig('game_snake_enabled', snakeEnabled ? 'true' : 'false'),
                configService.setConfig('game_snake_difficulty', snakeDifficulty),
                configService.setConfig('game_scramble_enabled', scrambleEnabled ? 'true' : 'false'),
                configService.setConfig('scramble_words', JSON.stringify(scrambleWords)),
                configService.setConfig('game_scramble_timer', scrambleTimer),
                configService.setConfig('game_matrix_enabled', matrixEnabled ? 'true' : 'false'),
                configService.setConfig('game_matrix_difficulty', matrixDifficulty),
                configService.setConfig('game_arrow_escape_enabled', arrowEscapeEnabled ? 'true' : 'false')
            ]);
            showStatusMessage('success', 'Game Settings saved successfully!');
        } catch (err) {
            console.error('Failed to save game settings config', err);
            showStatusMessage('error', 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10 animate-fade-in text-gray-800 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <MdSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Game Settings</h2>
                        <p className="text-xs text-gray-500">Configure settings, word pools, and visual themes for all platform games.</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : message.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <FiInfo className="w-4 h-4 shrink-0" />
                    <span>{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-semibold">Loading configurations...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    
                    {/* HANGMAN CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🔠 Hangman Game Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure words and game availability.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{hangmanEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={hangmanEnabled}
                                        onChange={(e) => setHangmanEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {hangmanEnabled && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-700">Hangman Word List</h4>
                                        <p className="text-[10px] text-gray-450">Vocabulary pool that attendees guess.</p>
                                    </div>
                                    <button
                                        onClick={handleResetDefaults}
                                        className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-gray-200 transition-colors cursor-pointer"
                                    >
                                        <MdRefresh className="w-4 h-4" /> Reset Defaults
                                    </button>
                                </div>

                                {/* Add Word Form */}
                                <div className="bg-[#f8fafc]/50 border border-dashed border-gray-300 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3.5">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">New Word</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. DOCKER (A-Z only)"
                                            value={newWord}
                                            onChange={(e) => setNewWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddWord(); }}
                                            className="bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 w-full"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddWord}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer justify-center w-full sm:w-auto h-[38px]"
                                    >
                                        <MdAdd className="w-4.5 h-4.5" /> Add Word
                                    </button>
                                </div>

                                {/* Word List Container */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-750 mb-2">Active Word Pool ({words.length})</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[160px] overflow-y-auto pr-2 p-1">
                                        {words.map((word) => (
                                            <div key={word} className="flex items-center justify-between p-2 bg-[#f8fafc] border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                                                <span className="text-xs font-black tracking-wide text-gray-700 truncate ml-1">{word}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveWord(word)}
                                                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg hover:text-red-700 transition-colors cursor-pointer shrink-0"
                                                    title="Delete Word"
                                                >
                                                    <MdDelete className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MEMORY MATCH CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🎮 Memory Match Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure visual themes and game availability.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{memoryEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={memoryEnabled}
                                        onChange={(e) => setMemoryEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {memoryEnabled && (
                            <div className="p-6 bg-[#18181b] rounded-2xl border border-neutral-800 space-y-6 text-neutral-200 animate-fade-in">
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Memory Match Theme</h4>
                                    <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Customize the card icons and theme for the user's Memory Match game.</p>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block text-center">Choose Icon Set</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {[
                                            { id: 'sponsors', name: 'Sponsors', icons: '🏢 ⭐️ 🤝' },
                                            { id: 'entertainment', name: 'Entertainment', icons: '🎮 🎯 🎨' },
                                            { id: 'animals', name: 'Animals', icons: '🐶 🐱 🐭' },
                                            { id: 'food', name: 'Food', icons: '🍎 🍌 🍇' },
                                            { id: 'nature', name: 'Nature', icons: '🌸 🌺 🌻' }
                                        ].map(set => (
                                            <button
                                                key={set.id}
                                                type="button"
                                                onClick={() => setMemoryThemeType(set.id)}
                                                className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                                    memoryThemeType === set.id
                                                        ? 'border-[#a3e635] bg-[#a3e635]/10 text-white shadow-[0_0_12px_rgba(163,230,53,0.2)]'
                                                        : 'border-neutral-800 bg-[#27272a] text-neutral-455 hover:border-neutral-700'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold tracking-wider uppercase">{set.name}</span>
                                                <span className="text-xl">{set.icons}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block text-center">Or Upload Custom Images</span>
                                        <label className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                                            memoryThemeType === 'custom'
                                                ? 'border-[#a3e635] bg-[#a3e635]/5'
                                                : 'border-neutral-800 bg-[#27272a]/50 hover:border-neutral-700'
                                        }`}>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleCustomImagesChange}
                                                className="hidden"
                                                disabled={uploadingCustom}
                                            />
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <span className="text-lg text-neutral-455">📤</span>
                                                <span className="text-xs font-bold text-neutral-250 mt-1">
                                                    {uploadingCustom ? 'Uploading...' : 'Select 8 Images'}
                                                </span>
                                                <span className="text-[9px] text-neutral-500 font-semibold mt-1">
                                                    Max 2MB each • Recommended: 128×128px square
                                                </span>
                                            </div>
                                        </label>
                                        
                                        {customImages.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold text-neutral-455">Custom Set Preview</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMemoryThemeType('sponsors');
                                                            setCustomImages([]);
                                                        }}
                                                        className="text-[9px] font-bold text-red-400 hover:text-red-300"
                                                    >
                                                        Clear Custom Images
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#27272a] rounded-lg border border-neutral-800">
                                                    {customImages.map((url, i) => (
                                                        <div key={i} className="aspect-square rounded border border-neutral-750 overflow-hidden bg-neutral-900 flex items-center justify-center">
                                                            <img src={url} alt={`preview ${i}`} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SNAKE CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-1">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🐍 Snake Game Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure snake game availability and difficulty.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{snakeEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={snakeEnabled}
                                        onChange={(e) => setSnakeEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Difficulty Options */}
                        {snakeEnabled && (
                            <div className="space-y-3 pt-3 border-t border-gray-100 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Game Difficulty</label>
                                <div className="flex gap-4">
                                    {[
                                        { id: 'easy', name: 'Easy', desc: 'Slow starting speed' },
                                        { id: 'medium', name: 'Medium', desc: 'Standard speed' },
                                        { id: 'hard', name: 'Hard', desc: 'Fast speed challenge' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSnakeDifficulty(opt.id)}
                                            className={`flex-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                                snakeDifficulty === opt.id
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                                                    : 'border-gray-250 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="text-xs">{opt.name}</div>
                                            <div className="text-[9px] text-gray-450 font-medium mt-0.5">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* WORD SCRAMBLE CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🔤 Word Scramble Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure words and game availability.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{scrambleEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={scrambleEnabled}
                                        onChange={(e) => setScrambleEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {scrambleEnabled && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex flex-col gap-1.5 max-w-xs border-b border-gray-100 pb-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Word Timer (Seconds)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={scrambleTimer}
                                        onChange={(e) => setScrambleTimer(e.target.value)}
                                        className="bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-105 focus:border-blue-500 text-gray-800 w-full font-semibold"
                                    />
                                    <span className="text-[9px] text-gray-400 font-semibold">Time allowed per word. Set between 5 and 120 seconds.</span>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-700">Word Scramble List</h4>
                                        <p className="text-[10px] text-gray-455">Vocabulary pool that attendees guess.</p>
                                    </div>
                                    <button
                                        onClick={handleResetScrambleDefaults}
                                        className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-gray-200 transition-colors cursor-pointer"
                                    >
                                        <MdRefresh className="w-4 h-4" /> Reset Defaults
                                    </button>
                                </div>

                                {/* Add Word Form */}
                                <div className="bg-[#f8fafc]/50 border border-dashed border-gray-300 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3.5">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">New Word</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. WEBINAR (A-Z only)"
                                            value={newScrambleWord}
                                            onChange={(e) => setNewScrambleWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddScrambleWord(); }}
                                            className="bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 w-full"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddScrambleWord}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer justify-center w-full sm:w-auto h-[38px]"
                                    >
                                        <MdAdd className="w-4.5 h-4.5" /> Add Word
                                    </button>
                                </div>

                                {/* Word List Container */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-750 mb-2">Active Word Pool ({scrambleWords.length})</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[160px] overflow-y-auto pr-2 p-1">
                                        {scrambleWords.map((word) => (
                                            <div key={word} className="flex items-center justify-between p-2 bg-[#f8fafc] border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                                                <span className="text-xs font-black tracking-wide text-gray-700 truncate ml-1">{word}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveScrambleWord(word)}
                                                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg hover:text-red-700 transition-colors cursor-pointer shrink-0"
                                                    title="Delete Word"
                                                >
                                                    <MdDelete className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MEMORY MATRIX CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-1">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🔲 Memory Grid Matrix Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure pattern recall game availability.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{matrixEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={matrixEnabled}
                                        onChange={(e) => setMatrixEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {matrixEnabled && (
                            <div className="space-y-3 pt-3 border-t border-gray-100 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Game Difficulty</label>
                                <div className="flex gap-4">
                                    {[
                                        { id: 'easy', name: 'Easy', desc: 'Longer flash time' },
                                        { id: 'medium', name: 'Medium', desc: 'Standard flash time' },
                                        { id: 'hard', name: 'Hard', desc: 'Fast flash speed' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setMatrixDifficulty(opt.id)}
                                            className={`flex-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                                matrixDifficulty === opt.id
                                                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-extrabold shadow-sm'
                                                    : 'border-gray-250 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="text-xs">{opt.name}</div>
                                            <div className="text-[9px] text-gray-400 mt-0.5 font-semibold leading-normal">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ARROW ESCAPE CONFIGURATION CARD */}
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-1">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                                    🏹 Arrow Escape Settings
                                </h3>
                                <p className="text-xs text-gray-500">Configure winding line path sliding game availability.</p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{arrowEscapeEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={arrowEscapeEnabled}
                                        onChange={(e) => setArrowEscapeEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Save Action */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
                        >
                            <MdSave className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGameSettings;
