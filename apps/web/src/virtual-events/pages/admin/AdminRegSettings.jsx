import React, { useState, useEffect } from 'react';
import { configService } from '../../services/api';
import { MdSettings, MdAdd, MdDelete } from 'react-icons/md';
import { FiInfo } from 'react-icons/fi';

const AdminRegSettings = () => {
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
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const [newFieldOptions, setNewFieldOptions] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error' | 'warning', text }

    // Helper to display message and auto-clear it
    const showStatusMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage(null);
        }, 5000);
    };

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
                        password: true,
                        firstName: true,
                        lastName: true
                    });
                    if (Array.isArray(fetchedCustomFields)) {
                        setCustomFields(fetchedCustomFields);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch registration fields config', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleFieldToggle = (field) => {
        setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleAddCustomField = () => {
        if (!newFieldLabel.trim()) return;
        if (newFieldType === 'select' && !newFieldOptions.trim()) {
            showStatusMessage('error', 'Dropdown/Select type requires comma-separated options.');
            return;
        }
        
        // Generate key using simple slug or timestamp
        const fieldKey = 'custom_' + newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        
        const newField = {
            key: fieldKey,
            label: newFieldLabel.trim(),
            type: newFieldType,
            required: newFieldRequired,
            options: newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : []
        };
        
        setCustomFields(prev => [...prev, newField]);
        setNewFieldLabel('');
        setNewFieldType('text');
        setNewFieldRequired(false);
        setNewFieldOptions('');
        showStatusMessage('success', 'Custom field added to list.');
    };

    const handleRemoveCustomField = (keyToRemove) => {
        setCustomFields(prev => prev.filter(f => f.key !== keyToRemove));
        showStatusMessage('warning', 'Custom field removed from list.');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const configToSave = {
                ...enabledFields,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                customFields
            };
            await configService.setConfig('registerFields', JSON.stringify(configToSave));
            showStatusMessage('success', 'Registration settings saved successfully!');
        } catch (err) {
            console.error('Failed to save registration fields config', err);
            showStatusMessage('error', 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 border border-gray-150 z-10 animate-fade-in text-gray-800 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <MdSettings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-800">Registration Settings</h2>
                        <p className="text-xs text-gray-500">Configure which fields are visible on the public registration page. <span className="text-red-600 font-semibold">(Email and Password are mandatory)</span></p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : message.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <FiInfo className="w-4 h-4 shrink-0" />
                    <span>{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-semibold">Loading registration settings...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.keys(enabledFields).map((key) => (
                            <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors shadow-sm bg-white">
                                <input 
                                    type="checkbox" 
                                    checked={['email', 'password', 'firstName', 'lastName'].includes(key) ? true : enabledFields[key]}
                                    disabled={['email', 'password', 'firstName', 'lastName'].includes(key)}
                                    onChange={() => handleFieldToggle(key)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                                <span className="text-xs font-bold text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                    {['email', 'password', 'firstName', 'lastName'].includes(key) && <span className="text-red-500 ml-1">*</span>}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Custom Fields Section */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Custom Fields</h3>
                            <p className="text-[11px] text-gray-500">Add dynamic fields to collect additional attendee information.</p>
                        </div>

                        {/* List of Custom Fields */}
                        {customFields.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {customFields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between p-3 bg-[#f8fafc] border border-gray-250 rounded-xl shadow-sm">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-gray-800 truncate">
                                                {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                                            </span>
                                            <span className="text-[10px] text-gray-400 capitalize font-semibold">
                                                Type: {field.type} {field.type === 'select' && `(${field.options.join(', ')})`}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomField(field.key)}
                                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg hover:text-red-700 transition-colors cursor-pointer shrink-0"
                                            title="Delete Field"
                                        >
                                            <MdDelete className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Custom Field Form */}
                        <div className="bg-[#f8fafc]/50 border border-dashed border-gray-300 p-4 rounded-2xl flex flex-col md:flex-row items-end gap-3.5 mt-1">
                            <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Field Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. LinkedIn Profile URL"
                                    value={newFieldLabel}
                                    onChange={(e) => setNewFieldLabel(e.target.value)}
                                    className="bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 w-full"
                                />
                            </div>

                            <div className="w-full md:w-1/4 flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Field Type</label>
                                <select
                                    value={newFieldType}
                                    onChange={(e) => setNewFieldType(e.target.value)}
                                    className="bg-white border border-gray-250 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 w-full"
                                >
                                    <option value="text">Text Input</option>
                                    <option value="number">Number Input</option>
                                    <option value="select">Dropdown/Select List</option>
                                </select>
                            </div>

                            {newFieldType === 'select' && (
                                <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dropdown Options (Comma-separated)</label>
                                    <input
                                        type="text"
                                        placeholder="Option 1, Option 2, Option 3"
                                        value={newFieldOptions}
                                        onChange={(e) => setNewFieldOptions(e.target.value)}
                                        className="bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 w-full"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 py-2.5">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newFieldRequired}
                                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-gray-655">Required</span>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddCustomField}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer w-full md:w-auto justify-center"
                            >
                                <MdAdd className="w-4.5 h-4.5" /> Add Field
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-70 cursor-pointer"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRegSettings;
