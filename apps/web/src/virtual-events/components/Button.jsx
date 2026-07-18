import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, loading, variant = 'primary', className, ...props }) => {
    const baseStyles = "relative flex justify-center items-center py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-primary text-white hover:bg-blue-600 shadow-md hover:shadow-lg active:transform active:scale-95",
        outline: "border-2 border-primary text-primary hover:bg-primary/10",
        ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    };

    return (
        <button 
            className={twMerge(clsx(baseStyles, variants[variant], className))} 
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            ) : null}
            <span className={clsx(loading && 'opacity-0')}>
                {children}
            </span>
        </button>
    );
};

export default Button;
