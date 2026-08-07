import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { quizService } from '../../services/api';
import { MdHelp, MdAdd, MdDelete, MdCheckCircle, MdOutlineCancel, MdPeople, MdLayersClear, MdFileDownload, MdBarChart, MdPieChart, MdDonutLarge, MdEdit, MdTimer, MdVisibilityOff, MdVisibility, MdSave, MdClose } from 'react-icons/md';

const AdminQuizzes = () => {
    const { addToast } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Quiz Form State
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
    const [newChartType, setNewChartType] = useState('bar');
    const [newHideResults, setNewHideResults] = useState(false);
    const [newDuration, setNewDuration] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Inline Edit State
    const [editingQuizId, setEditingQuizId] = useState(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [editOptions, setEditOptions] = useState([]);
    const [editCorrectIndex, setEditCorrectIndex] = useState(0);
    const [editHideResults, setEditHideResults] = useState(false);
    const [editDuration, setEditDuration] = useState(0);
    const [savingEdit, setSavingEdit] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    const fetchQuizzes = async () => {
        try {
            const res = await quizService.getQuizzes('engage');
            setQuizzes(res.data);
        } catch (err) {
            console.error('Failed to load quizzes:', err);
            addToast('Failed to load quizzes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
        const interval = setInterval(fetchQuizzes, 6000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(quizzes.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [quizzes.length, currentPage]);

    const handleAddOptionField = () => {
        setNewOptions([...newOptions, '']);
    };

    const handleRemoveOptionField = (index) => {
        if (newOptions.length <= 2) {
            addToast('Quizzes require at least 2 options', 'error');
            return;
        }
        setNewOptions(newOptions.filter((_, i) => i !== index));
        if (correctOptionIndex >= newOptions.length - 1) {
            setCorrectOptionIndex(0);
        }
    };

    const handleOptionChange = (index, value) => {
        const updated = [...newOptions];
        updated[index] = value;
        setNewOptions(updated);
    };

    const handleCreateQuiz = async (e) => {
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
            await quizService.createQuiz({
                question: newQuestion.trim(),
                options: filteredOptions,
                correctOptionIndex: Number(correctOptionIndex),
                type: 'engage',
                chartType: newChartType,
                hideResultsUntilClosed: newHideResults,
                duration: newDuration
            });
            addToast('Quiz created successfully!', 'success');
            setNewQuestion('');
            setNewOptions(['', '']);
            setCorrectOptionIndex(0);
            setNewChartType('bar');
            setNewHideResults(false);
            setNewDuration(0);
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to create quiz:', err);
            addToast(err.response?.data?.message || 'Failed to create quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Inline Edit Handlers
    const handleStartEdit = (quiz) => {
        setEditingQuizId(quiz._id);
        setEditQuestion(quiz.question || '');
        setEditOptions(quiz.options ? quiz.options.map(o => o.text || '') : ['', '']);
        setEditCorrectIndex(quiz.correctOptionIndex !== undefined ? quiz.correctOptionIndex : 0);
        setEditHideResults(quiz.hideResultsUntilClosed === true || String(quiz.hideResultsUntilClosed || quiz.hide_results_until_closed) === 'true');
        setEditDuration(quiz.duration || 0);
    };

    const handleCancelEdit = () => {
        setEditingQuizId(null);
        setEditQuestion('');
        setEditOptions([]);
    };

    const handleSaveEdit = async (quizId) => {
        if (!editQuestion.trim()) {
            addToast('Question text cannot be empty', 'error');
            return;
        }
        const filtered = editOptions.map(o => o.trim()).filter(Boolean);
        if (filtered.length < 2) {
            addToast('Quiz must have at least 2 non-empty options', 'error');
            return;
        }

        setSavingEdit(true);
        try {
            await quizService.updateQuiz(quizId, {
                question: editQuestion.trim(),
                options: filtered,
                correctOptionIndex: Number(editCorrectIndex),
                hideResultsUntilClosed: editHideResults,
                duration: editDuration
            });
            addToast('Quiz updated successfully!', 'success');
            setEditingQuizId(null);
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to update quiz:', err);
            addToast('Failed to update quiz', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleToggleResultsVisibility = async (quizId, rawHiddenState) => {
        const isCurrentlyHidden = rawHiddenState === true || String(rawHiddenState) === 'true';
        const nextState = !isCurrentlyHidden;
        try {
            await quizService.updateQuiz(quizId, { hideResultsUntilClosed: nextState });
            addToast(`Results are now ${nextState ? 'hidden from voters until closed' : 'visible to voters'}`, 'success');
            setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, hideResultsUntilClosed: nextState, hide_results_until_closed: nextState } : q));
        } catch (err) {
            console.error('Failed to toggle results visibility:', err);
            addToast('Failed to update results visibility', 'error');
        }
    };

    const handleChangeChartType = async (quizId, targetChartType) => {
        try {
            await quizService.updateQuiz(quizId, { chartType: targetChartType });
            addToast(`Chart style changed to ${targetChartType}`, 'success');
            setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, chartType: targetChartType, chart_type: targetChartType } : q));
        } catch (err) {
            console.error('Failed to update chart type:', err);
            addToast('Failed to update chart style', 'error');
        }
    };

    const handleShowAllResults = async () => {
        try {
            await Promise.all(
                quizzes.map(q => quizService.updateQuiz(q._id, { hideResultsUntilClosed: false }))
            );
            addToast('Results unlocked and visible for all quizzes!', 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to show all results:', err);
            addToast('Failed to unlock all quiz results', 'error');
        }
    };

    const handleHideAllResults = async () => {
        try {
            await Promise.all(
                quizzes.map(q => quizService.updateQuiz(q._id, { hideResultsUntilClosed: true }))
            );
            addToast('Results hidden for all active quizzes!', 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to hide all results:', err);
            addToast('Failed to hide all quiz results', 'error');
        }
    };

    const handleApplyTimerToAll = async (targetDuration) => {
        try {
            await Promise.all(
                quizzes.map(q => quizService.updateQuiz(q._id, { duration: targetDuration }))
            );
            addToast(`Timer duration set to ${targetDuration === 0 ? 'Unlimited' : targetDuration + 's'} for all quizzes!`, 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to apply timer to all quizzes:', err);
            addToast('Failed to apply timer to all quizzes', 'error');
        }
    };

    const handleDownloadAllCSV = () => {
        const headers = ["Question", "Option Chosen", "Correct?", "Voter Name", "Voter Email", "Designation"];
        const csvRows = [headers.join(",")];

        quizzes.forEach(quiz => {
            quiz.options.forEach((opt, optIndex) => {
                const isCorrect = optIndex === quiz.correctOptionIndex ? "YES" : "NO";
                if (opt.votes && opt.votes.length > 0) {
                    opt.votes.forEach(voter => {
                        const name = typeof voter === 'object' ? `${voter.firstName || ''} ${voter.lastName || ''}`.trim() || 'No Name' : 'Guest User';
                        const email = typeof voter === 'object' ? voter.email || '' : '';
                        const designation = typeof voter === 'object' ? voter.designation || '' : '';

                        const q = quiz.question.replace(/"/g, '""');
                        const o = opt.text.replace(/"/g, '""');
                        const n = name.replace(/"/g, '""');
                        const em = email.replace(/"/g, '""');
                        const d = designation.replace(/"/g, '""');

                        csvRows.push(`"${q}","${o}","${isCorrect}","${n}","${em}","${d}"`);
                    });
                }
            });
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_quizzes_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await quizService.toggleQuiz(id, !currentStatus);
            addToast(`Quiz ${!currentStatus ? 'activated' : 'closed'} successfully`, 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            addToast('Failed to change quiz status', 'error');
        }
    };

    const handleDeleteQuiz = async (id) => {
        try {
            await quizService.deleteQuiz(id);
            addToast('Quiz deleted successfully', 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to delete quiz:', err);
            addToast('Failed to delete quiz', 'error');
        }
    };

    const handleClearAllQuizzes = async () => {
        if (!window.confirm('WARNING: Are you sure you want to clear ALL quizzes? This cannot be undone.')) return;
        try {
            await quizService.clearQuizzes();
            addToast('All quizzes cleared successfully', 'success');
            fetchQuizzes();
        } catch (err) {
            console.error('Failed to clear quizzes:', err);
            addToast('Failed to clear quizzes', 'error');
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

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
                            <MdHelp className="text-[#295ce8] w-9 h-9" />
                            Manage Live Quizzes
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 mt-1.5 leading-relaxed">
                            Create new quizzes, set correct answers, monitor live responses, and configure timers.
                        </p>
                    </div>
                    {quizzes.length > 0 && (
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Bulk Timer Selector */}
                            <div className="flex items-center gap-1.5 border-2 border-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-xl shadow-sm">
                                <MdTimer className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider hidden sm:inline">Timer for All:</span>
                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value !== "") {
                                            handleApplyTimerToAll(Number(e.target.value));
                                            e.target.value = "";
                                        }
                                    }}
                                    className="bg-white border border-indigo-200 text-indigo-800 font-extrabold text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                    <option value="" disabled>Set Timer...</option>
                                    <option value={0}>No Timer (0s)</option>
                                    <option value={30}>30 Seconds</option>
                                    <option value={60}>1 Minute (60s)</option>
                                    <option value={120}>2 Minutes (120s)</option>
                                    <option value={300}>5 Minutes (300s)</option>
                                </select>
                            </div>
                            <button
                                onClick={handleShowAllResults}
                                className="flex items-center gap-1.5 border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                                title="Instantly reveal results for all active quizzes to voters"
                            >
                                <MdVisibility className="w-4 h-4" /> Show All
                            </button>
                            <button
                                onClick={handleHideAllResults}
                                className="flex items-center gap-1.5 border-2 border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                                title="Instantly hide results for all active quizzes from voters"
                            >
                                <MdVisibilityOff className="w-4 h-4" /> Hide All
                            </button>
                            <button
                                onClick={handleDownloadAllCSV}
                                className="flex items-center gap-2 border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                            >
                                <MdFileDownload className="w-4 h-4" /> Export Responses
                            </button>
                            <button
                                onClick={handleClearAllQuizzes}
                                className="flex items-center gap-2 border-2 border-red-500 hover:bg-red-50 text-red-500 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                            >
                                <MdLayersClear className="w-4 h-4" /> Clear All Quizzes
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Create Quiz Panel */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-md space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight border-b border-slate-100 pb-3">
                            Create New Quiz
                        </h2>

                        <form onSubmit={handleCreateQuiz} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    Quiz Question
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter quiz question..."
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all"
                                />
                            </div>

                            {/* Options with Correct Radio */}
                            <div className="space-y-2.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    Option Labels (Select radio for Correct Answer)
                                </label>
                                {newOptions.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-2xl border border-gray-200">
                                        <label className="flex items-center gap-1.5 cursor-pointer pl-1 shrink-0" title="Select as correct answer">
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                checked={correctOptionIndex === idx}
                                                onChange={() => setCorrectOptionIndex(idx)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${correctOptionIndex === idx ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {correctOptionIndex === idx ? '✓ Correct' : `Option ${idx + 1}`}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={`Enter text for Option ${idx + 1}...`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#295ce8] shadow-sm"
                                        />
                                        {newOptions.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOptionField(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
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

                            {/* Chart Style */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    Display Chart Style
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewChartType('bar')}
                                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                            newChartType === 'bar' ? 'bg-blue-50 border-[#295ce8] text-[#295ce8] ring-2 ring-blue-500/20' : 'bg-white border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        <MdBarChart className="w-5 h-5 mb-1" /> Bar Chart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewChartType('pie')}
                                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                            newChartType === 'pie' ? 'bg-blue-50 border-[#295ce8] text-[#295ce8] ring-2 ring-blue-500/20' : 'bg-white border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        <MdPieChart className="w-5 h-5 mb-1" /> Pie Diagram
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewChartType('donut')}
                                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                            newChartType === 'donut' ? 'bg-blue-50 border-[#295ce8] text-[#295ce8] ring-2 ring-blue-500/20' : 'bg-white border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        <MdDonutLarge className="w-5 h-5 mb-1" /> Donut Shape
                                    </button>
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                    <MdTimer className="w-3.5 h-3.5 text-indigo-500" /> Timer / Auto-Close Duration
                                </label>
                                <select
                                    value={newDuration}
                                    onChange={(e) => setNewDuration(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value={0}>Unlimited (No Timer)</option>
                                    <option value={30}>30 Seconds</option>
                                    <option value={60}>1 Minute (60s)</option>
                                    <option value={120}>2 Minutes (120s)</option>
                                    <option value={300}>5 Minutes (300s)</option>
                                </select>
                                {quizzes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleApplyTimerToAll(newDuration)}
                                        className="w-full mt-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                    >
                                        <MdTimer className="w-3.5 h-3.5 text-amber-600" /> Apply {newDuration > 0 ? `${newDuration}s` : 'No'} Timer to ALL Quizzes
                                    </button>
                                )}
                            </div>

                            {/* Hide Results Toggle */}
                            <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={newHideResults}
                                    onChange={(e) => setNewHideResults(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block flex items-center gap-1">
                                        <MdVisibilityOff className="w-3.5 h-3.5 text-indigo-600 inline" /> Hide results until quiz closes
                                    </span>
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-[#295ce8] hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Launching Quiz...' : 'Launch Quiz'}
                            </button>
                        </form>
                    </div>

                    {/* Quizzes History Cards Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                                Quizzes History ({quizzes.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-gray-400 font-bold">Loading quizzes...</div>
                        ) : quizzes.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-gray-150 p-8 text-center text-gray-400 font-semibold shadow-sm">
                                No quizzes created yet. Create your first quiz using the form on the left!
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {quizzes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((quiz) => {
                                    const { totalVotes, optionsWithPercentage } = getQuizStats(quiz);
                                    const chartType = quiz.chartType || quiz.chart_type || 'bar';
                                    const isEditingThis = editingQuizId === quiz._id;

                                    return (
                                        <div key={quiz._id} className="bg-white rounded-3xl border border-gray-150 p-6 shadow-md space-y-6 relative overflow-hidden">
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${quiz.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                        {quiz.isActive ? 'Active' : 'Closed'}
                                                    </span>
                                                    {/* Chart Switcher */}
                                                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                        <button onClick={() => handleChangeChartType(quiz._id, 'bar')} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ${chartType === 'bar' ? 'bg-white text-[#295ce8] shadow-sm' : 'text-slate-500'}`}>
                                                            <MdBarChart className="w-3.5 h-3.5" /> Bar
                                                        </button>
                                                        <button onClick={() => handleChangeChartType(quiz._id, 'pie')} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ${chartType === 'pie' ? 'bg-white text-[#295ce8] shadow-sm' : 'text-slate-500'}`}>
                                                            <MdPieChart className="w-3.5 h-3.5" /> Pie
                                                        </button>
                                                        <button onClick={() => handleChangeChartType(quiz._id, 'donut')} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ${chartType === 'donut' ? 'bg-white text-[#295ce8] shadow-sm' : 'text-slate-500'}`}>
                                                            <MdDonutLarge className="w-3.5 h-3.5" /> Donut
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Show/Hide Button */}
                                                    {(() => {
                                                        const isHidden = quiz.hideResultsUntilClosed === true || String(quiz.hideResultsUntilClosed || quiz.hide_results_until_closed) === 'true';
                                                        return (
                                                            <button
                                                                onClick={() => handleToggleResultsVisibility(quiz._id, isHidden)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${isHidden ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                                                            >
                                                                {isHidden ? <MdVisibility className="w-4 h-4 text-purple-600" /> : <MdVisibilityOff className="w-4 h-4 text-emerald-600" />}
                                                                {isHidden ? 'Show Results' : 'Hide Results'}
                                                            </button>
                                                        );
                                                    })()}
                                                    <button onClick={() => isEditingThis ? handleCancelEdit() : handleStartEdit(quiz)} className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg cursor-pointer">
                                                        {isEditingThis ? <MdClose className="w-5 h-5" /> : <MdEdit className="w-5 h-5" />}
                                                    </button>
                                                    <button onClick={() => handleToggleActive(quiz._id, quiz.isActive)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider cursor-pointer ${quiz.isActive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {quiz.isActive ? <MdOutlineCancel /> : <MdCheckCircle />}
                                                        {quiz.isActive ? 'Close Quiz' : 'Reopen Quiz'}
                                                    </button>
                                                    <button onClick={() => handleDeleteQuiz(quiz._id)} className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg cursor-pointer">
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Body / Edit Mode */}
                                            {isEditingThis ? (
                                                <div className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100">
                                                    <input type="text" value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800" />
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Options (Select radio for Correct Answer)</label>
                                                        {editOptions.map((optLabel, oi) => (
                                                            <div key={oi} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200">
                                                                <label className="flex items-center gap-1.5 cursor-pointer pl-1 shrink-0">
                                                                    <input type="radio" name={`editCorrect_${quiz._id}`} checked={editCorrectIndex === oi} onChange={() => setEditCorrectIndex(oi)} className="w-4 h-4 text-emerald-600 cursor-pointer" />
                                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${editCorrectIndex === oi ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {editCorrectIndex === oi ? '✓ Correct' : `Option ${oi + 1}`}
                                                                    </span>
                                                                </label>
                                                                <input type="text" value={optLabel} onChange={(e) => { const updated = [...editOptions]; updated[oi] = e.target.value; setEditOptions(updated); }} className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
                                                        <button onClick={handleCancelEdit} className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer">Cancel</button>
                                                        <button onClick={() => handleSaveEdit(quiz._id)} disabled={savingEdit} className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold cursor-pointer">
                                                            <MdSave className="w-4 h-4" /> {savingEdit ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-black text-gray-800 tracking-tight leading-snug">
                                                        {quiz.question}
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {optionsWithPercentage.map((opt) => (
                                                            <div key={opt._id} className="space-y-1">
                                                                <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
                                                                    <span className="flex items-center gap-1.5">
                                                                        {opt.text} {opt.isCorrect && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black">✓ Correct</span>}
                                                                    </span>
                                                                    <span>{opt.percentage}% ({opt.count} {opt.count === 1 ? 'response' : 'responses'})</span>
                                                                </div>
                                                                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all duration-700 ${opt.isCorrect ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${opt.percentage}%` }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminQuizzes;
