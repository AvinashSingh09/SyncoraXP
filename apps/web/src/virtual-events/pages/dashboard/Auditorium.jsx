import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiCalendar, FiBarChart2, FiMessageSquare, FiClock, FiCheck, FiCheckSquare, FiMessageCircle, FiThumbsUp } from 'react-icons/fi';
import { configService, sessionService, qnaService, pollService, quizService } from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import AuditoriumChat from './components/AuditoriumChat';

const Auditorium = () => {
    const { user, updateUser } = useAuth();
    const { layoutConfigs } = useOutletContext();
    const [pointsEarnedToast, setPointsEarnedToast] = useState(null);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [auditoriumVideoUrl, setAuditoriumVideoUrl] = useState('https://www.youtube.com/embed/nE5U0tS-1Yg');
    const [sessions, setSessions] = useState([]);
    const [showSessionsModal, setShowSessionsModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showQnaModal, setShowQnaModal] = useState(false);
    const [showPollsModal, setShowPollsModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [polls, setPolls] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [layoutConfig, setLayoutConfig] = useState(() => {
        if (layoutConfigs && layoutConfigs.auditorium_layout) {
            return {
                bgImage: layoutConfigs.auditorium_layout.bgImage || '',
                videoTop: layoutConfigs.auditorium_layout.videoTop ?? 24,
                videoLeft: layoutConfigs.auditorium_layout.videoLeft ?? 33.5,
                videoWidth: layoutConfigs.auditorium_layout.videoWidth ?? 33,
                videoHeight: layoutConfigs.auditorium_layout.videoHeight ?? 30,
                posters: layoutConfigs.auditorium_layout.posters || []
            };
        }
        return {
            bgImage: '',
            videoTop: 24,
            videoLeft: 33.5,
            videoWidth: 33,
            videoHeight: 30,
            posters: []
        };
    });

    useEffect(() => {
        if (layoutConfigs && layoutConfigs.auditorium_layout) {
            setLayoutConfig(layoutConfigs.auditorium_layout);
        }
    }, [layoutConfigs]);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await qnaService.getQuestions();
                if (res.data) {
                    setQuestions(res.data);
                }
            } catch (err) {
                console.error('Failed to load Q&A questions', err);
            }
        };

        fetchQuestions();

        const handleNewQuestion = (q) => {
            setQuestions(prev => {
                if (prev.some(x => x._id === q._id)) return prev;
                return [...prev, q];
            });
        };

        const handleQuestionUpdated = (updatedQ) => {
            setQuestions(prev => prev.map(q => q._id === updatedQ._id ? updatedQ : q));
        };

        const handleAllQuestionsCleared = () => {
            setQuestions([]);
        };

        socket.on('new-question', handleNewQuestion);
        socket.on('question-updated', handleQuestionUpdated);
        socket.on('all-questions-cleared', handleAllQuestionsCleared);

        return () => {
            socket.off('new-question', handleNewQuestion);
            socket.off('question-updated', handleQuestionUpdated);
            socket.off('all-questions-cleared', handleAllQuestionsCleared);
        };
    }, []);

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const res = await pollService.getPolls();
                if (res.data) {
                    setPolls(res.data);
                }
            } catch (err) {
                console.error('Failed to load polls', err);
            }
        };

        fetchPolls();

        const handleNewPoll = (p) => {
            setPolls(prev => {
                if (prev.some(x => x._id === p._id)) return prev;
                return [p, ...prev];
            });
        };

        const handlePollUpdate = (p) => {
            setPolls(prev => prev.map(x => x._id === p._id ? p : x));
        };

        const handlePollDeleted = (id) => {
            setPolls(prev => prev.filter(x => x._id !== id));
        };

        socket.on('new-poll', handleNewPoll);
        socket.on('poll-update', handlePollUpdate);
        socket.on('poll-deleted', handlePollDeleted);

        return () => {
            socket.off('new-poll', handleNewPoll);
            socket.off('poll-update', handlePollUpdate);
            socket.off('poll-deleted', handlePollDeleted);
        };
    }, []);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await quizService.getQuizzes();
                if (res.data) {
                    setQuizzes(res.data);
                }
            } catch (err) {
                console.error('Failed to load quizzes', err);
            }
        };

        fetchQuizzes();

        const handleNewQuiz = (q) => {
            setQuizzes(prev => {
                if (prev.some(x => x._id === q._id)) return prev;
                return [q, ...prev];
            });
        };

        const handleQuizUpdate = (q) => {
            setQuizzes(prev => prev.map(x => x._id === q._id ? q : x));
        };

        const handleQuizDeleted = (id) => {
            setQuizzes(prev => prev.filter(x => x._id !== id));
        };

        socket.on('new-quiz', handleNewQuiz);
        socket.on('quiz-update', handleQuizUpdate);
        socket.on('quiz-deleted', handleQuizDeleted);

        return () => {
            socket.off('new-quiz', handleNewQuiz);
            socket.off('quiz-update', handleQuizUpdate);
            socket.off('quiz-deleted', handleQuizDeleted);
        };
    }, []);

    const handleVote = async (pollId, optionId) => {
        try {
            const res = await pollService.votePoll(pollId, optionId);
            if (res.data) {
                const pollData = res.data.poll || res.data;
                setPolls(prev => prev.map(p => p._id === pollId ? pollData : p));
                
                if (res.data.earnedPoints && res.data.earnedPoints > 0) {
                    if (updateUser && res.data.user) {
                        updateUser(res.data.user);
                    }
                    setPointsEarnedToast({ amount: res.data.earnedPoints, reason: 'voting in poll' });
                    setTimeout(() => setPointsEarnedToast(null), 4000);
                }
            }
        } catch (err) {
            console.error('Failed to submit vote', err);
        }
    };

    const handleSubmitQuizAnswer = async (quizId, optionId) => {
        try {
            const res = await quizService.submitAnswer(quizId, optionId);
            if (res.data) {
                const quizData = res.data.quiz || res.data;
                setQuizzes(prev => prev.map(q => q._id === quizId ? quizData : q));

                if (res.data.earnedPoints && res.data.earnedPoints > 0) {
                    if (updateUser && res.data.user) {
                        updateUser(res.data.user);
                    }
                    setPointsEarnedToast({ amount: res.data.earnedPoints, reason: 'correct quiz answer' });
                    setTimeout(() => setPointsEarnedToast(null), 4000);
                }
            }
        } catch (err) {
            console.error('Failed to submit quiz answer', err);
        }
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestionText.trim()) return;

        try {
            await qnaService.askQuestion(newQuestionText.trim());
            setNewQuestionText('');
        } catch (err) {
            console.error('Failed to submit question', err);
        }
    };

    const handleUpvoteQuestion = async (id) => {
        try {
            await qnaService.upvoteQuestion(id);
        } catch (err) {
            console.error('Failed to upvote question', err);
        }
    };

    useEffect(() => {
        const fetchVideoUrl = async () => {
            try {
                const response = await configService.getConfig('auditorium_video');
                if (response.data && response.data.value) {
                    setAuditoriumVideoUrl(response.data.value);
                }
            } catch (err) {
                console.error('Failed to load video config', err);
            }
        };

        const fetchSessions = async () => {
            try {
                const response = await sessionService.getSessions();
                if (response.data && response.data.data) {
                    setSessions(response.data.data);
                }
            } catch (err) {
                console.error('Failed to load sessions', err);
            }
        };

        const fetchLayout = async () => {
            try {
                const response = await configService.getConfig('auditorium_layout');
                if (response.data && response.data.value) {
                    setLayoutConfig(JSON.parse(response.data.value));
                }
            } catch (err) {
                console.error('Failed to load layout config', err);
            }
        };

        fetchVideoUrl();
        fetchSessions();
        fetchLayout();

        const interval = setInterval(() => {
            fetchVideoUrl();
            fetchSessions();
            fetchLayout();
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Join auditorium socket room
        socket.emit('join-room', 'auditorium');

        const handleIncomingReaction = ({ emoji }) => {
            const id = Date.now() + Math.random();
            const left = Math.random() * 100 + 40; // range 40px to 140px
            const rotation = (Math.random() - 0.5) * 40; // -20deg to 20deg
            setFloatingReactions(prev => [...prev, { id, emoji, left, rotation }]);
            setTimeout(() => {
                setFloatingReactions(prev => prev.filter(r => r.id !== id));
            }, 3000);
        };

        socket.on('auditorium-reaction', handleIncomingReaction);

        return () => {
            socket.emit('leave-room', 'auditorium');
            socket.off('auditorium-reaction', handleIncomingReaction);
        };
    }, []);

    const getEmbedUrl = (url, isLive) => {
        const controls = isLive ? '0' : '1';
        const params = `autoplay=1&mute=0&loop=1&controls=${controls}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`;
        if (!url) return `https://www.youtube.com/embed/nE5U0tS-1Yg?${params}&playlist=nE5U0tS-1Yg`;
        if (url.includes('youtube.com/embed/')) {
            return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
        }
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?${params}&playlist=${videoId}`;
        }
        return url;
    };

    const handleReaction = (emoji) => {
        const id = Date.now() + Math.random();
        const left = Math.random() * 100 + 40; // range 40px to 140px
        const rotation = (Math.random() - 0.5) * 40; // -20deg to 20deg
        setFloatingReactions(prev => [...prev, { id, emoji, left, rotation }]);
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, 3000);

        // Broadcast reaction to other users in auditorium
        socket.emit('auditorium-reaction', { emoji });
    };

    return (
        <div
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none animate-fade-in"
            style={{
                background: layoutConfig.bgImage
                    ? `url(${layoutConfig.bgImage}) center / cover no-repeat`
                    : 'repeating-linear-gradient(90deg, #61412a, #61412a 40px, #513622 40px, #513622 80px)'
            }}
        >
            {/* Render Posters */}
            {layoutConfig.posters && layoutConfig.posters.map(poster => (
                <div
                    key={poster.id}
                    className="absolute z-10"
                    style={{
                        top: `${poster.top}%`,
                        left: `${poster.left}%`,
                        width: `${poster.width}%`,
                        height: `${poster.height}%`,
                        backgroundImage: poster.imageUrl ? `url(${poster.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            ))}
            <style>{`
                @keyframes floatUpAndFade {
                    0% {
                        transform: translateY(0) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-500px) scale(1.6) rotate(var(--rotation));
                        opacity: 0;
                    }
                }
                .animate-float-up {
                    animation: floatUpAndFade 3s cubic-bezier(0.08, 0.82, 0.17, 1) forwards;
                }
            `}</style>

            {/* Top Molding/Trim */}
            <div className="absolute top-0 left-0 w-full h-4 bg-[#e8dbce] border-b-4 border-[#826048] shadow-md z-10" />

            {/* Reaction Emojis Floating Panel (Bottom Left) */}
            <div className="absolute bottom-6 left-[60px] flex flex-col gap-3 bg-white/90 backdrop-blur-md px-2 py-3 rounded-full shadow-lg border border-white/20 z-20">
                {['👍', '👏', '❤️', '🔥', '😮'].map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => handleReaction(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 transition-transform duration-200 cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Floating animated reactions container */}
            <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
                {floatingReactions.map(reaction => (
                    <span
                        key={reaction.id}
                        className="absolute bottom-16 text-3xl animate-float-up"
                        style={{
                            left: `${reaction.left}px`,
                            '--rotation': `${reaction.rotation}deg`
                        }}
                    >
                        {reaction.emoji}
                    </span>
                ))}
            </div>

            {/* Main Auditorium Layout */}
            <div className="w-full h-full flex items-center justify-between gap-6 px-10 relative pt-[100px] pb-6">

                {/* Left Card Panel */}
                <div className="w-[22%] h-full flex flex-col gap-4 z-10">
                    <button
                        onClick={() => { setShowSessionsModal(!showSessionsModal); setShowPollsModal(false); setShowQuizModal(false); setShowQnaModal(false); setShowChat(false); }}
                        className="self-start flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-4 py-2 rounded shadow-md transition-all text-sm border border-gray-200 cursor-pointer"
                    >
                        <FiCalendar className="text-blue-600" />
                        <span>Sessions</span>
                    </button>

                    {/* <div className="bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 border border-gray-100">
                        <div className="flex justify-between items-center text-[10px] font-bold tracking-wider">
                            <span className="text-blue-600">TEST</span>
                            <span className="text-red-500">TEST</span>
                        </div>
                        <h3 className="text-red-600 font-extrabold text-sm border-b border-gray-100 pb-2">EVENT_NAME_BANNER</h3>
                        <ul className="text-gray-600 text-[11px] font-semibold flex flex-col gap-1.5 list-disc pl-4">
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                        </ul>
                        <img
                            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=60"
                            alt="Event Session"
                            className="w-full h-24 object-cover rounded mt-2 shadow-inner"
                        />
                    </div> */}
                </div>

                {/* Dynamic Absolute Video Player cutout */}
                <div
                    className="absolute z-10 flex flex-col items-center justify-center"
                    style={{
                        top: `${layoutConfig.videoTop}%`,
                        left: `${layoutConfig.videoLeft}%`,
                        width: `${layoutConfig.videoWidth}%`,
                        height: `${layoutConfig.videoHeight}%`
                    }}
                >
                    <div className="w-full h-full bg-black rounded shadow-2xl relative flex items-center justify-center overflow-hidden border border-neutral-700/20">
                        <iframe
                            className={`w-full h-full ${selectedSession ? '' : 'pointer-events-none'}`}
                            src={getEmbedUrl(selectedSession ? selectedSession.videoUrl : auditoriumVideoUrl, !selectedSession)}
                            title="Auditorium Presentation"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                        {selectedSession && (
                            <div className="absolute top-3 left-3 bg-black/80 px-3 py-1.5 rounded text-[10px] font-bold text-white flex items-center gap-2 border border-white/20 backdrop-blur-sm z-30">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                                <span>Session: {selectedSession.topic}</span>
                            </div>
                        )}
                    </div>

                    {selectedSession && (
                        <button
                            onClick={() => setSelectedSession(null)}
                            className="absolute -bottom-12 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded text-[10px] shadow-lg transition-all flex items-center gap-1 cursor-pointer z-30"
                        >
                            <span>Back to Live Stream</span>
                        </button>
                    )}
                </div>

                {/* Center Flex Spacer to maintain layout columns structure */}
                <div className="flex-1 max-w-[46%] pointer-events-none" />

                {/* Right Card Panel */}
                <div className="w-[22%] h-full flex flex-col gap-6 z-10">
                    <div className="flex gap-4 justify-end">
                        <button
                            onClick={() => { setShowPollsModal(!showPollsModal); setShowQuizModal(false); setShowQnaModal(false); setShowSessionsModal(false); setShowChat(false); }}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-lg shadow-md transition-all text-sm border border-gray-200 cursor-pointer"
                        >
                            <FiBarChart2 className="text-blue-600 w-4 h-4" />
                            <span>Polls</span>
                        </button>
                        <button
                            onClick={() => { setShowQuizModal(!showQuizModal); setShowPollsModal(false); setShowQnaModal(false); setShowSessionsModal(false); setShowChat(false); }}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-lg shadow-md transition-all text-sm border border-gray-200 cursor-pointer"
                        >
                            <FiCheckSquare className="text-blue-600 w-4 h-4" />
                            <span>Quiz</span>
                        </button>
                        <button
                            onClick={() => { setShowQnaModal(!showQnaModal); setShowPollsModal(false); setShowQuizModal(false); setShowSessionsModal(false); setShowChat(false); }}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-lg shadow-md transition-all text-sm border border-gray-200 cursor-pointer"
                        >
                            <FiMessageSquare className="text-blue-600 w-4 h-4" />
                            <span>Q&A</span>
                        </button>
                        <button
                            onClick={() => { setShowChat(!showChat); setShowPollsModal(false); setShowQuizModal(false); setShowQnaModal(false); setShowSessionsModal(false); }}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-lg shadow-md transition-all text-sm border border-gray-200 cursor-pointer"
                        >
                            <FiMessageCircle className="text-blue-600 w-4 h-4" />
                            <span>Live Chat</span>
                        </button>
                    </div>

                    {showChat && <AuditoriumChat />}
                    {/* Q&A Modal/Card */}
                    {showQnaModal && (
                        <div className="w-full max-h-full bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 flex flex-col overflow-hidden mb-2 animate-fade-in">
                            {/* Blue Q&A Header */}
                            <div className="bg-[#1e70e9] text-white px-4 py-3 flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <FiMessageSquare />
                                    <span>Q&A</span>
                                </div>
                                <button
                                    onClick={() => setShowQnaModal(false)}
                                    className="text-white hover:text-white/80 font-bold text-xl cursor-pointer p-0.5"
                                    title="Close Q&A"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Ask Area */}
                            <form onSubmit={handleAskQuestion} className="p-3 bg-[#f5f7fb] border-b border-gray-100 flex gap-2 items-center">
                                <textarea
                                    placeholder="Type your question here..."
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    className="flex-1 bg-white text-xs text-gray-800 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400 border border-gray-200 resize-none h-12"
                                />
                                <button
                                    type="submit"
                                    className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs border border-gray-300 py-1.5 px-3 rounded shadow-sm transition-colors cursor-pointer shrink-0"
                                >
                                    Ask
                                </button>
                            </form>

                            {/* Questions Feed */}
                            <div className="flex-1 overflow-y-auto max-h-72 bg-white">
                                {questions.length === 0 ? (
                                    <div className="text-center text-gray-400 text-xs py-8 italic">
                                        No questions asked yet. Be the first!
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {[...questions]
                                            .sort((a, b) => {
                                                const upvotesA = a.upvotes ? a.upvotes.length : 0;
                                                const upvotesB = b.upvotes ? b.upvotes.length : 0;
                                                if (upvotesB !== upvotesA) {
                                                    return upvotesB - upvotesA;
                                                }
                                                return new Date(b.createdAt) - new Date(a.createdAt);
                                            })
                                            .map((q) => {
                                                const hasUpvoted = q.upvotes?.includes(user?._id || user?.id);
                                                return (
                                                    <div key={q._id} className="p-3 text-xs leading-normal flex justify-between items-center gap-3">
                                                        <div className="flex-1 min-w-0">
                                                             <p className="font-bold text-gray-800 mb-0.5">{q.senderName}:</p>
                                                             <p className="text-gray-600 font-medium break-words">{q.text}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUpvoteQuestion(q._id)}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer select-none font-semibold ${
                                                                hasUpvoted
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                            }`}
                                                            title="Upvote question"
                                                        >
                                                            <FiThumbsUp className="w-3 h-3" />
                                                            <span>{q.upvotes ? q.upvotes.length : 0}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Polls Modal */}
                    {showPollsModal && (
                        <div className="w-full max-h-full bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 flex flex-col overflow-hidden mb-2 animate-fade-in">
                            {/* Blue Polls Header */}
                            <div className="bg-[#1e70e9] text-white px-4 py-3 flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <FiBarChart2 />
                                    <span>Live Polls</span>
                                </div>
                                <button
                                    onClick={() => setShowPollsModal(false)}
                                    className="text-white hover:text-white/80 font-bold text-xl cursor-pointer p-0.5"
                                    title="Close Polls"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Polls Feed */}
                            <div className="flex-1 overflow-y-auto max-h-96 bg-white p-4 flex flex-col gap-4">
                                {polls.filter(p => p.isActive).length === 0 ? (
                                    <div className="text-center text-gray-400 text-xs py-8 italic">
                                        No active polls at the moment.
                                    </div>
                                ) : (
                                    polls.filter(p => p.isActive).map((poll) => {
                                        const userId = user?._id || user?.id;
                                        const votedOption = poll.options.find(opt => opt.votes?.some(v => v.toString() === userId?.toString()));
                                        const hasVoted = !!votedOption;
                                        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

                                        return (
                                            <div key={poll._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                <p className="font-bold text-gray-800 text-xs mb-3 leading-normal">{poll.question}</p>

                                                {!hasVoted ? (
                                                    <div className="flex flex-col gap-2">
                                                        {poll.options.map((opt) => (
                                                            <button
                                                                key={opt._id}
                                                                onClick={() => handleVote(poll._id, opt._id)}
                                                                className="w-full text-left bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-200 transition-all cursor-pointer"
                                                            >
                                                                {opt.text}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2.5">
                                                        {poll.options.map((opt) => {
                                                            const votesCount = opt.votes?.length || 0;
                                                            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                                            const isUserChoice = votedOption?._id === opt._id;

                                                            return (
                                                                <div key={opt._id} className="flex flex-col gap-1 text-[11px]">
                                                                    <div className="flex justify-between items-center text-gray-600">
                                                                        <span className={`font-medium flex items-center gap-1 ${isUserChoice ? 'text-blue-600 font-bold' : ''}`}>
                                                                            {isUserChoice && <FiCheck className="w-3.5 h-3.5 text-blue-600" />}
                                                                            {opt.text}
                                                                        </span>
                                                                        <span className="font-semibold text-gray-700">{percent}% ({votesCount})</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-gray-150 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${isUserChoice ? 'bg-blue-600' : 'bg-gray-400'}`}
                                                                            style={{ width: `${percent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <span className="text-[9px] text-gray-400 font-semibold text-right block mt-1">
                                                            You voted • Total: {totalVotes}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    {/* Quiz Modal */}
                    {showQuizModal && (
                        <div className="w-full max-h-full bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 flex flex-col overflow-hidden mb-2 animate-fade-in">
                            {/* Blue Quiz Header */}
                            <div className="bg-[#1e70e9] text-white px-4 py-3 flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <FiCheckSquare />
                                    <span>Live Quizzes</span>
                                </div>
                                <button
                                    onClick={() => setShowQuizModal(false)}
                                    className="text-white hover:text-white/80 font-bold text-xl cursor-pointer p-0.5"
                                    title="Close Quiz"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Quizzes Feed */}
                            <div className="flex-1 overflow-y-auto max-h-96 bg-white p-4 flex flex-col gap-4">
                                {quizzes.filter(q => q.isActive).length === 0 ? (
                                    <div className="text-center text-gray-400 text-xs py-8 italic">
                                        No active quizzes at the moment.
                                    </div>
                                ) : (
                                    quizzes.filter(q => q.isActive).map((quiz) => {
                                        const userId = user?._id || user?.id;
                                        const submittedOption = quiz.options.find(opt => opt.votes?.some(v => v.toString() === userId?.toString()));
                                        const hasSubmitted = !!submittedOption;
                                        const totalSubmissions = quiz.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

                                        return (
                                            <div key={quiz._id} className="border-b border-gray-150 pb-4 last:border-0 last:pb-0">
                                                <p className="font-bold text-gray-800 text-xs mb-3 leading-normal">{quiz.question}</p>

                                                {!hasSubmitted ? (
                                                    <div className="flex flex-col gap-2">
                                                        {quiz.options.map((opt) => (
                                                            <button
                                                                key={opt._id}
                                                                onClick={() => handleSubmitQuizAnswer(quiz._id, opt._id)}
                                                                className="w-full text-left bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-200 transition-all cursor-pointer"
                                                            >
                                                                {opt.text}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2.5">
                                                        {quiz.options.map((opt, oIdx) => {
                                                            const votesCount = opt.votes?.length || 0;
                                                            const percent = totalSubmissions > 0 ? Math.round((votesCount / totalSubmissions) * 100) : 0;
                                                            const isUserChoice = submittedOption?._id === opt._id;
                                                            const isCorrect = oIdx === quiz.correctOptionIndex;

                                                            // Visual feedback for options
                                                            let optionBg = 'bg-gray-50';
                                                            let optionText = 'text-gray-700';
                                                            if (isCorrect) {
                                                                optionBg = 'bg-green-50 border-green-200';
                                                                optionText = 'text-green-700 font-bold';
                                                            } else if (isUserChoice && !isCorrect) {
                                                                optionBg = 'bg-red-50 border-red-200';
                                                                optionText = 'text-red-700 font-bold';
                                                            }

                                                            return (
                                                                <div key={opt._id} className={`flex flex-col gap-1 text-[11px] p-2 rounded-lg border ${optionBg}`}>
                                                                    <div className={`flex justify-between items-center ${optionText}`}>
                                                                        <span className="font-medium flex items-center gap-1">
                                                                            {isUserChoice && <span className="text-[9px] font-extrabold px-1 py-0.2 bg-gray-200/40 rounded mr-0.5">Your Ans</span>}
                                                                            {opt.text}
                                                                            {isCorrect && <span className="bg-green-600 text-white font-bold text-[8px] px-1 py-0.5 rounded leading-none ml-1">CORRECT</span>}
                                                                        </span>
                                                                        <span className="font-semibold">{percent}% ({votesCount})</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden mt-0.5">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : isUserChoice ? 'bg-red-500' : 'bg-gray-400'}`}
                                                                            style={{ width: `${percent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <span className="text-[9px] text-gray-400 font-semibold text-right block mt-1">
                                                            Submitted • Total: {totalSubmissions}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* <div className="bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 border border-gray-100">
                        <div className="text-[10px] font-bold text-blue-600 tracking-wider">
                            EVENT_NAME_BANNER BRAND
                        </div>
                        <h3 className="text-red-600 font-extrabold text-sm border-b border-gray-100 pb-2">EVENT_NAME</h3>
                        <ul className="text-gray-600 text-[11px] font-semibold flex flex-col gap-1.5 list-disc pl-4">
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                            <li>HEADER_POINTS</li>
                        </ul>
                        <img 
                            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=60" 
                            alt="Event Brand" 
                            className="w-full h-24 object-cover rounded mt-2 shadow-inner"
                        />
                    </div> */}
                </div>

            </div>

            {showSessionsModal && (
                <div className="absolute top-[112px] left-10 w-80 bg-white rounded-xl shadow-2xl z-40 flex flex-col border border-neutral-200/50 overflow-hidden animate-fade-in">
                    {/* Blue Sessions Header */}
                    <div className="bg-[#1e70e9] text-white px-4 py-3 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <FiCalendar />
                            <span>Event Sessions</span>
                        </div>
                        <button
                            onClick={() => setShowSessionsModal(false)}
                            className="text-white hover:text-white/80 font-bold text-xl cursor-pointer p-0.5"
                            title="Close Sessions"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Sessions Feed */}
                    <div className="flex-1 overflow-y-auto max-h-96 bg-white p-4 flex flex-col gap-2.5">
                        {sessions.length === 0 ? (
                            <div className="text-center text-gray-400 text-xs py-8 italic">
                                No sessions scheduled.
                            </div>
                        ) : (
                            sessions.map(session => (
                                <button
                                    key={session._id}
                                    onClick={() => {
                                        setSelectedSession(session);
                                        setShowSessionsModal(false);
                                    }}
                                    className="w-full text-left bg-gray-50 hover:bg-blue-50 hover:text-blue-700 p-3 rounded-xl border border-gray-200 transition-all flex flex-col gap-1 cursor-pointer hover:border-blue-200"
                                >
                                    <p className="text-xs font-bold text-gray-800">{session.topic}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <FiClock className="w-3.5 h-3.5 text-blue-500" />
                                        <span>{session.time}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {pointsEarnedToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold text-amber-100">
                            +{pointsEarnedToast.amount} points added for {pointsEarnedToast.reason}!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Auditorium;
