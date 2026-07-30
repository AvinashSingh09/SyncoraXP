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
    const [selectedElement, setSelectedElement] = useState('logo');
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
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setSaving(true);
            showStatusMessage('warning', 'Uploading agenda PDF...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setAgendaPdf(response.data.url);
                    showStatusMessage('success', 'Agenda PDF uploaded successfully!');
                }
            } catch (err) {
                console.error('Upload failed', err);
                showStatusMessage('error', 'Agenda PDF upload failed. Try again.');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleBgImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setSaving(true);
            showStatusMessage('warning', 'Uploading background image...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setBgImage(response.data.url);
                    showStatusMessage('success', 'Background image uploaded successfully!');
                }
            } catch (err) {
                console.error('Upload failed', err);
                showStatusMessage('error', 'Background image upload failed. Try again.');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLandingBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setSaving(true);
            showStatusMessage('warning', 'Uploading event banner...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLandingBannerImage(response.data.url);
                    showStatusMessage('success', 'Event banner uploaded successfully!');
                }
            } catch (err) {
                console.error('Upload failed', err);
                showStatusMessage('error', 'Event banner upload failed. Try again.');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLandingLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setSaving(true);
            showStatusMessage('warning', 'Uploading header logo...');
            try {
                const response = await configService.uploadImage(base64Data);
                if (response.data && response.data.success) {
                    setLandingLogoImage(response.data.url);
                    showStatusMessage('success', 'Header logo uploaded successfully!');
                }
            } catch (err) {
                console.error('Upload failed', err);
                showStatusMessage('error', 'Header logo upload failed. Try again.');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

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
                customFields,
                bgImage,
                agendaPdf,
                layoutStyle,
                landingWelcomeText,
                landingBannerImage,
                landingDateText,
                landingLogoImage,
                landingBtnText1,
                landingBtnText2,
                landingBtnBgColor,
                landingBtnTextColor,
                landingBtnShape,
                posLogoLeft,
                posLogoTop,
                posButtonsRight,
                posButtonsTop,
                posWelcomeLeft,
                posWelcomeTop,
                posBannerLeft,
                posBannerTop,
                posDateLeft,
                posDateTop,
                landingWelcomeColor,
                landingDateColor,
                landingLogoSize,
                landingBannerSize,
                landingBtnSize,
                showLandingLogo,
                showLandingWelcome,
                showLandingBanner,
                showLandingDate,
                showLandingButtons,
                landingWelcomeSize,
                landingDateSize,
                landingDescriptionText,
                landingDescriptionColor,
                landingDescriptionSize,
                posDescriptionLeft,
                posDescriptionTop,
                showLandingDescription
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

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Background Settings Section */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Registration Page Background</h3>
                            <p className="text-[11px] text-gray-500">Change the background image of the registration/login page.</p>
                        </div>
                        <div className="flex gap-2.5 items-center">
                            <input
                                type="text"
                                value={bgImage}
                                onChange={(e) => setBgImage(e.target.value)}
                                className="flex-1 bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800"
                                placeholder="https://example.com/background.jpg"
                            />
                            <div className="relative">
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBgImageUpload}
                                    className="hidden"
                                    id="reg-bg-upload"
                                />
                                <label 
                                    htmlFor="reg-bg-upload"
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload Image
                                </label>
                            </div>
                            {bgImage && (
                                <button
                                    type="button"
                                    onClick={() => setBgImage('')}
                                    className="text-red-500 hover:text-red-750 font-bold text-xs p-2.5"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Agenda PDF Section */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Event Agenda PDF</h3>
                            <p className="text-[11px] text-gray-500">Provide a PDF link or upload a PDF file for the event agenda.</p>
                        </div>
                        <div className="flex gap-2.5 items-center">
                            <input
                                type="text"
                                value={agendaPdf}
                                onChange={(e) => setAgendaPdf(e.target.value)}
                                className="flex-1 bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800"
                                placeholder="https://example.com/agenda.pdf"
                            />
                            <div className="relative">
                                <input 
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handlePdfUpload}
                                    className="hidden"
                                    id="reg-agenda-upload"
                                />
                                <label 
                                    htmlFor="reg-agenda-upload"
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer block text-center whitespace-nowrap"
                                >
                                    Upload PDF
                                </label>
                            </div>
                            {agendaPdf && (
                                <button
                                    type="button"
                                    onClick={() => setAgendaPdf('')}
                                    className="text-red-500 hover:text-red-750 font-bold text-xs p-2.5"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Layout Style Section */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Page Layout Style</h3>
                            <p className="text-[11px] text-gray-500">Choose how the login and registration page layout should look.</p>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center space-x-2.5 p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors shadow-sm bg-white flex-1">
                                <input
                                    type="radio"
                                    name="layoutStyle"
                                    value="card"
                                    checked={layoutStyle === 'card'}
                                    onChange={(e) => setLayoutStyle(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-xs font-bold text-gray-700">Centered Card</span>
                            </label>
                            <label className="flex items-center space-x-2.5 p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors shadow-sm bg-white flex-1">
                                <input
                                    type="radio"
                                    name="layoutStyle"
                                    value="split"
                                    checked={layoutStyle === 'split'}
                                    onChange={(e) => setLayoutStyle(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-xs font-bold text-gray-700">Split Screen (Left: Image, Right: Form)</span>
                            </label>
                            <label className="flex items-center space-x-2.5 p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors shadow-sm bg-white flex-1">
                                <input
                                    type="radio"
                                    name="layoutStyle"
                                    value="landing"
                                    checked={layoutStyle === 'landing'}
                                    onChange={(e) => setLayoutStyle(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-xs font-bold text-gray-700">Splash Landing Page (Custom Buttons & Banner)</span>
                            </label>
                        </div>
                    </div>

                    {/* Landing Page Customizer Box */}
                    {layoutStyle === 'landing' && (
                        <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col gap-4">
                            {/* Visibility Checklist */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-2">Visible Elements Checklist</label>
                                <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-gray-200">
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingLogo} onChange={(e) => setShowLandingLogo(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Header Logo
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingWelcome} onChange={(e) => setShowLandingWelcome(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Welcome Text
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingBanner} onChange={(e) => setShowLandingBanner(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Event Logo/Banner
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingDate} onChange={(e) => setShowLandingDate(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Date Subtitle
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingButtons} onChange={(e) => setShowLandingButtons(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Header Buttons
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={showLandingDescription} onChange={(e) => setShowLandingDescription(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        Custom Text
                                    </label>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Landing Page Customization</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Header Logo */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Top Header Logo</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={landingLogoImage}
                                            onChange={(e) => setLandingLogoImage(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            placeholder="Header logo URL"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLandingLogoUpload}
                                            className="hidden"
                                            id="landing-logo-upload"
                                        />
                                        <label
                                            htmlFor="landing-logo-upload"
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer block text-center whitespace-nowrap"
                                        >
                                            Upload Logo
                                        </label>
                                        {landingLogoImage && (
                                            <button
                                                type="button"
                                                onClick={() => setLandingLogoImage('')}
                                                className="text-red-500 hover:text-red-750 font-bold text-xs p-2.5"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Event Banner/Logo */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Center Event Logo/Banner</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={landingBannerImage}
                                            onChange={(e) => setLandingBannerImage(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            placeholder="Event banner logo URL"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLandingBannerUpload}
                                            className="hidden"
                                            id="landing-banner-upload"
                                        />
                                        <label
                                            htmlFor="landing-banner-upload"
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer block text-center whitespace-nowrap"
                                        >
                                            Upload Banner
                                        </label>
                                        {landingBannerImage && (
                                            <button
                                                type="button"
                                                onClick={() => setLandingBannerImage('')}
                                                className="text-red-500 hover:text-red-750 font-bold text-xs p-2.5"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Welcome Text */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Welcome Text (above main logo)</label>
                                    <input
                                        type="text"
                                        value={landingWelcomeText}
                                        onChange={(e) => setLandingWelcomeText(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. WELCOME TO"
                                    />
                                </div>

                                {/* Event Subtitle/Date Text */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Event Subtitle/Date Text</label>
                                    <input
                                        type="text"
                                        value={landingDateText}
                                        onChange={(e) => setLandingDateText(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. 10th Jan 2027"
                                    />
                                </div>

                                {/* Custom Text */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Custom Text (Additional Info)</label>
                                    <input
                                        type="text"
                                        value={landingDescriptionText}
                                        onChange={(e) => setLandingDescriptionText(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. Join us live for the keynote sessions"
                                    />
                                </div>

                                {/* Button 1 Text */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button 1 Text (Event Agenda/Flow)</label>
                                    <input
                                        type="text"
                                        value={landingBtnText1}
                                        onChange={(e) => setLandingBtnText1(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. EVENT FLOW"
                                    />
                                </div>

                                {/* Button 2 Text */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button 2 Text (Login/Register)</label>
                                    <input
                                        type="text"
                                        value={landingBtnText2}
                                        onChange={(e) => setLandingBtnText2(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. LOGIN"
                                    />
                                </div>

                                {/* Button Background Color */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button Background Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={landingBtnBgColor}
                                            onChange={(e) => setLandingBtnBgColor(e.target.value)}
                                            className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={landingBtnBgColor}
                                            onChange={(e) => setLandingBtnBgColor(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="#e60000"
                                        />
                                    </div>
                                </div>

                                {/* Button Text Color */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button Text Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={landingBtnTextColor}
                                            onChange={(e) => setLandingBtnTextColor(e.target.value)}
                                            className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={landingBtnTextColor}
                                            onChange={(e) => setLandingBtnTextColor(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>

                                {/* Button Shape */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button Shape</label>
                                    <select
                                        value={landingBtnShape}
                                        onChange={(e) => setLandingBtnShape(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="square">Square</option>
                                        <option value="rounded">Rounded</option>
                                        <option value="pill">Pill (Capsule)</option>
                                    </select>
                                </div>

                                {/* Button Size Scale */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Button Size</label>
                                    <select
                                        value={landingBtnSize}
                                        onChange={(e) => setLandingBtnSize(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium (Standard)</option>
                                        <option value="large">Large</option>
                                        <option value="xlarge">Extra Large</option>
                                    </select>
                                </div>

                                {/* Welcome Text Color */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Welcome Text Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={landingWelcomeColor}
                                            onChange={(e) => setLandingWelcomeColor(e.target.value)}
                                            className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={landingWelcomeColor}
                                            onChange={(e) => setLandingWelcomeColor(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>

                                {/* Date/Time Subtitle Text Color */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Date Subtitle Text Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={landingDateColor}
                                            onChange={(e) => setLandingDateColor(e.target.value)}
                                            className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={landingDateColor}
                                            onChange={(e) => setLandingDateColor(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>

                                {/* Custom Text Color */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Custom Text Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={landingDescriptionColor}
                                            onChange={(e) => setLandingDescriptionColor(e.target.value)}
                                            className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={landingDescriptionColor}
                                            onChange={(e) => setLandingDescriptionColor(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>

                                {/* Header Logo Height Sizing */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-700">Header Logo Height (px)</span>
                                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">{landingLogoSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="150"
                                        value={landingLogoSize}
                                        onChange={(e) => setLandingLogoSize(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                                    />
                                </div>

                                {/* Main Banner Image Height Sizing */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-700">Main Banner height (px)</span>
                                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">{landingBannerSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="400"
                                        value={landingBannerSize}
                                        onChange={(e) => setLandingBannerSize(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual Placement Editor (Point Mapping) */}
                    {layoutStyle === 'landing' && (
                        <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Visual Element Position Mapping</h4>
                                <p className="text-[11px] text-gray-500">Drag sliders or click on the preview image to visually position elements on the background.</p>
                            </div>

                            {/* Clickable Map Preview */}
                            <div 
                                className="relative w-full aspect-video max-w-4xl mx-auto border border-gray-300 rounded-2xl overflow-hidden bg-cover bg-center select-none cursor-crosshair shadow-inner"
                                style={bgImage ? { backgroundImage: `url(${bgImage})` } : { backgroundColor: '#1a1a1a' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(1));
                                    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(1));
                                    
                                    if (selectedElement === 'logo') {
                                        setPosLogoLeft(x);
                                        setPosLogoTop(y);
                                    } else if (selectedElement === 'buttons') {
                                        setPosButtonsRight(parseFloat((100 - x).toFixed(1)));
                                        setPosButtonsTop(y);
                                    } else if (selectedElement === 'welcome') {
                                        setPosWelcomeLeft(x);
                                        setPosWelcomeTop(y);
                                    } else if (selectedElement === 'banner') {
                                        setPosBannerLeft(x);
                                        setPosBannerTop(y);
                                    } else if (selectedElement === 'date') {
                                        setPosDateLeft(x);
                                        setPosDateTop(y);
                                    } else if (selectedElement === 'description') {
                                        setPosDescriptionLeft(x);
                                        setPosDescriptionTop(y);
                                    }
                                    showStatusMessage('success', `Positioned ${selectedElement} to X: ${x}%, Y: ${y}%`);
                                }}
                            >
                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-black/20" />

                                {/* Header Logo Overlay */}
                                {showLandingLogo && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border ${selectedElement === 'logo' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ left: `${posLogoLeft}%`, top: `${posLogoTop}%` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('logo'); }}
                                    >
                                        {landingLogoImage ? (
                                            <img src={landingLogoImage} alt="Logo" className="object-contain" style={{ height: `${landingLogoSize / 2.5}px` }} />
                                        ) : (
                                            <span className="text-[9px] font-black text-white bg-black/50 px-1 py-0.5 rounded">LOGO</span>
                                        )}
                                    </div>
                                )}

                                {/* Buttons Overlay */}
                                {showLandingButtons && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border flex gap-1 ${selectedElement === 'buttons' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ right: `${posButtonsRight}%`, top: `${posButtonsTop}%` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('buttons'); }}
                                    >
                                        <span 
                                            style={{ backgroundColor: landingBtnBgColor, color: landingBtnTextColor }}
                                            className={`text-[8px] px-2 py-1 uppercase tracking-wider font-bold ${landingBtnShape === 'square' ? 'rounded-none' : landingBtnShape === 'rounded' ? 'rounded-md' : 'rounded-full'}`}
                                        >
                                            {landingBtnText1}
                                        </span>
                                        <span 
                                            style={{ backgroundColor: landingBtnBgColor, color: landingBtnTextColor }}
                                            className={`text-[8px] px-2 py-1 uppercase tracking-wider font-bold ${landingBtnShape === 'square' ? 'rounded-none' : landingBtnShape === 'rounded' ? 'rounded-md' : 'rounded-full'}`}
                                        >
                                            {landingBtnText2}
                                        </span>
                                    </div>
                                )}

                                {/* Welcome Text Overlay */}
                                {showLandingWelcome && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border -translate-x-1/2 -translate-y-1/2 text-center ${selectedElement === 'welcome' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ left: `${posWelcomeLeft}%`, top: `${posWelcomeTop}%`, color: landingWelcomeColor, fontSize: `${landingWelcomeSize / 2.5}px` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('welcome'); }}
                                    >
                                        <span className="font-bold tracking-widest drop-shadow">{landingWelcomeText}</span>
                                    </div>
                                )}

                                {/* Banner Overlay */}
                                {showLandingBanner && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border -translate-x-1/2 -translate-y-1/2 ${selectedElement === 'banner' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ left: `${posBannerLeft}%`, top: `${posBannerTop}%` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('banner'); }}
                                    >
                                        {landingBannerImage ? (
                                            <img src={landingBannerImage} alt="Banner" className="object-contain drop-shadow" style={{ height: `${landingBannerSize / 2.5}px` }} />
                                        ) : (
                                            <span className="text-xs font-black text-white bg-black/50 px-2 py-1 rounded uppercase">EVENT BANNER</span>
                                        )}
                                    </div>
                                )}

                                {/* Date Overlay */}
                                {showLandingDate && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border -translate-x-1/2 -translate-y-1/2 ${selectedElement === 'date' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ left: `${posDateLeft}%`, top: `${posDateTop}%`, color: landingDateColor, fontSize: `${landingDateSize / 2.5}px` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('date'); }}
                                    >
                                        <span className="font-bold bg-black/40 px-2 py-1 rounded-full border border-white/10">{landingDateText}</span>
                                    </div>
                                )}

                                {/* Custom Text Overlay */}
                                {showLandingDescription && (
                                    <div 
                                        className={`absolute cursor-pointer p-1 rounded border -translate-x-1/2 -translate-y-1/2 text-center ${selectedElement === 'description' ? 'border-red-500 bg-red-500/20' : 'border-transparent'}`}
                                        style={{ left: `${posDescriptionLeft}%`, top: `${posDescriptionTop}%`, color: landingDescriptionColor, fontSize: `${landingDescriptionSize / 2.5}px` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElement('description'); }}
                                    >
                                        <span className="font-bold tracking-wide drop-shadow">{landingDescriptionText || "CUSTOM TEXT"}</span>
                                    </div>
                                )}
                            </div>

                            {/* Control Sliders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-4 rounded-xl border border-gray-200">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700">Select Element to Map Position</label>
                                    <select
                                        value={selectedElement}
                                        onChange={(e) => setSelectedElement(e.target.value)}
                                        className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="logo">Top Header Logo</option>
                                        <option value="buttons">Header Buttons</option>
                                        <option value="welcome">Welcome Text</option>
                                        <option value="banner">Center Point Logo/Banner</option>
                                        <option value="date">Event Subtitle/Date Text</option>
                                        <option value="description">Custom Text</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* X Slider */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-gray-700">
                                                {selectedElement === 'buttons' ? 'Right Position (X%)' : 'Horizontal Position (X%)'}
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                {selectedElement === 'logo' && `${posLogoLeft}%`}
                                                {selectedElement === 'buttons' && `${posButtonsRight}%`}
                                                {selectedElement === 'welcome' && `${posWelcomeLeft}%`}
                                                {selectedElement === 'banner' && `${posBannerLeft}%`}
                                                {selectedElement === 'date' && `${posDateLeft}%`}
                                                {selectedElement === 'description' && `${posDescriptionLeft}%`}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={
                                                selectedElement === 'logo' ? posLogoLeft :
                                                selectedElement === 'buttons' ? posButtonsRight :
                                                selectedElement === 'welcome' ? posWelcomeLeft :
                                                selectedElement === 'banner' ? posBannerLeft :
                                                selectedElement === 'description' ? posDescriptionLeft :
                                                posDateLeft
                                            }
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (selectedElement === 'logo') setPosLogoLeft(val);
                                                else if (selectedElement === 'buttons') setPosButtonsRight(val);
                                                else if (selectedElement === 'welcome') setPosWelcomeLeft(val);
                                                else if (selectedElement === 'banner') setPosBannerLeft(val);
                                                else if (selectedElement === 'description') setPosDescriptionLeft(val);
                                                else setPosDateLeft(val);
                                            }}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>

                                    {/* Y Slider */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-gray-700">Vertical Position (Y%)</span>
                                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                {selectedElement === 'logo' && `${posLogoTop}%`}
                                                {selectedElement === 'buttons' && `${posButtonsTop}%`}
                                                {selectedElement === 'welcome' && `${posWelcomeTop}%`}
                                                {selectedElement === 'banner' && `${posBannerTop}%`}
                                                {selectedElement === 'date' && `${posDateTop}%`}
                                                {selectedElement === 'description' && `${posDescriptionTop}%`}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={
                                                selectedElement === 'logo' ? posLogoTop :
                                                selectedElement === 'buttons' ? posButtonsTop :
                                                selectedElement === 'welcome' ? posWelcomeTop :
                                                selectedElement === 'banner' ? posBannerTop :
                                                selectedElement === 'description' ? posDescriptionTop :
                                                posDateTop
                                            }
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (selectedElement === 'logo') setPosLogoTop(val);
                                                else if (selectedElement === 'buttons') setPosButtonsTop(val);
                                                else if (selectedElement === 'welcome') setPosWelcomeTop(val);
                                                else if (selectedElement === 'banner') setPosBannerTop(val);
                                                else if (selectedElement === 'description') setPosDescriptionTop(val);
                                                else setPosDateTop(val);
                                            }}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>

                                    {/* Inline Size Control */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-gray-700">
                                                {selectedElement === 'logo' && 'Logo Height (px)'}
                                                {selectedElement === 'banner' && 'Banner Height (px)'}
                                                {selectedElement === 'welcome' && 'Welcome Text Size (px)'}
                                                {selectedElement === 'date' && 'Date Subtitle Text Size (px)'}
                                                {selectedElement === 'description' && 'Custom Text Size (px)'}
                                                {selectedElement === 'buttons' && 'Button Size scale'}
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                {selectedElement === 'logo' && `${landingLogoSize}px`}
                                                {selectedElement === 'banner' && `${landingBannerSize}px`}
                                                {selectedElement === 'welcome' && `${landingWelcomeSize}px`}
                                                {selectedElement === 'date' && `${landingDateSize}px`}
                                                {selectedElement === 'description' && `${landingDescriptionSize}px`}
                                                {selectedElement === 'buttons' && landingBtnSize}
                                            </span>
                                        </div>

                                        {selectedElement === 'buttons' ? (
                                            <select
                                                value={landingBtnSize}
                                                onChange={(e) => setLandingBtnSize(e.target.value)}
                                                className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white mt-1"
                                            >
                                                <option value="small">Small</option>
                                                <option value="medium">Medium (Standard)</option>
                                                <option value="large">Large</option>
                                                <option value="xlarge">Extra Large</option>
                                            </select>
                                        ) : (
                                            <input
                                                type="range"
                                                min={selectedElement === 'logo' ? 20 : selectedElement === 'welcome' ? 12 : selectedElement === 'date' ? 10 : selectedElement === 'description' ? 8 : 50}
                                                max={selectedElement === 'logo' ? 150 : selectedElement === 'welcome' ? 64 : selectedElement === 'date' ? 48 : selectedElement === 'description' ? 48 : 400}
                                                value={
                                                    selectedElement === 'logo' ? landingLogoSize :
                                                    selectedElement === 'banner' ? landingBannerSize :
                                                    selectedElement === 'welcome' ? landingWelcomeSize :
                                                    selectedElement === 'description' ? landingDescriptionSize :
                                                    landingDateSize
                                                }
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (selectedElement === 'logo') setLandingLogoSize(val);
                                                    else if (selectedElement === 'banner') setLandingBannerSize(val);
                                                    else if (selectedElement === 'welcome') setLandingWelcomeSize(val);
                                                    else if (selectedElement === 'description') setLandingDescriptionSize(val);
                                                    else setLandingDateSize(val);
                                                }}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-1"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
