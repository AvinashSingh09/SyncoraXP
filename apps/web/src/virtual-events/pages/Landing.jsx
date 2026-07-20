import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock } from 'react-icons/fi';

const Landing = () => {
    // Countdown state (dummy target date: 64 days from now for visual match)
    const [timeLeft, setTimeLeft] = useState({
        days: 64,
        hours: 8,
        minutes: 41,
        seconds: 8
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;
                if (seconds > 0) seconds--;
                else {
                    seconds = 59;
                    if (minutes > 0) minutes--;
                    else {
                        minutes = 59;
                        if (hours > 0) hours--;
                        else {
                            hours = 23;
                            if (days > 0) days--;
                        }
                    }
                }
                return { days, hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    // Get today's date formatted
    const today = new Date();
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-GB', dateOptions);

    return (
        <div className="min-h-screen bg-white relative flex flex-col items-center justify-center py-10 px-4 font-sans overflow-x-hidden">
            {/* Abstract Background Blob */}
            <div className="absolute top-0 left-0 w-full h-[70vh] bg-[#eef6f9] rounded-b-[40%] scale-150 transform -translate-y-1/4 -z-10"></div>

            <div className="w-full max-w-[1200px] z-10 flex flex-col items-center">
                {/* Top Section with Image and Slogan */}
                <div className="w-full flex flex-col items-center mb-10">
                    <div className="w-full h-[35vh] min-h-[250px] max-h-[400px] relative flex justify-center items-center mb-6">
                        <img
                            src="/virtual-events-assets/hero-illustration.png"
                            alt="Virtual Conference Illustration"
                            className="h-full object-contain mix-blend-multiply"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Go Virtual,
                    </h2>
                </div>

                {/* Bottom Blue Card Section */}
                <div className="w-full max-w-[1100px] bg-[#295ce8] text-white rounded-xl shadow-2xl p-8 md:p-10 flex flex-col relative z-10">
                    <div className="flex flex-col md:flex-row justify-between mb-8">

                        {/* Left Content */}
                        <div className="md:w-2/3 pr-0 md:pr-8 mb-6 md:mb-0">
                            <h1 className="text-3xl font-bold mb-3 tracking-wide">
                                Demo
                            </h1>
                            <p className="text-blue-50 text-sm leading-relaxed max-w-2xl font-light">
                                Demo is a Virtual Conference hosted for marketers and sales professionals across India to help them understand the role of automation in Business Development in the coming decades. The event will be participated by C-suite executives from top MNCs who will be delivering keynote sessions covering a range of topics.
                            </p>
                        </div>

                        {/* Right Content (Details & Buttons) */}
                        <div className="md:w-1/3 flex flex-col items-start md:items-end">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <FiCalendar className="w-4 h-4" />
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <FiClock className="w-4 h-4" />
                                    <span>10:00 am - 10:45 am</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to="/virtual-events-platform/app/register"
                                    className="bg-white text-[#295ce8] px-5 py-1.5 rounded text-sm font-bold shadow-sm hover:bg-gray-50"
                                >
                                    Register
                                </Link>
                                <Link
                                    to="/virtual-events-platform/app/login"
                                    className="bg-white text-[#295ce8] px-5 py-1.5 rounded text-sm font-bold shadow-sm hover:bg-gray-50"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex justify-center gap-8 md:gap-16 pt-6 border-t border-blue-400/30">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl md:text-5xl font-normal">{formatNumber(timeLeft.days)}</span>
                            <span className="text-xs mt-2 text-white uppercase tracking-widest font-medium">DAYS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl md:text-5xl font-normal">{formatNumber(timeLeft.hours)}</span>
                            <span className="text-xs mt-2 text-white uppercase tracking-widest font-medium">HOURS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl md:text-5xl font-normal">{formatNumber(timeLeft.minutes)}</span>
                            <span className="text-xs mt-2 text-white uppercase tracking-widest font-medium">MINUTES</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl md:text-5xl font-normal">{formatNumber(timeLeft.seconds)}</span>
                            <span className="text-xs mt-2 text-white uppercase tracking-widest font-medium">SECONDS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
