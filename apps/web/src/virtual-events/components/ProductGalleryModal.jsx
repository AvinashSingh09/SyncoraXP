import React, { useState, useEffect } from 'react';
import { FiX, FiExternalLink, FiSend, FiPlay } from 'react-icons/fi';
import { leadService } from '../services/api';

const ProductGalleryModal = ({ onClose, products, boothId }) => {
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const currentProduct = products && products.length > 0 ? products[selectedProductIndex] : null;
    const [activeMediaUrl, setActiveMediaUrl] = useState('');
    const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' or 'video'

    useEffect(() => {
        if (currentProduct) {
            setActiveMediaUrl(currentProduct.imageUrl || '');
            setActiveMediaType('image');
            setQuery('');
            setSuccessMessage('');
            setErrorMessage('');
        }
    }, [selectedProductIndex, currentProduct]);

    if (!products || products.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl border border-gray-150 text-center">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                        📦
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Available</h3>
                    <p className="text-gray-500 text-sm">The exhibitor hasn't added any products to their showcase yet.</p>
                </div>
            </div>
        );
    }

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || !currentProduct) return;

        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await leadService.createLead({
                boothId: boothId.toString(),
                productId: currentProduct.id || selectedProductIndex.toString(),
                productName: currentProduct.name,
                queryText: query
            });
            setSuccessMessage('Your inquiry has been sent to the exhibitor!');
            setQuery('');
        } catch (err) {
            console.error('Failed to submit product inquiry', err);
            setErrorMessage(err.response?.data?.message || 'Failed to submit query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract clean youtube embed URL
    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com/embed/')) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    // Prepare all media elements: main image, sub-images, video
    const mediaItems = [];
    if (currentProduct.imageUrl) {
        mediaItems.push({ type: 'image', url: currentProduct.imageUrl });
    }
    if (currentProduct.images && Array.isArray(currentProduct.images)) {
        currentProduct.images.forEach(img => {
            if (img) mediaItems.push({ type: 'image', url: img });
        });
    }
    if (currentProduct.videoUrl) {
        mediaItems.push({ type: 'video', url: currentProduct.videoUrl });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row relative max-h-[90vh]">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 z-20 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all cursor-pointer"
                >
                    <FiX className="w-5 h-5" />
                </button>

                {/* Left Section: Gallery View */}
                <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-between min-h-[350px] md:min-h-0 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="mb-4">
                        <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-2">Select Product</label>
                        <select
                            value={selectedProductIndex}
                            onChange={(e) => setSelectedProductIndex(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        >
                            {products.map((prod, idx) => (
                                <option key={prod.id || idx} value={idx}>
                                    {prod.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Main Media Preview */}
                    <div className="flex-1 flex items-center justify-center relative bg-black/40 rounded-2xl overflow-hidden min-h-[220px]">
                        {activeMediaType === 'image' ? (
                            <img
                                src={activeMediaUrl}
                                alt={currentProduct.name}
                                className="max-w-full max-h-[300px] object-contain rounded-lg transition-all duration-300"
                                onError={(e) => {
                                    e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image';
                                }}
                            />
                        ) : (
                            <iframe
                                src={getEmbedUrl(activeMediaUrl)}
                                className="w-full h-full min-h-[280px] border-0"
                                title="Product Video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>

                    {/* Thumbnails Navigation */}
                    {mediaItems.length > 1 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 max-w-full justify-center">
                            {mediaItems.map((item, idx) => {
                                const isActive = activeMediaUrl === item.url;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setActiveMediaUrl(item.url);
                                            setActiveMediaType(item.type);
                                        }}
                                        className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all relative ${
                                            isActive ? 'border-blue-500 scale-105' : 'border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                                                <FiPlay className="w-5 h-5 text-red-500" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Section: Details & Inquiry */}
                <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto bg-white">
                    <div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Product Catalogue</span>
                        <h2 className="text-3xl font-extrabold text-gray-800 mt-3 mb-2">{currentProduct.name}</h2>
                        
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium whitespace-pre-line">
                            {currentProduct.description || 'No description provided.'}
                        </p>

                        {currentProduct.infoUrl && (
                            <a
                                href={currentProduct.infoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors border-b-2 border-blue-600/30 hover:border-blue-600 pb-0.5"
                            >
                                <FiExternalLink className="w-4 h-4" />
                                <span>Click here for more info</span>
                            </a>
                        )}
                    </div>

                    {/* Inquiry Form */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Send Inquiry to Exhibitor</h4>
                        
                        {successMessage ? (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-xs font-semibold animate-fade-in flex items-center gap-2">
                                <span>✨</span>
                                <span>{successMessage}</span>
                            </div>
                        ) : (
                            <form onSubmit={handleQuerySubmit} className="space-y-3">
                                <div>
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        rows="3"
                                        className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                                        placeholder="Enter your query details..."
                                        required
                                    />
                                </div>
                                
                                {errorMessage && (
                                    <p className="text-[10px] font-semibold text-red-500">{errorMessage}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                                >
                                    <FiSend className="w-3.5 h-3.5" />
                                    <span>{loading ? 'Submitting...' : 'Submit Query'}</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default ProductGalleryModal;
