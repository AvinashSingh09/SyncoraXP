const PasswordStrength = ({ password }) => {
    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return { score: 0, text: '', color: 'bg-gray-200 dark:bg-gray-700' };

        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, text: 'Good', color: 'bg-yellow-500' };
        return { score, text: 'Strong', color: 'bg-green-500' };
    };

    const { score, text, color } = calculateStrength(password);

    return (
        <div className="flex flex-col gap-1 w-full mt-1">
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                            score >= level ? color : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                ))}
            </div>
            {text && (
                <p className={`text-xs font-medium text-right ${
                    score <= 2 ? 'text-red-500' : score <= 4 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                    {text}
                </p>
            )}
        </div>
    );
};

export default PasswordStrength;
