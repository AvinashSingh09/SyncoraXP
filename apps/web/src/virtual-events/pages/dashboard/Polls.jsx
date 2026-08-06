import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { pollService } from '../../services/api';
import { MdPoll, MdCheckCircle, MdLock, MdNavigateBefore, MdNavigateNext, MdInfoOutline } from 'react-icons/md';

const Polls = ({ onBack }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

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
            <div className="w-full h-full flex flex-col items-center justify-start px-6 pb-8 pt-[124px] overflow-y-auto font-sans">
                {/* Back button */}
                <div className="w-full max-w-4xl px-2 flex justify-start mb-4 z-10">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm transition-all cursor-pointer"
                    >
                        ← Back to Engage Hub
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mt-2 mb-6 z-10">
                    <h1 className="text-3xl font-black tracking-tight text-indigo-700 flex items-center justify-center gap-2">
                        <MdPoll className="w-9 h-9 text-indigo-600 animate-pulse" />
                        Live Polls
                    </h1>
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
                                const { totalVotes, optionsWithPercentage } = getPollStats(activePoll);
                                const showResults = hasVoted || isClosed;

                                return (
                                    <div className="flex-1 max-w-4xl rounded-3xl border border-slate-150 bg-white text-slate-800 p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[500px] transition-all duration-500">
                                        
                                        {/* Card Header Status */}
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                                                isClosed 
                                                    ? 'bg-slate-200 text-slate-600'
                                                    : 'bg-emerald-100 text-emerald-700 animate-pulse'
                                            }`}>
                                                {isClosed ? 'Closed' : 'Active'}
                                            </span>
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

                                        {/* Dynamic Content Area: Vote buttons OR Visual Column Bar Chart */}
                                        {showResults ? (
                                            <div className="flex flex-col items-center justify-center flex-1 py-4">
                                                {/* Columns Chart Container */}
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
                                            </div>
                                        ) : (
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
