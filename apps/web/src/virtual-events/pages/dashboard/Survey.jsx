import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiAward, FiCheckCircle, FiPrinter, FiRefreshCcw, FiDownload, FiInfo } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { surveyService, configService } from '../../services/api';

const Survey = () => {
    const { user, updateUser } = useAuth();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pointsEarnedToast, setPointsEarnedToast] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [surveyActive, setSurveyActive] = useState(true);

    useEffect(() => {
        const loadSurveyData = async () => {
            try {
                // Check status
                const statusRes = await surveyService.checkUserSurveyStatus();
                if (statusRes.data && statusRes.data.submitted) {
                    setIsSubmitted(true);
                }

                // Fetch questions
                const qRes = await surveyService.getQuestions();
                if (qRes.data && qRes.data.success) {
                    setQuestions(qRes.data.data);
                    // Initialize answers state
                    const initialAnswers = {};
                    qRes.data.data.forEach(q => {
                        initialAnswers[q._id] = '';
                    });
                    setAnswers(initialAnswers);
                }

                // Fetch active status config
                const configRes = await configService.getConfig('survey_active');
                if (configRes.data) {
                    setSurveyActive(configRes.data.value !== 'false');
                }
            } catch (err) {
                console.error('Failed to check survey status or questions', err);
            } finally {
                setLoading(false);
            }
        };
        loadSurveyData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                answer
            }));
            const res = await surveyService.submitSurvey({ answers: formattedAnswers });
            if (res.data && res.data.success) {
                setIsSubmitted(true);
                if (res.data.earnedPoints && res.data.earnedPoints > 0) {
                    if (updateUser && res.data.user) {
                        updateUser(res.data.user);
                    }
                    setPointsEarnedToast(res.data.earnedPoints);
                    setTimeout(() => setPointsEarnedToast(null), 4000);
                }
            }
        } catch (err) {
            console.error('Failed to submit survey', err);
            alert(err.response?.data?.message || 'Failed to submit survey. Please try again.');
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPDF = async () => {
        const certElement = document.getElementById('certificate');
        if (!certElement) return;

        setIsGenerating(true);
        try {
            // Temporarily adjust styles for perfect capture
            const originalTransform = certElement.style.transform;
            certElement.style.transform = 'none';

            const canvas = await html2canvas(certElement, {
                scale: 3, // High resolution
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            certElement.style.transform = originalTransform;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calculate scale to fit perfectly
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            const pdfRatio = pdfWidth / pdfHeight;

            let finalWidth = pdfWidth;
            let finalHeight = pdfHeight;

            if (imgRatio > pdfRatio) {
                finalHeight = pdfWidth / imgRatio;
            } else {
                finalWidth = pdfHeight * imgRatio;
            }

            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(`${user?.firstName || 'User'}_Certificate.pdf`);
        } catch (err) {
            console.error('Error generating PDF', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-50 py-20 text-gray-500 text-sm gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">Loading survey...</span>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full flex justify-center items-start overflow-y-auto bg-gray-50 p-8 pt-[128px]">
            <div className="w-full max-w-3xl">
                {!surveyActive && !isSubmitted ? (
                    <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-150 text-center space-y-6 max-w-xl mx-auto mt-10">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-sm animate-pulse">
                            <FiInfo className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Survey Closed</h2>
                            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                                The event feedback survey is currently closed or has ended. Thank you for participating in Virtual Event 2026!
                            </p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => window.location.href = '/virtual-events-platform/app/dashboard/lobby'}
                                className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
                            >
                                Back to Lobby
                            </button>
                        </div>
                    </div>
                ) : !isSubmitted ? (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Event Feedback Survey</h2>
                            <p className="text-gray-500 mt-2">Please share your thoughts with us to get your certificate of completion.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {questions.map((question, idx) => (
                                <div key={question._id} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                        {idx + 1}. {question.text}
                                    </label>

                                    {question.type === 'rating' && (
                                        <div className="flex gap-4 flex-wrap">
                                            {(question.options && question.options.length > 0 ? question.options : ['Excellent', 'Good', 'Average', 'Poor']).map((option) => (
                                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`question-${question._id}`}
                                                        value={option}
                                                        checked={answers[question._id] === option}
                                                        onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        required
                                                    />
                                                    <span className="text-sm text-gray-700">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'yes_no' && (
                                        <div className="flex gap-6">
                                            {(question.options && question.options.length > 0 ? question.options : ['Yes', 'No']).map((option) => (
                                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`question-${question._id}`}
                                                        value={option}
                                                        checked={answers[question._id] === option}
                                                        onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        required
                                                    />
                                                    <span className="text-sm text-gray-700">{option === 'Yes' ? 'Yes, absolutely' : option === 'No' ? 'Not really' : option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'text' && (
                                        <textarea
                                            name={`question-${question._id}`}
                                            value={answers[question._id] || ''}
                                            onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
                                            rows="4"
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
                                            placeholder="Share your ideas..."
                                            required
                                        ></textarea>
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                className="w-full bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg mt-8 pointer-events-auto cursor-pointer"
                            >
                                <FiCheckCircle className="w-6 h-6" />
                                Submit & Get Certificate
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-fade-in-up">
                        <div className="mb-6 flex gap-4 print:hidden">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGenerating}
                                className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-sm"
                            >
                                <FiDownload className="w-5 h-5" />
                                {isGenerating ? 'Generating PDF...' : 'Download Certificate (PDF)'}
                            </button>
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="bg-white hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 transition-colors cursor-pointer text-sm"
                            >
                                <FiRefreshCcw className="w-5 h-5" />
                                Retake Survey
                            </button>
                        </div>

                        {/* Certificate Container */}
                        <div id="certificate" className="bg-[#ffffff] p-2 w-full max-w-[800px] aspect-[1.414/1] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] rounded relative print:shadow-none print:w-[100vw] print:h-[100vh] print:max-w-none print:p-0">
                            {/* Inner Border */}
                            <div className="w-full h-full border-[12px] border-double border-[#bda662] p-8 flex flex-col items-center justify-center relative bg-[#fffcf5]">

                                {/* Corner Decorations */}
                                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#bda662]"></div>
                                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#bda662]"></div>
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#bda662]"></div>
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#bda662]"></div>

                                <FiAward className="w-20 h-20 text-[#bda662] mb-6" />

                                <h1 className="text-5xl font-serif text-[#111827] tracking-wider mb-2 text-center">
                                    CERTIFICATE
                                </h1>
                                <p className="text-xl text-[#bda662] tracking-[0.3em] font-medium mb-10">
                                    OF COMPLETION
                                </p>

                                <p className="text-[#4b5563] italic mb-4 font-serif text-lg">
                                    This is to proudly certify that
                                </p>

                                <h2 className="text-4xl font-bold text-[#111827] mb-4 border-b-2 border-[#d1d5db] pb-2 px-12 text-center uppercase tracking-wide">
                                    {user?.firstName} {user?.lastName}
                                </h2>

                                <p className="text-[#4b5563] italic mb-6 font-serif text-lg text-center max-w-lg">
                                    has successfully completed the survey and actively participated in the interactive sessions at the
                                </p>

                                <h3 className="text-2xl font-bold text-[#295ce8] mb-12 tracking-wide uppercase">
                                    Virtual Event 2026
                                </h3>

                                <div className="w-full px-16 flex justify-between items-end mt-auto">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 border-b border-[#1f2937] mb-2"></div>
                                        <p className="text-sm font-semibold text-[#4b5563] uppercase tracking-widest">Date</p>
                                        <p className="text-sm text-[#6b7280] mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>

                                    {/* Event Logo Placeholder */}
                                    <div className="flex items-center gap-2 text-[#295ce8] opacity-80">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span className="text-xl font-bold text-[#1f2937] tracking-wide">Virtual<span className="text-[#295ce8]">Event</span></span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-32 border-b border-[#1f2937] mb-2 relative h-10 flex items-end justify-center">
                                            <span className="text-2xl text-[#1f2937] opacity-70 mb-1" style={{ fontFamily: "'Brush Script MT', 'Bradley Hand', cursive" }}>Organizer</span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#4b5563] uppercase tracking-widest">Organizer</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>{`
                            @media print {
                                body * {
                                    visibility: hidden;
                                }
                                #certificate, #certificate * {
                                    visibility: visible;
                                }
                                #certificate {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                }
                                @page {
                                    size: landscape;
                                    margin: 0;
                                }
                            }
                            @keyframes fadeInUp {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .animate-fade-in-up {
                                animation: fadeInUp 0.6s ease-out forwards;
                            }
                        `}</style>
                    </div>
                )}
            </div>

            {pointsEarnedToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-bounce select-none">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                        🏆
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-wide uppercase">Points Earned!</p>
                        <p className="text-xs font-semibold text-amber-100">
                            +{pointsEarnedToast} points added for completing the survey!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Survey;
