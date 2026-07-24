import React, { useState } from 'react';
import { FiX, FiFileText, FiVideo, FiEye, FiDownload, FiPlay, FiArrowLeft, FiFolderPlus, FiFolderMinus } from 'react-icons/fi';

const ResourceCenterModal = ({ onClose, resources, boothId }) => {
    const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'videos'
    const [selectedResource, setSelectedResource] = useState(null); // { type, url, title }
    
    const [bagItems, setBagItems] = useState(() => {
        try {
            const saved = localStorage.getItem('my_bag');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const toggleBagItem = (item, type) => {
        setBagItems(prev => {
            const exists = prev.find(i => i.id === item.id && i.type === type);
            let updated;
            if (exists) {
                updated = prev.filter(i => !(i.id === item.id && i.type === type));
            } else {
                updated = [...prev, {
                    id: item.id,
                    title: item.title,
                    url: type === 'video' ? (item.videoUrl || item.url) : item.url,
                    type: type,
                    boothId: boothId || 'General',
                    addedAt: Date.now()
                }];
            }
            localStorage.setItem('my_bag', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
            return updated;
        });
    };

    const isInBag = (itemId, type) => {
        return bagItems.some(i => i.id === itemId && i.type === type);
    };
    
    const docs = resources?.documents || [];
    const vids = resources?.videos || [];

    const getDownloadUrl = (url) => {
        if (!url) return '';
        if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
            return url.replace('/image/upload/', '/image/upload/fl_attachment/');
        }
        return url;
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        const params = 'controls=1&rel=0&modestbranding=1&enablejsapi=1';
        if (url.includes('youtube.com/embed/')) {
            return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
        }
        const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}?${params}`;
        }
        return url;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-[#f5f7fa] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
                
                {selectedResource ? (
                    // Embedded Viewer View
                    <div className="flex flex-col h-full w-full bg-black">
                        <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setSelectedResource(null)}
                                    className="text-gray-300 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">{selectedResource.title}</h2>
                            </div>
                            <button 
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-2"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 w-full relative min-h-[60vh] sm:min-h-[70vh] bg-gray-900 flex flex-col">
                            <div className="bg-gray-800 text-white px-6 py-2.5 flex justify-between items-center text-xs border-b border-gray-700 shrink-0">
                                <span className="font-semibold text-gray-300 truncate max-w-md">
                                    {selectedResource.type === 'video' ? 'Video Player' : 'Document Preview'}: {selectedResource.title || selectedResource.name || 'File'}
                                </span>
                                <div className="flex items-center gap-3">
                                    {selectedResource.url && (
                                        <a
                                            href={selectedResource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-[#295ce8] hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                                        >
                                            Open Full Page / Download
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 w-full relative bg-gray-950">
                                {!selectedResource.url || (!selectedResource.url.startsWith('http') && !selectedResource.url.startsWith('/ve-api') && !selectedResource.url.startsWith('data:')) ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900 text-white">
                                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-3xl mb-4 border border-gray-700">
                                            {selectedResource.type === 'video' ? '🎬' : '📄'}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Invalid or Missing Resource Link</h3>
                                        <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
                                            The entered link <code className="bg-gray-800 px-2 py-1 rounded text-rose-400">{selectedResource.url || 'empty'}</code> is not a valid file URL. Please use the <strong className="text-white">"{selectedResource.type === 'video' ? 'Upload Video File' : 'Upload PDF'}"</strong> button in Booth Settings to upload your file properly.
                                        </p>
                                    </div>
                                ) : selectedResource.type === 'video' ? (
                                    (selectedResource.url.endsWith('.mp4') || 
                                     selectedResource.url.endsWith('.webm') || 
                                     selectedResource.url.endsWith('.ogg') || 
                                     selectedResource.url.includes('/uploads/') || 
                                     (selectedResource.url.includes('cloudinary.com') && !selectedResource.url.includes('youtube'))) ? (
                                        <video 
                                            src={selectedResource.url} 
                                            controls 
                                            autoPlay 
                                            className="absolute inset-0 w-full h-full object-contain bg-black"
                                        />
                                    ) : (
                                        <iframe 
                                            src={getEmbedUrl(selectedResource.url)}
                                            className="absolute inset-0 w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    )
                                ) : (
                                    <embed 
                                        src={selectedResource.url} 
                                        type="application/pdf" 
                                        className="absolute inset-0 w-full h-full border-0 bg-white"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // List View
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-200 bg-white">
                            <h2 className="text-2xl font-bold text-gray-700">Resource Center</h2>
                            <button 
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-white px-8 pt-2 gap-8 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                                    activeTab === 'documents' 
                                        ? 'text-[#6b46c1] border-b-2 border-[#6b46c1]' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FiFileText className="w-5 h-5" />
                                Documents
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                                    activeTab === 'videos' 
                                        ? 'text-[#6b46c1] border-b-2 border-[#6b46c1]' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FiVideo className="w-5 h-5" />
                                Videos
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto bg-[#f5f7fa] flex-1">
                            {activeTab === 'documents' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {docs.length === 0 ? (
                                        <p className="text-gray-500 italic col-span-2 text-center py-10">No documents available.</p>
                                    ) : (
                                        docs.map(doc => {
                                            const docName = doc.name || doc.title || 'Untitled Document';
                                            return (
                                                <div 
                                                    key={doc.id} 
                                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                                                    onClick={() => setSelectedResource({ type: 'document', ...doc, title: docName })}
                                                >
                                                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                                        <span className="font-extrabold text-xs">PDF</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-800 truncate" title={docName}>{docName}</h4>
                                                        <p className="text-[10px] text-gray-400 font-semibold truncate">Click to view document preview</p>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            onClick={() => setSelectedResource({ type: 'document', ...doc, title: docName })}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6b46c1] hover:bg-purple-50 rounded-full transition-colors cursor-pointer"
                                                            title="View Preview"
                                                        >
                                                            <FiEye />
                                                        </button>
                                                        <a 
                                                            href={getDownloadUrl(doc.url)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            download
                                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6b46c1] hover:bg-purple-50 rounded-full transition-colors cursor-pointer"
                                                            title="Download PDF"
                                                        >
                                                            <FiDownload />
                                                        </a>
                                                        <button 
                                                            onClick={() => toggleBagItem(doc, 'document')}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                                                isInBag(doc.id, 'document') 
                                                                    ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-50' 
                                                                    : 'text-gray-400 hover:text-[#6b46c1] hover:bg-purple-50'
                                                            }`}
                                                            title={isInBag(doc.id, 'document') ? "Remove from Bag" : "Add to Bag"}
                                                        >
                                                            {isInBag(doc.id, 'document') ? <FiFolderMinus /> : <FiFolderPlus />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {vids.length === 0 ? (
                                        <p className="text-gray-500 italic col-span-2 text-center py-10">No videos available.</p>
                                    ) : (
                                        vids.map(vid => {
                                            const vidName = vid.name || vid.title || 'Untitled Video';
                                            const hasUrl = vid.url && vid.url.trim() !== '';
                                            return (
                                                <div key={vid.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                                                    <div 
                                                        className="h-36 bg-gray-900 relative flex items-center justify-center group-hover:bg-black transition-colors cursor-pointer overflow-hidden"
                                                        onClick={() => setSelectedResource({ type: 'video', ...vid, title: vidName })}
                                                    >
                                                        {(vid.thumbnailUrl || vid.imageUrl) ? (
                                                            <img src={vid.thumbnailUrl || vid.imageUrl} alt={vidName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        ) : null}
                                                        <FiPlay className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all absolute" />
                                                        {!hasUrl && (
                                                            <span className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                                                Upload File Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-4 flex items-center justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-gray-800 truncate" title={vidName}>{vidName}</h4>
                                                            <p className="text-[10px] text-gray-400 font-semibold truncate">
                                                                {hasUrl ? 'Click to play video' : 'File upload required in Admin Settings'}
                                                            </p>
                                                        </div>
                                                        <button 
                                                            onClick={() => toggleBagItem(vid, 'video')}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                                                isInBag(vid.id, 'video') 
                                                                    ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-50' 
                                                                    : 'text-gray-400 hover:text-[#6b46c1] hover:bg-purple-50'
                                                            }`}
                                                            title={isInBag(vid.id, 'video') ? "Remove from Bag" : "Add to Bag"}
                                                        >
                                                            {isInBag(vid.id, 'video') ? <FiFolderMinus /> : <FiFolderPlus />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default ResourceCenterModal;
