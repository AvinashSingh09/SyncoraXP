import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ label, error, type = 'text', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={ref}
                    type={inputType}
                    className={twMerge(clsx(
                        "w-full px-4 py-2 rounded-lg border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                        "focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200",
                        "dark:text-white dark:border-gray-600 dark:placeholder-gray-400",
                        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
                        className
                    ))}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 animate-fade-in">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
