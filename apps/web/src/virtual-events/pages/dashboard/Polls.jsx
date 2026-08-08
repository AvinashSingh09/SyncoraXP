import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { pollService } from '../../services/api';
import { MdPoll, MdCheckCircle, MdLock, MdNavigateBefore, MdNavigateNext, MdInfoOutline, MdTimer, MdVisibilityOff } from 'react-icons/md';

const Polls = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showAllView, setShowAllView] = useState(false);

    const fetchPolls = async () => {
        try {
            const res = await pollService.getPolls('engage');
            setPolls(res.data);
        } catch (err) {
            console.error('Failed to fetch polls:', err);
            addToast('Failed to load polls', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
        // Poll every 5 seconds for live updates
        const interval = setInterval(fetchPolls, 5000);
        return () => clearInterval(interval);
    }, []);

    // Countdown Timer Hook for active poll
    useEffect(() => {
        const active = polls[currentIndex] || polls[0];
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
                fetchPolls();
            }
        };

        calcRemaining();
        const timerId = setInterval(calcRemaining, 1000);
        return () => clearInterval(timerId);
    }, [polls, currentIndex]);

    const handleVote = async (pollId, optionId) => {
        if (votingId) return;
        setVotingId(pollId);
        try {
            const res = await pollService.votePoll(pollId, optionId);
            addToast(res.data.earnedPoints > 0 ? `Voted! Earned ${res.data.earnedPoints} points!` : 'Vote registered!', 'success');
            
            // Update polls locally
            setPolls(prev => prev.map(p => p._id === pollId ? res.data.poll : p));
            
            // Update user points if awarded
            if (res.data.user) {
                updateUser(res.data.user);
            }
        } catch (err) {
            console.error('Failed to vote:', err);
            addToast(err.response?.data?.message || 'Failed to submit vote', 'error');
        } finally {
            setVotingId(null);
        }
    };

    const getPollStats = (poll) => {
        const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
        return {
            totalVotes,
            optionsWithPercentage: poll.options.map(opt => {
                const count = opt.votes?.length || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return {
                    ...opt,
                    count,
                    percentage
                };
            })
        };
    };

    const checkHasVoted = (poll) => {
        const currentUserId = user?._id || user?.id;
        if (!currentUserId) return null;
        return poll.options.find(opt => 
            opt.votes?.some(v => {
                const voterId = typeof v === 'object' ? (v._id || v.id) : v;
                return String(voterId) === String(currentUserId);
            })
        );
    };

    // Calculate how many polls are answered/submitted
    const answeredCount = polls.filter(p => !!checkHasVoted(p)).length;
    const totalCount = polls.length;

    // Safety check for index out of bounds if polls list updates
    const activePoll = polls[currentIndex] || polls[0];
    const displayIndex = polls[currentIndex] ? currentIndex : 0;

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
                        <MdPoll className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-lg font-black tracking-tight text-slate-800">
                            Live Polls
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
                            {showAllView ? 'Single View' : 'Show All Polls'}
                        </button>
                        <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                            {showAllView ? `Total: ${totalCount}` : `Poll ${displayIndex + 1} of ${totalCount}`}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500 font-semibold">Loading polls...</p>
                    </div>
                ) : totalCount === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl w-full max-w-6xl border border-slate-100 p-8 shadow-sm">
                        <p className="text-lg text-slate-500 font-bold">No active polls at the moment.</p>
                        <p className="text-xs text-slate-400 mt-1">Check back later or ask the host to launch a poll!</p>
                    </div>
                ) : showAllView ? (
                    /* SHOW ALL POLLS STACKED VIEW */
                    <div className="w-full max-w-4xl space-y-6 pb-8">
                        {polls.map((pollItem, idx) => {
                            const votedOpt = checkHasVoted(pollItem);
                            const userVoted = !!votedOpt;
                            const pollClosed = !pollItem.isActive;
                            const hiddenRes = pollItem.hideResultsUntilClosed === true || String(pollItem.hideResultsUntilClosed || pollItem.hide_results_until_closed) === 'true';
                            const { totalVotes: tv, optionsWithPercentage: optsWithPct } = getPollStats(pollItem);
                            const canSee = pollClosed || (userVoted && !hiddenRes);
                            const showHideMsg = userVoted && hiddenRes && !pollClosed;
                            const pollStyle = pollItem.chartType || pollItem.chart_type || 'bar';

                            return (
                                <div key={pollItem._id} className="w-full rounded-3xl border border-slate-200 bg-white text-slate-800 p-6 shadow-md relative overflow-hidden space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                            Poll #{idx + 1}
                                        </span>
                                        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                                            pollClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {pollClosed ? 'Closed' : 'Active'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 leading-snug text-center">
                                        {pollItem.question}
                                    </h3>

                                    {showHideMsg ? (
                                        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center space-y-2">
                                            <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                                                <MdVisibilityOff className="w-4 h-4 text-indigo-600" /> Response recorded! Results are hidden until the poll closes.
                                            </p>
                                        </div>
                                    ) : canSee ? (
                                        <div className="space-y-3 pt-2">
                                            {optsWithPct.map((opt) => (
                                                <div key={opt._id} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-slate-700 px-1">
                                                        <span>{opt.text} {votedOpt && votedOpt._id === opt._id && <MdCheckCircle className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />}</span>
                                                        <span>{opt.percentage}% ({opt.count} {opt.count === 1 ? 'vote' : 'votes'})</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${opt.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 pt-2">
                                            {optsWithPct.map((opt) => (
                                                <button
                                                    key={opt._id}
                                                    disabled={votingId === pollItem._id}
                                                    onClick={() => handleVote(pollItem._id, opt._id)}
                                                    className="w-full text-left rounded-xl p-3 border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 font-bold text-xs text-slate-700 flex justify-between items-center transition-all cursor-pointer"
                                                >
                                                    <span>{opt.text}</span>
                                                    <span className="text-indigo-600 text-[11px]">Vote →</span>
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
                        
                        {/* Horizontal navigation controls container */}
                        <div className="w-full flex items-center justify-center gap-6">
                            
                            {/* Prev circular button */}
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={displayIndex === 0}
                                className="hidden md:flex rounded-full w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all flex-shrink-0 cursor-pointer"
                                title="Previous Poll"
                            >
                                <MdNavigateBefore className="w-8 h-8" />
                            </button>

                            {/* Active Single Poll Card */}
                            {activePoll && (() => {
                                const votedOption = checkHasVoted(activePoll);
                                const hasVoted = !!votedOption;
                                const isClosed = !activePoll.isActive;
                                const hideResults = activePoll.hideResultsUntilClosed === true || String(activePoll.hideResultsUntilClosed || activePoll.hide_results_until_closed) === 'true';
                                const { totalVotes, optionsWithPercentage } = getPollStats(activePoll);
                                
                                const canSeeResults = isClosed || (hasVoted && !hideResults);
                                const showHiddenMessage = hasVoted && hideResults && !isClosed;

                                return (
                                    <div className="flex-1 max-w-4xl rounded-3xl border border-slate-150 bg-white text-slate-800 p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[500px] transition-all duration-500">
                                        
                                        {/* Card Header Status */}
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                                            <div className="flex items-center gap-2">
                                                {timeLeft !== null && !isClosed && (
                                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 animate-pulse">
                                                        <MdTimer className="w-4 h-4 text-amber-600" />
                                                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                                                    isClosed 
                                                        ? 'bg-slate-200 text-slate-600'
                                                        : 'bg-emerald-100 text-emerald-700 animate-pulse'
                                                }`}>
                                                    {isClosed ? 'Closed' : 'Active'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-extrabold text-slate-400">
                                                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
                                            </span>
                                        </div>

                                        {/* Question */}
                                        <div className="flex flex-col justify-center my-2">
                                            <h2 className="text-2xl font-black leading-snug text-center px-2 text-slate-800">
                                                {activePoll.question}
                                            </h2>
                                        </div>

                                        {/* Dynamic Content Area */}
                                        {showHiddenMessage ? (
                                            /* Hidden Results Message Mode */
                                            <div className="flex flex-col items-center justify-center flex-1 py-8 px-4 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <MdVisibilityOff className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1 max-w-md">
                                                    <h3 className="text-lg font-black text-slate-800">Your Response Has Been Recorded!</h3>
                                                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                        Results are hidden until the poll closes to ensure completely unbiased voting. Check back soon!
                                                    </p>
                                                </div>
                                                {votedOption && (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-extrabold text-xs shadow-sm">
                                                        <MdCheckCircle className="w-4 h-4 text-emerald-600" /> Voted: "{votedOption.text}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : canSeeResults ? (() => {
                                            const chartStyle = activePoll.chartType || activePoll.chart_type || 'bar';
                                            const sliceColors = ['#84cc16', '#2563eb', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];

                                            // Helper for Pie / Donut SVG paths
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
                                                    {chartStyle === 'pie' || chartStyle === 'donut' ? (
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
                                                                
                                                                {/* Center Text for Donut Chart */}
                                                                {chartStyle === 'donut' && (
                                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                                                        <span className="text-2xl font-black text-slate-800 leading-none">
                                                                            {totalVotes}
                                                                        </span>
                                                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5 tracking-wider">
                                                                            {totalVotes === 1 ? 'Vote' : 'Votes'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Side Legend & Statistics */}
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
                                                                                <span 
                                                                                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-white" 
                                                                                    style={{ backgroundColor: slice.color }} 
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                                                    {slice.text}
                                                                                    {isSelected && (
                                                                                        <MdCheckCircle className="w-4 h-4 text-indigo-600 inline" />
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="text-xs font-black text-slate-800">
                                                                                    {slice.percentage}%
                                                                                </span>
                                                                                <span className="text-[11px] font-semibold text-slate-400 block">
                                                                                    {slice.count} {slice.count === 1 ? 'vote' : 'votes'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Vertical Columns Bar Chart Container */
                                                        <div className="flex items-end justify-center gap-12 w-full h-[300px] px-6 mt-2">
                                                            {optionsWithPercentage.map((opt, idx) => {
                                                                const colors = [
                                                                    'from-[#ADF542] to-[#c2f76d]', // Lime/Yellow
                                                                    'from-[#2563EB] to-[#60A5FA]', // Blue
                                                                    'from-[#7C3AED] to-[#A78BFA]', // Purple
                                                                    'from-[#EC4899] to-[#F472B6]'  // Pink
                                                                ];
                                                                const gradColor = colors[idx % colors.length];
                                                                const isSelected = votedOption && votedOption._id === opt._id;
                                                                
                                                                // Scale height safely up to max 220px based on percentage
                                                                const barHeight = Math.round((opt.percentage / 100) * 220);

                                                                return (
                                                                    <div key={opt._id} className="flex flex-col items-center justify-end h-full flex-1 max-w-[180px]">
                                                                        {/* Vote Count above bar */}
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
                                                                            {/* Selected Checkmark Badge */}
                                                                            {isSelected && (
                                                                                <div className="absolute -top-2.5 -right-2 bg-indigo-600 text-white rounded-full p-0.5 border border-white shadow-sm z-10">
                                                                                    <MdCheckCircle className="w-3.5 h-3.5" />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Label below bar */}
                                                                        <span className="text-sm font-extrabold text-slate-600 mt-3 text-center truncate w-full" title={opt.text}>
                                                                            {opt.text}
                                                                        </span>
                                                                        
                                                                        {/* Percentage */}
                                                                        <span className="text-xs font-black text-slate-450 mt-0.5">
                                                                            {opt.percentage}%
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })() : (
                                            /* Options Voting Buttons List */
                                            <div className="space-y-3 mb-6">
                                                {optionsWithPercentage.map((opt) => (
                                                    <button
                                                        key={opt._id}
                                                        disabled={votingId === activePoll._id}
                                                        onClick={() => handleVote(activePoll._id, opt._id)}
                                                        className="w-full relative text-left rounded-2xl p-4 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 bg-white transition-all duration-300 flex items-center justify-between group cursor-pointer"
                                                    >
                                                        <span className="font-bold text-sm text-slate-700 pr-4">
                                                            {opt.text}
                                                        </span>

                                                        <span className="text-xs font-black text-slate-500">
                                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 font-bold">
                                                                Vote →
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Footer Message */}
                                        {hasVoted && (
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold justify-center py-2.5 rounded-xl bg-indigo-50/50 text-indigo-600">
                                                <MdCheckCircle className="w-4 h-4" /> Thank you for submitting your response
                                            </div>
                                        )}
                                        {isClosed && !hasVoted && (
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold justify-center py-2.5 rounded-xl bg-slate-100 text-slate-500">
                                                <MdLock className="w-4 h-4" /> This poll has closed
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Next circular button */}
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(totalCount - 1, prev + 1))}
                                disabled={displayIndex === totalCount - 1}
                                className="hidden md:flex rounded-full w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all flex-shrink-0 cursor-pointer"
                                title="Next Poll"
                            >
                                <MdNavigateNext className="w-8 h-8" />
                            </button>

                        </div>

                        {/* Responsive mobile buttons if screen is small */}
                        <div className="flex md:hidden justify-between w-full px-2 mt-2">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={displayIndex === 0}
                                className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
                            >
                                <MdNavigateBefore className="w-5 h-5" /> Prev
                            </button>
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(totalCount - 1, prev + 1))}
                                disabled={displayIndex === totalCount - 1}
                                className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
                            >
                                Next <MdNavigateNext className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Polls;
