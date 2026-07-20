import React, { useState, useEffect } from 'react';
import { quizService } from '../../../services/api';
import { FiPlusCircle, FiSettings, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const QuizzesManager = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [quizQuestion, setQuizQuestion] = useState('');
    const [quizOptions, setQuizOptions] = useState(['', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizStatus, setQuizStatus] = useState('');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await quizService.getQuizzes();
                if (response.data) {
                    setQuizzes(response.data);
                }
            } catch (err) {
                console.error('Failed to load quizzes', err);
            }
        };
        fetchQuizzes();
    }, []);

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const validOptions = quizOptions.map(opt => opt.trim()).filter(Boolean);
        if (validOptions.length < 2) {
            setQuizStatus('Error: At least 2 non-empty options are required.');
            return;
        }

        setQuizLoading(true);
        setQuizStatus('');
        try {
            const response = await quizService.createQuiz({
                question: quizQuestion.trim(),
                options: validOptions,
                correctOptionIndex: Number(correctOptionIndex)
            });
            if (response.data) {
                setQuizzes(prev => [response.data, ...prev]);
                setQuizQuestion('');
                setQuizOptions(['', '']);
                setCorrectOptionIndex(0);
                setQuizStatus('Quiz created successfully!');
                setTimeout(() => setQuizStatus(''), 4000);
            }
        } catch (err) {
            console.error('Failed to create quiz', err);
            setQuizStatus('Error creating quiz.');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleToggleQuiz = async (id, currentStatus) => {
        try {
            const response = await quizService.toggleQuiz(id, !currentStatus);
            if (response.data) {
                setQuizzes(prev => prev.map(q => q._id === id ? response.data : q));
            }
        } catch (err) {
            console.error('Failed to toggle quiz status', err);
        }
    };

    const handleDeleteQuiz = async (id) => {
        try {
            await quizService.deleteQuiz(id);
            setQuizzes(prev => prev.filter(q => q._id !== id));
        } catch (err) {
            console.error('Failed to delete quiz', err);
        }
    };

    const handleAddQuizOption = () => {
        setQuizOptions(prev => [...prev, '']);
    };

    const handleRemoveQuizOption = (index) => {
        if (quizOptions.length <= 2) return;
        setQuizOptions(prev => prev.filter((_, i) => i !== index));
        if (correctOptionIndex >= quizOptions.length - 1) {
            setCorrectOptionIndex(0);
        }
    };

    const handleQuizOptionChange = (index, value) => {
        setQuizOptions(prev => prev.map((opt, i) => i === index ? value : opt));
    };

    return (
        <div className="flex flex-col gap-6 text-gray-800">
            {/* Create Quiz Form */}
            <form onSubmit={handleCreateQuiz} className="bg-gray-50 p-5 rounded-xl border border-gray-250 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiPlusCircle className="text-blue-600" /> Create New Quiz
                </h2>
                <div className="flex flex-col gap-1.5">
                    <label className="block text-sm font-semibold text-gray-655">Question</label>
                    <input
                        type="text"
                        value={quizQuestion}
                        onChange={(e) => setQuizQuestion(e.target.value)}
                        placeholder="e.g. Which programming language is statically typed?"
                        className="w-full bg-white border border-gray-250 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-gray-655">Options</label>
                        <span className="text-xs text-gray-450 italic">Select correct answer using radio button</span>
                    </div>
                    {quizOptions.map((opt, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input
                                type="radio"
                                name="correct-answer-index"
                                checked={correctOptionIndex === index}
                                onChange={() => setCorrectOptionIndex(index)}
                                className="cursor-pointer h-4 w-4 text-[#295ce8] focus:ring-blue-400"
                                title="Mark as correct option"
                            />
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleQuizOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 bg-white border border-gray-250 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                                required
                            />
                            {quizOptions.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuizOption(index)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 cursor-pointer"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddQuizOption}
                        className="self-start text-sm font-bold text-[#295ce8] hover:text-blue-700 flex items-center gap-1 mt-1 cursor-pointer"
                    >
                        <FiPlusCircle /> Add Option
                    </button>
                </div>

                {quizStatus && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${quizStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <FiCheckCircle className="flex-shrink-0" />
                        <span>{quizStatus}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={quizLoading}
                    className="w-full bg-[#295ce8] hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                    <span>{quizLoading ? 'Creating...' : 'Create Quiz'}</span>
                </button>
            </form>

            {/* Quizzes List */}
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiSettings className="text-purple-605" /> Existing Quizzes
                </h2>
                {quizzes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No quizzes created yet.</p>
                ) : (
                    <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
                        {quizzes.map(quiz => {
                            const totalVotes = quiz.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                            return (
                                <div key={quiz._id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{quiz.question}</p>
                                            <span className="text-sm text-gray-400 font-semibold mt-1 block">
                                                Total Submissions: {totalVotes}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleQuiz(quiz._id, quiz.isActive)}
                                                className={`px-2 py-1 rounded text-sm font-bold border transition-colors cursor-pointer ${quiz.isActive
                                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                        : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {quiz.isActive ? 'Active' : 'Draft'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz._id)}
                                                className="text-gray-400 hover:text-red-655 p-1 rounded transition-colors cursor-pointer animate-fade-in"
                                                title="Delete Quiz"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-1">
                                        {quiz.options.map((opt, oIdx) => {
                                            const votesCount = opt.votes?.length || 0;
                                            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                            const isCorrect = oIdx === quiz.correctOptionIndex;
                                            return (
                                                <div key={opt._id} className={`flex flex-col gap-1 text-[11px] p-2 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-150' : 'bg-gray-100/50'}`}>
                                                    <div className="flex justify-between text-gray-600">
                                                        <span className="flex items-center gap-1.5">
                                                            {opt.text}
                                                            {isCorrect && (
                                                                <span className="bg-green-600 text-white font-bold text-[8px] px-1 py-0.5 rounded leading-none">CORRECT</span>
                                                            )}
                                                        </span>
                                                        <span className="font-semibold text-gray-800">{votesCount} submission(s) ({percent}%)</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    {votesCount > 0 && (
                                                        <details className="mt-1 group cursor-pointer">
                                                            <summary className="text-[10px] text-blue-600 font-bold outline-none select-none">View Details</summary>
                                                            <ul className="mt-1 flex flex-col gap-1 pl-2 border-l-2 border-blue-100 max-h-32 overflow-y-auto">
                                                                {opt.votes.map(voter => (
                                                                    <li key={voter._id || voter} className="text-[9px] text-gray-600">
                                                                        {voter.firstName ? <><span className="font-bold">{voter.firstName} {voter.lastName}</span> ({voter.email})</> : <span className="italic">Unknown User</span>}
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

export default QuizzesManager;
