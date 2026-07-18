import React, { useState, useEffect } from 'react';
import { surveyService, configService } from '../../services/api';
import { 
    FiUsers, 
    FiStar, 
    FiMessageSquare, 
    FiPlus, 
    FiTrash2, 
    FiEdit2, 
    FiCheck, 
    FiX, 
    FiGrid, 
    FiSettings, 
    FiInfo,
    FiChevronDown,
    FiChevronUp,
    FiDownload,
    FiSearch,
    FiMail,
    FiBriefcase,
    FiMapPin
} from 'react-icons/fi';

const AdminSurvey = () => {
    const [surveys, setSurveys] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'questions'
    const [expandedSubmissions, setExpandedSubmissions] = useState({});
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [isSurveyActive, setIsSurveyActive] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const getInitials = (first, last) => {
        const f = first ? first.charAt(0) : '';
        const l = last ? last.charAt(0) : '';
        return (f + l).toUpperCase() || '??';
    };
    
    // Detailed modal state
    const [selectedResponse, setSelectedResponse] = useState(null);

    // Question form state
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [questionForm, setQuestionForm] = useState({
        text: '',
        type: 'rating',
        order: 0
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const qRes = await surveyService.getQuestions();
            const sRes = await surveyService.getSurveys();
            const configRes = await configService.getConfig('survey_active');
            
            if (qRes.data && qRes.data.success) {
                setQuestions(qRes.data.data);
            }
            if (sRes.data && sRes.data.success) {
                setSurveys(sRes.data.data);
            }
            if (configRes.data) {
                setIsSurveyActive(configRes.data.value !== 'false');
            }
        } catch (err) {
            console.error('Failed to load admin survey data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const toggleSurveyActiveStatus = async () => {
        const nextStatus = !isSurveyActive;
        try {
            await configService.setConfig('survey_active', nextStatus ? 'true' : 'false');
            setIsSurveyActive(nextStatus);
        } catch (error) {
            console.error('Failed to update survey status', error);
            alert('Failed to update survey status.');
        }
    };

    // Form handlers
    const handleFormChange = (e) => {
        setQuestionForm({
            ...questionForm,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const existingQuestion = isEditing ? questions.find(q => q._id === editingId) : null;
            const payload = {
                text: questionForm.text,
                type: questionForm.type,
                options: existingQuestion ? (existingQuestion.options || []) : [],
                order: isEditing ? (questionForm.order || 0) : (questions.length + 1)
            };

            if (isEditing) {
                await surveyService.updateQuestion(editingId, payload);
            } else {
                await surveyService.createQuestion(payload);
            }

            // Reset form
            setQuestionForm({
                text: '',
                type: 'rating',
                order: 0
            });
            setIsEditing(false);
            setEditingId(null);
            
            // Reload
            await fetchAllData();
        } catch (error) {
            console.error('Failed to save question', error);
            alert('Failed to save question.');
        }
    };

    const handleEditClick = (q) => {
        setIsEditing(true);
        setEditingId(q._id);
        setQuestionForm({
            text: q.text,
            type: q.type,
            order: q.order || 0
        });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this question? This will affect how future surveys are displayed.')) {
            try {
                await surveyService.deleteQuestion(id);
                await fetchAllData();
            } catch (error) {
                console.error('Failed to delete question', error);
                alert('Failed to delete question.');
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setQuestionForm({
            text: '',
            type: 'rating',
            order: 0
        });
    };

    const toggleRow = (id, e) => {
        e.stopPropagation(); // prevent opening detailed modal
        setExpandedSubmissions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleExport = (format) => {
        if (surveys.length === 0) {
            alert('No data to export.');
            return;
        }

        let fileContent = '';
        let fileName = `survey_submissions_${new Date().toISOString().slice(0, 10)}`;
        let mimeType = 'text/plain';

        if (format === 'json') {
            fileContent = JSON.stringify(surveys, null, 2);
            fileName += '.json';
            mimeType = 'application/json';
        } else if (format === 'csv') {
            // CSV columns: Name, Email, Date, and all question text
            const headers = ['Attendee Name', 'Attendee Email', 'Submission Date', ...questions.map(q => q.text)];
            
            const rows = surveys.map(survey => {
                const u = survey.user || {};
                const userName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous';
                const userEmail = u.email || 'N/A';
                const date = new Date(survey.createdAt).toLocaleDateString();
                
                const answers = questions.map(q => {
                    const ansObj = survey.answers?.find(a => (a.questionId?._id || a.questionId) === q._id);
                    const val = ansObj ? ansObj.answer : '-';
                    // Escape double quotes
                    return `"${val.replace(/"/g, '""')}"`;
                });

                return [`"${userName.replace(/"/g, '""')}"`, `"${userEmail.replace(/"/g, '""')}"`, `"${date.replace(/"/g, '""')}"`, ...answers].join(',');
            });

            fileContent = [
                headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
                ...rows
            ].join('\n');
            fileName += '.csv';
            mimeType = 'text/csv';
        } else if (format === 'xls') {
            const headers = ['Attendee Name', 'Attendee Email', 'Submission Date', ...questions.map(q => q.text)];
            
            const headerCells = headers.map(h => `<th style="background-color: #295ce8; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 8px;">${h}</th>`).join('');
            
            const rows = surveys.map(survey => {
                const u = survey.user || {};
                const userName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous';
                const userEmail = u.email || 'N/A';
                const date = new Date(survey.createdAt).toLocaleDateString();
                
                const answers = questions.map(q => {
                    const ansObj = survey.answers?.find(a => (a.questionId?._id || a.questionId) === q._id);
                    return ansObj ? ansObj.answer : '-';
                });

                const cells = [userName, userEmail, date, ...answers]
                    .map(val => `<td style="border: 1px solid #dddddd; padding: 8px; vertical-align: top;">${val}</td>`)
                    .join('');
                
                return `<tr>${cells}</tr>`;
            }).join('');

            fileContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>Survey Submissions</x:Name>
                                    <x:WorksheetOptions>
                                        <x:DisplayGridlines/>
                                    </x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>${headerCells}</tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            fileName += '.xls';
            mimeType = 'application/vnd.ms-excel';
        }

        const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate stats helper
    const getStatsForQuestion = (qId, qType, qOptions) => {
        const defaultOpts = qType === 'rating' ? ['Excellent', 'Good', 'Average', 'Poor'] : ['Yes', 'No'];
        const options = qOptions && qOptions.length > 0 ? qOptions : defaultOpts;
        
        const stats = {};
        options.forEach(opt => {
            stats[opt] = 0;
        });

        let totalAnswers = 0;
        surveys.forEach(s => {
            const ansObj = s.answers?.find(a => (a.questionId?._id || a.questionId) === qId);
            if (ansObj && stats[ansObj.answer] !== undefined) {
                stats[ansObj.answer]++;
                totalAnswers++;
            }
        });

        return { stats, totalAnswers, options };
    };

    if (loading && questions.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-500 text-sm gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">Loading survey manager...</span>
            </div>
        );
    }

    const ratingColors = {
        Excellent: 'bg-emerald-500',
        Good: 'bg-blue-500',
        Average: 'bg-amber-500',
        Poor: 'bg-rose-500',
        Yes: 'bg-emerald-500',
        No: 'bg-rose-500'
    };

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10 animate-fade-in text-gray-800 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-[#295ce8] border border-blue-100 shadow-sm">
                        <FiUsers className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Survey Manager & Analytics</h2>
                        <p className="text-xs text-gray-500">Configure questions and view submission analytics for the event survey</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Toggle Switch */}
                    <button
                        onClick={toggleSurveyActiveStatus}
                        className={`px-4 py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                            isSurveyActive 
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/80 shadow-emerald-50' 
                                : 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100/80 shadow-rose-50'
                        }`}
                        title={isSurveyActive ? "Click to Stop Survey" : "Click to Start Survey"}
                    >
                        <span className={`w-2 h-2 rounded-full ${isSurveyActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isSurveyActive ? 'Survey: ON' : 'Survey: OFF'}
                    </button>

                    {/* Tab Switches */}
                    <div className="flex bg-gray-200/60 p-1.5 rounded-2xl border border-gray-200 max-w-fit shadow-inner">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                activeTab === 'analytics' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <FiGrid className="w-4 h-4" />
                            Analytics & Responses
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                activeTab === 'questions' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <FiSettings className="w-4 h-4" />
                            Manage Questions
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <>
                    {/* Stats Dashboard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Responses */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-blue-700 tracking-wide uppercase">Total Responses</span>
                                <h3 className="text-3xl font-extrabold text-blue-900">{surveys.length}</h3>
                                <span className="text-[10px] text-blue-500 font-semibold">Submitted Certificates</span>
                            </div>
                            <div className="p-4 bg-white/80 rounded-full text-blue-600 shadow-sm">
                                <FiUsers className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Survey Questions */}
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Survey Length</span>
                                <h3 className="text-3xl font-extrabold text-amber-900">{questions.length}</h3>
                                <span className="text-[10px] text-amber-500 font-semibold">Active Questions</span>
                            </div>
                            <div className="p-4 bg-white/80 rounded-full text-amber-600 shadow-sm">
                                <FiGrid className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Survey Status */}
                        <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm transition-all duration-350 ${
                            isSurveyActive 
                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-100' 
                                : 'bg-gradient-to-r from-rose-50 to-rose-100/50 border-rose-100'
                        }`}>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold tracking-wide uppercase ${isSurveyActive ? 'text-emerald-700' : 'text-rose-700'}`}>Survey Status</span>
                                    <span className="relative flex h-2 w-2">
                                        {isSurveyActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isSurveyActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    </span>
                                </div>
                                <h3 className={`text-3xl font-extrabold ${isSurveyActive ? 'text-emerald-900' : 'text-rose-900'}`}>
                                    {isSurveyActive ? 'Active' : 'Stopped'}
                                </h3>
                                <span className={`text-[10px] font-semibold ${isSurveyActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isSurveyActive ? 'Collecting Feedback' : 'Closed for Attendees'}
                                </span>
                            </div>
                            <div className={`p-4 bg-white/80 rounded-full shadow-sm ${isSurveyActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                <FiInfo className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Search by name, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 font-semibold"
                            />
                            <FiSearch className="absolute left-3.5 top-[13px] text-gray-400 w-4 h-4" />
                        </div>
                    </div>

                    {/* Submissions Feed Table */}
                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-gray-50/50">
                            <div>
                                <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">All Submissions Feed</h3>
                                <p className="text-xs text-gray-400 font-semibold mt-0.5">Click any response row to inspect detailed feedback or expand inline.</p>
                            </div>
                            
                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="bg-white border border-gray-200 hover:border-blue-500 hover:text-[#295ce8] text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                    title="Export survey data"
                                >
                                    <FiDownload className="w-3.5 h-3.5" />
                                    Export Submissions
                                </button>
                                
                                {showExportDropdown && (
                                    <>
                                        {/* Backdrop */}
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)}></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-in-up py-1.5">
                                            <button
                                                onClick={() => { handleExport('xls'); setShowExportDropdown(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold transition-colors cursor-pointer border-b border-gray-100/50"
                                            >
                                                📈 Export as Excel (.xls)
                                            </button>
                                            <button
                                                onClick={() => { handleExport('csv'); setShowExportDropdown(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold transition-colors cursor-pointer border-b border-gray-100/50"
                                            >
                                                📊 Export as CSV (.csv)
                                            </button>
                                            <button
                                                onClick={() => { handleExport('json'); setShowExportDropdown(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold transition-colors cursor-pointer"
                                            >
                                                ⚙️ Export as JSON (.json)
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                        <th className="py-4.5 px-6">User</th>
                                        <th className="py-4.5 px-6">Professional Profile</th>
                                        <th className="py-4.5 px-6 text-center">Feedback / Responses</th>
                                        <th className="py-4.5 px-6">Submission Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {surveys.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-gray-400 py-12 italic font-semibold">
                                                No survey submissions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        surveys
                                            .filter(survey => {
                                                const u = survey.user || {};
                                                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                                                const email = (u.email || '').toLowerCase();
                                                const query = searchQuery.toLowerCase();
                                                return fullName.includes(query) || email.includes(query);
                                            })
                                            .map((survey) => {
                                                const u = survey.user || {};
                                                const isExpanded = !!expandedSubmissions[survey._id];
                                                return (
                                                    <React.Fragment key={survey._id}>
                                                        <tr 
                                                            className={`hover:bg-blue-50/10 transition-all duration-200 cursor-pointer ${
                                                                isExpanded ? 'bg-blue-50/5' : ''
                                                            }`}
                                                            onClick={() => setSelectedResponse(survey)}
                                                        >
                                                            {/* User Column */}
                                                            <td className="py-4 px-6 flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-inner">
                                                                    {getInitials(u.firstName, u.lastName)}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-gray-800 truncate">
                                                                        {u.firstName} {u.lastName}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                                                                        <FiMail className="w-3 h-3" /> {u.email}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Professional Profile Column */}
                                                            <td className="py-4 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-700">{u.designation || 'Attendee'}</span>
                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                                                                        <FiBriefcase className="w-3.5 h-3.5 text-gray-400" /> {u.company || 'VirtualEvent'}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Feedback / Responses Column */}
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <span className="bg-blue-50 text-[#295ce8] border border-blue-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                                                        {survey.answers?.length || 0} Answers
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => toggleRow(survey._id, e)}
                                                                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 ${
                                                                            isExpanded 
                                                                                ? 'bg-[#295ce8] text-white shadow-[0_2px_8px_rgba(41,92,232,0.4)]' 
                                                                                : 'bg-gray-50 border border-gray-200 text-gray-400 hover:text-[#295ce8] hover:bg-blue-50 hover:border-blue-200'
                                                                        } cursor-pointer`}
                                                                        title="Toggle Answers Inline"
                                                                    >
                                                                        {isExpanded ? (
                                                                            <FiChevronUp className="w-4 h-4" />
                                                                        ) : (
                                                                            <FiChevronDown className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Date Column */}
                                                            <td className="py-4 px-6 text-gray-550 font-bold">
                                                                {new Date(survey.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </td>
                                                        </tr>

                                                        {/* Dropdown details row */}
                                                        {isExpanded && (
                                                            <tr className="bg-gray-50/30">
                                                                <td colSpan={4} className="p-6">
                                                                    <div className="bg-white max-w-4xl mx-auto rounded-3xl border border-gray-150 p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                                                <span className="w-2 h-2 rounded-full bg-[#295ce8] animate-pulse"></span>
                                                                                Survey Response Details ({survey.answers?.length || 0} Questions)
                                                                            </h4>
                                                                            <span className="text-[10px] font-bold text-gray-400">
                                                                                Submitted on {new Date(survey.createdAt).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {questions.map((q, idx) => {
                                                                                const ansObj = survey.answers?.find(a => (a.questionId?._id || a.questionId) === q._id);
                                                                                const answerText = ansObj ? ansObj.answer : '-';
                                                                                return (
                                                                                    <div key={q._id} className="p-5 rounded-2xl border border-gray-100 bg-[#f8fafc]/50 flex flex-col gap-2.5 hover:bg-[#f8fafc] transition-colors duration-150">
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className="text-[10px] font-black text-[#295ce8]">Q{idx + 1}.</span>
                                                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                                                                                    {q.type.replace('_', ' ')}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-xs font-extrabold text-gray-800 leading-snug">{q.text}</p>
                                                                                        <div className="mt-1">
                                                                                            {q.type === 'rating' || q.type === 'yes_no' ? (
                                                                                                answerText !== '-' ? (
                                                                                                    <span className={`inline-flex items-center gap-1.5 font-extrabold px-3 py-1 rounded-full text-[10px] border uppercase ${
                                                                                                        answerText === 'Excellent' || answerText === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                                                                                        answerText === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-250' :
                                                                                                        answerText === 'Average' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                                                                                                        'bg-rose-50 text-rose-700 border-rose-250'
                                                                                                    }`}>
                                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${ratingColors[answerText] || 'bg-gray-400'}`}></span>
                                                                                                        {answerText}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="text-gray-300 font-bold">-</span>
                                                                                                )
                                                                                            ) : (
                                                                                                <blockquote className="text-xs text-gray-600 font-medium bg-white p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap leading-relaxed shadow-sm italic">
                                                                                                    "{answerText}"
                                                                                                </blockquote>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Manage Questions Tab */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add / Edit Question Form */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-md h-fit space-y-5">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3.5">
                            <div className="p-2 bg-blue-50 text-[#295ce8] rounded-xl border border-blue-100/60 shadow-sm">
                                <FiPlus className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">
                                {isEditing ? 'Edit Survey Question' : 'Add Survey Question'}
                            </h3>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Question Text */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Question Text</label>
                                <input
                                    type="text"
                                    name="text"
                                    value={questionForm.text}
                                    onChange={handleFormChange}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all placeholder-gray-400 font-semibold shadow-sm"
                                    placeholder="e.g. Rate your overall experience"
                                    required
                                />
                            </div>

                            {/* Question Type */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Question Type</label>
                                <select
                                    name="type"
                                    value={questionForm.type}
                                    onChange={handleFormChange}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#295ce8] transition-all cursor-pointer font-semibold shadow-sm"
                                >
                                    <option value="rating">Rating (Excellent, Good, Average, Poor)</option>
                                    <option value="yes_no">Yes / No</option>
                                    <option value="text">Open Text Area</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-200"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    {isEditing ? 'Update Question' : 'Save Question'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer border border-gray-200/50"
                                    >
                                        <FiX className="w-4 h-4" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Active Questions List */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 shadow-md overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight">Active Questions ({questions.length})</h3>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">These questions display to attendees in sorting order order.</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {questions.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-xs italic font-semibold">
                                    No questions configured. Add one on the left.
                                </div>
                            ) : (
                                questions.map((q) => (
                                    <div key={q._id} className="p-6 flex items-start justify-between gap-4 hover:bg-gray-50/20 transition-all duration-200">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="bg-gray-100 text-gray-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-gray-200 uppercase tracking-wider">
                                                    Order {q.order}
                                                </span>
                                                <span className="bg-blue-50 text-[#295ce8] text-[9px] font-black px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                                                    {q.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-gray-800 leading-snug">{q.text}</h4>
                                            
                                            {(q.type === 'rating' || q.type === 'yes_no') && (
                                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider mr-1">Choices:</span>
                                                    {(q.options && q.options.length > 0 ? q.options : (q.type === 'rating' ? ['Excellent', 'Good', 'Average', 'Poor'] : ['Yes', 'No'])).map(opt => (
                                                        <span key={opt} className="bg-white text-gray-500 border border-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleEditClick(q)}
                                                className="w-8 h-8 rounded-full border border-gray-250 bg-white text-gray-400 hover:text-[#295ce8] hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all cursor-pointer"
                                                title="Edit question"
                                            >
                                                <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(q._id)}
                                                className="w-8 h-8 rounded-full border border-gray-250 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-all cursor-pointer"
                                                title="Delete question"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Response Modal */}
            {selectedResponse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-[#295ce8] p-6 text-white relative">
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-bold">Feedback Details</h3>
                            <p className="text-xs text-blue-100 font-medium mt-1">
                                Submitted by {selectedResponse.user?.firstName} {selectedResponse.user?.lastName} ({selectedResponse.user?.email})
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {questions.map((q, idx) => {
                                const ansObj = selectedResponse.answers?.find(a => (a.questionId?._id || a.questionId) === q._id);
                                const answerText = ansObj ? ansObj.answer : '-';
                                return (
                                    <div key={q._id} className="space-y-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-extrabold text-blue-600">Q{idx + 1}.</span>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {q.type.replace('_', ' ')} Question
                                            </h4>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800">{q.text}</p>
                                        <div className="mt-1">
                                            {q.type === 'rating' || q.type === 'yes_no' ? (
                                                <span className={`inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full text-xs ${
                                                    answerText === 'Excellent' || answerText === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    answerText === 'Good' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    answerText === 'Average' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    answerText === 'Poor' || answerText === 'No' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                    'bg-gray-50 text-gray-600 border border-gray-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ratingColors[answerText] || 'bg-gray-400'}`}></span>
                                                    {answerText}
                                                </span>
                                            ) : (
                                                <p className="text-sm text-gray-700 font-medium bg-gray-50 p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap">
                                                    {answerText}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSurvey;
