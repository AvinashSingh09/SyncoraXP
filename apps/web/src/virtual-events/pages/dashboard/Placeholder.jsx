import React from 'react';

const Placeholder = ({ title }) => {
    return (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-800">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-gray-500">This view is currently under construction.</p>
        </div>
    );
};

export default Placeholder;
