import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { quizService } from '../../services/api';
import { MdHelp, MdCheckCircle, MdLock, MdNavigateBefore, MdNavigateNext, MdInfoOutline, MdTimer, MdVisibilityOff, MdClose } from 'react-icons/md';

const Quizzes = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showAllView, setShowAllView] = useState(false);

    const fetchQuizzes = async () => {
        try {
            const res = await quizService.getQuizzes('engage');
            setQuizzes(res.data);
        } catch (err) {
            console.error('Failed to fetch quizzes:', err);
            addToast('Failed to load quizzes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
        const interval = setInterval(fetchQuizzes, 5000);
        return () => clearInterval(interval);
    }, []);

    // Countdown Timer Hook
    useEffect(() => {
        const active = quizzes[currentIndex] || quizzes[0];
        const expiry = active ? (active.expiresAt || active.expires_at) : null;
        if (!active || !active.isActive || !expiry) {
            setTimeLeft(null);
            return;
        }

        const calcRemaining = () => {
            const expTime = new Date(expiry).getTime();
            const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
            setTimeLeft(diff);
            if (diff === 0) {
                fetchQuizzes();
            }
        };

        calcRemaining();
        const timerId = setInterval(calcRemaining, 1000);
        return () => clearInterval(timerId);
    }, [quizzes, currentIndex]);

    const handleSubmitAnswer = async (quizId, optionId) => {
        if (submittingId) return;
        setSubmittingId(quizId);
        try {
            const res = await quizService.submitAnswer(quizId, optionId);
            if (res.data.earnedPoints > 0) {
                addToast(`Correct Answer! Earned ${res.data.earnedPoints} points! 🎉`, 'success');
            } else {
                addToast('Answer submitted!', 'info');
            }
            
            setQuizzes(prev => prev.map(q => q._id === quizId ? res.data.quiz : q));
            if (res.data.user) {
                updateUser(res.data.user);
            }
        } catch (err) {
            console.error('Failed to submit answer:', err);
            addToast(err.response?.data?.message || 'Failed to submit answer', 'error');
        } finally {
            setSubmittingId(null);
        }
    };

    const getQuizStats = (quiz) => {
        const totalVotes = quiz.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
        return {
            totalVotes,
            optionsWithPercentage: quiz.options.map((opt, idx) => {
                const count = opt.votes?.length || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return {
                    ...opt,
                    count,
                    percentage,
                    isCorrect: idx === quiz.correctOptionIndex
                };
            })
        };
    };

    const checkHasAnswered = (quiz) => {
        const currentUserId = user?._id || user?.id;
        if (!currentUserId) return null;
        return quiz.options.find(opt => 
            opt.votes?.some(v => {
                const voterId = typeof v === 'object' ? (v._id || v.id) : v;
                return String(voterId) === String(currentUserId);
            })
        );
    };

    const renderQuizChart = (quiz, optionsWithPercentage, totalVotes, votedOption) => {
        const chartStyle = quiz.chartType || quiz.chart_type || 'bar';
        if (chartStyle === 'pie' || chartStyle === 'donut') {
            const sliceColors = ['#10b981', '#2563eb', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16'];
            let currentAngle = -90;
            const slices = optionsWithPercentage.map((opt, idx) => {
                const count = opt.count || 0;
                const slicePercent = totalVotes > 0 ? count / totalVotes : 1 / (optionsWithPercentage.length || 1);
                const angle = slicePercent * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const cx = 110, cy = 110, R = 95, r = 58;
                const largeArcFlag = angle > 180 ? 1 : 0;

                const x1_out = cx + R * Math.cos(startRad);
                const y1_out = cy + R * Math.sin(startRad);
                const x2_out = cx + R * Math.cos(endRad);
                const y2_out = cy + R * Math.sin(endRad);

                const x1_in = cx + r * Math.cos(startRad);
                const y1_in = cy + r * Math.sin(startRad);
                const x2_in = cx + r * Math.cos(endRad);
                const y2_in = cy + r * Math.sin(endRad);

                const isFull = angle >= 359.9;
                let piePath = '';
                let donutPath = '';

                if (isFull) {
                    piePath = `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z`;
                    donutPath = `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
                } else {
                    piePath = `M ${cx} ${cy} L ${x1_out} ${y1_out} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out} Z`;
                    donutPath = `M ${x1_out} ${y1_out} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${r} ${r} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in} Z`;
                }

                return {
                    ...opt,
                    piePath,
                    donutPath,
                    color: sliceColors[idx % sliceColors.length]
                };
            });

            return (
                <div className="flex flex-col items-center justify-center flex-1 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full min-h-[300px] px-6 mt-2">
                        {/* SVG Pie / Donut Graphic */}
                        <div className="relative w-[220px] h-[220px] flex-shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
                                {slices.map((slice) => {
                                    const isSelected = votedOption && votedOption._id === slice._id;
                                    const pathData = chartStyle === 'pie' ? slice.piePath : slice.donutPath;

                                    return (
                                        <path
                                            key={slice._id}
                                            d={pathData}
                                            fill={slice.color}
                                            stroke="#ffffff"
                                            strokeWidth={isSelected ? "3" : "1.5"}
                                            fillRule={chartStyle === 'donut' ? "evenodd" : "nonzero"}
                                            className="transition-all duration-700 hover:opacity-90 cursor-pointer"
                                        />
                                    );
                                })}
                            </svg>
                            
                            {chartStyle === 'donut' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                    <span className="text-2xl font-black text-slate-800 leading-none">
                                        {totalVotes}
                                    </span>
                                    <span className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5 tracking-wider">
                                        {totalVotes === 1 ? 'Response' : 'Responses'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col justify-center gap-3 flex-1 max-w-md w-full">
                            {slices.map((slice) => {
                                const isSelected = votedOption && votedOption._id === slice._id;

                                return (
                                    <div 
                                        key={slice._id} 
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                            isSelected 
                                                ? 'bg-indigo-50/60 border-indigo-200 ring-2 ring-indigo-500/20' 
                                                : 'bg-slate-50/50 border-slate-150'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: slice.color }} />
                                            <span className="font-bold text-xs text-slate-700">
                                                {slice.text}
                                                {slice.isCorrect && <span className="ml-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-black">✓ Correct</span>}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800">
                                            {slice.percentage}% ({slice.count})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        // Vertical Columns Bar Chart (matching Polls.jsx style)
        return (
            <div className="flex items-end justify-center gap-6 md:gap-12 w-full h-[300px] px-6 mt-2">
                {optionsWithPercentage.map((opt, idx) => {
                    const colors = [
                        'from-[#ADF542] to-[#c2f76d]', // Lime/Yellow
                        'from-[#2563EB] to-[#60A5FA]', // Blue
                        'from-[#7C3AED] to-[#A78BFA]', // Purple
                        'from-[#EC4899] to-[#F472B6]'  // Pink
                    ];
                    const gradColor = colors[idx % colors.length];
                    const isSelected = votedOption && votedOption._id === opt._id;
                    const barHeight = Math.round((opt.percentage / 100) * 220);

                    return (
                        <div key={opt._id} className="flex flex-col items-center justify-end h-full flex-1 max-w-[180px]">
                            {/* Response Count above bar */}
                            <span className="text-2xl font-black text-slate-700 mb-2">
                                {opt.count}
                            </span>

                            {/* Vertical Bar Chart Column */}
                            <div 
                                className={`w-full bg-gradient-to-t ${gradColor} rounded-t-xl transition-all duration-1000 ease-out relative ${
                                    isSelected ? 'ring-4 ring-indigo-500/20' : ''
                                }`}
                                style={{ height: `${Math.max(12, barHeight)}px` }}
                            >
                                {opt.isCorrect && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap z-10">
                                        ✓ Correct
                                    </div>
                                )}
                            </div>

                            {/* Label below bar */}
                            <span className="text-sm font-extrabold text-slate-600 mt-3 text-center truncate w-full" title={opt.text}>
                                {opt.text}
                            </span>
                            
                            {/* Percentage */}
                            <span className="text-xs font-black text-slate-400 mt-0.5">
                                {opt.percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const answeredCount = quizzes.filter(q => !!checkHasAnswered(q)).length;
    const totalCount = quizzes.length;
    const activeQuiz = quizzes[currentIndex] || quizzes[0];
    const displayIndex = quizzes[currentIndex] ? currentIndex : 0;

    return (
        <div className="absolute inset-0 w-full h-full text-slate-800 overflow-hidden bg-[#f8fafc]">
            <div className="w-full h-full flex flex-col items-center justify-start px-4 md:px-8 pb-6 pt-[84px] overflow-y-auto font-sans">
                
                {/* Sleek Integrated Header Bar */}
                <div className="w-full max-w-5xl flex items-center justify-between gap-4 mb-4 z-10 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm transition-all cursor-pointer"
                    >
                        ← Back to Engage Hub
                    </button>

                    <div className="flex items-center gap-2">
                        <MdHelp className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-lg font-black tracking-tight text-slate-800">
                            Live Quizzes
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAllView(prev => !prev)}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs border transition-all cursor-pointer shadow-sm ${
                                showAllView
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            {showAllView ? 'Single View' : 'Show All Quizzes'}
                        </button>
                        <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                            {showAllView ? `Total: ${totalCount}` : `Quiz ${displayIndex + 1} of ${totalCount}`}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500 font-semibold">Loading quizzes...</p>
                    </div>
                ) : totalCount === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl w-full max-w-6xl border border-slate-100 p-8 shadow-sm">
                        <p className="text-lg text-slate-500 font-bold">No active quizzes at the moment.</p>
                        <p className="text-xs text-slate-400 mt-1">Check back later or ask the host to launch a quiz!</p>
                    </div>
                ) : showAllView ? (
                    /* SHOW ALL QUIZZES STACKED VIEW */
                    <div className="w-full max-w-4xl space-y-6 pb-8">
                        {quizzes.map((quizItem, idx) => {
                            const votedOpt = checkHasAnswered(quizItem);
                            const userVoted = !!votedOpt;
                            const quizClosed = !quizItem.isActive;
                            const hiddenRes = quizItem.hideResultsUntilClosed === true || String(quizItem.hideResultsUntilClosed || quizItem.hide_results_until_closed) === 'true';
                            const { totalVotes: tv, optionsWithPercentage: optsWithPct } = getQuizStats(quizItem);
                            const canSee = quizClosed || (userVoted && !hiddenRes);
                            const showHideMsg = userVoted && hiddenRes && !quizClosed;

                            return (
                                <div key={quizItem._id} className="w-full rounded-3xl border border-slate-200 bg-white text-slate-800 p-6 shadow-md relative overflow-hidden space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                            Quiz #{idx + 1}
                                        </span>
                                        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${quizClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {quizClosed ? 'Closed' : 'Active'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 leading-snug text-center">
                                        {quizItem.question}
                                    </h3>

                                    {showHideMsg ? (
                                        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center space-y-2">
                                            <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                                                <MdVisibilityOff className="w-4 h-4 text-indigo-600" /> Answer submitted! Results are hidden until the quiz closes.
                                            </p>
                                        </div>
                                    ) : canSee ? (
                                        renderQuizChart(quizItem, optsWithPct, tv, votedOpt)
                                    ) : (
                                        <div className="space-y-2 pt-2">
                                            {optsWithPct.map((opt) => (
                                                <button
                                                    key={opt._id}
                                                    disabled={submittingId === quizItem._id}
                                                    onClick={() => handleSubmitAnswer(quizItem._id, opt._id)}
                                                    className="w-full text-left rounded-xl p-3 border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 font-bold text-xs text-slate-700 flex justify-between items-center transition-all cursor-pointer"
                                                >
                                                    <span>{opt.text}</span>
                                                    <span className="text-indigo-600 text-[11px]">Select →</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full max-w-6xl flex flex-col items-center gap-6">
                        <div className="w-full flex items-center justify-center gap-6">
                            {/* Prev circular button */}
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={displayIndex === 0}
                                className="hidden md:flex rounded-full w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all flex-shrink-0 cursor-pointer"
                                title="Previous Quiz"
                            >
                                <MdNavigateBefore className="w-8 h-8" />
                            </button>

                            {/* Active Single Quiz Card */}
                            {activeQuiz && (() => {
                                const votedOption = checkHasAnswered(activeQuiz);
                                const hasVoted = !!votedOption;
                                const isClosed = !activeQuiz.isActive;
                                const hideResults = activeQuiz.hideResultsUntilClosed === true || String(activeQuiz.hideResultsUntilClosed || activeQuiz.hide_results_until_closed) === 'true';
                                const { totalVotes, optionsWithPercentage } = getQuizStats(activeQuiz);
                                const canSeeResults = isClosed || (hasVoted && !hideResults);
                                const showHiddenMessage = hasVoted && hideResults && !isClosed;

                                return (
                                    <div className="flex-1 max-w-4xl rounded-3xl border border-slate-150 bg-white text-slate-800 p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[500px] transition-all duration-500">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                                            <div className="flex items-center gap-2">
                                                {timeLeft !== null && !isClosed && (
                                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 animate-pulse">
                                                        <MdTimer className="w-4 h-4 text-amber-600" />
                                                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${isClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700 animate-pulse'}`}>
                                                    {isClosed ? 'Closed' : 'Active'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-extrabold text-slate-400">
                                                {totalVotes} {totalVotes === 1 ? 'response' : 'responses'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col justify-center my-2">
                                            <h2 className="text-2xl font-black leading-snug text-center px-2 text-slate-800">
                                                {activeQuiz.question}
                                            </h2>
                                        </div>

                                        {showHiddenMessage ? (
                                            <div className="flex flex-col items-center justify-center flex-1 py-8 px-4 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <MdVisibilityOff className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1 max-w-md">
                                                    <h3 className="text-lg font-black text-slate-800">Your Answer Has Been Submitted!</h3>
                                                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                        Results are hidden until the host closes this quiz. Check back soon!
                                                    </p>
                                                </div>
                                            </div>
                                        ) : canSeeResults ? (
                                            renderQuizChart(activeQuiz, optionsWithPercentage, totalVotes, votedOption)
                                        ) : (
                                            <div className="space-y-3 mb-6">
                                                {optionsWithPercentage.map((opt) => (
                                                    <button
                                                        key={opt._id}
                                                        disabled={submittingId === activeQuiz._id}
                                                        onClick={() => handleSubmitAnswer(activeQuiz._id, opt._id)}
                                                        className="w-full relative text-left rounded-2xl p-4 border border-slate-200 hover:border-indigo-400 bg-white transition-all flex items-center justify-between group cursor-pointer"
                                                    >
                                                        <span className="font-bold text-sm text-slate-700 pr-4">
                                                            {opt.text}
                                                        </span>
                                                        <span className="text-xs font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Select Answer →
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {hasVoted && (
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold justify-center py-2.5 rounded-xl bg-indigo-50/50 text-indigo-600">
                                                <MdCheckCircle className="w-4 h-4" /> Thank you for completing this quiz!
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Next circular button */}
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(quizzes.length - 1, prev + 1))}
                                disabled={displayIndex === quizzes.length - 1}
                                className="hidden md:flex rounded-full w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all flex-shrink-0 cursor-pointer"
                                title="Next Quiz"
                            >
                                <MdNavigateNext className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quizzes;
