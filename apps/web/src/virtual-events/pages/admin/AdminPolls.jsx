import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { pollService } from '../../services/api';
import { MdPoll, MdAdd, MdDelete, MdCheckCircle, MdOutlineCancel, MdPeople, MdLayersClear, MdFileDownload } from 'react-icons/md';

const AdminPolls = () => {
    const { addToast } = useToast();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Poll Form State
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']);
    const [submitting, setSubmitting] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    const fetchPolls = async () => {
        try {
            const res = await pollService.getPolls('engage');
            setPolls(res.data);
        } catch (err) {
            console.error('Failed to load polls:', err);
            addToast('Failed to load polls', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
        // Poll every 6 seconds for live admin updates
        const interval = setInterval(fetchPolls, 6000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(polls.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [polls.length, currentPage]);

    const handleAddOptionField = () => {
        setNewOptions([...newOptions, '']);
    };

    const handleRemoveOptionField = (index) => {
        if (newOptions.length <= 2) {
            addToast('Polls require at least 2 options', 'error');
            return;
        }
        setNewOptions(newOptions.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index, value) => {
        const updated = [...newOptions];
        updated[index] = value;
        setNewOptions(updated);
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) {
            addToast('Question is required', 'error');
            return;
        }
        const filteredOptions = newOptions.map(o => o.trim()).filter(Boolean);
        if (filteredOptions.length < 2) {
            addToast('At least 2 non-empty options are required', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await pollService.createPoll({
                question: newQuestion.trim(),
                options: filteredOptions,
                type: 'engage'
            });
            addToast('Poll created successfully!', 'success');
            setNewQuestion('');
            setNewOptions(['', '']);
            fetchPolls();
        } catch (err) {
            console.error('Failed to create poll:', err);
            addToast(err.response?.data?.message || 'Failed to create poll', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadAllCSV = () => {
        const headers = ["Question", "Option Chosen", "Voter Name", "Voter Email", "Designation"];
        const csvRows = [headers.join(",")];

        polls.forEach(poll => {
            poll.options.forEach(opt => {
                if (opt.votes && opt.votes.length > 0) {
                    opt.votes.forEach(voter => {
                        const name = typeof voter === 'object' ? `${voter.firstName || ''} ${voter.lastName || ''}`.trim() || 'No Name' : 'Guest User';
                        const email = typeof voter === 'object' ? voter.email || '' : '';
                        const designation = typeof voter === 'object' ? voter.designation || '' : '';

                        const q = poll.question.replace(/"/g, '""');
                        const o = opt.text.replace(/"/g, '""');
                        const n = name.replace(/"/g, '""');
                        const em = email.replace(/"/g, '""');
                        const d = designation.replace(/"/g, '""');

                        csvRows.push(`"${q}","${o}","${n}","${em}","${d}"`);
                    });
                }
            });
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_polls_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await pollService.togglePoll(id, !currentStatus);
            addToast(`Poll ${!currentStatus ? 'activated' : 'closed'} successfully`, 'success');
            fetchPolls();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            addToast('Failed to change poll status', 'error');
        }
    };

    const handleDeletePoll = async (id) => {
        if (!window.confirm('Are you sure you want to delete this poll?')) return;
        try {
            await pollService.deletePoll(id);
            addToast('Poll deleted successfully', 'success');
            fetchPolls();
        } catch (err) {
            console.error('Failed to delete poll:', err);
            addToast('Failed to delete poll', 'error');
        }
    };

    const handleClearAllPolls = async () => {
        if (!window.confirm('WARNING: Are you sure you want to clear ALL polls? This will delete all voting data and cannot be undone.')) return;
        try {
            await pollService.clearPolls();
            addToast('All polls cleared successfully', 'success');
            fetchPolls();
        } catch (err) {
            console.error('Failed to clear polls:', err);
            addToast('Failed to clear polls', 'error');
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

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
                            <MdPoll className="text-[#295ce8] w-9 h-9" />
                            Manage Live Polls
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 mt-1.5 leading-relaxed">
                            Create new polls, monitor live voting percentages, and view detailed user responses.
                        </p>
                    </div>
                    {polls.length > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownloadAllCSV}
                                className="flex items-center gap-2 border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                <MdFileDownload className="w-4 h-4" /> Export All Responses
                            </button>
                            <button
                                onClick={handleClearAllPolls}
                                className="flex items-center gap-2 border-2 border-red-500 hover:bg-red-50 text-red-500 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                <MdLayersClear className="w-4 h-4" /> Clear All Polls
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Create Poll Panel */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-md space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight border-b border-slate-100 pb-3">
                            Create New Poll
                        </h2>

                        <form onSubmit={handleCreatePoll} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    Question Text
                                </label>
                                <textarea
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="e.g. Which feature should we develop next?"
                                    rows="3"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all font-semibold shadow-sm resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    Options
                                </label>
                                {newOptions.map((opt, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all font-semibold shadow-sm"
                                            required
                                        />
                                        {newOptions.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOptionField(index)}
                                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 transition-colors cursor-pointer"
                                            >
                                                <MdDelete className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddOptionField}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#295ce8] hover:text-blue-700 pl-1 py-1 cursor-pointer"
                                >
                                    <MdAdd className="w-4 h-4" /> Add Option
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Creating...' : 'Launch Poll'}
                            </button>
                        </form>
                    </div>

                    {/* Active/Past Polls Lists */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            Polls History ({polls.length})
                        </h2>

                        {loading ? (
                            <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-md space-y-4">
                                <div className="w-10 h-10 border-4 border-[#295ce8] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-sm text-gray-500 font-semibold">Loading polls data...</p>
                            </div>
                        ) : polls.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-md">
                                <p className="text-lg text-gray-400 font-bold">No polls created yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Use the panel on the left to launch your first poll!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {polls.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((poll) => {
                                    const { totalVotes, optionsWithPercentage } = getPollStats(poll);

                                    return (
                                        <div key={poll._id} className="bg-white rounded-3xl border border-gray-150 p-6 shadow-md space-y-6 relative overflow-hidden">
                                            {/* Status Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${poll.isActive
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-600'
                                                        }`}>
                                                        {poll.isActive ? 'Active' : 'Closed'}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleActive(poll._id, poll.isActive)}
                                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${poll.isActive
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        {poll.isActive ? <MdOutlineCancel /> : <MdCheckCircle />}
                                                        {poll.isActive ? 'Close Poll' : 'Reopen Poll'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePoll(poll._id)}
                                                        className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Poll"
                                                    >
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Question */}
                                            <h3 className="text-lg font-black text-gray-800 tracking-tight leading-snug">
                                                {poll.question}
                                            </h3>

                                            {/* Options & Live Breakdown */}
                                            <div className="space-y-5">
                                                {optionsWithPercentage.map((opt) => (
                                                    <div key={opt._id} className="space-y-2">
                                                        {/* Option Stats Header */}
                                                        <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
                                                            <span>{opt.text}</span>
                                                            <span>{opt.percentage}% ({opt.count} {opt.count === 1 ? 'vote' : 'votes'})</span>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${opt.percentage}%` }}
                                                            />
                                                        </div>

                                                        {/* Voters Breakdown Sub-List */}
                                                        {opt.votes && opt.votes.length > 0 && (
                                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-1 mt-1 text-[11px] font-semibold text-slate-500">
                                                                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                                                    <MdPeople className="w-3.5 h-3.5 text-slate-400" />
                                                                    Voters List:
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {opt.votes.map((voter, vi) => {
                                                                        const displayName = typeof voter === 'object'
                                                                            ? `${voter.firstName || ''} ${voter.lastName || ''}`.trim() || voter.email
                                                                            : 'Guest User';
                                                                        const details = typeof voter === 'object' ? `(${voter.email}${voter.designation ? `, ${voter.designation}` : ''})` : '';

                                                                        return (
                                                                            <span key={vi} className="inline-block bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-bold shadow-sm" title={details}>
                                                                                {displayName}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination Controls */}
                                {Math.ceil(polls.length / ITEMS_PER_PAGE) > 1 && (
                                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-4 sm:px-6 rounded-3xl shadow-md border border-gray-150 mt-4">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                className="relative inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                disabled={currentPage === Math.ceil(polls.length / ITEMS_PER_PAGE)}
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(polls.length / ITEMS_PER_PAGE)))}
                                                className="relative ml-3 inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">
                                                    Showing <span className="font-bold text-gray-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                                                    <span className="font-bold text-gray-700">
                                                        {Math.min(currentPage * ITEMS_PER_PAGE, polls.length)}
                                                    </span>{' '}
                                                    of <span className="font-bold text-gray-700">{polls.length}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
                                                    <button
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        className="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 cursor-pointer text-xs font-bold transition-all"
                                                    >
                                                        &larr; Previous
                                                    </button>
                                                    {Array.from({ length: Math.ceil(polls.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            aria-current={currentPage === page ? "page" : undefined}
                                                            className={`relative inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currentPage === page
                                                                    ? "z-10 bg-[#295ce8] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm"
                                                                    : "text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:outline-offset-0"
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                    <button
                                                        disabled={currentPage === Math.ceil(polls.length / ITEMS_PER_PAGE)}
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(polls.length / ITEMS_PER_PAGE)))}
                                                        className="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 cursor-pointer text-xs font-bold transition-all"
                                                    >
                                                        Next &rarr;
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPolls;
