import React, { useState, useEffect } from 'react';
import { pollService } from '../../../services/api';
import { FiPlusCircle, FiSettings, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const PollsManager = () => {
    const [polls, setPolls] = useState([]);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollLoading, setPollLoading] = useState(false);
    const [pollStatus, setPollStatus] = useState('');

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const response = await pollService.getPolls();
                if (response.data) {
                    setPolls(response.data);
                }
            } catch (err) {
                console.error('Failed to load polls', err);
            }
        };
        fetchPolls();
    }, []);

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        const validOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
        if (validOptions.length < 2) {
            setPollStatus('Error: At least 2 non-empty options are required.');
            return;
        }

        setPollLoading(true);
        setPollStatus('');
        try {
            const response = await pollService.createPoll({
                question: pollQuestion.trim(),
                options: validOptions
            });
            if (response.data) {
                setPolls(prev => [response.data, ...prev]);
                setPollQuestion('');
                setPollOptions(['', '']);
                setPollStatus('Poll created successfully!');
                setTimeout(() => setPollStatus(''), 4000);
            }
        } catch (err) {
            console.error('Failed to create poll', err);
            setPollStatus('Error creating poll.');
        } finally {
            setPollLoading(false);
        }
    };

    const handleTogglePoll = async (id, currentStatus) => {
        try {
            const response = await pollService.togglePoll(id, !currentStatus);
            if (response.data) {
                setPolls(prev => prev.map(p => p._id === id ? response.data : p));
            }
        } catch (err) {
            console.error('Failed to toggle poll status', err);
        }
    };

    const handleDeletePoll = async (id) => {
        try {
            await pollService.deletePoll(id);
            setPolls(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            console.error('Failed to delete poll', err);
        }
    };

    const handleAddPollOption = () => {
        setPollOptions(prev => [...prev, '']);
    };

    const handleRemovePollOption = (index) => {
        if (pollOptions.length <= 2) return;
        setPollOptions(prev => prev.filter((_, i) => i !== index));
    };

    const handlePollOptionChange = (index, value) => {
        setPollOptions(prev => prev.map((opt, i) => i === index ? value : opt));
    };

    return (
        <div className="flex flex-col gap-6 text-gray-800">
            {/* Create Poll Form */}
            <form onSubmit={handleCreatePoll} className="bg-gray-50 p-5 rounded-xl border border-gray-250 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiPlusCircle className="text-[#295ce8]" /> Create New Poll
                </h2>
                <div className="flex flex-col gap-1.5">
                    <label className="block text-sm font-semibold text-gray-500">Question</label>
                    <input 
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="e.g. What is your favorite session today?"
                        className="w-full bg-white border border-gray-250 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-semibold text-gray-500">Options</label>
                    {pollOptions.map((opt, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input 
                                type="text"
                                value={opt}
                                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 bg-white border border-gray-250 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                required
                            />
                            {pollOptions.length > 2 && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemovePollOption(index)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 cursor-pointer"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={handleAddPollOption}
                        className="self-start text-sm font-bold text-[#295ce8] hover:text-blue-700 flex items-center gap-1 mt-1 cursor-pointer"
                    >
                        <FiPlusCircle /> Add Option
                    </button>
                </div>

                {pollStatus && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${pollStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{pollStatus}</span>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={pollLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                    <span>{pollLoading ? 'Creating...' : 'Create Poll'}</span>
                </button>
            </form>

            {/* Polls List */}
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiSettings className="text-purple-600" /> Existing Polls
                </h2>
                {polls.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No polls created yet.</p>
                ) : (
                    <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
                        {polls.map(poll => {
                            const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                            return (
                                <div key={poll._id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{poll.question}</p>
                                            <span className="text-sm text-gray-400 font-semibold mt-1 block">
                                                Total votes: {totalVotes}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleTogglePoll(poll._id, poll.isActive)}
                                                className={`px-2 py-1 rounded text-sm font-bold border transition-colors cursor-pointer ${
                                                    poll.isActive 
                                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                                        : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            >
                                                {poll.isActive ? 'Active' : 'Draft'}
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePoll(poll._id)}
                                                className="text-gray-400 hover:text-red-655 p-1 rounded transition-colors cursor-pointer animate-fade-in"
                                                title="Delete Poll"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-1">
                                        {poll.options.map(opt => {
                                            const votesCount = opt.votes?.length || 0;
                                            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt._id} className="flex flex-col gap-1 text-[11px]">
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>{opt.text}</span>
                                                        <span className="font-semibold text-gray-800">{votesCount} votes ({percent}%)</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    {votesCount > 0 && (
                                                        <details className="mt-1 group cursor-pointer">
                                                            <summary className="text-[10px] text-blue-600 font-bold outline-none select-none">View Voters ({votesCount})</summary>
                                                            <ul className="mt-1 flex flex-col gap-1 pl-2 border-l-2 border-blue-100 max-h-32 overflow-y-auto">
                                                                {opt.votes.map(voter => (
                                                                    <li key={voter._id || voter} className="text-[9px] text-gray-600">
                                                                        {voter.firstName ? <><span className="font-bold">{voter.firstName} {voter.lastName}</span> ({voter.email}) {voter.designation && `- ${voter.designation}`}</> : <span className="italic">Unknown User ({voter})</span>}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </details>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PollsManager;
