import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import PasswordStrength from '../components/PasswordStrength';
import { useToast } from '../context/ToastContext';
import { authService, configService } from '../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        designation: '',
        company: '',
        email: '',
        mobileNumber: '',
        country: '',
        state: '',
        city: '',
        utmSource: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [enabledFields, setEnabledFields] = useState({
        firstName: true,
        lastName: true,
        designation: true,
        company: true,
        email: true,
        mobileNumber: true,
        country: true,
        state: true,
        city: true,
        utmSource: true,
        password: true
    });
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await configService.getConfig('registerFields');
                if (res.data && res.data.value) {
                    const parsed = JSON.parse(res.data.value);
                    const { customFields: fetchedCustomFields, ...standardFields } = parsed;
                    setEnabledFields({
                        ...standardFields,
                        email: true,
                        password: true
                    });
                    if (Array.isArray(fetchedCustomFields)) {
                        setCustomFields(fetchedCustomFields);
                        const initialCustomValues = {};
                        fetchedCustomFields.forEach(f => {
                            initialCustomValues[f.key] = '';
                        });
                        setFormData(prev => ({
                            ...prev,
                            ...initialCustomValues
                        }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch registration fields config', err);
            }
        };
        fetchConfig();
    }, []);

    const validate = () => {
        const newErrors = {};
        
        if (enabledFields.firstName !== false && !formData.firstName) newErrors.firstName = 'First name is required';
        if (enabledFields.lastName !== false && !formData.lastName) newErrors.lastName = 'Last name is required';
        if (enabledFields.designation !== false && !formData.designation) newErrors.designation = 'Designation is required';
        if (enabledFields.company !== false && !formData.company) newErrors.company = 'Company is required';
        if (enabledFields.mobileNumber !== false && !formData.mobileNumber) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (formData.mobileNumber) {
            if (!/^\d{10}$/.test(formData.mobileNumber)) {
                newErrors.mobileNumber = 'Mobile number must be exactly 10 digits and numeric only';
            }
        }
        if (enabledFields.country !== false && !formData.country) newErrors.country = 'Country is required';
        if (enabledFields.state !== false && !formData.state) newErrors.state = 'State is required';
        if (enabledFields.city !== false && !formData.city) newErrors.city = 'City is required';

        if (enabledFields.email !== false) {
            if (!formData.email) newErrors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
        }

        // Validate custom fields
        customFields.forEach(field => {
            if (field.required && !formData[field.key]) {
                newErrors[field.key] = `${field.label} is required`;
            }
        });

        if (enabledFields.password !== false) {
            if (!formData.password) newErrors.password = 'Password is required';
            else if (formData.password.length < 8) newErrors.password = 'Min 8 characters required';
            else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password)) {
                newErrors.password = 'Must contain uppercase, lowercase, number, and special character';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords must match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        // Construct dynamic custom fields payload
        const payloadCustomFields = {};
        customFields.forEach(field => {
            payloadCustomFields[field.key] = formData[field.key];
        });

        setLoading(true);
        try {
            await authService.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                designation: formData.designation,
                company: formData.company,
                email: formData.email,
                mobileNumber: formData.mobileNumber,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                utmSource: formData.utmSource,
                password: formData.password,
                customFields: payloadCustomFields
            });
            addToast('Registration successful! Please login.', 'success');
            navigate('/virtual-events-platform/app/login');
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed';
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = Object.keys(errors).length === 0 && (
        (enabledFields.firstName !== false ? Boolean(formData.firstName) : true) &&
        (enabledFields.lastName !== false ? Boolean(formData.lastName) : true) &&
        (enabledFields.designation !== false ? Boolean(formData.designation) : true) &&
        (enabledFields.company !== false ? Boolean(formData.company) : true) &&
        (enabledFields.email !== false ? Boolean(formData.email) : true) &&
        (enabledFields.mobileNumber !== false ? Boolean(formData.mobileNumber) : true) &&
        (enabledFields.country !== false ? Boolean(formData.country) : true) &&
        (enabledFields.state !== false ? Boolean(formData.state) : true) &&
        (enabledFields.city !== false ? Boolean(formData.city) : true) &&
        (enabledFields.password !== false ? (Boolean(formData.password) && Boolean(formData.confirmPassword)) : true) &&
        customFields.every(field => field.required ? Boolean(formData[field.key]) : true)
    );

    return (
        <div className="min-h-screen bg-white relative flex flex-col items-center justify-center py-10 px-4 font-sans overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-[70vh] bg-[#eef6f9] rounded-b-[40%] scale-150 transform -translate-y-1/4 -z-10"></div>
            
            <div className="w-full max-w-md bg-[#295ce8] text-white rounded-xl shadow-2xl p-8 relative z-10">
                <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
                    Create Account
                </h1>
                <p className="text-center text-blue-100 mb-8 text-sm font-light">
                    Join us today for an amazing experience
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {enabledFields.firstName !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.firstName && <p className="text-red-200 text-xs mt-1">{errors.firstName}</p>}
                        </div>
                    )}

                    {enabledFields.lastName !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input 
                                type="text" 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.lastName && <p className="text-red-200 text-xs mt-1">{errors.lastName}</p>}
                        </div>
                    )}

                    {enabledFields.designation !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Designation</label>
                            <input 
                                type="text" 
                                name="designation" 
                                value={formData.designation} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.designation && <p className="text-red-200 text-xs mt-1">{errors.designation}</p>}
                        </div>
                    )}

                    {enabledFields.company !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Company</label>
                            <input 
                                type="text" 
                                name="company" 
                                value={formData.company} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.company && <p className="text-red-200 text-xs mt-1">{errors.company}</p>}
                        </div>
                    )}
                    
                    {enabledFields.email !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.email && <p className="text-red-200 text-xs mt-1">{errors.email}</p>}
                        </div>
                    )}

                    {enabledFields.mobileNumber !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Mobile Number</label>
                            <input 
                                type="text" 
                                name="mobileNumber" 
                                value={formData.mobileNumber} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.mobileNumber && <p className="text-red-200 text-xs mt-1">{errors.mobileNumber}</p>}
                        </div>
                    )}

                    {enabledFields.country !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Country</label>
                            <input 
                                type="text" 
                                name="country" 
                                value={formData.country} 
                                onChange={handleChange} 
                                placeholder="Country"
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                            {errors.country && <p className="text-red-200 text-xs mt-1">{errors.country}</p>}
                        </div>
                    )}

                    {(enabledFields.state !== false || enabledFields.city !== false) && (
                        <div className="flex gap-4">
                            {enabledFields.state !== false && (
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">State</label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={formData.state} 
                                        onChange={handleChange} 
                                        placeholder="State"
                                        className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                    />
                                    {errors.state && <p className="text-red-200 text-xs mt-1">{errors.state}</p>}
                                </div>
                            )}
                            {enabledFields.city !== false && (
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">City</label>
                                    <input 
                                        type="text" 
                                        name="city" 
                                        value={formData.city} 
                                        onChange={handleChange} 
                                        placeholder="City"
                                        className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                    />
                                    {errors.city && <p className="text-red-200 text-xs mt-1">{errors.city}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {enabledFields.utmSource !== false && (
                        <div>
                            <label className="block text-sm font-medium mb-1">UTM Source</label>
                            <input 
                                type="text" 
                                name="utmSource" 
                                value={formData.utmSource} 
                                onChange={handleChange} 
                                placeholder="Choose UTM"
                                className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                            />
                        </div>
                    )}

                    {/* Render Custom Fields */}
                    {customFields.map((field) => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium mb-1">
                                {field.label} {field.required && <span className="text-red-200 ml-0.5">*</span>}
                            </label>
                            {field.type === 'select' ? (
                                <select
                                    name={field.key}
                                    value={formData[field.key] || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-md bg-white border-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="">Select option</option>
                                    {field.options.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    type={field.type} 
                                    name={field.key} 
                                    value={formData[field.key] || ''} 
                                    onChange={handleChange} 
                                    placeholder={field.label}
                                    className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                                />
                            )}
                            {errors[field.key] && <p className="text-red-200 text-xs mt-1">{errors[field.key]}</p>}
                        </div>
                    ))}

                    {enabledFields.password !== false && (
                        <>
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
                                <div className="mt-2"><PasswordStrength password={formData.password} /></div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 rounded-md bg-white border-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10" 
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-200 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-6 bg-white text-[#295ce8] px-6 py-2.5 rounded-md font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-blue-100">
                    Already have an account?{' '}
                    <Link to="/virtual-events-platform/app/login" className="font-bold text-white hover:text-blue-200 transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
