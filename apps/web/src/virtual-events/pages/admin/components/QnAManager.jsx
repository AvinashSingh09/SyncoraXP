import React, { useState, useEffect } from 'react';
import { qnaService } from '../../../services/api';
import socket from '../../../services/socket';
import { FiThumbsUp } from 'react-icons/fi';

const QnAManager = () => {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await qnaService.getQuestions();
                if (response.data) {
                    setQuestions(response.data);
                }
            } catch (err) {
                console.error('Failed to load questions', err);
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

    const sortedQuestions = [...questions].sort((a, b) => {
        const upvotesA = a.upvotes ? a.upvotes.length : 0;
        const upvotesB = b.upvotes ? b.upvotes.length : 0;
        if (upvotesB !== upvotesA) {
            return upvotesB - upvotesA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-gray-700">Q&A Questions from Attendees</h3>
                {sortedQuestions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No questions asked yet.</p>
                ) : (
                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                        {sortedQuestions.map(q => (
                            <div key={q._id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{q.senderName}</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                            <FiThumbsUp className="w-2.5 h-2.5 text-gray-500" />
                                            <span>{q.upvotes ? q.upvotes.length : 0} upvotes</span>
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-semibold">{new Date(q.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-800 mt-2 leading-relaxed">{q.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QnAManager;
