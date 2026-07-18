import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import { BOOTH_ADMINS } from '../config/boothAdmins';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
            if (BOOTH_ADMINS[emailKey]) {
                const boothInfo = BOOTH_ADMINS[emailKey];
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

    return (
        <div className="min-h-screen bg-white relative flex flex-col items-center justify-center py-10 px-4 font-sans overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-[70vh] bg-[#eef6f9] rounded-b-[40%] scale-150 transform -translate-y-1/4 -z-10"></div>
            
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
            </div>
        </div>
    );
};

export default Login;
