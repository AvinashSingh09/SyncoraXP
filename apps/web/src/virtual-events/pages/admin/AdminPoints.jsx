import React, { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiInfo } from 'react-icons/fi';
import { configService } from '../../services/api';

const AdminPoints = () => {
    const [boothRewardEnabled, setBoothRewardEnabled] = useState(true);
    const [boothPoints, setBoothPoints] = useState('50');
    
    const [gameRewardEnabled, setGameRewardEnabled] = useState(true);
    
    // Tic-Tac-Toe points
    const [pointsTictactoeWin, setPointsTictactoeWin] = useState('30');
    const [pointsTictactoeTie, setPointsTictactoeTie] = useState('10');
    
    // Memory Match points
    const [pointsMemoryWin, setPointsMemoryWin] = useState('25');
    const [pointsMemorySpeed, setPointsMemorySpeed] = useState('15');
    const [pointsMemoryAccuracy, setPointsMemoryAccuracy] = useState('10');
    
    // Hangman points
    const [pointsHangmanWin, setPointsHangmanWin] = useState('20');
    
    // Snake points
    const [pointsSnakeMax, setPointsSnakeMax] = useState('20');
    
    // Word Scramble points
    const [pointsScrambleWin, setPointsScrambleWin] = useState('15');

    // Memory Matrix points
    const [pointsMatrixLevelList, setPointsMatrixLevelList] = useState('5,10,15,20,25');
    const [pointsMatrixMax, setPointsMatrixMax] = useState('50');
    
    // Poll states
    const [pollRewardEnabled, setPollRewardEnabled] = useState(false);
    const [pollPoints, setPollPoints] = useState('15');

    // Quiz states
    const [quizRewardEnabled, setQuizRewardEnabled] = useState(false);
    const [quizPoints, setQuizPoints] = useState('10');

    // Survey states
    const [surveyRewardEnabled, setSurveyRewardEnabled] = useState(false);
    const [surveyPoints, setSurveyPoints] = useState('100');

    // Memory Match Theme states
    const [memoryThemeType, setMemoryThemeType] = useState('sponsors'); // 'sponsors', 'entertainment', 'animals', 'food', 'nature', 'custom'
    const [customImages, setCustomImages] = useState([]); // array of up to 8 image URLs
    const [uploadingCustom, setUploadingCustom] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [message, setMessage] = useState(null);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const keys = [
                'reward_booth_enabled',
                'points_booth_visit', 
                'reward_game_enabled',
                'reward_poll_enabled',
                'points_poll_vote',
                'reward_quiz_enabled',
                'points_quiz_correct',
                'reward_survey_enabled',
                'points_survey_complete',
                'game_memory_match_theme',
                'points_tictactoe_win',
                'points_tictactoe_tie',
                'points_memory_win',
                'points_memory_speed',
                'points_memory_accuracy',
                'points_hangman_win',
                'points_snake_max',
                'points_scramble_win',
                'points_matrix_level_list',
                'points_matrix_max',
                'points_game_win', // Fallbacks
                'points_game_tie'
            ];
            const responses = await Promise.all(
                keys.map(k => configService.getConfig(k))
            );

            const [
                boothEnabledRes, boothRes, gameEnabledRes, 
                pollEnabledRes, pollPointsRes, 
                quizEnabledRes, quizPointsRes, 
                surveyEnabledRes, surveyPointsRes, 
                themeRes,
                tictactoeWinRes, tictactoeTieRes,
                memoryWinRes, memorySpeedRes, memoryAccuracyRes,
                hangmanWinRes, snakeMaxRes, scrambleWinRes,
                matrixLevelListRes, matrixMaxRes,
                oldWinRes, oldTieRes
            ] = responses;

            if (boothEnabledRes.data && boothEnabledRes.data.value) setBoothRewardEnabled(boothEnabledRes.data.value === 'true');
            if (boothRes.data && boothRes.data.value) setBoothPoints(boothRes.data.value);
            
            if (gameEnabledRes.data && gameEnabledRes.data.value) setGameRewardEnabled(gameEnabledRes.data.value === 'true');
            
            // Set Tic-Tac-Toe points (with old config fallbacks)
            const oldWin = oldWinRes.data && oldWinRes.data.value ? oldWinRes.data.value : '30';
            const oldTie = oldTieRes.data && oldTieRes.data.value ? oldTieRes.data.value : '10';
            
            if (tictactoeWinRes.data && tictactoeWinRes.data.value) {
                setPointsTictactoeWin(tictactoeWinRes.data.value);
            } else {
                setPointsTictactoeWin(oldWin);
            }
            if (tictactoeTieRes.data && tictactoeTieRes.data.value) {
                setPointsTictactoeTie(tictactoeTieRes.data.value);
            } else {
                setPointsTictactoeTie(oldTie);
            }

            // Set Memory Match points
            if (memoryWinRes.data && memoryWinRes.data.value) setPointsMemoryWin(memoryWinRes.data.value);
            if (memorySpeedRes.data && memorySpeedRes.data.value) setPointsMemorySpeed(memorySpeedRes.data.value);
            if (memoryAccuracyRes.data && memoryAccuracyRes.data.value) setPointsMemoryAccuracy(memoryAccuracyRes.data.value);

            // Set Hangman points
            if (hangmanWinRes.data && hangmanWinRes.data.value) {
                setPointsHangmanWin(hangmanWinRes.data.value);
            } else {
                setPointsHangmanWin('20');
            }

            // Set Snake points
            if (snakeMaxRes.data && snakeMaxRes.data.value) {
                setPointsSnakeMax(snakeMaxRes.data.value);
            } else {
                setPointsSnakeMax('20');
            }

            // Set Word Scramble points
            if (scrambleWinRes.data && scrambleWinRes.data.value) {
                setPointsScrambleWin(scrambleWinRes.data.value);
            } else {
                setPointsScrambleWin('15');
            }

            // Set Memory Matrix points
            if (matrixLevelListRes.data && matrixLevelListRes.data.value) {
                setPointsMatrixLevelList(matrixLevelListRes.data.value);
            } else {
                setPointsMatrixLevelList('5,10,15,20,25');
            }
            if (matrixMaxRes.data && matrixMaxRes.data.value) {
                setPointsMatrixMax(matrixMaxRes.data.value);
            } else {
                setPointsMatrixMax('50');
            }
            
            if (pollEnabledRes.data && pollEnabledRes.data.value) setPollRewardEnabled(pollEnabledRes.data.value === 'true');
            if (pollPointsRes.data && pollPointsRes.data.value) setPollPoints(pollPointsRes.data.value);
            
            if (quizEnabledRes.data && quizEnabledRes.data.value) setQuizRewardEnabled(quizEnabledRes.data.value === 'true');
            if (quizPointsRes.data && quizPointsRes.data.value) setQuizPoints(quizPointsRes.data.value);
            if (surveyEnabledRes.data && surveyEnabledRes.data.value) setSurveyRewardEnabled(surveyEnabledRes.data.value === 'true');
            if (surveyPointsRes.data && surveyPointsRes.data.value) setSurveyPoints(surveyPointsRes.data.value);

            if (themeRes && themeRes.data && themeRes.data.value) {
                try {
                    const parsed = JSON.parse(themeRes.data.value);
                    if (parsed.type) setMemoryThemeType(parsed.type);
                    if (parsed.customImages) setCustomImages(parsed.customImages);
                } catch(e) {
                    console.error('Failed to parse memory match theme config', e);
                }
            }
        } catch (err) {
            console.error('Failed to load point configurations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleCustomImagesChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if (files.length !== 8) {
            setMessage({ type: 'error', text: 'Please select exactly 8 images.' });
            setTimeout(() => setMessage(null), 5000);
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
            setMessage({ type: 'success', text: 'All 8 images uploaded successfully!' });
            setTimeout(() => setMessage(null), 5000);
        } catch (err) {
            console.error('Failed to upload custom images', err);
            setMessage({ type: 'error', text: 'Failed to upload custom images. Please try again.' });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setUploadingCustom(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validate inputs
        const booth = parseInt(boothPoints);
        const poll = parseInt(pollPoints);
        const quiz = parseInt(quizPoints);
        const survey = parseInt(surveyPoints);

        // Individual Game Points validations
        const ttWin = parseInt(pointsTictactoeWin);
        const ttTie = parseInt(pointsTictactoeTie);
        const memWin = parseInt(pointsMemoryWin);
        const memSpeed = parseInt(pointsMemorySpeed);
        const memAcc = parseInt(pointsMemoryAccuracy);
        const hangWin = parseInt(pointsHangmanWin);
        const snakeMax = parseInt(pointsSnakeMax);
        const scrambleWin = parseInt(pointsScrambleWin);
        const matrixMax = parseInt(pointsMatrixMax);

        const matrixLevelArray = pointsMatrixLevelList.split(',').map(s => parseInt(s.trim()));
        const hasInvalidLevelPoints = matrixLevelArray.some(val => isNaN(val) || val <= 0);

        if (
            isNaN(booth) || booth <= 0 || 
            isNaN(poll) || poll <= 0 ||
            isNaN(quiz) || quiz <= 0 ||
            isNaN(survey) || survey <= 0 ||
            isNaN(ttWin) || ttWin <= 0 ||
            isNaN(ttTie) || ttTie <= 0 ||
            isNaN(memWin) || memWin <= 0 ||
            isNaN(memSpeed) || memSpeed <= 0 ||
            isNaN(memAcc) || memAcc <= 0 ||
            isNaN(hangWin) || hangWin <= 0 ||
            isNaN(snakeMax) || snakeMax <= 0 ||
            isNaN(scrambleWin) || scrambleWin <= 0 ||
            hasInvalidLevelPoints || matrixLevelArray.length === 0 ||
            isNaN(matrixMax) || matrixMax <= 0
        ) {
            setMessage({ type: 'error', text: 'All point values must be positive integers, and Level list must be valid numbers (e.g. 5,10,15).' });
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                configService.setConfig('reward_booth_enabled', boothRewardEnabled ? 'true' : 'false'),
                configService.setConfig('points_booth_visit', boothPoints),
                configService.setConfig('reward_game_enabled', gameRewardEnabled ? 'true' : 'false'),
                
                // Save individual game points
                configService.setConfig('points_tictactoe_win', pointsTictactoeWin),
                configService.setConfig('points_tictactoe_tie', pointsTictactoeTie),
                configService.setConfig('points_memory_win', pointsMemoryWin),
                configService.setConfig('points_memory_speed', pointsMemorySpeed),
                configService.setConfig('points_memory_accuracy', pointsMemoryAccuracy),
                configService.setConfig('points_hangman_win', pointsHangmanWin),
                configService.setConfig('points_snake_max', pointsSnakeMax),
                configService.setConfig('points_scramble_win', pointsScrambleWin),
                configService.setConfig('points_matrix_level_list', pointsMatrixLevelList.split(',').map(s => s.trim()).filter(Boolean).join(',')),
                configService.setConfig('points_matrix_max', pointsMatrixMax),
                
                // Backwards compatibility legacy configs
                configService.setConfig('points_game_win', pointsTictactoeWin),
                configService.setConfig('points_game_tie', pointsTictactoeTie),
                
                configService.setConfig('reward_poll_enabled', pollRewardEnabled ? 'true' : 'false'),
                configService.setConfig('points_poll_vote', pollPoints),
                configService.setConfig('reward_quiz_enabled', quizRewardEnabled ? 'true' : 'false'),
                configService.setConfig('points_quiz_correct', quizPoints),
                configService.setConfig('reward_survey_enabled', surveyRewardEnabled ? 'true' : 'false'),
                configService.setConfig('points_survey_complete', surveyPoints)
            ]);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            setMessage({ type: 'success', text: 'Points and game configurations saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Failed to save configurations', err);
            setMessage({ type: 'error', text: 'Failed to save configurations. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 flex flex-col items-center justify-center py-20 text-gray-500 text-sm gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">Loading points settings...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <FiSettings className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">Points Configuration</h2>
                    <p className="text-sm text-gray-500">Configure points rewarded to attendees for event activities</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <FiInfo className="w-4 h-4 shrink-0" />
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-6">
                    {/* Expo Booth Visit Points */}
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🏢 Expo Booth Visit Points</h3>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Points awarded when a user stays in an exhibitor booth for 10 seconds.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={boothRewardEnabled}
                                    onChange={(e) => setBoothRewardEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {boothRewardEnabled && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Points per Visit
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={boothPoints}
                                    onChange={(e) => setBoothPoints(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold transition-all"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Game Win & Tie Points */}
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🎮 Arcade Game Points</h3>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Points awarded for playing different arcade games.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={gameRewardEnabled}
                                    onChange={(e) => setGameRewardEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {gameRewardEnabled && (
                            <div className="space-y-6 animate-fade-in divide-y divide-gray-150">
                                {/* Tic-Tac-Toe Section */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">❌ Tic-Tac-Toe Points</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Win Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsTictactoeWin}
                                                onChange={(e) => setPointsTictactoeWin(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Tie Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsTictactoeTie}
                                                onChange={(e) => setPointsTictactoeTie(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Memory Match Section */}
                                <div className="pt-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">🧠 Memory Match Points</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Base Win Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsMemoryWin}
                                                onChange={(e) => setPointsMemoryWin(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Speed Bonus</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsMemorySpeed}
                                                onChange={(e) => setPointsMemorySpeed(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Accuracy Bonus</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsMemoryAccuracy}
                                                onChange={(e) => setPointsMemoryAccuracy(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Hangman Section */}
                                <div className="pt-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">🚹 Hangman Points</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase">Win Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pointsHangmanWin}
                                            onChange={(e) => setPointsHangmanWin(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Snake Section */}
                                <div className="pt-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">🐍 Snake Points</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase">Max Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pointsSnakeMax}
                                            onChange={(e) => setPointsSnakeMax(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Word Scramble Section */}
                                <div className="pt-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">🔤 Word Scramble Points</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase">Win Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pointsScrambleWin}
                                            onChange={(e) => setPointsScrambleWin(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Memory Matrix Section */}
                                <div className="pt-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">🔲 Memory Grid Matrix Points</h4>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Level-wise Points (Comma-separated list)</label>
                                            <input
                                                type="text"
                                                value={pointsMatrixLevelList}
                                                onChange={(e) => setPointsMatrixLevelList(e.target.value)}
                                                placeholder="e.g. 5,10,15,20,25"
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                            <span className="text-[9px] text-gray-400 font-semibold mt-0.5">Define points for consecutive levels. Beyond the list, the last value is used.</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase">Max Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pointsMatrixMax}
                                                onChange={(e) => setPointsMatrixMax(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Poll Rewards Config */}
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">📊 Poll Participation Rewards</h3>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Award points when attendees submit a vote on a poll</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={pollRewardEnabled}
                                    onChange={(e) => setPollRewardEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {pollRewardEnabled && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Points per Vote
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={pollPoints}
                                    onChange={(e) => setPollPoints(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold transition-all"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Quiz Rewards Config */}
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">✏️ Quiz Correct Answer Rewards</h3>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Award points for answering a quiz question correctly</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={quizRewardEnabled}
                                    onChange={(e) => setQuizRewardEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {quizRewardEnabled && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Points per Correct Answer
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quizPoints}
                                    onChange={(e) => setQuizPoints(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold transition-all"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Survey Rewards Config */}
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">📋 Survey Completion Rewards</h3>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Award points when attendees complete the feedback survey</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={surveyRewardEnabled}
                                    onChange={(e) => setSurveyRewardEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {surveyRewardEnabled && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Points per Survey Completed
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={surveyPoints}
                                    onChange={(e) => setSurveyPoints(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold transition-all"
                                    required
                                />
                            </div>
                        )}
                    </div>

                </div>

                <div className="border-t border-gray-100 pt-6 flex justify-end items-center gap-4">
                    {saved && (
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-fade-in">
                            ✅ Saved successfully!
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs active:scale-98 disabled:opacity-50 text-white ${
                            saved 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-[#295ce8] hover:bg-[#1d4fd7]'
                        }`}
                    >
                        {saved ? (
                            <>
                                <span>✓</span>
                                <span>Saved!</span>
                            </>
                        ) : (
                            <>
                                <FiSave className="w-4 h-4" />
                                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminPoints;
