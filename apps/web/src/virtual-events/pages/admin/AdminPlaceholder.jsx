import React from 'react';
import { FiSettings } from 'react-icons/fi';

const AdminPlaceholder = ({ title }) => {
    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <FiSettings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">{title} Settings</h2>
                    <p className="text-sm text-gray-500">Configure parameters for this environment</p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-gray-400 italic text-sm">
                <p>Settings for {title} coming soon.</p>
                <p className="text-sm mt-2">Currently configuring Auditorium, Lounge, and Round Tables settings.</p>
            </div>
        </div>
    );
};

export default AdminPlaceholder;
