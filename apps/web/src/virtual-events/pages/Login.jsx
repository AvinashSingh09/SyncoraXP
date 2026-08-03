import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { authService, configService } from '../services/api';
import { BOOTH_ADMINS } from '../config/boothAdmins';
import { FaEye, FaEyeSlash, FaFilePdf } from 'react-icons/fa';
import { FiArrowLeft, FiX } from 'react-icons/fi';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [bgImage, setBgImage] = useState('');
    const [agendaPdf, setAgendaPdf] = useState('');
    const [layoutStyle, setLayoutStyle] = useState('card');
    const [landingWelcomeText, setLandingWelcomeText] = useState('WELCOME TO');
    const [landingBannerImage, setLandingBannerImage] = useState('');
    const [landingDateText, setLandingDateText] = useState('');
    const [landingLogoImage, setLandingLogoImage] = useState('');
    const [landingBtnText1, setLandingBtnText1] = useState('EVENT FLOW');
    const [landingBtnText2, setLandingBtnText2] = useState('LOGIN');
    const [landingBtnBgColor, setLandingBtnBgColor] = useState('#e60000');
    const [landingBtnTextColor, setLandingBtnTextColor] = useState('#ffffff');
    const [landingBtnShape, setLandingBtnShape] = useState('pill');
    const [posLogoLeft, setPosLogoLeft] = useState(5);
    const [posLogoTop, setPosLogoTop] = useState(4);
    const [posButtonsRight, setPosButtonsRight] = useState(5);
    const [posButtonsTop, setPosButtonsTop] = useState(4);
    const [posWelcomeLeft, setPosWelcomeLeft] = useState(50);
    const [posWelcomeTop, setPosWelcomeTop] = useState(30);
    const [posBannerLeft, setPosBannerLeft] = useState(50);
    const [posBannerTop, setPosBannerTop] = useState(50);
    const [posDateLeft, setPosDateLeft] = useState(50);
    const [posDateTop, setPosDateTop] = useState(72);
    const [landingWelcomeColor, setLandingWelcomeColor] = useState('#ffffff');
    const [landingDateColor, setLandingDateColor] = useState('#ffffff');
    const [landingLogoSize, setLandingLogoSize] = useState(48);
    const [landingBannerSize, setLandingBannerSize] = useState(180);
    const [landingBtnSize, setLandingBtnSize] = useState('medium');
    const [landingWelcomeSize, setLandingWelcomeSize] = useState(24);
    const [landingDateSize, setLandingDateSize] = useState(18);
    const [landingDescriptionText, setLandingDescriptionText] = useState('');
    const [landingDescriptionColor, setLandingDescriptionColor] = useState('#ffffff');
    const [landingDescriptionSize, setLandingDescriptionSize] = useState(16);
    const [posDescriptionLeft, setPosDescriptionLeft] = useState(50);
    const [posDescriptionTop, setPosDescriptionTop] = useState(85);
    const [showLandingLogo, setShowLandingLogo] = useState(true);
    const [showLandingWelcome, setShowLandingWelcome] = useState(true);
    const [showLandingBanner, setShowLandingBanner] = useState(true);
    const [showLandingDate, setShowLandingDate] = useState(true);
    const [showLandingButtons, setShowLandingButtons] = useState(true);
    const [showLandingDescription, setShowLandingDescription] = useState(false);
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const location = useLocation();
    const [showLoginModal, setShowLoginModal] = useState(() => {
        // Auto-open login modal when navigated from Register page
        return new URLSearchParams(location.search).get('modal') === 'login';
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await configService.getConfig('registerFields');
                if (res.data && res.data.value) {
                    const parsed = JSON.parse(res.data.value);
                    if (parsed.bgImage) {
                        setBgImage(parsed.bgImage);
                    }
                    if (parsed.agendaPdf) {
                        setAgendaPdf(parsed.agendaPdf);
                    }
                    if (parsed.layoutStyle) {
                        setLayoutStyle(parsed.layoutStyle);
                    }
                    if (parsed.landingWelcomeText) setLandingWelcomeText(parsed.landingWelcomeText);
                    if (parsed.landingBannerImage) setLandingBannerImage(parsed.landingBannerImage);
                    if (parsed.landingDateText) setLandingDateText(parsed.landingDateText);
                    if (parsed.landingLogoImage) setLandingLogoImage(parsed.landingLogoImage);
                    if (parsed.landingBtnText1) setLandingBtnText1(parsed.landingBtnText1);
                    if (parsed.landingBtnText2) setLandingBtnText2(parsed.landingBtnText2);
                    if (parsed.landingBtnBgColor) setLandingBtnBgColor(parsed.landingBtnBgColor);
                    if (parsed.landingBtnTextColor) setLandingBtnTextColor(parsed.landingBtnTextColor);
                    if (parsed.landingBtnShape) setLandingBtnShape(parsed.landingBtnShape);
                    if (parsed.posLogoLeft !== undefined) setPosLogoLeft(parsed.posLogoLeft);
                    if (parsed.posLogoTop !== undefined) setPosLogoTop(parsed.posLogoTop);
                    if (parsed.posButtonsRight !== undefined) setPosButtonsRight(parsed.posButtonsRight);
                    if (parsed.posButtonsTop !== undefined) setPosButtonsTop(parsed.posButtonsTop);
                    if (parsed.posWelcomeLeft !== undefined) setPosWelcomeLeft(parsed.posWelcomeLeft);
                    if (parsed.posWelcomeTop !== undefined) setPosWelcomeTop(parsed.posWelcomeTop);
                    if (parsed.posBannerLeft !== undefined) setPosBannerLeft(parsed.posBannerLeft);
                    if (parsed.posBannerTop !== undefined) setPosBannerTop(parsed.posBannerTop);
                    if (parsed.posDateLeft !== undefined) setPosDateLeft(parsed.posDateLeft);
                    if (parsed.posDateTop !== undefined) setPosDateTop(parsed.posDateTop);
                    if (parsed.landingWelcomeColor) setLandingWelcomeColor(parsed.landingWelcomeColor);
                    if (parsed.landingDateColor) setLandingDateColor(parsed.landingDateColor);
                    if (parsed.landingLogoSize !== undefined) setLandingLogoSize(parsed.landingLogoSize);
                    if (parsed.landingBannerSize !== undefined) setLandingBannerSize(parsed.landingBannerSize);
                    if (parsed.landingBtnSize) setLandingBtnSize(parsed.landingBtnSize);
                    if (parsed.showLandingLogo !== undefined) setShowLandingLogo(parsed.showLandingLogo);
                    if (parsed.showLandingWelcome !== undefined) setShowLandingWelcome(parsed.showLandingWelcome);
                    if (parsed.showLandingBanner !== undefined) setShowLandingBanner(parsed.showLandingBanner);
                    if (parsed.showLandingDate !== undefined) setShowLandingDate(parsed.showLandingDate);
                    if (parsed.showLandingButtons !== undefined) setShowLandingButtons(parsed.showLandingButtons);
                    if (parsed.landingWelcomeSize !== undefined) setLandingWelcomeSize(parsed.landingWelcomeSize);
                    if (parsed.landingDateSize !== undefined) setLandingDateSize(parsed.landingDateSize);
                    if (parsed.landingDescriptionText !== undefined) setLandingDescriptionText(parsed.landingDescriptionText);
                    if (parsed.landingDescriptionColor) setLandingDescriptionColor(parsed.landingDescriptionColor);
                    if (parsed.landingDescriptionSize !== undefined) setLandingDescriptionSize(parsed.landingDescriptionSize);
                    if (parsed.posDescriptionLeft !== undefined) setPosDescriptionLeft(parsed.posDescriptionLeft);
                    if (parsed.posDescriptionTop !== undefined) setPosDescriptionTop(parsed.posDescriptionTop);
                    if (parsed.showLandingDescription !== undefined) setShowLandingDescription(parsed.showLandingDescription);
                }
            } catch (err) {
                console.error('Failed to fetch registration fields config', err);
            }
        };
        fetchConfig();
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';

        if (!formData.password) newErrors.password = 'Password is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password
            });
            const emailKey = formData.email.toLowerCase().trim();
            let boothInfo = BOOTH_ADMINS[emailKey];

            if (!boothInfo) {
                // Check dynamic booth configurations (booth_1_layout, booth_2_layout, etc.)
                try {
                    for (let b = 1; b <= 20; b++) {
                        const confRes = await configService.getConfig(`booth_${b}_layout`);
                        if (confRes.data && confRes.data.value) {
                            const parsed = JSON.parse(confRes.data.value);
                            if (
                                parsed.boothAdminEmail &&
                                parsed.boothAdminEmail.toLowerCase().trim() === emailKey &&
                                parsed.boothAdminPassword === formData.password
                            ) {
                                boothInfo = {
                                    hallId: 'a',
                                    boothId: b,
                                    roomName: `Booth ${b}`
                                };
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error checking dynamic booth admin config', err);
                }
            }

            if (boothInfo) {
                sessionStorage.setItem('autoOpenChat', boothInfo.roomName);
                if (boothInfo.hallId === 'lobby') {
                    sessionStorage.setItem('redirectUrl', '/virtual-events-platform/app/dashboard/lobby');
                } else {
                    sessionStorage.setItem('redirectUrl', `/virtual-events-platform/app/dashboard/expo-hall/${boothInfo.hallId}/booth/${boothInfo.boothId}`);
                }
            }

            login(response.data.data.user, response.data.data.token);
            addToast('Login successful!', 'success');
            // Redirection is handled by AppRoutes/DashboardLayout now
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid credentials';
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (layoutStyle === 'landing') {
        const getShapeClass = (shape) => {
            if (shape === 'square') return 'rounded-none';
            if (shape === 'rounded') return 'rounded-xl';
            return 'rounded-full';
        };

        const getButtonPaddingAndFont = (size) => {
            if (size === 'small') return 'px-5 py-1.5 text-xs';
            if (size === 'large') return 'px-10 py-4 text-base';
            if (size === 'xlarge') return 'px-12 py-5 text-lg';
            return 'px-8 py-3 text-sm'; // medium
        };

        const buttonStyle = {
            backgroundColor: landingBtnBgColor,
            color: landingBtnTextColor,
            borderColor: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
        };

        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] overflow-hidden font-sans">
                {/* Responsive Canvas: Full screen on mobile, 16:9 aspect ratio on desktop */}
                <div
                    className="relative w-full min-h-screen md:min-h-0 md:aspect-video md:max-h-screen bg-cover bg-center shadow-2xl overflow-hidden"
                    style={bgImage ? { backgroundImage: `url(${bgImage})` } : { backgroundColor: '#1a1a1a' }}
                >
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/35 z-0" />

                    {/* Header Logo */}
                    {showLandingLogo && (
                        <div
                            className="absolute z-10 transition-all duration-300"
                            style={{ left: `${posLogoLeft}%`, top: `${posLogoTop}%` }}
                        >
                            {landingLogoImage ? (
                                <img src={landingLogoImage} alt="Logo" className="object-contain" style={{ height: `${landingLogoSize}px` }} />
                            ) : (
                                <span className="text-xl font-black text-white tracking-widest uppercase">VIRTUAL EVENT</span>
                            )}
                        </div>
                    )}

                    {/* Header Buttons */}
                    {showLandingButtons && (
                        <div
                            className="absolute z-10 flex gap-4 items-center transition-all duration-300"
                            style={{ right: `${posButtonsRight}%`, top: `${posButtonsTop}%` }}
                        >
                            <button
                                type="button"
                                onClick={() => setShowAgendaModal(true)}
                                style={buttonStyle}
                                className={`font-bold border-2 uppercase tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer ${getShapeClass(landingBtnShape)} ${getButtonPaddingAndFont(landingBtnSize)}`}
                            >
                                {landingBtnText1}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLoginModal(true)}
                                style={buttonStyle}
                                className={`font-bold border-2 uppercase tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer ${getShapeClass(landingBtnShape)} ${getButtonPaddingAndFont(landingBtnSize)}`}
                            >
                                {landingBtnText2}
                            </button>
                        </div>
                    )}

                    {/* Welcome Text */}
                    {showLandingWelcome && landingWelcomeText && (
                        <div
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-300"
                            style={{ left: `${posWelcomeLeft}%`, top: `${posWelcomeTop}%` }}
                        >
                            <h2
                                style={{ color: landingWelcomeColor, fontSize: `${landingWelcomeSize}px` }}
                                className="font-extrabold uppercase tracking-[0.25em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            >
                                {landingWelcomeText}
                            </h2>
                        </div>
                    )}

                    {/* Event Banner */}
                    {showLandingBanner && (
                        <div
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                            style={{ left: `${posBannerLeft}%`, top: `${posBannerTop}%` }}
                        >
                            {landingBannerImage ? (
                                <img
                                    src={landingBannerImage}
                                    alt="Event Banner"
                                    className="max-w-[85vw] md:max-w-2xl object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                                    style={{ height: `${landingBannerSize}px` }}
                                />
                            ) : (
                                <h1 className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] uppercase text-white">
                                    Event Title
                                </h1>
                            )}
                        </div>
                    )}

                    {/* Date/Time Text */}
                    {showLandingDate && landingDateText && (
                        <div
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                            style={{ left: `${posDateLeft}%`, top: `${posDateTop}%` }}
                        >
                            <p
                                style={{ color: landingDateColor, fontSize: `${landingDateSize}px` }}
                                className="font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/25 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-sm whitespace-nowrap"
                            >
                                {landingDateText}
                            </p>
                        </div>
                    )}

                    {/* Custom Description Text */}
                    {showLandingDescription && landingDescriptionText && (
                        <div
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-300"
                            style={{ left: `${posDescriptionLeft}%`, top: `${posDescriptionTop}%` }}
                        >
                            <p
                                style={{ color: landingDescriptionColor, fontSize: `${landingDescriptionSize}px` }}
                                className="font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap"
                            >
                                {landingDescriptionText}
                            </p>
                        </div>
                    )}

                    {/* Footer brand/copyright */}
                    <footer className="absolute bottom-2 left-0 right-0 z-10 text-center text-[10px] text-white/50 tracking-wider">
                        {/* Powered by VirtualEvent Platform */}
                    </footer>
                </div>

                {/* Login Modal Popup */}
                {showLoginModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
                        <div className="relative w-full max-w-md bg-[#295ce8] text-white rounded-2xl shadow-2xl p-8 animate-scale-up">
                            {/* Close button */}
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1"
                            >
                                <FiX className="w-6 h-6" />
                            </button>

                            <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
                                Welcome Back
                            </h1>
                            <p className="text-center text-blue-100 mb-8 text-sm font-light">
                                Enter your credentials to access your account
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                    {errors.email && <p className="text-red-200 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-200 text-xs mt-1">{errors.password}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-6 bg-white text-[#295ce8] px-6 py-2.5 rounded-md font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-70"
                                >
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>

                            <p className="text-center mt-6 text-sm text-blue-100">
                                Don't have an account?{' '}
                                <Link
                                    to="/virtual-events-platform/app/register"
                                    className="font-bold text-white hover:text-blue-200 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* Agenda Modal */}
                {showAgendaModal && agendaPdf && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative bg-[#f5f7fa] w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-scale-up">
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowAgendaModal(false)}
                                        className="text-gray-300 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full cursor-pointer"
                                    >
                                        <FiArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">Event Agenda</h2>
                                </div>
                                <button
                                    onClick={() => setShowAgendaModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            {/* Sub Header */}
                            <div className="flex-1 w-full bg-gray-905 flex flex-col">
                                <div className="bg-gray-800 text-white px-6 py-2.5 flex justify-between items-center text-xs border-b border-gray-700 shrink-0">
                                    <span className="font-semibold text-gray-300 truncate max-w-md">
                                        Document Preview: Event Agenda
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={agendaPdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            Open Full Page / Download
                                        </a>
                                    </div>
                                </div>
                                {/* Iframe View */}
                                <div className="flex-1 w-full relative bg-gray-950">
                                    <iframe
                                        src={`${agendaPdf}#zoom=page-width`}
                                        className="absolute inset-0 w-full h-full border-0 bg-white"
                                        title="Event Agenda"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (layoutStyle === 'split') {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-[#eef6f9] overflow-hidden">
                {/* Left side: Image Template */}
                <div
                    className="hidden md:block md:w-[60%] lg:w-[65%] h-screen bg-cover bg-center"
                    style={bgImage ? { backgroundImage: `url(${bgImage})` } : { backgroundColor: '#eef6f9' }}
                />

                {/* Right side: Login Form */}
                <div className="w-full md:w-[40%] lg:w-[35%] h-screen flex items-center justify-center p-6 bg-white overflow-y-auto">
                    <div className="w-full max-w-md bg-[#295ce8] text-white rounded-xl shadow-2xl p-8 relative">
                        <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
                            Welcome Back
                        </h1>
                        <p className="text-center text-blue-100 mb-8 text-sm font-light">
                            Enter your credentials to access your account
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                                {errors.email && <p className="text-red-200 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-200 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-white text-[#295ce8] px-6 py-2.5 rounded-md font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-70"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center mt-6 text-sm text-blue-100">
                            Don't have an account?{' '}
                            <Link to="/virtual-events-platform/app/register" className="font-bold text-white hover:text-blue-200 transition-colors">
                                Sign up
                            </Link>
                        </p>

                        {agendaPdf && (
                            <div className="mt-6 pt-6 border-t border-blue-400/30 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowAgendaModal(true)}
                                    className="text-xs font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-1.5 bg-blue-700/50 hover:bg-blue-700/80 px-4 py-2 rounded-lg"
                                >
                                    <FaFilePdf className="w-3.5 h-3.5" /> View Event Agenda
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {showAgendaModal && agendaPdf && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative bg-[#f5f7fa] w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-scale-up">
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowAgendaModal(false)}
                                        className="text-gray-300 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full cursor-pointer"
                                    >
                                        <FiArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">Event Agenda</h2>
                                </div>
                                <button
                                    onClick={() => setShowAgendaModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            {/* Sub Header */}
                            <div className="flex-1 w-full bg-gray-905 flex flex-col">
                                <div className="bg-gray-800 text-white px-6 py-2.5 flex justify-between items-center text-xs border-b border-gray-700 shrink-0">
                                    <span className="font-semibold text-gray-300 truncate max-w-md">
                                        Document Preview: Event Agenda
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={agendaPdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            Open Full Page / Download
                                        </a>
                                    </div>
                                </div>
                                {/* Iframe View */}
                                <div className="flex-1 w-full relative bg-gray-950">
                                    <iframe
                                        src={`${agendaPdf}#zoom=page-width`}
                                        className="absolute inset-0 w-full h-full border-0 bg-white"
                                        title="Event Agenda"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-white relative flex flex-col items-center justify-center py-10 px-4 font-sans overflow-x-hidden"
            style={bgImage ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            } : {}}
        >
            {!bgImage && <div className="absolute top-0 left-0 w-full h-[70vh] bg-[#eef6f9] rounded-b-[40%] scale-150 transform -translate-y-1/4 -z-10"></div>}

            <div className="w-full max-w-md bg-[#295ce8] text-white rounded-xl shadow-2xl p-8 relative z-10">
                <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
                    Welcome Back
                </h1>
                <p className="text-center text-blue-100 mb-8 text-sm font-light">
                    Enter your credentials to access your account
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        {errors.email && <p className="text-red-200 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-200 text-xs mt-1">{errors.password}</p>}
                    </div>



                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-white text-[#295ce8] px-6 py-2.5 rounded-md font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-blue-100">
                    Don't have an account?{' '}
                    <Link to="/virtual-events-platform/app/register" className="font-bold text-white hover:text-blue-200 transition-colors">
                        Sign up
                    </Link>
                </p>

                {agendaPdf && (
                    <div className="mt-6 pt-6 border-t border-blue-400/30 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setShowAgendaModal(true)}
                            className="text-xs font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-1.5 bg-blue-700/50 hover:bg-blue-700/80 px-4 py-2 rounded-lg"
                        >
                            <FaFilePdf className="w-3.5 h-3.5" /> View Event Agenda
                        </button>
                    </div>
                )}
            </div>

            {showAgendaModal && agendaPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative bg-[#f5f7fa] w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-scale-up">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowAgendaModal(false)}
                                    className="text-gray-300 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full cursor-pointer"
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">Event Agenda</h2>
                            </div>
                            <button
                                onClick={() => setShowAgendaModal(false)}
                                className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Sub Header */}
                        <div className="flex-1 w-full bg-gray-905 flex flex-col">
                            <div className="bg-gray-800 text-white px-6 py-2.5 flex justify-between items-center text-xs border-b border-gray-700 shrink-0">
                                <span className="font-semibold text-gray-300 truncate max-w-md">
                                    Document Preview: Event Agenda
                                </span>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={agendaPdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        Open Full Page / Download
                                    </a>
                                </div>
                            </div>
                            {/* Iframe View */}
                            <div className="flex-1 w-full relative bg-gray-950">
                                <iframe
                                    src={`${agendaPdf}#zoom=page-width`}
                                    className="absolute inset-0 w-full h-full border-0 bg-white"
                                    title="Event Agenda"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
