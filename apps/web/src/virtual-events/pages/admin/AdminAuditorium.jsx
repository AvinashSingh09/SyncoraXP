import React, { useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import LiveStreamManager from './components/LiveStreamManager';
import SessionsManager from './components/SessionsManager';
import LayoutManager from './components/LayoutManager';
import PollsManager from './components/PollsManager';
import QuizzesManager from './components/QuizzesManager';
import QnAManager from './components/QnAManager';

const AdminAuditorium = () => {
    const [auditoriumSubTab, setAuditoriumSubTab] = useState('live');

    return (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <FiSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Auditorium Settings</h2>
                        <p className="text-sm text-gray-500">Configure parameters for this environment</p>
                    </div>
                </div>
            </div>

            <div>
                {/* Inner Sub-tabs */}
                <div className="flex flex-wrap border border-gray-200 mb-6 bg-gray-50 p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => setAuditoriumSubTab('live')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'live' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Live Screen
                    </button>
                    <button 
                        onClick={() => setAuditoriumSubTab('sessions')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'sessions' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Sessions
                    </button>
                    <button 
                        onClick={() => setAuditoriumSubTab('layout')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'layout' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Layout & Placement
                    </button>
                    <button 
                        onClick={() => setAuditoriumSubTab('polls')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'polls' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Polls
                    </button>
                    <button 
                        onClick={() => setAuditoriumSubTab('quizzes')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'quizzes' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Quizzes
                    </button>
                    <button 
                        onClick={() => setAuditoriumSubTab('qna')}
                        className={`flex-1 min-w-[120px] py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${auditoriumSubTab === 'qna' ? 'bg-[#295ce8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Q&A
                    </button>
                </div>

                {auditoriumSubTab === 'live' && <LiveStreamManager />}
                {auditoriumSubTab === 'sessions' && <SessionsManager />}
                {auditoriumSubTab === 'layout' && <LayoutManager />}
                {auditoriumSubTab === 'polls' && <PollsManager />}
                {auditoriumSubTab === 'quizzes' && <QuizzesManager />}
                {auditoriumSubTab === 'qna' && <QnAManager />}
            </div>
        </div>
    );
};

export default AdminAuditorium;
