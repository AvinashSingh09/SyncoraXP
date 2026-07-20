import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Toast = ({ message, type, onClose }) => {
    const icons = {
        success: <FiCheckCircle className="w-5 h-5 text-green-500" />,
        error: <FiAlertCircle className="w-5 h-5 text-red-500" />,
        info: <FiInfo className="w-5 h-5 text-blue-500" />
    };

    const baseStyles = "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg glass animate-slide-up transition-all";
    const typeStyles = {
        success: "border-green-500/30",
        error: "border-red-500/30",
        info: "border-blue-500/30"
    };

    return (
        <div className={twMerge(clsx(baseStyles, typeStyles[type]))}>
            {icons[type]}
            <p className="text-sm font-medium">{message}</p>
            <button 
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <FiX className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
